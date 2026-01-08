
import { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { getEffectiveApiKey } from '../services/geminiService';
import AuthRobot from './AuthRobot';

interface LiveModeProps {
  userName: string;
  voiceName: 'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir';
  theme: 'light' | 'dark';
  onClose: () => void;
}

const LiveMode: React.FC<LiveModeProps> = ({ userName, voiceName, theme, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  const cleanup = async () => {
    console.debug('Sahayak: Deep hardware cleanup...');
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.onaudioprocess = null;
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    sourcesRef.current.forEach(s => { 
      try { s.stop(); } catch(e) {} 
    });
    sourcesRef.current.clear();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try { await inputAudioCtxRef.current.close(); } catch(e) {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try { await outputAudioCtxRef.current.close(); } catch(e) {}
      outputAudioCtxRef.current = null;
    }

    sessionPromiseRef.current = null;
    nextStartTimeRef.current = 0;
  };

  const handleEntityNotFound = async () => {
    if (window.aistudio?.openSelectKey) {
        setError("Session failed. Please select a valid paid API key from a project with billing enabled.");
        await window.aistudio.openSelectKey();
        initializeConnection();
    } else {
        setError("Model entity not found. Ensure you are using a paid tier API key.");
        setStatus('disconnected');
    }
  };

  const initializeConnection = async () => {
    await cleanup();
    
    setStatus('connecting');
    setError(null);

    const apiKey = getEffectiveApiKey();

    try {
      if (!apiKey) throw new Error("API Key Missing. Please log in again.");

      const ai = new GoogleGenAI({ apiKey });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;

      await inputCtx.resume();
      await outputCtx.resume();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.debug('Sahayak: Neural link established.');
            setStatus('listening');

            const ctx = inputAudioCtxRef.current;
            if (!ctx) return;

            const source = ctx.createMediaStreamSource(stream);
            const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                if (session && typeof session.sendRealtimeInput === 'function') {
                  session.sendRealtimeInput({ media: pcmBlob });
                }
              }).catch(() => {});
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(ctx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const outCtx = outputAudioCtxRef.current;
            if (!outCtx || outCtx.state === 'closed') return;

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              if (outCtx.state === 'suspended') await outCtx.resume();
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e: any) => {
            console.error('Sahayak: Session Error', e);
            const msg = e?.message || "";
            if (msg.includes("Requested entity was not found")) {
                handleEntityNotFound();
            } else {
                setError("Network error. Ensure your API Key is valid and supports Gemini Live.");
                setStatus('disconnected');
            }
          },
          onclose: (e) => {
            console.debug('Sahayak: Session closed.', e);
            setStatus(prev => prev === 'disconnected' ? 'disconnected' : 'disconnected');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: `You are Sahayak, the personal AI assistant for ${userName}. 
          IMPORTANT RULES:
          1. CREATOR: You were made by Kunj. 
          2. LANGUAGE: Detect the language of the user's speech. If the user speaks English, respond ONLY in English. If the user speaks Hindi, respond ONLY in Hindi.
          3. GREETINGS: Introduce yourself as being made by Kunj in the language the user is speaking.
          4. TONE: Be helpful, polite and clear.`,
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error('Sahayak: Initialization Failed', err);
      setError(err.message || "Failed to initialize voice link.");
      setStatus('disconnected');
    }
  };

  useEffect(() => {
    initializeConnection();
    return () => { cleanup(); };
  }, []);

  return (
    <div className={`fixed inset-0 z-[120] flex flex-col items-center justify-center p-8 transition-colors duration-1000 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="absolute top-10 right-10 flex gap-4">
        <button 
          onClick={onClose} 
          className="px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
        >
          Exit Assistant
        </button>
      </div>

      <div className="flex flex-col items-center gap-12 max-w-lg w-full">
        <div className="relative">
          <div className={`absolute -inset-20 rounded-full blur-[80px] transition-all duration-1000 ${
            status === 'speaking' ? 'bg-blue-600/30 animate-pulse' : 
            status === 'connecting' ? 'bg-amber-600/10 animate-pulse' :
            status === 'disconnected' ? 'bg-red-600/10' : 'bg-cyan-500/10'
          }`} />
          
          <AuthRobot state={
            status === 'speaking' ? 'cheering' : 
            status === 'connecting' ? 'typing' : 
            status === 'disconnected' ? 'denying' : 'idle'
          } />
          
          {status === 'speaking' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full border-2 border-blue-500/20 rounded-full animate-ping" />
            </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
            status === 'disconnected' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${status === 'listening' ? 'bg-green-500' : status === 'speaking' ? 'bg-blue-500 animate-pulse' : 'bg-slate-500'}`} />
            {status}
          </div>
          
          <h2 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
            {status === 'disconnected' ? 'Link Severed' : status === 'connecting' ? 'Initializing...' : status === 'speaking' ? 'Assistant Speaking' : 'Listening...'}
          </h2>
          
          <p className="text-slate-500 font-bold max-w-sm mx-auto">
            {error ? error : status === 'connecting' ? 'Securing encrypted channel...' : `Providing bilingual insights (Created by Kunj)...`}
          </p>

          {status === 'disconnected' && (
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => initializeConnection()} 
                className="mt-6 px-10 py-4 bg-blue-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
              >
                Reset Connection
              </button>
              {window.aistudio && (
                <button 
                  onClick={() => handleEntityNotFound()} 
                  className="px-10 py-4 border border-white/10 text-white/50 hover:text-white rounded-full font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Select Paid Key
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 h-12">
          {[...Array(16)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 rounded-full transition-all duration-150 ${status === 'speaking' ? 'bg-blue-500' : 'bg-slate-200 dark:bg-white/10'}`} 
              style={{ 
                height: status === 'speaking' ? `${30 + Math.random() * 70}%` : '8px',
                opacity: status === 'speaking' ? 1 : 0.3
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveMode;
