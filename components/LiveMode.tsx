
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';
import { getEffectiveApiKey } from '../services/geminiService';
import AuthRobot from './AuthRobot';

interface LiveModeProps {
  userName: string;
  voiceName: 'Kore' | 'Zephyr';
  theme: 'light' | 'dark';
  onClose: () => void;
}

const LiveMode: React.FC<LiveModeProps> = ({ userName, voiceName, theme, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Manual Base64 Implementation
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
    console.debug('Sahayak: Running deep hardware cleanup...');
    
    // Stop all active audio playback
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();

    // Release Microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        t.stop();
        t.enabled = false;
      });
      streamRef.current = null;
    }

    // Close Contexts
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

  const initializeConnection = async () => {
    await cleanup();
    
    // Crucial delay to prevent "Hardware Busy" errors during rapid reconnects.
    await new Promise(r => setTimeout(r, 800));
    
    setStatus('connecting');
    setError(null);

    // Use the effective API key (manual override or environment)
    const apiKey = getEffectiveApiKey();

    try {
      if (!apiKey) throw new Error("API Key Missing: Please provide a key in the login screen.");

      const ai = new GoogleGenAI({ apiKey });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true 
        } 
      });
      streamRef.current = stream;

      inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });

      // Corrected model name per technical requirements
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.debug('Sahayak: Neural link established.');
            setStatus('listening');

            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              const outCtx = outputAudioCtxRef.current!;
              
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
            }
          },
          onerror: (e) => {
            console.error('Sahayak: Session Error', e);
            setError("Connection error. Please verify your API Key and network.");
            setStatus('disconnected');
          },
          onclose: () => {
            console.debug('Sahayak: Session closed.');
            setStatus('disconnected');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: `You are Sahayak, the personal AI assistant for ${userName}. 
          Always respond in user's language (Hindi or English).
          Be highly detailed and intellectual.`,
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error('Sahayak: Initialization Failed', err);
      setError("Failed to initialize voice link. Check your API Key.");
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
            {status === 'disconnected' ? 'Link Severed' : status === 'connecting' ? 'Initializing...' : status === 'speaking' ? 'Sahayak Speaking' : 'Listening...'}
          </h2>
          
          <p className="text-slate-500 font-bold max-w-sm mx-auto">
            {error ? error : status === 'connecting' ? 'Securing encrypted channel...' : `Providing deep neural insights for you...`}
          </p>

          {status === 'disconnected' && (
            <button 
              onClick={() => initializeConnection()} 
              className="mt-6 px-10 py-4 bg-blue-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
            >
              Reset Connection
            </button>
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
