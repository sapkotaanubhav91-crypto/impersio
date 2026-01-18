import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Paperclip, 
  ChevronDown, 
  Globe, 
  ArrowUp,
  Compass,
  Sun,
  Moon,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Mic,
  CornerDownRight,
  Copy,
  Share,
  Info,
  RotateCcw,
  Cpu,
  Menu,
  Check,
  Sparkles,
  X,
  UserCircle,
  History
} from 'lucide-react';
import { streamResponse } from './services/geminiService';
import { searchWeb } from './services/googleSearchService';
import { createConversation, saveMessage, getConversationMessages } from './services/chatStorageService';
import { supabase } from './services/supabaseClient';
import { Message, SearchResult, WidgetData } from './types';
import { Discover } from './components/Discover';
import { About } from './components/About';
import { TimeWidget } from './components/TimeWidget';
import { StockWidget } from './components/StockWidget';
import { WeatherWidget } from './components/WeatherWidget';
import { SearchModes } from './components/SearchModes';
import { AuthModal } from './components/AuthModal';
import { HistorySidebar } from './components/HistorySidebar';
import { MessageContent } from './components/MessageContent';
import { 
  ReasoningIcon, 
  GeminiIcon, 
  MimoIcon, 
  OpenAIIcon, 
  MetaIcon, 
  KimiIcon, 
  QwenIcon
} from './components/Icons';

// Model Options matching user request
const MODEL_OPTIONS = [
  { id: 'gemini-3-flash', name: 'Gemini 3.0 Flash', icon: GeminiIcon },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', icon: GeminiIcon },
  { id: 'gpt-oss-120b', name: 'GPT OSS 120B', icon: OpenAIIcon },
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick', icon: MetaIcon },
  { id: 'kimi-k2', name: 'Kimi K2', icon: KimiIcon },
  { id: 'qwen-3-32b', name: 'Qwen 3', icon: QwenIcon },
  { id: 'mimo-v2-flash', name: 'Mimo V2 Flash', icon: MimoIcon },
];

const SEARCH_MODES = [
    { id: 'web', label: 'Web', icon: Globe },
    // ... others handled in SearchModes.tsx
];

// Updated Regex to include feature/capability questions so they don't trigger a web search
const SKIP_SEARCH_REGEX = /^(hi|hello|hey|greetings|sup|howdy|yo|good\s*(morning|afternoon|evening|night)|how\s*are\s*you|who\s*are\s*you|what\s*is\s*your\s*name|help|test|what\s*can\s*you\s*do|what\s*are\s*your\s*features|capabilities|features)$/i;

