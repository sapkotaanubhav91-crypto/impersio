import { Plus, ChevronDown, ArrowUp } from 'lucide-react';
import React, { useRef } from 'react';

interface InputBarProps {
  query: string;
  setQuery: (q: string) => void;
  handleSearch: () => void;
  isInitial: boolean;
}

export const ChatBoxInput: React.FC<InputBarProps> = ({ 
  query, 
  setQuery, 
  handleSearch, 
  isInitial,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    return (
        <div className={`w-full ${isInitial ? 'max-w-[800px]' : 'max-w-3xl'} mx-auto relative z-30 px-4 pb-8`}>
            <div className={`flex items-center gap-2 p-2 w-full border border-gray-200 rounded-full bg-white shadow-lg transition-all duration-300 hover:border-gray-300`}>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Plus className="w-5 h-5" />
                </button>
                
                <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
                    placeholder="Ask anything..."
                    className='flex-1 outline-none bg-transparent resize-none text-foreground py-2 text-sm placeholder:text-gray-400'
                    rows={1}
                />

                <div className="flex items-center gap-2 pr-1">
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors text-xs font-medium text-gray-500">
                        <span>Model</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    <button 
                        onClick={() => handleSearch()} 
                        className={`p-2 rounded-full transition-all ${query.trim() ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}
                        disabled={!query.trim()}
                    >
                        <ArrowUp className='h-4 w-4'/>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatBoxInput;
