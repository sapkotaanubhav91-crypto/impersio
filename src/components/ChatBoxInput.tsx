import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchCheck, Atom, Cpu, Globe, Paperclip, Mic, AudioLines } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchModeType } from '@/types'

interface ChatBoxInputProps {
    query: string;
    setQuery: (val: string) => void;
    onSearch: () => void;
    selectedMode: SearchModeType;
    setSelectedMode: (mode: SearchModeType) => void;
}

function ChatBoxInput({ query, setQuery, onSearch, selectedMode, setSelectedMode }: ChatBoxInputProps) {
    return (
        <div className='flex items-center justify-center w-full h-screen'>
            <div className='p-2 w-full max-w-2xl border rounded-2xl bg-background'>
                <input
                    type="text"
                    placeholder='Ask Anything'
                    className='w-full p-4 outline-none bg-transparent'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onSearch();
                        }
                    }}
                />

                <div className='flex justify-between items-center mt-2'>
                    <Tabs value={selectedMode === 'extreme' ? 'Research' : 'Search'} onValueChange={(val) => setSelectedMode(val === 'Research' ? 'extreme' : 'web')}>
                        <TabsList>
                            <TabsTrigger value="Search" className='text-[#1c7483] data-[state=active]:text-[#1c7483]'>
                                <SearchCheck className='w-4 h-4 mr-2' />
                                Search
                            </TabsTrigger>
                            <TabsTrigger value="Research" className='text-[#1c7483] data-[state=active]:text-[#1c7483]'>
                                <Atom className='w-4 h-4 mr-2' />
                                Research
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className='flex items-center gap-2'>
                        <Button variant="ghost" size="icon" className='text-gray-500 hover:text-gray-700'>
                            <Cpu className='w-5 h-5' />
                        </Button>
                        <Button variant="ghost" size="icon" className='text-gray-500 hover:text-gray-700'>
                            <Globe className='w-5 h-5' />
                        </Button>
                        <Button variant="ghost" size="icon" className='text-gray-500 hover:text-gray-700'>
                            <Paperclip className='w-5 h-5' />
                        </Button>
                        <Button variant="ghost" size="icon" className='text-gray-500 hover:text-gray-700'>
                            <Mic className='w-5 h-5' />
                        </Button>
                        <Button size="icon" onClick={onSearch}>
                            <AudioLines className='w-5 h-5 text-white' />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatBoxInput
