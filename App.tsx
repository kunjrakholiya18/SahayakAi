
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('sahayak-theme') as 'light' | 'dark') || 'dark';
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('sahayak-theme', theme);
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    if (view === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isThinking, view]);

  const handleAuthSuccess = (name: string, apiKey: string) => {
    setManualApiKey(apiKey);
    const newUser = { name };
    setCurrentUser(newUser);
    localStorage.setItem('sahayak_user', JSON.stringify(newUser));

    setMessages([{
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: `नमस्ते ${name}! मैं सहायक हूँ। 
      
आप मुझसे हिंदी या अंग्रेजी में बात कर सकते हैं।
Hello ${name}! I am Sahayak. You can talk to me in Hindi or English.`,
      timestamp: new Date()
    }]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sahayak_user');
    setMessages([]);
    setView('chat');
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
            content: `यह रहा आपका चित्र, ${currentUser.name}!`,
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

  if (!currentUser) return <AuthScreen onSuccess={handleAuthSuccess} theme={theme} onToggleTheme={toggleTheme} />;

  return (
    <div className={`h-screen w-screen flex bg-white dark:bg-black text-slate-900 dark:text-white transition-colors duration-500 overflow-hidden`}>
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

      <div className={`fixed md:relative z-40 h-full w-72 glass-card border-r border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg">S</div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tight">Sahayak AI</h1>
              <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest -mt-1">Neural Node</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
            <button 
              onClick={() => { setView('chat'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-sm font-bold border ${view === 'chat' ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/10'}`}
            >
              <span className="text-lg">💬</span> Chat Mode
            </button>

            <button 
              onClick={() => { setView('magic'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-sm font-bold border ${view === 'magic' ? 'bg-purple-600 text-white border-purple-500 shadow-xl' : 'bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white/10'}`}
            >
              <span className="text-lg">✨</span> Magic Image
            </button>

            <button 
              onClick={() => setIsLiveMode(true)} 
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-green-600/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-bold hover:bg-green-600/20 transition-all"
            >
              <span className="text-lg">🎙️</span> Voice Mode
            </button>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10">
                <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] mb-4">Companions</p>
                <div className="grid grid-cols-3 gap-2">
                    {(['aero', 'volt', 'luna'] as CompanionType[]).map(type => (
                        <button 
                            key={type} 
                            onClick={() => addCompanion(type)}
                            className="aspect-square rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:border-blue-500 transition-all flex items-center justify-center text-xs group"
                        >
                            <div className={`w-6 h-6 rounded-full group-hover:scale-125 transition-transform ${type === 'aero' ? 'bg-cyan-500' : type === 'volt' ? 'bg-emerald-500' : 'bg-pink-400'}`} />
                        </button>
                    ))}
                </div>
            </div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">{currentUser.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{currentUser.name}</p>
                <p className="text-[9px] text-green-500 font-black uppercase tracking-widest">Active Link</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-4 rounded-2xl border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Disconnect</button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative h-full">
        <header className="h-20 flex items-center justify-between px-6 border-b border-slate-200 dark:border-white/10 glass-card">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
            <div className="flex flex-col">
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${view === 'magic' ? 'text-purple-500' : 'text-blue-600 dark:text-blue-400'}`}>
                Neural Node Status: Active
              </span>
              <span className="font-bold text-lg">{view === 'magic' ? 'Magic Canvas' : `Chatting as ${currentUser.name}`}</span>
            </div>
          </div>
          <button onClick={toggleTheme} className="p-3 rounded-full bg-slate-100 dark:bg-white/5 hover:scale-110 transition-all border border-slate-200 dark:border-white/10 shadow-sm">{theme === 'dark' ? '☀️' : '🌙'}</button>
        </header>

        {view === 'magic' ? (
          <MagicImageMode theme={theme} />
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                      <div className="text-6xl">🤖</div>
                      <p className="font-black uppercase tracking-[0.5em] text-sm">Waiting for input</p>
                  </div>
              )}
              {messages.map(msg => <ChatMessage key={msg.id} message={msg} theme={theme} />)}
              {isThinking && (
                  <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl w-fit animate-pulse">
                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Neural Syncing...</span>
                  </div>
              )}
              {errorMessage && <div className="mx-auto max-w-lg p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-center text-xs font-bold animate-shake">⚠️ {errorMessage}</div>}
            </div>

            <div className="p-6">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
                <RobotAvatar isThinking={isThinking} theme={theme} />
                <div className={`relative flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-2 pr-4 transition-all focus-within:ring-2 focus-within:ring-blue-500/50 shadow-2xl ${selectedImage ? 'pt-24' : ''}`}>
                  {selectedImage && (
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-md animate-in zoom-in-95 duration-200">
                        <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} className="w-14 h-14 rounded-lg object-cover" alt="Preview"/>
                        <button type="button" onClick={() => setSelectedImage(null)} className="p-1.5 bg-red-500 text-white rounded-full hover:scale-110 transition-all shadow-sm"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 text-slate-400 dark:text-white/30 hover:text-blue-500 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onloadend = () => setSelectedImage({ data: (r.result as string).split(',')[1], mimeType: file.type }); r.readAsDataURL(file); } }} className="hidden"/>
                  <input 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)} 
                    placeholder={`नमस्ते ${currentUser.name}, कुछ पूछें... (Hindi/English)`} 
                    className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-4 text-lg font-medium placeholder-slate-400 dark:placeholder-white/10" 
                  />
                  <button type="submit" disabled={isThinking || (!inputText.trim() && !selectedImage)} className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/40 transition-all active:scale-95 disabled:opacity-50"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                </div>
              </form>
              <p className="text-center text-[9px] text-slate-400 dark:text-white/10 mt-6 uppercase tracking-[0.5em] font-black">Bilingual Intelligence • Nano Banana Engine</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
