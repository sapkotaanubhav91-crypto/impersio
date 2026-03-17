import { ArrowUp, Atom, Globe, Mic, Paperclip, Cpu, Search, AudioLines } from 'lucide-react';
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
            <div className="flex flex-col w-full bg-surface border border-border rounded-2xl shadow-elegant transition-all duration-300 hover:border-scira-accent/30 p-3">
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
                    className='w-full outline-none bg-transparent resize-none text-foreground py-2 px-3 text-base placeholder:text-muted/50'
                    rows={1}
                />

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-2">
                    <div className="flex items-center gap-1">
                        <Tabs defaultValue="Search" className="w-fit">
                            <TabsList variant="line" className="h-8 p-0 bg-transparent border-none">
                                <TabsTrigger 
                                    value="Search" 
                                    className="data-[state=active]:text-scira-accent data-[state=active]:bg-scira-accent/5 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all"
                                > 
                                    <Search className="w-3.5 h-3.5" /> Search
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="Research" 
                                    className="data-[state=active]:text-scira-accent data-[state=active]:bg-scira-accent/5 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-all"
                                > 
                                    <Atom className="w-3.5 h-3.5" /> Research
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className='flex gap-3 items-center'>
                        <div className="flex items-center gap-2 mr-2 border-r border-border pr-3">
                            <Cpu className='text-muted hover:text-scira-accent h-4 w-4 cursor-pointer transition-colors'/>
                            <Globe className='text-muted hover:text-scira-accent h-4 w-4 cursor-pointer transition-colors'/>
                            <Paperclip className='text-muted hover:text-scira-accent h-4 w-4 cursor-pointer transition-colors'/>
                            <Mic className='text-muted hover:text-scira-accent h-4 w-4 cursor-pointer transition-colors'/>
                        </div>
                        
                        <Button 
                            size="icon-sm" 
                            variant="ghost" 
                            className="rounded-full bg-scira-accent hover:bg-scira-accent-hover text-white"
                        >
                            <AudioLines className='h-4 w-4'/>
                        </Button>

                        <button 
                            onClick={() => handleSearch()} 
                            className={`p-1.5 rounded-full transition-all ${query.trim() ? 'bg-scira-accent text-white shadow-glow' : 'bg-muted/10 text-muted cursor-not-allowed'}`}
                            disabled={!query.trim()}
                        >
                            <ArrowUp className='h-4 w-4'/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatBoxInput;
