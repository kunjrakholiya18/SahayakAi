
import React, { useState, useEffect } from 'react';
import AuthRobot, { RobotState } from './AuthRobot';
import Orb from './Orb';

interface AuthScreenProps {
  onSuccess: (name: string, apiKey: string) => void;
  theme?: 'light' | 'dark';
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, theme = 'dark' }) => {
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

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      setRobotState('cheering');
      await window.aistudio.openSelectKey();
      // After selecting, we assume the key is available via process.env.API_KEY
      if (name.trim()) {
          handleSubmit(new Event('submit') as any);
      } else {
          setError('Please enter your name first');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setRobotState('denying');
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setRobotState('cheering');
    
    // Key might come from manual input or be pre-configured in process.env
    const finalKey = apiKey.trim() || process.env.API_KEY || '';
    
    setTimeout(() => {
      onSuccess(name.trim(), finalKey);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-black overflow-hidden relative px-6 py-12 transition-colors duration-500 font-sans">
      <div className="absolute top-1/4 -left-20 opacity-20"><Orb size="lg" theme="dark" /></div>
      <div className="absolute bottom-1/4 -right-20 opacity-20"><Orb size="md" theme="dark" /></div>
      
      <div className="mb-8 z-20 transition-transform duration-700 hover:scale-110">
        <AuthRobot state={robotState} />
      </div>

      <div className="w-full max-w-xl text-center z-30 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 dark:to-indigo-400">
                Sahayak AI
            </h1>
            <p className="text-xs font-black text-white/30 uppercase tracking-[0.4em]">Personal Assistant • Made by Kunj</p>
        </div>

        <form onSubmit={handleSubmit} className="relative max-w-md mx-auto space-y-6">
            <div className="space-y-2 text-left">
                <label className="px-5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Your Name </label>
                <input 
                    type="text" 
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Enter Your Name"
                    className="w-full px-8 py-5 rounded-[2rem] bg-white/5 border-2 border-white/10 text-lg font-bold text-white outline-none focus:border-blue-500 transition-all shadow-xl"
                />
            </div>

            <div className="space-y-2 text-left">
                <label className="px-5 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Gemini API Key (Optional if pre-set)</label>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={handleKeyChange}
                        placeholder="Paste key or use selector"
                        className="flex-1 px-8 py-5 rounded-[2rem] bg-white/5 border-2 border-white/10 text-sm font-bold text-white outline-none focus:border-blue-500 transition-all shadow-xl"
                    />
                    {window.aistudio && (
                      <button 
                        type="button" 
                        onClick={handleSelectKey}
                        className="px-6 rounded-[2rem] bg-white/10 border-2 border-white/10 hover:bg-white/20 transition-all text-xl"
                        title="Select key from AI Studio"
                      >
                        🔑
                      </button>
                    )}
                </div>
                <p className="px-5 text-[8px] text-white/30 font-bold uppercase tracking-widest">
                  Required for Live Voice & High-Quality Responses
                </p>
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
                  name.trim() && !isLoading
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-95' 
                  : 'bg-white/5 text-white/10 cursor-not-allowed'
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

        <div className="pt-8 border-t border-white/5 max-w-sm mx-auto">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] leading-relaxed">
                Connect to Sahayak. Created by Kunj. Responses in English & Hindi.
                <br/>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500/50 hover:underline mt-2 inline-block">Learn about API Keys</a>
            </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
