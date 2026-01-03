
import React, { useState, useEffect } from 'react';
import AuthRobot, { RobotState } from './AuthRobot';
import Orb from './Orb';

interface AuthScreenProps {
  onSuccess: (name: string, apiKey: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, theme = 'dark', onToggleTheme }) => {
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [robotState, setRobotState] = useState<RobotState>('waving');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setRobotState('idle'), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setRobotState('typing');
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    if (e.target.value) setRobotState('typing');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setRobotState('denying');
      setError('कृपया अपना नाम लिखें / Please enter your name');
      return;
    }
    if (!apiKey.trim()) {
      setRobotState('denying');
      setError('कृपया अपनी API Key डालें / Please enter your API Key');
      return;
    }

    setIsLoading(true);
    setRobotState('cheering');
    
    // Simulate a neural handshake
    setTimeout(() => {
      onSuccess(name.trim(), apiKey.trim());
    }, 1200);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-black overflow-hidden relative px-6 py-12 transition-colors duration-500 font-sans">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-20 opacity-20"><Orb size="lg" theme={theme} /></div>
      <div className="absolute bottom-1/4 -right-20 opacity-20"><Orb size="md" theme={theme} /></div>
      
      {/* Theme Toggle */}
      <button 
        onClick={onToggleTheme} 
        className="absolute top-8 right-8 p-3 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:scale-110 transition-all z-50 shadow-xl border border-slate-200 dark:border-white/10"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Robot Mascot */}
      <div className="mb-8 z-20 transition-transform duration-700 hover:scale-110">
        <AuthRobot state={robotState} />
      </div>

      <div className="w-full max-w-xl text-center z-30 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 dark:from-blue-400 dark:via-cyan-300 dark:to-indigo-400">
                Sahayak AI
            </h1>
            <p className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.4em]">Bilingual Personal Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="relative max-w-md mx-auto space-y-6">
            <div className="space-y-2 text-left">
                <label className="px-5 text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em]">Your Name / आपका नाम</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Rahul / राहुल"
                    className="w-full px-8 py-5 rounded-[2rem] bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-xl"
                />
            </div>

            <div className="space-y-2 text-left">
                <label className="px-5 text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em]">Gemini API Key / की (Key) डालें</label>
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={handleKeyChange}
                    placeholder="Paste your key here"
                    className="w-full px-8 py-5 rounded-[2rem] bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all shadow-xl"
                />
            </div>
            
            {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.15em] animate-shake">
                    ⚠️ {error}
                </p>
            )}

            <button 
                type="submit"
                disabled={isLoading}
                className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all flex items-center justify-center gap-3 ${
                  name.trim() && apiKey.trim() && !isLoading
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-95' 
                  : 'bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/10 cursor-not-allowed'
                }`}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <span>Start Neural Link</span>
                        <span>🚀</span>
                    </>
                )}
            </button>
        </form>

        <div className="pt-8 border-t border-slate-200 dark:border-white/5 max-w-sm mx-auto">
            <p className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.5em] leading-relaxed">
                Enter your name and API key to connect to Sahayak. Your key is used locally to connect with Gemini.
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
