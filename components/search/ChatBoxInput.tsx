import { Atom, Globe, Mic, Paperclip, Search, Cpu, ArrowUp, CheckCircle2 } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ModelOption, SearchModeType } from '../../types';

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
    const [placeholder, setPlaceholder] = useState('Ask Anything');

    return (
        <div className={`w-full ${isInitial ? 'max-w-[800px]' : 'max-w-3xl'} mx-auto relative z-30 px-4`}>
            <div className={`p-4 w-full border rounded-2xl bg-white dark:bg-[#2F2F2F]`}>
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
                    className='w-full outline-none bg-transparent resize-none text-gray-600'
                    rows={2}
                />
                <div className='flex justify-between items-center mt-2'>
                    {/* Left Side: Tabs */}
                    <div className='flex items-center gap-2'>
                        <Tabs defaultValue="Search">
                            <TabsList className="bg-gray-100 p-1 rounded-xl">
                                <TabsTrigger value="Search" className='text-[#1c7483] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm'>
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Search
                                </TabsTrigger>
                                <TabsTrigger value="Research" className='text-[#1c7483] rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm'>
                                    <Atom className="w-4 h-4 mr-2" /> Research
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                    {/* Right Side: Icons and Action Button */}
                    <div className='flex gap-1 items-center'>
                        <Button variant='ghost' className='text-gray-500 p-2'><Cpu className='h-5 w-5'/></Button>
                        <Button variant='ghost' className='text-gray-500 p-2'><Globe className='h-5 w-5'/></Button>
                        <Button variant='ghost' className='text-gray-500 p-2'><Paperclip className='h-5 w-5'/></Button>
                        <Button variant='ghost' className='text-gray-500 p-2'><Mic className='h-5 w-5'/></Button>
                        <Button onClick={() => handleSearch()} className="bg-[#1c7483] hover:bg-[#1c7483]/90 p-2 text-white rounded-xl" disabled={!query.trim()}>
                            <ArrowUp className='h-5 w-5'/>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatBoxInput;
