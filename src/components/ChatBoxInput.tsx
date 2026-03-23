import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchCheck, Atom, Cpu, Globe, Paperclip, Mic, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchModeType, ModelOption } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatBoxInputProps {
    query: string;
    setQuery: (val: string) => void;
    onSearch: () => void;
    selectedMode: SearchModeType;
    setSelectedMode: (mode: SearchModeType) => void;
    models: ModelOption[];
    selectedModel: ModelOption;
    setSelectedModel: (model: ModelOption) => void;
    isChatView?: boolean;
}

function ChatBoxInput({ query, setQuery, onSearch, selectedMode, setSelectedMode, models, selectedModel, setSelectedModel, isChatView }: ChatBoxInputProps) {
  return (
    <div className='flex items-center justify-center w-full'>
      <div className={`p-2 w-full max-w-2xl border bg-background ${isChatView ? 'rounded-t-2xl border-b-0' : 'rounded-2xl'}`}>
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
                <SearchCheck className='h-4 w-4 mr-1' /> Search
              </TabsTrigger>
              <TabsTrigger value="Research" className='text-[#1c7483] data-[state=active]:text-[#1c7483]'>
                <Atom className='h-4 w-4 mr-1' /> Research
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='flex gap-2 items-center'>

            {/* CPU Icon with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon'>
                  <Cpu className='text-gray-500 h-5 w-5' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#f9faf5]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {models.map((model) => (
                    <DropdownMenuItem 
                      key={model.id} 
                      onClick={() => setSelectedModel(model)}
                      className={selectedModel.id === model.id ? 'bg-accent' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <span>{model.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

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
              <Button size='icon' onClick={onSearch}>
                <Send className='text-white h-5 w-5' />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatBoxInput
