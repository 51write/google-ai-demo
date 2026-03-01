import React, { useState, useRef } from 'react';
import { Upload, Scissors, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle, ScanFace } from 'lucide-react';
import { generateHairstyle, adjustToFrontFacing } from './services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

const HAIRSTYLES = [
  { id: 'short-bob', name: 'Short Bob', prompt: 'a chic short bob cut' },
  { id: 'long-wavy', name: 'Long Wavy', prompt: 'long flowing wavy hair' },
  { id: 'pixie', name: 'Pixie Cut', prompt: 'a stylish short pixie cut' },
  { id: 'buzz', name: 'Buzz Cut', prompt: 'a very short buzz cut' },
  { id: 'curly', name: 'Curly Afro', prompt: 'a voluminous curly afro' },
  { id: 'bangs', name: 'Straight with Bangs', prompt: 'straight hair with front bangs' },
  { id: 'messy-bun', name: 'Messy Bun', prompt: 'a casual messy bun updo' },
  { id: 'slicked-back', name: 'Slicked Back', prompt: 'elegant slicked back hair' },
];

export default function App() {
  const [originalImage, setOriginalImage] = useState<{ url: string; base64: string; mimeType: string } | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, { status: 'loading' | 'success' | 'error', url?: string, error?: string }>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64 = result.split(',')[1];
      setOriginalImage({
        url: result,
        base64,
        mimeType: file.type,
      });
      // Reset state on new upload
      setResults({});
      setSelectedStyles([]);
    };
    reader.readAsDataURL(file);
  };

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!originalImage || selectedStyles.length === 0) return;

    setIsGenerating(true);
    
    // Initialize loading state for all selected styles
    const newResults = { ...results };
    selectedStyles.forEach(styleId => {
      if (newResults[styleId]?.status !== 'success') {
        newResults[styleId] = { status: 'loading' };
      }
    });
    setResults(newResults);

    const stylesToGenerate = selectedStyles.filter(id => results[id]?.status !== 'success');
    
    await Promise.allSettled(
      stylesToGenerate.map(async (styleId) => {
        const style = HAIRSTYLES.find(s => s.id === styleId)!;
        try {
          const generatedUrl = await generateHairstyle(originalImage.base64, originalImage.mimeType, style.prompt);
          setResults(prev => ({
            ...prev,
            [styleId]: { status: 'success', url: generatedUrl }
          }));
        } catch (error: any) {
          console.error(`Error generating ${style.name}:`, error);
          setResults(prev => ({
            ...prev,
            [styleId]: { status: 'error', error: error.message || 'Failed to generate' }
          }));
        }
      })
    );

    setIsGenerating(false);
  };

  const handleAdjustFrontFacing = async () => {
    if (!originalImage) return;
    
    setIsAdjusting(true);
    try {
      const newImageUrl = await adjustToFrontFacing(originalImage.base64, originalImage.mimeType);
      
      // Convert the new data URL back to base64 and mimeType
      const base64 = newImageUrl.split(',')[1];
      const mimeTypeMatch = newImageUrl.match(/data:(.*?);base64/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
      
      setOriginalImage({
        url: newImageUrl,
        base64,
        mimeType
      });
      
      // Clear previous hairstyle results since the base image changed
      setResults({});
    } catch (error: any) {
      console.error("Error adjusting to front-facing:", error);
      alert(error.message || "Failed to adjust angle. Please try again.");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white">
              <Scissors size={16} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">StylePreview AI</h1>
          </div>
          <p className="text-sm text-stone-500 font-medium hidden sm:block">Virtual Salon Experience</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-10">
            
            {/* Upload Section */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">01. Your Photo</h2>
              
              {!originalImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[3/4] sm:aspect-video lg:aspect-[3/4] rounded-2xl border-2 border-dashed border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group"
                >
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="text-stone-400" size={24} />
                  </div>
                  <div className="text-center px-4">
                    <p className="font-medium text-stone-700">Click to upload portrait</p>
                    <p className="text-sm text-stone-400 mt-1">Clear face, good lighting works best</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] sm:aspect-video lg:aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 group shadow-sm">
                    <img 
                      src={originalImage.url} 
                      alt="Original portrait" 
                      className="w-full h-full object-cover"
                    />
                    {isAdjusting && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center text-stone-800 z-10">
                        <Loader2 size={32} className="animate-spin mb-3 text-stone-600" />
                        <span className="text-sm font-medium animate-pulse">Adjusting Angle...</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white text-stone-900 px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                      >
                        <Upload size={16} />
                        Change Photo
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAdjustFrontFacing}
                    disabled={isAdjusting || isGenerating}
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <ScanFace size={18} />
                    Adjust to Front-Facing
                  </button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
              />
            </section>

            {/* Style Selection */}
            <AnimatePresence>
              {originalImage && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400">02. Choose Styles</h2>
                    <span className="text-xs font-medium bg-stone-200 text-stone-600 px-2 py-1 rounded-full">
                      {selectedStyles.length} selected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {HAIRSTYLES.map(style => {
                      const isSelected = selectedStyles.includes(style.id);
                      return (
                        <button
                          key={style.id}
                          onClick={() => toggleStyle(style.id)}
                          className={`
                            text-left px-4 py-3 rounded-xl border transition-all duration-200
                            ${isSelected 
                              ? 'border-stone-900 bg-stone-900 text-white shadow-md' 
                              : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{style.name}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-white/80" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={selectedStyles.length === 0 || isGenerating}
                    className={`
                      w-full mt-6 py-4 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all
                      ${selectedStyles.length === 0 
                        ? 'bg-stone-300 cursor-not-allowed' 
                        : isGenerating 
                          ? 'bg-stone-800 cursor-wait' 
                          : 'bg-stone-900 hover:bg-stone-800 hover:shadow-lg hover:-translate-y-0.5'}
                    `}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Generating Magic...
                      </>
                    ) : (
                      <>
                        <Scissors size={18} />
                        Generate {selectedStyles.length} {selectedStyles.length === 1 ? 'Style' : 'Styles'}
                      </>
                    )}
                  </button>
                </motion.section>
              )}
            </AnimatePresence>

          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            {originalImage ? (
              <div className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-4">03. Results</h2>
                
                {Object.keys(results).length === 0 ? (
                  <div className="aspect-square sm:aspect-video lg:aspect-square rounded-3xl border border-stone-200 bg-white/50 flex flex-col items-center justify-center text-stone-400 p-8 text-center">
                    <ImageIcon size={48} className="mb-4 opacity-20" />
                    <p className="font-medium text-stone-600">No results yet</p>
                    <p className="text-sm mt-2 max-w-xs">Select some hairstyles and click generate to see your new look.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <AnimatePresence>
                      {HAIRSTYLES.filter(s => results[s.id]).map(style => {
                        const result = results[style.id];
                        return (
                          <motion.div 
                            key={style.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100 flex flex-col"
                          >
                            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 relative mb-3">
                              {result.status === 'loading' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 bg-stone-50">
                                  <Loader2 size={32} className="animate-spin mb-3 text-stone-300" />
                                  <span className="text-sm font-medium animate-pulse">Crafting {style.name}...</span>
                                </div>
                              )}
                              {result.status === 'error' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 bg-red-50 p-4 text-center">
                                  <AlertCircle size={32} className="mb-2" />
                                  <span className="text-sm font-medium">Failed to generate</span>
                                  <span className="text-xs mt-1 opacity-70">{result.error}</span>
                                </div>
                              )}
                              {result.status === 'success' && result.url && (
                                <img 
                                  src={result.url} 
                                  alt={`${style.name} result`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                            </div>
                            <div className="px-2 pb-1 flex items-center justify-between">
                              <span className="font-medium text-stone-800">{style.name}</span>
                              {result.status === 'success' && (
                                <button 
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = result.url!;
                                    a.download = `hairstyle-${style.id}.png`;
                                    a.click();
                                  }}
                                  className="text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
                                >
                                  Download
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 min-h-[400px]">
                <div className="w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-6">
                  <ImageIcon size={32} className="opacity-50" />
                </div>
                <p className="text-lg font-medium text-stone-600">Your virtual salon awaits</p>
                <p className="text-sm mt-2 max-w-sm text-center">Upload a photo to start exploring different hairstyles powered by AI.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
