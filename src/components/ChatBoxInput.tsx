import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchCheck, Atom, Cpu, Globe, Paperclip, Mic, AudioLines, Send, X, MicOff, GraduationCap, GitBranch, Receipt, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef, useState, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { ModelOption } from '@/types'

interface ChatBoxInputProps {
    query?: string;
    setQuery?: (val: string) => void;
    onSearch?: () => void;
    image?: string | null;
    setImage?: (val: string | null) => void;
    selectedModel?: ModelOption;
    setSelectedModel?: (model: ModelOption) => void;
    searchModes?: { web: boolean, academic: boolean, social: boolean, finance: boolean };
    setSearchModes?: (modes: { web: boolean, academic: boolean, social: boolean, finance: boolean } | ((prev: { web: boolean, academic: boolean, social: boolean, finance: boolean }) => { web: boolean, academic: boolean, social: boolean, finance: boolean })) => void;
    models?: ModelOption[];
}

function ChatBoxInput({ 
    query = '', 
    setQuery = () => {}, 
    onSearch = () => {}, 
    image = null, 
    setImage = () => {},
    selectedModel,
    setSelectedModel = () => {},
    searchModes = { web: true, academic: false, social: false, finance: false },
    setSearchModes = () => {},
    models = []
}: ChatBoxInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                const currentTranscript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                setQuery(currentTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [setQuery]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            // Clear query when starting new dictation if desired, or just append. 
            // We'll let it overwrite for simplicity as per standard behavior unless handled otherwise.
            setQuery('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImage(reader.result as string);
                    };
                    reader.readAsDataURL(blob);
                }
            }
        }
    };

    return (
        <div className='flex items-center justify-center w-full'>
            <div className={`p-2 w-full max-w-2xl border rounded-2xl bg-background transition-all duration-300 ${isListening ? 'border-[#1c7483] ring-1 ring-[#1c7483]' : ''}`}>
                {image && (
                    <div className="relative inline-block mb-2 ml-4 mt-2">
                        <img src={image} alt="Upload preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                        <button 
                            onClick={() => setImage(null)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
                <input
                    type="text"
                    placeholder={isListening ? 'Listening...' : 'Ask anything. Type @ for mentions.'}
                    className='w-full p-4 outline-none bg-transparent'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onPaste={handlePaste}
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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className="bg-[#f9faf5] hover:bg-[#f9faf5]/80">
                                    <Cpu className='text-gray-500 h-5 w-5' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-[#f9faf5] dark:text-black">
                                <DropdownMenuGroup>
                                    {models.map((model) => (
                                        <DropdownMenuItem 
                                            key={model.id} 
                                            onClick={() => setSelectedModel(model)}
                                            className="flex items-center justify-between cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                {model.logoUrl && (
                                                    <img 
                                                        src={model.logoUrl} 
                                                        alt={`${model.name} logo`} 
                                                        className="w-4 h-4 object-contain"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                )}
                                                <span>{model.name}</span>
                                            </div>
                                            {selectedModel?.id === model.id && <Check className="h-4 w-4 text-[#1c7483]" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='ghost' size='icon' className="bg-[#f9faf5] hover:bg-[#f9faf5]/80">
                                    <Globe className='text-gray-500 h-5 w-5' />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2 bg-[#f9faf5] dark:text-black">
                                <DropdownMenuGroup className="space-y-1">
                                    <DropdownMenuItem 
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setSearchModes(prev => ({ ...prev, web: !prev.web }));
                                        }} 
                                        className="flex items-start gap-3 p-2 cursor-pointer"
                                    >
                                        <Globe className={`h-5 w-5 mt-0.5 ${searchModes.web ? 'text-[#1c7483]' : 'text-gray-500'}`} />
                                        <div className="flex flex-col flex-1 pointer-events-none">
                                            <span className="font-medium">Web</span>
                                            <span className="text-xs text-gray-500">Search across the entire web.</span>
                                        </div>
                                        <Switch checked={searchModes.web} className="mt-1 pointer-events-none" />
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setSearchModes(prev => ({ ...prev, academic: !prev.academic }));
                                        }} 
                                        className="flex items-start gap-3 p-2 cursor-pointer"
                                    >
                                        <GraduationCap className={`h-5 w-5 mt-0.5 ${searchModes.academic ? 'text-[#1c7483]' : 'text-gray-500'}`} />
                                        <div className="flex flex-col flex-1 pointer-events-none">
                                            <span className="font-medium">Academic</span>
                                            <span className="text-xs text-gray-500">Search academic papers</span>
                                        </div>
                                        <Switch checked={searchModes.academic} className="mt-1 pointer-events-none" />
                                    </DropdownMenuItem>

                                    <DropdownMenuItem 
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setSearchModes(prev => ({ ...prev, social: !prev.social }));
                                        }} 
                                        className="flex items-start gap-3 p-2 cursor-pointer"
                                    >
                                        <GitBranch className={`h-5 w-5 mt-0.5 ${searchModes.social ? 'text-[#1c7483]' : 'text-gray-500'}`} />
                                        <div className="flex flex-col flex-1 pointer-events-none">
                                            <span className="font-medium">Social</span>
                                            <span className="text-xs text-gray-500">Discussions and opinions</span>
                                        </div>
                                        <Switch checked={searchModes.social} className="mt-1 pointer-events-none" />
                                    </DropdownMenuItem>

                                    <DropdownMenuItem 
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setSearchModes(prev => ({ ...prev, finance: !prev.finance }));
                                        }} 
                                        className="flex items-start gap-3 p-2 cursor-pointer"
                                    >
                                        <Receipt className={`h-5 w-5 mt-0.5 ${searchModes.finance ? 'text-[#1c7483]' : 'text-gray-500'}`} />
                                        <div className="flex flex-col flex-1 pointer-events-none">
                                            <span className="font-medium">Finance</span>
                                            <span className="text-xs text-gray-500">Search SEC fillings</span>
                                        </div>
                                        <Switch checked={searchModes.finance} className="mt-1 pointer-events-none" />
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <Button variant='ghost' size='icon' onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className='text-gray-500 h-5 w-5' />
                        </Button>
                        <Button variant='ghost' size='icon' onClick={toggleListening} className={isListening ? 'text-[#1c7483] bg-[#1c7483]/10' : ''}>
                            {isListening ? <MicOff className='h-5 w-5' /> : <Mic className='text-gray-500 h-5 w-5' />}
                        </Button>
                        {query.trim() === '' && !image ? (
                            <Button size='icon' onClick={toggleListening}>
                                <AudioLines className='text-white h-5 w-5' />
                            </Button>
                        ) : (
                            <Button size='icon' onClick={onSearch} className="bg-[#1c7483] hover:bg-[#1c7483]/80 rounded-full">
                                <Send className='text-white h-4 w-4' />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatBoxInput
