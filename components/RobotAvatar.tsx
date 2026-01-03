
import React from 'react';

interface RobotAvatarProps {
  isThinking: boolean;
  theme?: 'light' | 'dark';
}

const RobotAvatar: React.FC<RobotAvatarProps> = ({ isThinking, theme = 'dark' }) => {
  return (
    <div className={`absolute bottom-full left-0 mb-2 z-30 transition-all duration-700 ease-in-out pointer-events-none ${isThinking ? 'scale-125 -translate-y-2 translate-x-2' : 'scale-90 translate-y-2 -translate-x-2 opacity-80'}`}>
      <div className="relative group">
        {/* Shadow/Reflection */}
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1.5 ${theme === 'light' ? 'bg-slate-300' : 'bg-black/40'} rounded-full blur-sm transition-all duration-700 ${isThinking ? 'scale-150 opacity-60' : 'scale-100 opacity-20'}`} />

        {/* Robot Head */}
        <div className={`relative w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.3),3px_3px_10px_rgba(0,0,0,0.5)] flex items-center justify-center border-b-4 border-blue-800 animate-bounce-slow`}>
          
          {/* Antennas */}
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex gap-3">
            <div className="w-0.5 h-3 bg-blue-700 rounded-full" />
            <div className="w-0.5 h-3 bg-blue-700 rounded-full" />
          </div>

          {/* Face Display */}
          <div className="w-10 h-7 bg-slate-900 rounded-lg flex flex-col items-center justify-center gap-1 border border-white/10 overflow-hidden">
            {/* Eyes */}
            <div className="flex gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] transition-all duration-300 ${isThinking ? 'animate-pulse scale-125' : 'animate-[blink_4s_infinite]'}`} />
              <div className={`w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] transition-all duration-300 ${isThinking ? 'animate-pulse scale-125' : 'animate-[blink_4s_infinite]'}`} />
            </div>
            {/* Mouth/Voice Line */}
            <div className={`h-0.5 bg-cyan-400/50 rounded-full transition-all duration-300 ${isThinking ? 'w-5 opacity-100' : 'w-1.5 opacity-30'}`} />
          </div>

          {/* Glass Overlay Effect */}
          <div className="absolute top-1 left-1 w-5 h-2 bg-white/20 rounded-full rotate-[-15deg] blur-[1px]" />
        </div>

        {/* Status indicator */}
        {isThinking && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2.5s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default RobotAvatar;
