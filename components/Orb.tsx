
import React from 'react';

interface OrbProps {
  size?: 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  theme?: 'light' | 'dark';
}

const Orb: React.FC<OrbProps> = ({ size = 'md', isThinking = false, theme = 'dark' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-64 h-64'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* Background Glow Layers */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600 via-blue-500 to-pink-500 blur-2xl transition-all duration-700 ${theme === 'light' ? 'opacity-20' : 'opacity-40'} animate-pulse ${isThinking ? 'scale-110' : 'scale-100'}`} />
      <div className={`absolute inset-0 rounded-full bg-gradient-to-bl from-indigo-600 via-cyan-400 to-fuchsia-500 blur-3xl transition-all duration-700 ${theme === 'light' ? 'opacity-15' : 'opacity-30'} animate-pulse delay-700`} />
      
      {/* The Main Orb Body */}
      <div className={`relative z-10 w-full h-full rounded-full border-2 border-slate-200 dark:border-white/20 glass-card bg-white/20 dark:bg-transparent flex items-center justify-center overflow-hidden transition-all duration-500 ${isThinking ? 'rotate-180 scale-105' : 'rotate-0'}`}>
        {/* Dynamic Swirling Gradients */}
        <div className="absolute inset-0 opacity-80 animate-[spin_10s_linear_infinite]">
            <div className={`absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(123,49,255,${theme === 'light' ? '0.4' : '0.8'})_0%,_transparent_70%)]`} />
            <div className={`absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(0,210,255,${theme === 'light' ? '0.4' : '0.8'})_0%,_transparent_70%)]`} />
        </div>
        
        {/* AI Text Center */}
        <span className={`${theme === 'light' ? 'text-slate-900' : 'text-white'} font-bold select-none tracking-widest ${size === 'lg' ? 'text-7xl' : size === 'md' ? 'text-4xl' : 'text-xl'} transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`}>
          AI
        </span>

        {/* Inner Light Ring */}
        <div className="absolute inset-2 rounded-full border border-slate-300 dark:border-white/30" />
      </div>

      {/* Decorative Rotating Particle Rings */}
      {size === 'lg' && (
        <div className="absolute inset-[-20px] rounded-full border border-dashed border-slate-200 dark:border-white/10 animate-[spin_30s_linear_infinite]" />
      )}
    </div>
  );
};

export default Orb;
