import React, { useRef, useState } from 'react';
import { Plus, Mic, ArrowRight, ChevronDown, ArrowUp } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';
import { ModelOption } from '../../types';
import { SoundWaveIcon } from '../Icons';

interface InputBarProps {
  query: string;
  setQuery: (q: string) => void;
  handleSearch: () => void;
  isInitial: boolean;
  selectedModel: ModelOption;
  setSelectedModel: (m: ModelOption) => void;
  models: ModelOption[];
}

export const InputBar: React.FC<InputBarProps> = ({ 
  query, 
  setQuery, 
  handleSearch, 
  isInitial,
  selectedModel,
  setSelectedModel,
  models
}) => {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
      <div className={`w-full ${isInitial ? 'max-w-[700px]' : 'max-w-3xl'} mx-auto relative z-30 px-4`}>
        <div className={`
          relative flex flex-col w-full bg-white dark:bg-[#202020] border border-gray-200 dark:border-gray-700 transition-all duration-300
          ${isInitial ? 'rounded-2xl p-3 pb-3 shadow-sm hover:border-gray-300 dark:hover:border-gray-600' : 'rounded-full p-2 px-4 shadow-elegant mb-6'}
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
                  placeholder="Ask anything. Type @ for sources and / for shortcuts."
                  className="w-full bg-transparent text-primary placeholder:text-gray-400 font-normal focus:outline-none resize-none overflow-hidden text-lg mb-10 leading-relaxed ml-1 font-sans min-h-[40px]"
                  style={{ minHeight: '28px' }}
                  rows={1}
                  autoFocus
                />
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                     <button className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-primary border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Plus className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     {/* Model Selector */}
                    <div className="flex items-center gap-2">
                       <ModelSelector
                            selectedModel={selectedModel}
                            models={models}
                            onSelect={setSelectedModel}
                            isOpen={isModelMenuOpen}
                            onToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            trigger={
                                <button className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                                    Model <ChevronDown className="w-3 h-3" />
                                </button>
                            }
                        />
                    </div>
                    
                    {/* Mic */}
                    <button className="p-2 rounded-full text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Mic className="w-5 h-5" />
                    </button>

                    {/* Submit Button */}
                    <button 
                      onClick={() => handleSearch()}
                      disabled={!query.trim()}
                      className={`
                        flex items-center justify-center rounded-full w-9 h-9 transition-all duration-200
                        ${query.trim() ? 'bg-[#1c7483] hover:bg-[#165f6b] text-white shadow-md' : 'bg-[#1c7483] text-white'}
                      `}
                    >
                      {query.trim() ? <ArrowRight className="w-5 h-5" /> : <SoundWaveIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
             </>
          ) : (
            <div className="flex items-center gap-3 w-full h-[46px]">
               <button className="p-2 text-muted hover:text-primary transition-colors rounded-full shrink-0 hover:bg-surface-hover">
                  <Plus className="w-5 h-5 opacity-60" />
               </button>
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
                    className={`flex items-center justify-center rounded-full w-8 h-8 transition-all ${query.trim() ? 'bg-scira-accent text-white' : 'bg-border/30 text-muted'}`}
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
