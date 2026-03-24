import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchCheck, Atom, Cpu, Globe, Paperclip, Mic, AudioLines, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatBoxInputProps {
    query?: string;
    setQuery?: (val: string) => void;
    onSearch?: () => void;
}

function ChatBoxInput({ query = '', setQuery = () => {}, onSearch = () => {} }: ChatBoxInputProps) {
    return (
        <div className='flex items-center justify-center w-full'>
            <div className='p-2 w-full max-w-2xl border rounded-2xl'>
                <input
                    type="text"
                    placeholder='Ask Anything'
                    className='w-full p-4 outline-none'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onSearch();
                        }
                    }}
                />

                <div className='flex justify-between items-center mt-2'>
                    <Tabs defaultValue="Search">
                        <TabsList>
                            <TabsTrigger value="Search" className='text-[#1c7483] data-[state=active]:text-[#1c7483]'>
                                <SearchCheck className='h-4 w-4 mr-1' /> Search
                            </TabsTrigger>
                            <TabsTrigger value="Research" className='text-[#1c7483] data-[state=active]:text-[#1c7483]'>
                                <Atom className='h-4 w-4 mr-1' /> Research
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className='flex gap-2 items-center'>
                        <Button variant='ghost' size='icon'>
                            <Cpu className='text-gray-500 h-5 w-5' />
                        </Button>
                        <Button variant='ghost' size='icon'>
                            <Globe className='text-gray-500 h-5 w-5' />
                        </Button>
                        <Button variant='ghost' size='icon'>
                            <Paperclip className='text-gray-500 h-5 w-5' />
                        </Button>
                        {query.trim() === '' ? (
                            <Button variant='ghost' size='icon'>
                                <Mic className='text-gray-500 h-5 w-5' />
                            </Button>
                        ) : (
                            <Button size='icon' onClick={onSearch} className="bg-[#1c7483] hover:bg-[#1c7483]/80 rounded-full">
                                <Send className='text-white h-4 w-4' />
                            </Button>
                        )}
                        <Button size='icon'>
                            <AudioLines className='text-white h-5 w-5' />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatBoxInput
