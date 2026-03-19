import { Atom, Globe, Mic, Paperclip, Cpu, Search, AudioLines, ArrowUp } from 'lucide-react';
import React, { useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

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
            <div className="flex flex-col w-full bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-xl shadow-sm transition-all duration-300 p-3">
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
                    className='w-full outline-none bg-transparent resize-none text-foreground py-2 px-3 text-base placeholder:text-muted-foreground/70'
                    rows={1}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-2">
                    <Tabs defaultValue="Search" className="w-fit">
                        <TabsList className="h-9 p-1 bg-black/5 dark:bg-white/5 rounded-full">
                            <TabsTrigger value="Search" className='rounded-full px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-[#1c7483] data-[state=active]:shadow-sm text-muted-foreground'> <Search className="w-3.5 h-3.5 mr-1.5" /> Search</TabsTrigger>
                            <TabsTrigger value="Research" className='rounded-full px-3 py-1 data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-[#1c7483] data-[state=active]:shadow-sm text-muted-foreground'> <Atom className="w-3.5 h-3.5 mr-1.5" /> Research</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className='flex gap-3 items-center mt-2'>
                        <Cpu className='text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors'/>
                        <Globe className='text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors'/>
                        <Paperclip className='text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors'/>
                        <Mic className='text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors'/>
                        <Button size="icon" className="rounded-lg w-8 h-8 bg-[#1c7483] hover:bg-[#1c7483]/90 text-white ml-2">
                            <AudioLines className='h-4 w-4'/>
                        </Button>
                        <button 
                            onClick={() => handleSearch()} 
                            className={`p-1.5 rounded-lg transition-all ${query.trim() ? 'bg-[#1c7483] text-white' : 'bg-black/5 dark:bg-white/5 text-muted-foreground cursor-not-allowed'}`}
                            disabled={!query.trim()}
                        >
                            <ArrowUp className='h-4 w-4'/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBoxInput;
