
import React, { useState, useRef } from 'react';
import { generateAIImage } from '../services/geminiService';
import AuthRobot from './AuthRobot';

interface MagicImageModeProps {
  theme: 'light' | 'dark';
}

const MagicImageMode: React.FC<MagicImageModeProps> = ({ theme }) => {
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUploadedImage({ data: base64String, mimeType: file.type });
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage) return;

    setIsLoading(true);
    setLoadingStep('Initializing Nano Banana Engine...');
    setError(null);
    setResultImage(null);

    try {
      setLoadingStep('Processing Pixels...');
      const resultUrl = await generateAIImage(prompt, aspectRatio, uploadedImage || undefined);
      
      if (resultUrl) {
        setResultImage(resultUrl);
      } else {
        throw new Error("The model returned no result. Please try a different prompt.");
      }
    } catch (err: any) {
      console.error("Generation Error:", err);
      let errorMessage = err.message || "An unexpected error occurred.";
      
      if (errorMessage.includes("403") || errorMessage.includes("permission")) {
        errorMessage = "Access Denied (403): API Key issue. Ensure your key is valid and has billing/quota enabled.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const clearAll = () => {
    setUploadedImage(null);
    setResultImage(null);
    setPrompt('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const availableRatios = ['1:1', '9:16', '16:9', '4:3', '3:4'];

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-8 flex flex-col items-center relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse transition-colors duration-1000 bg-purple-600/10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-[100px] animate-pulse delay-1000 transition-colors duration-1000 bg-blue-600/10" />
      </div>

      <div className="z-10 w-full max-w-5xl space-y-8">
        
        {/* Nano Banana Branding Card */}
        <div className="w-full bg-slate-900/50 dark:bg-white/5 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
                ✨
            </div>
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500">
                    Nano banana powered app
                </h2>
                <p className="text-slate-400 dark:text-slate-300 font-medium mt-1">
                    Add powerful photo editing to your app. Allow users to add objects, remove backgrounds, or change a photo's style just by typing.
                </p>
            </div>
            <div className="flex gap-2">
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest">v2.5 Flash</div>
                <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-bold text-purple-400 uppercase tracking-widest">Neural GPU</div>
            </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 space-y-6">
                <label className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] px-2">Input Image</label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative h-64 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${uploadedImage ? 'border-purple-500 bg-purple-500/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  
                  {uploadedImage ? (
                    <>
                      <img src={`data:${uploadedImage.mimeType};base64,${uploadedImage.data}`} alt="Upload" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold uppercase text-xs tracking-widest bg-white/20 px-4 py-2 rounded-full backdrop-blur-md">Change Reference</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        📤
                      </div>
                      <p className="font-bold text-slate-600 dark:text-white/70">SELECT PRODUCT / IMAGE</p>
                      <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-widest font-bold">Max file size: 5MB</p>
                    </div>
                  )}
                </div>

                {/* Aspect Ratio Selector */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Aspect Ratio</label>
                        <span className="text-[10px] font-mono text-purple-400 font-bold">{aspectRatio}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {availableRatios.map(ratio => (
                            <button
                                key={ratio}
                                onClick={() => setAspectRatio(ratio)}
                                className={`flex-1 min-w-[60px] py-3 rounded-2xl text-xs font-black border transition-all active:scale-95 ${
                                    aspectRatio === ratio
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/70'
                                }`}
                            >
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Prompt Area */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Prompt</label>
                      <button onClick={() => setPrompt('')} className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:underline">Clear</button>
                  </div>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={uploadedImage ? "Example: add micro jewelry, change background to a luxury store..." : "Example: A cinematic shot of a futuristic sports car..."}
                    className="w-full h-32 p-5 rounded-[1.5rem] bg-black/20 border border-white/10 outline-none resize-none font-medium placeholder-white/20 transition-all focus:ring-2 focus:ring-blue-500/50 text-white"
                  />
                </div>

                <button 
                  onClick={handleGenerate} 
                  disabled={isLoading || (!prompt.trim() && !uploadedImage)}
                  className="w-full py-5 rounded-[1.5rem] font-black text-white uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:scale-100 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                        <span>Generating...</span>
                    </div>
                  ) : (
                    <>
                        <span>✨</span>
                        <span>Generate Magic</span>
                    </>
                  )}
                </button>
            </div>
          </div>

          {/* Result Section */}
          <div className="flex flex-col gap-6">
            <div className={`relative h-full min-h-[500px] rounded-[2.5rem] bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group`}>
                <div className="absolute top-6 left-6 z-10">
                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70">
                        Workspace Output
                    </div>
                </div>

                {isLoading ? (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl transition-all duration-500">
                        <div className="relative z-10 scale-125 mb-8">
                            <AuthRobot state="typing" />
                        </div>
                        <div className="relative z-10 text-center space-y-3">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter animate-pulse">
                                Rendering Neural Assets
                            </h3>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">
                                {loadingStep || 'Synchronizing with Nano Banana...'}
                            </p>
                        </div>
                        <div className="mt-8 w-64 h-1 bg-white/10 rounded-full overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full w-full animate-[progress_2s_ease-in-out_infinite] bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" style={{ transformOrigin: 'left' }} />
                        </div>
                    </div>
                ) : resultImage ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <img src={resultImage} alt="Magic Result" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <a 
                            href={resultImage} 
                            download={`sahayak-magic-${Date.now()}.png`}
                            className="absolute bottom-10 px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-110 transition-transform flex items-center gap-3 z-20 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 duration-300"
                        >
                            <span>💾</span>
                            <span>Export Result</span>
                        </a>
                    </div>
                ) : (
                    <div className="text-center p-12">
                        <div className="w-24 h-24 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-5xl mb-6 grayscale opacity-30">
                            ✨
                        </div>
                        <p className="font-black text-2xl uppercase tracking-[0.2em] text-white/20">
                            Magic Canvas
                        </p>
                        <p className="text-xs font-bold mt-3 text-white/10 uppercase tracking-widest">Output will appear in this workspace</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8 z-[60]">
                        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-[2rem] text-center backdrop-blur-xl max-w-sm">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h4 className="text-white font-black uppercase tracking-widest mb-2">Engine Warning</h4>
                            <p className="text-red-400 text-sm font-medium leading-relaxed mb-6">{error}</p>
                            <button onClick={() => setError(null)} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Re-sync Engine
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center pb-12">
             <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.5em] text-center">
                Secure Neural Pipeline • End-to-End Encryption • Powered by Nano Banana
             </p>
        </div>
      </div>
    </div>
  );
};

export default MagicImageMode;
