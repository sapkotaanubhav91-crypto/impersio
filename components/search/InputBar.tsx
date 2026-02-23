import React, { useRef, useState } from 'react';
import { Plus, Mic, ArrowRight, ChevronDown, ArrowUp, Globe, Mountain, Sparkles, Keyboard, Calculator, Code, MessageSquare, Book, Youtube } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';
import { ModeSelector } from './ModeSelector';
import { ModelOption, SearchModeType } from '../../types';
import { SoundWaveIcon } from '../Icons';

interface InputBarProps {
  query: string;
  setQuery: (q: string) => void;
  handleSearch: () => void;
  isInitial: boolean;
  selectedModel: ModelOption;
  setSelectedModel: (m: ModelOption) => void;
  models: ModelOption[];
  selectedMode: SearchModeType;
  setSelectedMode: (m: SearchModeType) => void;
}

export const InputBar: React.FC<InputBarProps> = ({ 
  query, 
  setQuery, 
  handleSearch, 
  isInitial,
  selectedModel,
  setSelectedModel,
  models,
  selectedMode,
  setSelectedMode
}) => {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
      <div className={`w-full ${isInitial ? 'max-w-[700px]' : 'max-w-3xl'} mx-auto relative z-30 px-4`}>
        <div className={`
          relative flex flex-col w-full bg-[#f4f4f5] dark:bg-[#202020] transition-all duration-300
          ${isInitial ? 'rounded-xl p-4 shadow-sm border border-gray-300 dark:border-gray-700' : 'rounded-full p-2 px-4 shadow-elegant mb-6 border border-transparent'}
        `}>
          {isInitial ? (
             <>
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
                  placeholder="Ask a question..."
                  className="w-full bg-transparent text-primary placeholder:text-gray-500 font-normal focus:outline-none resize-none overflow-hidden text-lg mb-4 leading-relaxed ml-1 font-sans min-h-[28px]"
                  style={{ minHeight: '28px' }}
                  rows={1}
                  autoFocus
                />
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                     {/* Web/Mode Toggle */}
                     <ModeSelector 
                        selectedMode={selectedMode} 
                        onSelect={(m) => { setSelectedMode(m); setIsModeMenuOpen(false); }} 
                        isOpen={isModeMenuOpen} 
                        onToggle={() => setIsModeMenuOpen(!isModeMenuOpen)}
                        trigger={
                            <button 
                                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${selectedMode === 'web' ? 'bg-[#52525b] text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                <Globe className="w-4 h-4" />
                            </button>
                        }
                     />

                     {/* Extra Icons (Visual Only) */}
                     <div className="hidden sm:flex items-center gap-1 mr-2">
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200/50"><Keyboard className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200/50"><Calculator className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200/50"><Code className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200/50"><MessageSquare className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200/50"><Book className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-200/50"><Youtube className="w-4 h-4" /></button>
                     </div>

                     {/* Model Selector Pill */}
                     <ModelSelector
                        selectedModel={selectedModel}
                        models={models}
                        onSelect={setSelectedModel}
                        isOpen={isModelMenuOpen}
                        onToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        trigger={
                            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#404040] text-white rounded-full text-xs font-medium hover:bg-black transition-colors">
                                <Sparkles className="w-3 h-3" />
                                {selectedModel.name}
                            </button>
                        }
                    />

                     {/* Extreme Mode Toggle */}
                     <button 
                        onClick={() => setSelectedMode(selectedMode === 'extreme' ? 'web' : 'extreme')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${selectedMode === 'extreme' ? 'bg-white border-gray-200 text-black shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                     >
                         <Mountain className="w-3 h-3" />
                         Extreme
                     </button>
                  </div>
                  
                  {/* Submit Button */}
                  <button 
                    onClick={() => handleSearch()}
                    disabled={!query.trim()}
                    className={`
                      flex items-center justify-center rounded-full w-8 h-8 transition-all duration-200
                      ${query.trim() ? 'bg-[#404040] text-white hover:bg-black' : 'bg-gray-300 text-white'}
                    `}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
             </>
          ) : (
            <div className="flex items-center gap-3 w-full h-[46px]">
               <div className="shrink-0">
                   <ModeSelector 
                        selectedMode={selectedMode} 
                        onSelect={(m) => { setSelectedMode(m); setIsModeMenuOpen(false); }} 
                        isOpen={isModeMenuOpen} 
                        onToggle={() => setIsModeMenuOpen(!isModeMenuOpen)}
                        trigger={
                            <button className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary transition-colors">
                                <Globe className="w-4 h-4" />
                            </button>
                        }
                   />
               </div>
               <input
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                 placeholder="Ask follow-up..."
                 className="flex-1 bg-transparent text-primary placeholder:text-muted/60 font-medium focus:outline-none text-[15px] font-sans"
               />
               <div className="flex items-center gap-3 shrink-0">
                   {/* Model Selector in Footer */}
                   <ModelSelector
                        selectedModel={selectedModel}
                        models={models}
                        onSelect={setSelectedModel}
                        isOpen={isModelMenuOpen}
                        onToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        trigger={
                           <button className="text-xs font-medium text-muted hover:text-primary bg-surface-hover px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                               {selectedModel.name} <ChevronDown className="w-3 h-3" />
                           </button>
                        }
                  />
                  <div className="h-4 w-px bg-border mx-1" />
                  <button 
                    onClick={() => handleSearch()}
                    disabled={!query.trim()}
                    className={`flex items-center justify-center rounded-full w-8 h-8 transition-all ${query.trim() ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
  );
};