export const ImpersioLogo = ({ isMobile, compact = false }: { isMobile?: boolean; compact?: boolean }) => (
  <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} select-none transition-transform duration-300 hover:scale-105 cursor-default`}>
    {/* Impersio Logo Icon */}
    <div className={`${compact ? 'w-6 h-6' : (isMobile ? 'w-10 h-10' : 'w-12 h-12')} relative flex items-center justify-center text-primary`}>
       <svg viewBox="0 0 50 40" fill="none" stroke="currentColor" strokeWidth="4" className="w-full h-full">
          {/* Left Pill */}
          <rect x="4" y="2" width="20" height="36" rx="10" />
          {/* Right Pill - Overlapping */}
          <rect x="20" y="2" width="20" height="36" rx="10" />
          {/* Dot in the left pill */}
          <circle cx="14" cy="11" r="3" fill="currentColor" stroke="none" />
       </svg>
    </div>
    <span className={`font-sans font-medium tracking-tight text-primary ${compact ? 'text-lg' : (isMobile ? 'text-4xl' : 'text-5xl')}`}>
      Impersio
    </span>
  </div>
);

export default function App() {
  const [query, setQuery] = useState('');
  const [activeMode, setActiveMode] = useState<string>('web');
  const [selectedModel, setSelectedModel] = useState(MODEL_OPTIONS[0]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isReasoningEnabled, setIsReasoningEnabled] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentTitle, setCurrentTitle] = useState("New Search");
  const [view, setView] = useState<'home' | 'discover' | 'about'>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Auth & Storage States
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Clean URL hash if we just logged in via OAuth
        if (window.location.hash && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Double check hash clearing on auth state change
      if (session?.user && window.location.hash.includes('access_token')) {
         window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const shouldSearchWeb = (query: string, mode: string | null): boolean => {
    if (mode && mode !== 'web') return true;
    if (SKIP_SEARCH_REGEX.test(query.trim())) return false;
    if (query.trim().length < 2) return false;
    return true;
  };

  const getModelId = (id: string) => {
    switch(id) {
      case 'gemini-3-flash': return 'gemini-3-flash-preview'; 
      case 'gemini-2.0-flash': return 'gemini-2.0-flash-exp';
      case 'gpt-oss-120b': return 'openai/gpt-oss-120b';
      case 'kimi-k2': return 'moonshotai/kimi-k2-instruct-0905';
      case 'llama-4-maverick': return 'meta-llama/llama-4-maverick-17b-128e-instruct'; 
      case 'qwen-3-32b': return 'qwen/qwen3-32b';
      case 'mimo-v2-flash': return 'xiaomi/mimo-v2-flash:free';
      default: return 'gemini-3-flash-preview';
    }
  };

  const handleSearch = async (overrideQuery?: string) => {
    const finalQuery = overrideQuery || query;
    if ((!finalQuery.trim() && attachments.length === 0) || isLoading) return;

    setIsLoading(true);
    setQuery(''); 
    const currentAttachments = [...attachments];
    setAttachments([]);

    let currentConversationId = conversationId;

    if (!hasSearched) {
      setHasSearched(true);
      const title = finalQuery.length > 30 ? finalQuery.substring(0, 30) + "..." : finalQuery || "Image Analysis";
      setCurrentTitle(title);
      // Create conversation in Supabase (pass user.id if logged in)
      const newId = await createConversation(title, user?.id);
      if (newId) {
        setConversationId(newId);
        currentConversationId = newId;
      }
    }
    
    // Pass images in the message for user
    setMessages(prev => [...prev, { 
        role: 'user', 
        content: finalQuery,
        images: currentAttachments // Store user images here for display
    }]);

    // Save User Message to Supabase
    if (currentConversationId) {
        await saveMessage(currentConversationId, 'user', finalQuery, { images: currentAttachments });
    }

    const modelId = getModelId(selectedModel.id);
    
    try {
      // Logic: Skip search if attachments exist (image analysis) 
      const needsSearch = shouldSearchWeb(finalQuery, activeMode) && attachments.length === 0;
      let searchResults: SearchResult[] = [];
      let searchImages: string[] = [];

      if (needsSearch) {
        setIsSearching(true);
        // Pass the activeMode to the search service
        const response = await searchWeb(finalQuery, activeMode);
        searchResults = response.results;
        searchImages = response.images;
        setIsSearching(false);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '', 
        sources: searchResults, 
        images: searchImages
      }]);

      await streamResponse(
        finalQuery, 
        modelId, 
        searchResults,
        currentAttachments,
        isReasoningEnabled,
        isMobile, // Pass mobile state to AI
        (chunkText) => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content = chunkText;
            }
            return newMessages;
          });
        },
        (widgetData: WidgetData) => {
           setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.widget = widgetData;
            }
            return newMessages;
          });
        },
        (relatedQuestions: string[]) => {
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.relatedQuestions = relatedQuestions;
                }
                return newMessages;
            });
        },
        // onComplete callback to save to Supabase
        async (fullContent, widget, relatedQuestions) => {
            if (currentConversationId) {
                await saveMessage(currentConversationId, 'assistant', fullContent, {
                    sources: searchResults,
                    images: searchImages,
                    widget: widget,
                    relatedQuestions: relatedQuestions
                });
            }
        }
      );
      
    } catch (e) {
      console.error("Search failed", e);
      setIsSearching(false);
      const errorMessage = "Sorry, I encountered an error while searching.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
      if (currentConversationId) {
          await saveMessage(currentConversationId, 'assistant', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  const processFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    // DataTransferItemList is not iterable in all TS environments, use index loop to prevent type errors
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
             // Cast file to File to satisfy TypeScript if inference fails
             const base64 = await processFile(file as File);
             setAttachments(prev => [...prev, base64]);
          } catch (err) {
             console.error("Failed to read pasted image", err);
          }
        }
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newAttachments: string[] = [];
      for (const file of files) {
         try {
            const base64 = await processFile(file as File);
            newAttachments.push(base64);
         } catch (err) {
            console.error("Failed to read file", err);
         }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const loadConversation = async (id: string, title: string) => {
     setIsLoading(true);
     setMessages([]);
     setHasSearched(true);
     setCurrentTitle(title);
     setConversationId(id);
     
     const history = await getConversationMessages(id);
     setMessages(history);
     setIsLoading(false);
  };

  const handleNewChat = () => {
     setHasSearched(false);
     setMessages([]);
     setConversationId(null);
     setCurrentTitle("New Search");
     setQuery('');
     setAttachments([]);
  };

  // Helper to render the floating minimal header
  const renderHeader = (compact: boolean) => (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
       {/* Left: Menu & Logo (compact only) */}
       <div className="flex items-center gap-3 pointer-events-auto">
          <button 
             onClick={() => setIsHistoryOpen(true)}
             className="p-2 text-muted hover:text-primary rounded-xl hover:bg-surface/50 transition-colors backdrop-blur-sm"
          >
             <Menu className="w-5 h-5" />
          </button>
          {compact && (
            <button 
              className="cursor-pointer hover:opacity-80 transition-all duration-200"
              onClick={handleNewChat}
            >
              <ImpersioLogo compact />
            </button>
          )}
       </div>
       
       {/* Right: Auth */}
       <div className="pointer-events-auto">
           {!user && (
              <button 
                 onClick={() => setIsAuthModalOpen(true)}
                 className="text-xs font-medium px-3 py-1.5 bg-primary text-background rounded-full hover:opacity-90 transition-all shadow-sm"
              >
                 Sign In
              </button>
           )}
           {user && (
              <button 
                onClick={() => setIsHistoryOpen(true)} 
                className="w-8 h-8 rounded-full bg-scira-accent/20 text-scira-accent flex items-center justify-center font-medium text-xs border border-scira-accent/30"
              >
                  {user.email?.[0].toUpperCase()}
              </button>
           )}
       </div>
    </div>
  );

  const renderInputBar = (isInitial: boolean) => (
    <div className={`w-full max-w-2xl mx-auto relative z-10`}>
      <div className={`
        relative flex flex-col w-full bg-surface 
        rounded-[24px] 
        border border-border 
        shadow-sm group 
        focus-within:border-muted/40 focus-within:shadow-md
        transition-all duration-300
        ${isMobile ? 'p-1.5' : 'p-2'}
        ${isInitial ? '' : ''}
      `}>
         {/* Attachment Previews */}
         {attachments.length > 0 && (
           <div className="flex items-center gap-2 px-4 pt-2 pb-1 overflow-x-auto">
             {attachments.map((img, idx) => (
               <div key={idx} className="relative group/image">
                 <div className="w-16 h-16 rounded-xl overflow-hidden border border-border">
                    <img src={img} alt="attachment" className="w-full h-full object-cover" />
                 </div>
                 <button 
                   onClick={() => removeAttachment(idx)}
                   className="absolute -top-1.5 -right-1.5 bg-surface border border-border rounded-full p-0.5 shadow-sm text-muted hover:text-red-500 transition-all hover:scale-110"
                 >
                   <X className="w-3 h-3" />
                 </button>
               </div>
             ))}
           </div>
         )}

         <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isMobile ? "Ask anything..." : "What do you want to know?"}
            className={`w-full bg-transparent text-primary placeholder-muted/50 ${isMobile ? 'text-[16px] px-3 pt-2' : 'text-[16px] px-4 pt-2'} pb-2 focus:outline-none resize-none overflow-hidden min-h-[44px] max-h-[200px] rounded-xl`}
            rows={1}
            autoFocus={isInitial && !isMobile}
          />

          <div className="flex items-center justify-between px-2 pb-1 pt-0">
            <div className="flex items-center gap-1 md:gap-2">
               {/* Globe / Scope Dropdown */}
               <div className="relative">
                 <button 
                    className="p-1.5 text-muted hover:text-scira-accent bg-transparent hover:bg-scira-accent/10 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1.5 group"
                    title="Search Scope"
                 >
                    <Globe className="w-4 h-4" />
                    {!isMobile && <span className="text-xs font-medium opacity-70 group-hover:opacity-100 group-hover:text-scira-accent">Web</span>}
                    <ChevronDown className="w-3 h-3 opacity-50 group-hover:text-scira-accent" />
                 </button>
               </div>

               {/* Reasoning Toggle */}
               <button 
                 onClick={() => setIsReasoningEnabled(!isReasoningEnabled)}
                 className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-1.5 ${isReasoningEnabled ? 'text-scira-accent bg-scira-accent/10' : 'text-muted hover:text-scira-accent hover:bg-scira-accent/10'}`}
                 title="Deep Reasoning"
               >
                 <ReasoningIcon className="w-4 h-4" />
                 {isReasoningEnabled && !isMobile && <span className="text-xs font-medium">Deep</span>}
               </button>

               {/* Model Selector Pill */}
               <div className="relative">
                  <button 
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1 bg-transparent hover:bg-scira-accent/10 hover:text-scira-accent rounded-full text-xs text-muted font-medium transition-all duration-200 hover:scale-105"
                  >
                    <selectedModel.icon className="w-4 h-4" />
                    {!isMobile && <span>{selectedModel.name}</span>}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                  
                  {isModelDropdownOpen && (
                      <div className="absolute bottom-full mb-2 left-0 w-60 bg-surface border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {MODEL_OPTIONS.map(model => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between group
                              ${selectedModel.id === model.id ? 'bg-surface-hover text-scira-accent' : 'text-muted hover:bg-surface-hover hover:text-scira-accent'}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <model.icon className={`w-5 h-5 ${selectedModel.id === model.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                              <span className="font-medium">{model.name}</span>
                            </div>
                            {selectedModel.id === model.id && (
                              <Check className="w-4 h-4 text-scira-accent" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
               </div>
            </div>

            <div className="flex items-center gap-2">
               <input 
                 type="file" 
                 multiple 
                 accept="image/*" 
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={handleFileSelect} 
               />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${attachments.length > 0 ? 'text-scira-accent bg-scira-accent/10' : 'text-muted hover:text-scira-accent hover:bg-scira-accent/10'}`}
               >
                 <Paperclip className="w-4 h-4" />
               </button>
               
               {query.trim().length > 0 || attachments.length > 0 ? (
                 <button 
                    onClick={() => handleSearch()}
                    className="flex items-center justify-center w-8 h-8 bg-scira-accent hover:opacity-90 rounded-full text-background transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                 >
                    <ArrowUp className="w-5 h-5" />
                 </button>
               ) : (
                 <button className="flex items-center justify-center w-8 h-8 bg-voice-peach hover:opacity-90 rounded-full text-voice-text transition-all duration-200 hover:scale-110 shadow-sm cursor-pointer">
                    <Mic className="w-4 h-4" />
                 </button>
               )}
            </div>
          </div>
      </div>
    </div>
  );

  if (view === 'discover') {
    return <Discover onBack={() => setView('home')} />;
  }

  if (view === 'about') {
    return <About onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col font-sans relative transition-colors duration-300">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        onSelectChat={loadConversation}
        onNewChat={handleNewChat}
        userId={user?.id}
        onSignIn={() => setIsAuthModalOpen(true)}
        onOpenAbout={() => setView('about')}
      />

      {!hasSearched ? (
        <main className={`flex-1 flex flex-col items-center justify-center px-4 ${isMobile ? '-mt-4' : '-mt-16'}`}>
          {/* Minimal Floating Header for Home (Menu + Sign In) */}
          {renderHeader(false)}
          
          <div className="mb-10 animate-fade-in">
             <ImpersioLogo isMobile={isMobile} />
          </div>
          
          {renderInputBar(true)}
          
          {/* Search Modes Row - Below Input */}
          <div className="mt-4 w-full max-w-2xl overflow-x-auto no-scrollbar">
             <SearchModes activeMode={activeMode} onSelect={setActiveMode} />
          </div>

        </main>
      ) : (
        <div className="flex flex-col h-screen relative">
          {/* Minimal Floating Header for Chat (Menu + Small Logo + Sign In) */}
          {renderHeader(true)}

          <div className="flex-1 overflow-y-auto px-4 scroll-smooth">
             <div className="max-w-3xl mx-auto pb-40 pt-16">
                {messages.map((msg, idx) => (
                  <div key={idx} className="animate-fade-in mb-10">
                    {msg.role === 'user' ? (
                       <div className="mb-6 mt-4">
                          <h2 className="text-3xl font-medium text-primary tracking-tight leading-tight">{msg.content}</h2>
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                {msg.images.map((img, i) => (
                                    <div key={i} className="flex-none w-32 h-32 rounded-xl overflow-hidden border border-border transition-transform hover:scale-105">
                                        <img src={img} alt="User upload" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                          )}
                       </div>
                    ) : (
                       <div className="space-y-8">
                          {/* Widgets */}
                          {msg.widget && (
                             <div className="animate-fade-in">
                                {msg.widget.type === 'time' && <TimeWidget data={msg.widget.data} />}
                                {msg.widget.type === 'stock' && <StockWidget data={msg.widget.data} />}
                                {msg.widget.type === 'weather' && <WeatherWidget data={msg.widget.data} />}
                             </div>
                          )}

                          {/* Assistant Response Images (Search results) */}
                          {msg.images && msg.images.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                                {msg.images.slice(0,4).map((img, i) => (
                                <div key={i} className="flex-none h-32 w-auto aspect-video rounded-xl overflow-hidden bg-surface relative border border-border shadow-sm group">
                                    <img 
                                        src={img} 
                                        alt={`Result ${i + 1}`} 
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        loading="lazy"
                                    />
                                </div>
                                ))}
                            </div>
                          )}

                          {/* Assistant Response Content with Typing Animation */}
                          <MessageContent 
                             content={msg.content} 
                             isStreaming={idx === messages.length - 1 && isLoading} 
                          />

                          {/* Sources Grid */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="">
                                <h3 className="text-sm font-medium text-muted mb-3 flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5" />
                                    Sources
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                    {msg.sources.slice(0, 4).map((source, i) => (
                                        <a 
                                            key={i} 
                                            href={source.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-all duration-200 group h-full hover:scale-[1.02] hover:shadow-md"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
                                                <img 
                                                    src={getFaviconUrl(source.link)} 
                                                    className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity"
                                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-medium text-primary truncate group-hover:text-scira-accent transition-colors">{source.title}</div>
                                                <div className="text-[10px] text-muted truncate opacity-80">{source.displayLink}</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                          )}

                          {/* Related Questions */}
                          {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                            <div className="mt-2">
                               <h3 className="text-sm font-medium text-muted flex items-center gap-2 mb-3">
                                  <CornerDownRight className="w-3.5 h-3.5" />
                                  Related
                               </h3>
                               <div className="flex flex-wrap gap-2">
                                 {msg.relatedQuestions.map((q, i) => (
                                   <button 
                                     key={i}
                                     onClick={() => handleSearch(q)}
                                     className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-xl text-sm text-primary transition-all duration-200 text-left hover:scale-[1.02] hover:shadow-sm"
                                   >
                                     {q}
                                   </button>
                                 ))}
                               </div>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                             <button className="p-2 text-muted hover:text-scira-accent transition-all duration-200 hover:scale-110 hover:bg-surface-hover rounded-full"><RotateCcw className="w-4 h-4" /></button>
                             <button className="p-2 text-muted hover:text-scira-accent transition-all duration-200 hover:scale-110 hover:bg-surface-hover rounded-full"><Copy className="w-4 h-4" /></button>
                             <button className="p-2 text-muted hover:text-scira-accent transition-all duration-200 hover:scale-110 hover:bg-surface-hover rounded-full"><Share className="w-4 h-4" /></button>
                          </div>
                       </div>
                    )}
                  </div>
                ))}
                
                {/* Searching State */}
                {isSearching && (
                   <div className="flex items-center gap-3 text-muted animate-pulse mt-8">
                      <div className="w-5 h-5 flex items-center justify-center">
                          <Globe className="w-4 h-4 animate-spin text-scira-accent" />
                      </div>
                      <span className="text-sm font-medium text-scira-accent">Searching resources...</span>
                   </div>
                )}
             </div>
          </div>

          <div className="flex-none bg-background pb-6 px-4">
             {renderInputBar(false)}
          </div>
        </div>
      )}
    </div>
  );
}