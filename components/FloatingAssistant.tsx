
import React, { useState, useRef, useEffect } from 'react';

export type CompanionType = 'aero' | 'volt' | 'luna';

interface FloatingAssistantProps {
  type: CompanionType;
  isThinking: boolean;
  userName: string;
  theme: 'light' | 'dark';
  initialOffset?: { x: number, y: number };
  onClose: () => void;
}

const FloatingAssistant: React.FC<FloatingAssistantProps> = ({ type, isThinking, userName, theme, initialOffset = { x: 0, y: 0 }, onClose }) => {
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 250 + initialOffset.x, 
    y: window.innerHeight - 350 + initialOffset.y 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [interactionState, setInteractionState] = useState<'idle' | 'laughing' | 'angry' | 'scared' | 'looking_left' | 'looking_right'>('idle');
  const [showGreeting, setShowGreeting] = useState(true);
  
  // Audio functionality removed as per user request (Voice only voice nikal do)

  // --- Neural Autonomy Logic (Idle Animations) ---
  useEffect(() => {
    const autonomyInterval = setInterval(() => {
      if (isDragging || isThinking || interactionState !== 'idle') return;

      const rand = Math.random();
      if (rand < 0.15) {
        setInteractionState('laughing');
        setTimeout(() => setInteractionState('idle'), 2000);
      } else if (rand < 0.30) {
        setInteractionState('looking_left');
        setTimeout(() => setInteractionState('idle'), 1500);
      } else if (rand < 0.45) {
        setInteractionState('looking_right');
        setTimeout(() => setInteractionState('idle'), 1500);
      }
    }, 6000);

    return () => clearInterval(autonomyInterval);
  }, [isDragging, isThinking, interactionState]);

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (interactionState !== 'scared') {
      setInteractionState('scared');
    }
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setInteractionState('idle');
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSingleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    setInteractionState('laughing');
    setTimeout(() => setInteractionState('idle'), 2500);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInteractionState('angry');
    setTimeout(() => setInteractionState('idle'), 3500);
  };

  // BOT THEMES: Bodies are now colored
  const botThemes = {
    aero: { 
      body: 'bg-cyan-500', 
      secondary: 'bg-cyan-600',
      core: 'bg-white', 
      glow: 'shadow-[0_0_15px_rgba(255,255,255,0.8)]',
      border: 'border-cyan-700'
    },
    volt: { 
      body: 'bg-emerald-500', 
      secondary: 'bg-emerald-600',
      core: 'bg-green-400', 
      glow: 'shadow-[0_0_20px_rgba(74,222,128,0.9)]',
      border: 'border-emerald-700'
    },
    luna: { 
      body: 'bg-pink-400', 
      secondary: 'bg-pink-500',
      core: 'bg-pink-200', 
      glow: 'shadow-[0_0_15px_rgba(251,207,232,0.8)]',
      border: 'border-pink-600'
    }
  };

  const themeConfig = botThemes[type];

  const RemoveButton = () => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClose(); }} 
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl transition-all z-[150] border-2 border-white dark:border-slate-800 scale-110 active:scale-90"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  // --- RENDERS ---

  if (type === 'luna') {
    return (
      <div 
        className={`fixed z-[100] select-none transition-transform duration-75 group ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab scale-100'}`}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
        onClick={handleSingleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className={`relative flex flex-col items-center ${interactionState === 'scared' ? 'animate-shake-volt' : ''} ${interactionState === 'idle' ? 'animate-float-gentle' : ''}`}>
          <RemoveButton />
          
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none">
             {interactionState === 'laughing' && <Bubble text="Pink Power! 🌸" color="bg-pink-500" />}
             {interactionState === 'angry' && <Bubble text="STOP! 💢" color="bg-red-500" />}
             {interactionState === 'scared' && <Bubble text="AAAH! 😿" color="bg-orange-400" />}
             {showGreeting && interactionState === 'idle' && !isThinking && <Bubble text={`Hi ${userName}!`} color="bg-pink-400" />}
          </div>

          <div className={`w-16 h-20 ${themeConfig.body} rounded-[2rem] shadow-xl border-x border-pink-300 relative flex flex-col items-center transition-all duration-500 ${interactionState === 'looking_left' ? 'rotate-[-8deg]' : interactionState === 'looking_right' ? 'rotate-[8deg]' : interactionState === 'angry' ? 'rotate-3' : ''}`}>
            <div className="absolute -top-1 w-18 h-10 bg-slate-800 rounded-t-full z-10" />
            <div className={`absolute top-4 -left-2 w-5 h-8 bg-slate-700 rounded-full z-20 shadow-md ${interactionState === 'idle' ? 'animate-pulse' : ''}`} />
            <div className={`absolute top-4 -right-2 w-5 h-8 bg-slate-700 rounded-full z-20 shadow-md ${interactionState === 'idle' ? 'animate-pulse' : ''}`} />
            
            <div className="mt-8 flex flex-col items-center gap-1.5 z-30">
              <div className={`flex gap-4 transition-transform duration-300 ${interactionState === 'looking_left' ? '-translate-x-1' : interactionState === 'looking_right' ? 'translate-x-1' : ''}`}>
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${interactionState === 'angry' ? 'bg-red-500 shadow-[0_0_8px_red] scale-y-50' : 'bg-white shadow-[0_0_8px_pink]'} ${isThinking ? 'animate-pulse' : 'animate-[blink_4s_infinite]'}`} />
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${interactionState === 'angry' ? 'bg-red-500 shadow-[0_0_8px_red] scale-y-50' : 'bg-white shadow-[0_0_8px_pink]'} ${isThinking ? 'animate-pulse' : 'animate-[blink_4s_infinite]'}`} />
              </div>
              <div className="h-4 flex items-center justify-center">
                 <div className={`transition-all duration-300 ${
                   interactionState === 'laughing' ? 'w-6 h-2 border-b-2 border-white rounded-full' :
                   interactionState === 'angry' ? 'w-4 h-1 border-t-2 border-red-500 rounded-full' :
                   interactionState === 'scared' ? 'w-2 h-2 border border-white rounded-full' :
                   'w-2 h-0.5 bg-pink-200 rounded-full'
                 }`} />
              </div>
            </div>
          </div>

          <div className={`w-14 h-28 ${themeConfig.secondary} rounded-t-lg rounded-b-[2.5rem] shadow-xl border-x border-pink-300 mt-[-2px] flex flex-col items-center pt-4 relative`}>
            <div className={`w-6 h-6 rounded-full border border-pink-200 bg-pink-100 shadow-inner flex items-center justify-center ${isThinking || interactionState === 'idle' ? 'animate-pulse' : ''}`}>
              <div className="w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_10px_pink]" />
            </div>
            <div className={`absolute -left-3 top-2 w-3 h-20 ${themeConfig.body} rounded-full origin-top transition-all duration-300 shadow-sm border-l border-pink-300 ${
              interactionState === 'laughing' ? 'animate-wave-left' :
              interactionState === 'scared' ? 'rotate-[-30deg]' : interactionState === 'idle' ? 'rotate-[-5deg]' : 'rotate-0'
            }`} />
            <div className={`absolute -right-3 top-2 w-3 h-20 ${themeConfig.body} rounded-full origin-top transition-all duration-300 shadow-sm border-r border-pink-300 ${
              interactionState === 'laughing' ? 'animate-wave-right' :
              interactionState === 'scared' ? 'rotate-[30deg]' : interactionState === 'idle' ? 'rotate-[5deg]' : 'rotate-0'
            }`} />
          </div>
          <div className="w-10 h-2 bg-black/10 rounded-full blur-sm mt-2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (type === 'volt') {
    return (
      <div 
        className={`fixed z-[100] select-none transition-transform duration-75 group ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab scale-100'}`}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
        onClick={handleSingleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className={`relative flex flex-col items-center ${interactionState === 'scared' ? 'animate-shake-volt' : ''} ${interactionState === 'idle' ? 'animate-float-gentle' : ''}`}>
          <RemoveButton />
          
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none">
             {interactionState === 'laughing' && <Bubble text="Eco Mode! 🔋" color="bg-emerald-600" />}
             {interactionState === 'angry' && <Bubble text="SHUTDOWN! ⚠️" color="bg-red-600" />}
             {interactionState === 'scared' && <Bubble text="VOLTAGE DROP! 📉" color="bg-amber-600" />}
             {showGreeting && interactionState === 'idle' && !isThinking && <Bubble text={`Master ${userName}!`} color="bg-emerald-600" />}
          </div>

          <div className={`w-14 h-22 ${themeConfig.body} rounded-t-full rounded-b-[2rem] shadow-2xl border-x-2 border-emerald-600 relative flex flex-col items-center p-2 transition-all duration-500 ${interactionState === 'looking_left' ? 'rotate-[-5deg]' : interactionState === 'looking_right' ? 'rotate-[5deg]' : interactionState === 'angry' ? 'rotate-[-5deg]' : ''}`}>
            <div className="w-full h-12 bg-slate-900 rounded-[1.5rem] mt-1 flex flex-col items-center justify-center gap-1.5 relative overflow-hidden">
               <div className={`flex gap-2 transition-transform duration-300 ${interactionState === 'looking_left' ? '-translate-x-1.5' : interactionState === 'looking_right' ? 'translate-x-1.5' : ''}`}>
                 <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${interactionState === 'angry' ? 'bg-red-500 shadow-[0_0_10px_red] scale-y-50' : 'bg-green-400 shadow-[0_0_10px_lime]'} ${isThinking ? 'animate-pulse' : 'animate-[blink_4s_infinite]'}`} />
                 <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${interactionState === 'angry' ? 'bg-red-500 shadow-[0_0_10px_red] scale-y-50' : 'bg-green-400 shadow-[0_0_10px_lime]'} ${isThinking ? 'animate-pulse' : 'animate-[blink_4s_infinite]'}`} />
               </div>
               <div className="h-3 flex items-center justify-center w-full px-2">
                 <div className={`transition-all duration-300 ${
                   interactionState === 'laughing' ? 'w-6 h-2 border-b-2 border-green-400 rounded-full' :
                   interactionState === 'angry' ? 'w-4 h-1 border-t-2 border-red-500 rounded-full' :
                   interactionState === 'scared' ? 'w-1.5 h-1.5 border border-white rounded-full' :
                   'w-3 h-0.5 bg-green-900/40 rounded-full'
                 }`} />
               </div>
            </div>
          </div>

          <div className={`w-16 h-24 ${themeConfig.secondary} rounded-t-xl rounded-b-3xl shadow-xl border-x-2 border-emerald-600 flex flex-col items-center pt-3 relative`}>
            <div className={`absolute -left-3 top-3 w-4 h-16 ${themeConfig.body} rounded-full origin-top transition-all duration-300 shadow-sm border-l border-emerald-600 ${
              interactionState === 'laughing' ? 'animate-wave-left' :
              interactionState === 'scared' ? 'rotate-[-40deg]' : interactionState === 'idle' ? 'rotate-[-5deg]' : 'rotate-0'
            }`} />
            <div className={`absolute -right-3 top-3 w-4 h-16 ${themeConfig.body} rounded-full origin-top transition-all duration-300 shadow-sm border-r border-emerald-600 ${
              interactionState === 'laughing' ? 'animate-wave-right' :
              interactionState === 'scared' ? 'rotate-[40deg]' : interactionState === 'idle' ? 'rotate-[5deg]' : 'rotate-0'
            }`} />
            <div className={`w-8 h-8 rounded-lg border border-emerald-400 bg-emerald-900 flex flex-col items-center justify-center ${isThinking || interactionState === 'idle' ? 'animate-pulse' : ''}`}>
              <div className={`w-4 h-1 rounded-sm ${themeConfig.core} ${themeConfig.glow}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Aero (Cyan Body)
  return (
    <div 
      className={`fixed z-[100] select-none transition-transform duration-75 group ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab scale-100'}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className={`relative flex flex-col items-center ${interactionState === 'scared' ? 'animate-shake-fast' : ''} ${interactionState === 'idle' ? 'animate-float-gentle' : ''}`}>
        <RemoveButton />
        
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none">
           {interactionState === 'laughing' && <Bubble text="Aero Jump! ☁️" color="bg-cyan-600" />}
           {interactionState === 'angry' && <Bubble text="STOP! 😡" color="bg-red-500" />}
           {interactionState === 'scared' && <Bubble text="WHOA! 😨" color="bg-amber-500" />}
           {showGreeting && interactionState === 'idle' && !isThinking && <Bubble text={`Hi ${userName}!`} color="bg-cyan-500" />}
        </div>

        <div className={`w-24 h-24 ${themeConfig.body} rounded-full shadow-xl border-b-4 border-cyan-700 relative flex items-center justify-center transition-all duration-300 ${interactionState === 'looking_left' ? 'rotate-[-10deg]' : interactionState === 'looking_right' ? 'rotate-[10deg]' : interactionState === 'angry' ? 'rotate-6' : ''}`}>
          <div className="w-20 h-16 bg-slate-900 rounded-[2rem] border-2 border-white/20 flex flex-col items-center justify-center gap-1.5 relative overflow-hidden">
            <div className={`flex gap-4 transition-transform duration-300 ${interactionState === 'looking_left' ? '-translate-x-2' : interactionState === 'looking_right' ? 'translate-x-2' : ''}`}>
              <div className={`w-4 h-4 rounded-full ${interactionState === 'angry' ? 'bg-red-500 scale-y-50' : 'bg-cyan-400'} shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden animate-[blink_5s_infinite]`}>
                <div className={`w-1 h-1 bg-black rounded-full ${interactionState === 'scared' ? 'scale-150' : 'scale-100'}`} />
              </div>
              <div className={`w-4 h-4 rounded-full ${interactionState === 'angry' ? 'bg-red-500 scale-y-50' : 'bg-cyan-400'} shadow-lg transition-all duration-300 flex items-center justify-center overflow-hidden animate-[blink_5s_infinite]`}>
                <div className={`w-1 h-1 bg-black rounded-full ${interactionState === 'scared' ? 'scale-150' : 'scale-100'}`} />
              </div>
            </div>
            <div className="h-4 flex items-center justify-center w-full px-4">
              <div className={`transition-all duration-300 ${
                interactionState === 'laughing' ? 'w-8 h-3 border-b-4 border-white rounded-full' :
                interactionState === 'angry' ? 'w-6 h-1.5 border-t-2 border-red-500 rounded-full mt-2' :
                interactionState === 'scared' ? 'w-3 h-3 border-2 border-white rounded-full' :
                'w-4 h-0.5 bg-white/40 rounded-full'
              }`} />
            </div>
          </div>
        </div>

        <div className={`w-28 h-28 ${themeConfig.secondary} rounded-full shadow-2xl border-b-8 border-cyan-800 -mt-4 relative flex items-center justify-center`}>
          <div className={`absolute -left-4 top-8 w-6 h-12 ${themeConfig.body} rounded-full origin-top transition-all duration-300 border-b-2 border-cyan-700 shadow-sm ${
            interactionState === 'laughing' ? 'animate-wave-left' : 
            interactionState === 'scared' ? 'rotate-[-60deg]' : interactionState === 'idle' ? 'rotate-[-10deg]' : 'rotate-0'
          }`} />
          <div className={`absolute -right-4 top-8 w-6 h-12 ${themeConfig.body} rounded-full origin-top transition-all duration-300 border-b-2 border-cyan-700 shadow-sm ${
            interactionState === 'laughing' ? 'animate-wave-right' : 
            interactionState === 'scared' ? 'rotate-[60deg]' : interactionState === 'idle' ? 'rotate-[10deg]' : 'rotate-0'
          }`} />
          <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-2 border-cyan-300 shadow-inner ${isThinking || interactionState === 'idle' ? 'animate-pulse' : ''}`}>
             <span className={`text-[10px] font-black text-white drop-shadow-sm`}>AI</span>
             <div className={`w-6 h-1 rounded-full ${themeConfig.core} ${themeConfig.glow} opacity-80`} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%, 96%, 100% { transform: scaleY(1); } 98% { transform: scaleY(0.1); } }
        @keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-float-gentle { animation: float-gentle 4s ease-in-out infinite; }
        @keyframes wave-left { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-40deg); } }
        @keyframes wave-right { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(40deg); } }
        .animate-wave-left { animation: wave-left 0.5s ease-in-out infinite; }
        .animate-wave-right { animation: wave-right 0.5s ease-in-out infinite; }
        @keyframes shake-volt { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-2px, 2px); } 75% { transform: translate(2px, -2px); } }
        .animate-shake-volt { animation: shake-volt 0.1s infinite; }
      `}} />
    </div>
  );
};

const Bubble = ({ text, color = 'bg-white' }: { text: string, color?: string }) => (
  <div className={`${color.startsWith('bg-') ? color : 'bg-white'} px-4 py-2 rounded-2xl shadow-2xl border border-white/20 animate-bounce relative`}>
    <p className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow-md">{text}</p>
    <div className={`absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 ${color.startsWith('bg-') ? color : 'bg-white'} rotate-45`} />
  </div>
);

export default FloatingAssistant;
