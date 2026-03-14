import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Globe, ChevronDown, Plus, Mic, Monitor, Search, BrainCircuit, Cpu, Paperclip, Atom } from 'lucide-react';
import { ModelSelector } from '../ModelSelector';
import { ModeSelector } from './ModeSelector';
import { ModelOption, SearchModeType } from '../../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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
  const [placeholder, setPlaceholder] = useState('Ask anything...');

  useEffect(() => {
    const placeholders = ['Ask anything...', 'Type / for search modes and shortcuts', 'Type @ for connectors and sources'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setPlaceholder(placeholders[i]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
      <div className={`w-full ${isInitial ? 'max-w-[800px]' : 'max-w-3xl'} mx-auto relative z-30 px-4`}>
        <div className={`
          relative flex flex-col w-full bg-[#F4F4F4] dark:bg-[#2F2F2F] transition-all duration-300
          ${isInitial ? 'rounded-3xl p-4 shadow-sm border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600' : 'rounded-full p-2 px-4 shadow-sm mb-6 border border-gray-200 dark:border-gray-700'}
        `}>
          <Tabs defaultValue="Search" className="w-full">
            <TabsList className="mb-2">
                <TabsTrigger value="Search" className='text-[#1c7483]'> <Search className="w-4 h-4 mr-2" /> Search</TabsTrigger>
                <TabsTrigger value="Research" className='text-[#1c7483]'> <Atom className="w-4 h-4 mr-2" />Research</TabsTrigger>
            </TabsList>
            <TabsContent value="Search">
                <div className="flex items-start gap-2 mb-2">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-500 font-normal focus:outline-none resize-none overflow-hidden text-lg leading-relaxed font-sans min-h-[44px] pt-1.5"
                    style={{ minHeight: '44px' }}
                    rows={1}
                    autoFocus
                  />
                </div>
            </TabsContent>
            <TabsContent value="Research">
                <div className="flex items-start gap-2 mb-2">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
                    placeholder="Research Anything..."
                    className="w-full bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-500 font-normal focus:outline-none resize-none overflow-hidden text-lg leading-relaxed font-sans min-h-[44px] pt-1.5"
                    style={{ minHeight: '44px' }}
                    rows={1}
                    autoFocus
                  />
                </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
                {/* Focus / Mode Selector */}
                <ModeSelector 
                    selectedMode={selectedMode} 
                    onSelect={(m) => { setSelectedMode(m); setIsModeMenuOpen(false); }} 
                    isOpen={isModeMenuOpen} 
                    onToggle={() => setIsModeMenuOpen(!isModeMenuOpen)}
                    trigger={
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-[#3A3A3A] transition-colors text-sm font-medium">
                            <Globe className="w-4 h-4" />
                            <span>Focus</span>
                        </button>
                    }
                />
            </div>
            
            <div className="flex items-center gap-2">
                {/* Model Selector */}
                <ModelSelector
                    selectedModel={selectedModel}
                    models={models}
                    onSelect={setSelectedModel}
                    isOpen={isModelMenuOpen}
                    onToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
                    trigger={
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-[#3A3A3A] rounded-full text-sm font-medium transition-colors">
                            <Cpu className="w-4 h-4" />
                            {selectedModel.name}
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                    }
                />

                {/* File Upload Button */}
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-[#3A3A3A] rounded-full text-sm font-medium transition-colors">
                    <Paperclip className="w-4 h-4" />
                    <span>Attach</span>
                </button>

                {/* Mic Button */}
                <button className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-[#3A3A3A] rounded-full transition-colors">
                    <Mic className="w-5 h-5" />
                </button>

                {/* Submit Button */}
                <button 
                    onClick={() => handleSearch()}
                    disabled={!query.trim()}
                    className={`
                        flex items-center justify-center rounded-full w-9 h-9 transition-all duration-200 ml-1
                        ${query.trim() ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80' : 'bg-[#E0E0E0] dark:bg-[#4A4A4A] text-gray-400 dark:text-gray-500'}
                    `}
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      </div>
  );
};
