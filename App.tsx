
import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { generateBilingualResponse, generateAIImage, setManualApiKey } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import RobotAvatar from './components/RobotAvatar';
import AuthScreen from './components/AuthScreen';
import LiveMode from './components/LiveMode';
import FloatingAssistant, { CompanionType } from './components/FloatingAssistant';
import MagicImageMode from './components/MagicImageMode';

interface UserProfile {
  name: string;
}

interface CompanionInstance {
  id: string;
  type: CompanionType;
}

type AppView = 'chat' | 'magic';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('sahayak_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [view, setView] = useState<AppView>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  
  const [activeCompanions, setActiveCompanions] = useState<CompanionInstance[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const theme = 'dark';

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }, []);

  useEffect(() => {
    if (view === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThinking, view]);

  // Initial welcome message for returning users
  useEffect(() => {
    if (currentUser && messages.length === 0) {
        setMessages([{
            id: 'welcome-' + Date.now(),
            role: 'assistant',
            content: `नमस्ते ${currentUser.name}! मैं सहायक हूँ, और मुझे कुंज (Kunj) ने बनाया है।
मैं आपकी हिंदी और अंग्रेजी दोनों में मदद कर सकता हूँ।

Hello ${currentUser.name}! I am Sahayak, and I am made by Kunj.
I can help you in both Hindi and English.`,
            timestamp: new Date()
        }]);
    }
  }, [currentUser]);

  const handleAuthSuccess = (name: string, apiKey: string) => {
    setManualApiKey(apiKey);
    const newUser = { name };
    setCurrentUser(newUser);
    localStorage.setItem('sahayak_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sahayak_user');
    localStorage.removeItem('sahayak_api_key');
    setMessages([]);
    setView('chat');
  };

  const addCompanion = (type: CompanionType) => {
    const newCompanion: CompanionInstance = {
      id: Math.random().toString(36).substr(2, 9),
      type
    };
    setActiveCompanions(prev => [...prev, newCompanion].slice(-3));
  };

  const removeCompanion = (id: string) => {
    setActiveCompanions(prev => prev.filter(c => c.id !== id));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmedInput = inputText.trim();
    if ((!trimmedInput && !selectedImage) || isThinking) return;

    setErrorMessage(null);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      image: selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.data}` : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    const currentImg = selectedImage;
    setSelectedImage(null);
    setIsThinking(true);

    try {
      const isImgReq = ['generate', 'create', 'image', 'photo', 'banao', 'chitra', 'make'].some(k => trimmedInput.toLowerCase().includes(k));

      if (isImgReq && !currentImg) {
        const url = await generateAIImage(trimmedInput);
        if (url) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `यह रहा आपका चित्र, ${currentUser.name}! 
Here is your image, ${currentUser.name}!`,
            image: url,
            timestamp: new Date()
          }]);
        } else {
          throw new Error("I couldn't generate the image.");
        }
      } else {
        const apiHistory = messages.map(m => ({ 
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model', 
          parts: [{ text: m.content }] 
        })).slice(-10);
        
        const response = await generateBilingualResponse(currentUser.name, trimmedInput, apiHistory, currentImg || undefined);
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: response.text, 
          timestamp: new Date() 
        }]);
      }
    } catch (error: any) {
      console.error("Neural Error:", error);
      setErrorMessage(error.message || "Link unstable. Please retry.");
    } finally {
      setIsThinking(false);
    }
  };

  if (!currentUser) return <AuthScreen onSuccess={handleAuthSuccess} theme={theme} />;

  return (
    <div className="h-screen w-screen flex bg-[#020617] text-white transition-colors duration-500 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-dots opacity-[0.05] text-white"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-600/10 blur-[120px] animate-float-slow"></div>
          <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-600/5 blur-[100px] animate-pulse-slow delay-1000"></div>
      </div>

      {isLiveMode && <LiveMode userName={currentUser.name} voiceName="Kore" theme={theme} onClose={() => setIsLiveMode(false)} />}
      
      {activeCompanions.map((comp, index) => (
        <FloatingAssistant 
          key={comp.id}
          type={comp.type}
          isThinking={isThinking} 
          userName={currentUser.name} 
          theme={theme} 
          initialOffset={{ x: index * -80, y: index * -60 }}
          onClose={() => removeCompanion(comp.id)} 
        />
      ))}

      {/* Sidebar */}
      <div className={`fixed md:relative z-40 h-full w-80 glass-card border-r border-white/5 bg-black/20 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-4 mb-10 group cursor-pointer">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/30 rounded-2xl blur-md group-hover:scale-125 transition-transform duration-700 animate-pulse"></div>
              <div className="absolute inset-[-4px] border border-dashed border-teal-500/40 rounded-full animate-[spin_10s_linear_infinite] group-hover:border-teal-400"></div>
              <div className="relative z-10 w-full h-full rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-[0_10px_20px_rgba(37,99,235,0.4)] border border-white/20 transition-all duration-500 group-hover:rotate-[360deg] group-hover:scale-110">
                <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">S</span>
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-2xl transform -skew-x-12 -translate-x-1"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors">Sahayak AI</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
                <span className="text-[8px] font-bold text-teal-500 uppercase tracking-[0.2em] -mt-0.5">By Kunj</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-6 flex-1 overflow-y-auto pr-2">
            <button 
              onClick={() => { setView('chat'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 p-4 rounded-[1.8rem] transition-all duration-300 border hover:scale-[1.05] hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] ${view === 'chat' ? 'bg-blue-600/10 border-blue-500/50' : 'bg-transparent border-white/5 hover:border-blue-500/30'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 ${view === 'chat' ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'bg-blue-600/20 text-blue-400'}`}>💬</div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/70">Interaction</p>
                <p className="text-sm font-bold text-white">Chat Mode</p>
              </div>
            </button>

            <button 
              onClick={() => { setView('magic'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 p-4 rounded-[1.8rem] transition-all duration-300 border hover:scale-[1.05] hover:shadow-[0_0_30px_rgba(147,51,234,0.2)] ${view === 'magic' ? 'bg-purple-600/10 border-purple-500/50' : 'bg-transparent border-white/5 hover:border-purple-500/30'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-300 ${view === 'magic' ? 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.6)]' : 'bg-purple-600/20 text-purple-400'}`}>✨</div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/70">Creative</p>
                <p className="text-sm font-bold text-white">Magic Canvas</p>
              </div>
            </button>

            <button 
              onClick={() => setIsLiveMode(true)} 
              className="w-full flex items-center gap-4 p-4 rounded-[1.8rem] transition-all duration-300 border border-teal-500/20 bg-transparent hover:bg-teal-500/5 hover:scale-[1.05] hover:border-teal-500/50 hover:shadow-[0_0_30px_rgba(20,184,166,0.2)]"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-xl text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)] group-hover:bg-teal-500 group-hover:text-white transition-all">🎙️</div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400/70">Real-time</p>
                <p className="text-sm font-bold text-white">Voice Mode</p>
              </div>
            </button>
          </div>
          
          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4 p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-white/20 transition-all">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">{currentUser.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{currentUser.name}</p>
                <p className="text-[9px] text-teal-500 font-black uppercase tracking-widest">Neural Linked</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-4 rounded-2xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all active:scale-95">Disconnect Link</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-full z-10">
        <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 bg-black/10 glass-card">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-white/5 rounded-lg text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${view === 'magic' ? 'text-purple-500' : 'text-teal-400'}`}>
                Neural Status: Synchronized
              </span>
              <span className="font-bold text-lg text-white/90">{view === 'magic' ? 'Magic Canvas' : `Bilingual Chat as ${currentUser.name}`}</span>
            </div>
          </div>
          <div className="p-3 text-xs font-black uppercase tracking-widest text-teal-500/40 border border-teal-500/10 rounded-full px-5 bg-teal-500/5">Made by Kunj</div>
        </header>

        {view === 'magic' ? (
          <MagicImageMode theme={theme} />
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-6">
                      <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                          <div className="text-8xl relative z-10">🤖</div>
                      </div>
                      <div className="space-y-2">
                        <p className="font-black uppercase tracking-[0.6em] text-sm text-white">Sahayak AI</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.4em]">Made by Kunj • Bilingual Mode</p>
                      </div>
                  </div>
              )}
              {messages.map(msg => <ChatMessage key={msg.id} message={msg} theme={theme} />)}
              {isThinking && (
                  <div className="flex items-center gap-3 p-4 bg-teal-500/10 rounded-[1.2rem] w-fit border border-teal-500/20 animate-pulse">
                    <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Thinking...</span>
                  </div>
              )}
              {errorMessage && (
                <div className="mx-auto max-w-lg p-6 bg-red-500/10 border border-red-500/20 rounded-[1.8rem] text-red-500 text-center space-y-4 animate-shake">
                  <p className="text-xs font-bold font-mono tracking-widest uppercase">⚠️ System Error</p>
                  <p className="text-sm font-medium">{errorMessage}</p>
                  {(errorMessage.toLowerCase().includes("valid api key") || errorMessage.toLowerCase().includes("key")) && (
                    <button 
                      onClick={handleLogout}
                      className="px-6 py-2 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-red-500/20"
                    >
                      Update API Key
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-6">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
                <RobotAvatar isThinking={isThinking} theme={theme} />
                <div className={`relative flex items-center bg-black/40 border border-white/10 rounded-[2.5rem] p-2 pr-4 transition-all focus-within:ring-2 focus-within:ring-teal-500/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] glass-card ${selectedImage ? 'pt-24' : ''}`}>
                  {selectedImage && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-800/90 p-2 rounded-xl border border-white/10 shadow-md animate-in zoom-in-95 duration-200 backdrop-blur-md">
                        <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} className="w-14 h-14 rounded-lg object-cover" alt="Preview"/>
                        <button type="button" onClick={() => setSelectedImage(null)} className="p-1.5 bg-red-500 text-white rounded-full hover:scale-110 transition-all shadow-sm"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 text-white/30 hover:text-teal-500 transition-colors hover:scale-110"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onloadend = () => setSelectedImage({ data: (r.result as string).split(',')[1], mimeType: file.type }); r.readAsDataURL(file); } }} className="hidden"/>
                  <input 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    placeholder={`नमस्ते ${currentUser.name}, कुछ पूछें (Hindi/English)...`} 
                    className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-lg font-medium placeholder-white/20 text-white" 
                  />
                  <button type="submit" disabled={isThinking || (!inputText.trim() && !selectedImage)} className="p-4 bg-gradient-to-br from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white rounded-full shadow-lg shadow-teal-500/30 transition-all hover:scale-110 active:scale-95 disabled:opacity-50"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                </div>
              </form>
              <p className="text-center text-[9px] text-white/20 mt-6 uppercase tracking-[0.6em] font-black">Made by Kunj • Bilingual AI Assistant</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
