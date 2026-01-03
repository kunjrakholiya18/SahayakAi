
import React from 'react';

export type RobotState = 'idle' | 'waving' | 'denying' | 'cheering' | 'typing';

interface AuthRobotProps {
  state: RobotState;
}

const AuthRobot: React.FC<AuthRobotProps> = ({ state }) => {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 transition-all duration-500 transform hover:scale-105">
      {/* Robot Body Shadow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/40 rounded-full blur-xl animate-pulse" />

      {/* Main Robot Container */}
      <div className={`relative w-full h-full flex flex-col items-center justify-center animate-float ${state === 'denying' ? 'animate-shake' : ''}`}>
        
        {/* Antennas */}
        <div className="absolute -top-4 flex gap-8">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full relative">
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${state === 'denying' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-400 shadow-[0_0_10px_cyan]'} transition-colors duration-300 animate-pulse`} />
          </div>
          <div className="w-1.5 h-6 bg-blue-600 rounded-full relative">
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${state === 'denying' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-blue-400 shadow-[0_0_10px_cyan]'} transition-colors duration-300 animate-pulse`} />
          </div>
        </div>

        {/* Head */}
        <div className={`w-40 h-40 md:w-52 md:h-52 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-[3rem] shadow-[inset_-8px_-8px_15px_rgba(0,0,0,0.3),8px_8px_25px_rgba(0,0,0,0.5)] border-b-8 border-indigo-900 flex items-center justify-center overflow-hidden relative group`}>
          
          {/* Inner Screen */}
          <div className="w-32 h-24 md:w-40 md:h-32 bg-slate-900 rounded-[2rem] border-2 border-white/10 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
            
            {/* Eyes Container */}
            <div className="flex gap-8">
              {/* Left Eye */}
              <div className={`relative w-4 h-4 md:w-6 md:h-6 rounded-full transition-all duration-300 ${
                state === 'denying' ? 'bg-red-500 shadow-[0_0_15px_red] scale-y-50' : 
                state === 'cheering' ? 'bg-green-400 shadow-[0_0_15px_lime] scale-125' : 
                'bg-cyan-400 shadow-[0_0_15px_cyan] animate-[blink_4s_infinite]'
              }`}>
                {state === 'cheering' && <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] md:text-xs">^</div>}
              </div>
              
              {/* Right Eye */}
              <div className={`relative w-4 h-4 md:w-6 md:h-6 rounded-full transition-all duration-300 ${
                state === 'denying' ? 'bg-red-500 shadow-[0_0_15px_red] scale-y-50' : 
                state === 'cheering' ? 'bg-green-400 shadow-[0_0_15px_lime] scale-125' : 
                'bg-cyan-400 shadow-[0_0_15px_cyan] animate-[blink_4s_infinite]'
              }`}>
                {state === 'cheering' && <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] md:text-xs">^</div>}
              </div>
            </div>

            {/* Mouth */}
            <div className={`transition-all duration-500 ${
              state === 'denying' ? 'w-8 h-1 bg-red-400 rounded-full' :
              state === 'cheering' ? 'w-12 h-4 border-b-4 border-green-400 rounded-full' :
              state === 'typing' ? 'w-4 h-4 border-2 border-cyan-400 rounded-full animate-ping' :
              'w-6 h-1 bg-cyan-400/50 rounded-full'
            }`} />

            {/* Scanning Line (only when typing/idle) */}
            {(state === 'idle' || state === 'typing') && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent w-full h-1/2 animate-[scan_2s_linear_infinite]" />
            )}
          </div>

          {/* Hand/Waving Arm */}
          <div className={`absolute -right-4 top-1/2 w-8 h-12 bg-indigo-600 rounded-full origin-top transition-transform duration-500 ${state === 'waving' ? 'animate-wave' : 'rotate-[20deg]'}`} />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-40deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes scan {
          from { transform: translateY(-100%); }
          to { transform: translateY(200%); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-wave { animation: wave 1s ease-in-out infinite; }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}} />
    </div>
  );
};

export default AuthRobot;
