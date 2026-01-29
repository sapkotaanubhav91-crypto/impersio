
import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Copy,
  RotateCcw,
  Plus,
  ThumbsUp,
  ThumbsDown,
  ArrowUp,
  Clock,
  Search
} from 'lucide-react';
import { streamResponse, orchestrateProSearch, shouldSearch } from './services/geminiService';
import { searchFast, getSuggestions } from './services/googleSearchService';
import { createConversation, saveMessage } from './services/chatStorageService';
import { Message, SearchResult, ModelOption } from './types';
import { Discover } from './components/Discover';
import { About } from './components/About';
import { TimeWidget } from './components/TimeWidget';
import { StockWidget } from './components/StockWidget';
import { WeatherWidget } from './components/WeatherWidget';
import { SlidesWidget } from './components/SlidesWidget';
import { AuthModal } from './components/AuthModal';
import { HistorySidebar } from './components/HistorySidebar';
import { AppSidebar } from './components/AppSidebar';
import { MessageContent } from './components/MessageContent';
import { ModelSelector } from './components/ModelSelector';
import { ProSearchLogger } from './components/ProSearchLogger';
import { useTheme } from './hooks/useTheme';
import { 
  ImpersioLogo,
  CoffeeIcon,
  PenIcon,
  GraduationCapIcon,
  TrendingUpIcon,
  CodeIcon,
  CPUIcon
} from './components/Icons';

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3', icon: CPUIcon },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', icon: CPUIcon },
  { id: 'zhipu/glm-4-flash', name: 'GLM 4.7', icon: CPUIcon },
  { id: 'moonshot/moonshot-v1-8k', name: 'Kimi K1.5', icon: CPUIcon },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral', icon: CPUIcon },
];

const STORAGE_KEY = 'impersio_chat_state';

interface MessageItemProps {
  msg: Message;
  isLast: boolean;
  isLoading: boolean;
  onSearch: (q: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  msg, 
  isLast, 
  isLoading, 
}) => {
  const [sourcesVisible, setSourcesVisible] = useState(false);

  if (!msg) return null;

  // --- USER MESSAGE (Dark Pill, Right Aligned) ---
  if (msg.role === 'user') {
    return (
      <div className="w-full max-w-3xl mx-auto py-6 px-4 animate-fade-in flex justify-end">
          <div className="bg-[#1A1A1A] text-[#ECECEC] px-5 py-2.5 rounded-2xl text-[16px] leading-relaxed max-w-[85%] font-sans">
             {msg.content}
          </div>
      </div>
    );
  }

  // --- ASSISTANT MESSAGE (Serif, Left Aligned) ---
  const sourceLimit = 4;
  const shownSources = msg.sources?.slice(0, sourceLimit) || [];

  return (
      <div className="w-full max-w-3xl mx-auto pb-8 px-4 animate-fade-in flex flex-col gap-2">
        <div className="flex flex-col gap-2">
            
            {/* 1. Pro Search Status */}
            {msg.proSearchSteps && msg.proSearchSteps.length > 0 && (
               <div className="mb-4">
                 <ProSearchLogger steps={msg.proSearchSteps} />
               </div>
            )}

            {/* 2. Sources (Elegant Pill) */}
            {msg.sources && msg.sources.length > 0 && (
                <div className="mb-4">
                     <button 
                        onClick={() => setSourcesVisible(!sourcesVisible)}
                        className="group flex items-center gap-3 px-1 py-1 rounded-lg transition-colors"
                     >
                        <div className="flex -space-x-2">
                            {shownSources.slice(0, 3).map((s, i) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-surface border border-border overflow-hidden relative z-10 shadow-sm">
                                    <img 
                                    src={`https://www.google.com/s2/favicons?domain=${new URL(s.link).hostname}&sz=32`}
                                    className="w-full h-full object-cover opacity-80"
                                    onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                    />
                                </div>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-muted group-hover:text-primary transition-colors">
                            {msg.sources.length} Sources
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${sourcesVisible ? 'rotate-180' : ''}`} />
                     </button>
                     
                     {/* Expanded Sources Grid */}
                     {sourcesVisible && (
                        <div className="grid grid-cols-2 gap-3 mt-4 animate-slide-up">
                            {msg.sources.map((source, idx) => (
                                <a 
                                    key={idx}
                                    href={source.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col p-3 rounded-lg bg-surface hover:bg-surface-hover border border-border transition-all h-20 justify-between group shadow-sm hover:shadow-md"
                                >
                                    <div className="text-xs font-semibold text-primary line-clamp-2 leading-tight font-sans">
                                        {source.title}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-border/50 overflow-hidden">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${new URL(source.link).hostname}&sz=32`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                            />
                                        </div>
                                        <div className="text-[10px] text-muted truncate font-sans">{source.displayLink}</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                     )}
                </div>
            )}

            {/* 3. Thinking Indicator */}
            {isLoading && isLast && !msg.content && (!msg.proSearchSteps || msg.proSearchSteps.length === 0) && (
               <div className="flex items-center gap-3 mb-6 animate-pulse">
                  <ImpersioLogo className="w-6 h-6 text-scira-accent animate-spin-slow" />
               </div>
            )}

            {/* 4. Main Content (Serif) */}
            <div className="min-h-[20px] font-serif text-lg leading-relaxed text-[#ECECEC]">
                <MessageContent 
                  content={msg.content} 
                  isStreaming={isLast && isLoading} 
                  sources={msg.sources}
                />
            </div>
            
            {/* 5. Widgets */}
            {msg.widget && (
                <div className="mt-8">
                  {msg.widget.type === 'time' && <TimeWidget data={msg.widget.data} />}
                  {msg.widget.type === 'weather' && <WeatherWidget data={msg.widget.data} />}
                  {msg.widget.type === 'stock' && <StockWidget data={msg.widget.data} />}
                  {msg.widget.type === 'slides' && <SlidesWidget data={msg.widget.data} />}
                </div>
            )}

            {/* 6. Action Bar */}
            <div className="flex items-center gap-2 mt-4">
                <button className="p-1.5 text-muted hover:text-primary transition-colors" title="Copy">
                    <Copy className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-muted hover:text-primary transition-colors" title="Good response">
                    <ThumbsUp className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-muted hover:text-primary transition-colors" title="Bad response">
                    <ThumbsDown className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-muted hover:text-primary transition-colors" title="Retry">
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.messages || [];
      }
    } catch(e) {}
    return [];
  });

  const [hasSearched, setHasSearched] = useState(() => {
    try {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved) return JSON.parse(saved).hasSearched || false;
    } catch(e) {}
    return false;
  });

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODEL_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'home' | 'discover' | 'about'>('home');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const checkUser = () => {
        const localUser = localStorage.getItem('impersio_local_user');
        if (localUser) {
            setUser(JSON.parse(localUser));
        } else {
            setUser(null);
        }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      const newSuggestions = await getSuggestions(query);
      setSuggestions(newSuggestions);
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        messages,
        hasSearched
      }));
    }
  }, [messages, hasSearched]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(24, Math.min(textareaRef.current.scrollHeight, 160))}px`;
    }
  }, [query]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]); 

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  const handleSearch = async (overrideQuery?: string) => {
    const finalQuery = overrideQuery || query;
    setSuggestions([]);

    if ((!finalQuery.trim() && attachments.length === 0) || isLoading) return;

    setIsLoading(true);
    setQuery(''); 
    const currentAttachments = [...attachments];
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let currentConversationId = conversationId;

    if (!hasSearched) {
      setHasSearched(true);
      const title = finalQuery.length > 30 ? finalQuery.substring(0, 30) + "..." : finalQuery || "Search";
      const newId = await createConversation(title, user?.id || 'guest');
      if (newId) {
        setConversationId(newId);
        currentConversationId = newId;
      }
    }
    
    setMessages(prev => [...prev, { 
        role: 'user', 
        content: finalQuery,
        images: currentAttachments 
    }]);

    if (currentConversationId) {
        await saveMessage(currentConversationId, 'user', finalQuery, { images: currentAttachments });
    }

    const modelId = selectedModel.id;
    
    try {
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: '', 
            sources: [], 
            proSearchSteps: []
        }]);

        const needsSearch = await shouldSearch(finalQuery);
        
        let allSources: SearchResult[] = [];
        
        if (needsSearch) {
             const searchResult = await searchFast(finalQuery);
             if (searchResult && searchResult.results) {
                 allSources = searchResult.results;
             }
     
             allSources = allSources.filter((s, index, self) => 
                 index === self.findIndex((t) => (t.link === s.link))
             );
        }

        await streamResponse(
            finalQuery,
            modelId,
            messages.slice(-6),
            allSources,
            currentAttachments,
            false,
            isMobile,
            (chunk) => {
                    setMessages(prev => {
                    if (!prev || prev.length === 0) return prev;
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex].role === 'assistant') {
                        newMessages[lastIndex] = { 
                            ...newMessages[lastIndex], 
                            content: chunk, 
                            sources: allSources 
                        };
                    }
                    return newMessages;
                });
            },
            (widget) => {
                    setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    newMessages[lastIndex].widget = widget;
                    return newMessages;
                });
            },
            (related) => {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    newMessages[lastIndex].relatedQuestions = related;
                    return newMessages;
                });
            }
        );

    } catch (e) {
      console.error("Search failed", e);
      const errorMessage = "Sorry, I encountered an error.";
      setMessages(prev => {
          if (!prev || prev.length === 0) return prev;
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
              newMessages[newMessages.length - 1] = { ...lastMsg, content: errorMessage };
          } else {
             newMessages.push({ role: 'assistant', content: errorMessage });
          }
          return newMessages;
      });
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

  const handleNewChat = () => {
     setHasSearched(false);
     setMessages([]);
     setConversationId(null);
     setQuery('');
     setAttachments([]);
     setView('home');
     setSuggestions([]);
     localStorage.removeItem(STORAGE_KEY); 
  };

  const renderInputBar = (isInitial: boolean) => (
    <div className={`w-full ${isInitial ? 'max-w-2xl' : 'max-w-3xl'} mx-auto relative z-30 transition-all duration-500`}>
      <div className={`
        relative flex flex-col w-full bg-[#1F1F1F]
        rounded-[20px]
        border border-[#333]
        shadow-sm transition-all duration-300
        overflow-visible
        group
        ${isInitial ? 'min-h-[140px]' : ''}
      `}>
         <div className="flex flex-col px-4 py-3 h-full">
             <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isInitial ? "How can I help you today?" : "Reply..."}
                className={`w-full bg-transparent text-[#E0E0E0] placeholder-[#666] text-[16px] font-sans font-normal px-0 focus:outline-none resize-none overflow-hidden mt-1`}
                style={{ minHeight: '28px' }}
                rows={1}
                autoFocus={isInitial && !isMobile}
              />
              
              <div className={`flex items-center justify-between mt-auto pt-3 ${isInitial ? 'absolute bottom-3 left-4 right-4' : ''}`}>
                 <div className="flex items-center gap-2">
                     <button className="text-[#888] hover:text-[#E0E0E0] transition-colors" title="Attach">
                         <Plus className="w-5 h-5" strokeWidth={2} />
                     </button>
                     <button className="text-[#888] hover:text-[#E0E0E0] transition-colors" title="History">
                         <Clock className="w-5 h-5" strokeWidth={2} />
                     </button>
                 </div>

                 <div className="flex items-center gap-3">
                     <ModelSelector
                        selectedModel={selectedModel}
                        models={MODEL_OPTIONS}
                        onSelect={setSelectedModel}
                        isOpen={isModelSelectorOpen}
                        onToggle={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                     />
                     <button 
                        onClick={() => handleSearch()}
                        disabled={!query.trim() && attachments.length === 0}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${query.trim() ? 'bg-scira-accent text-white' : 'bg-[#333] text-[#666]'}`}
                     >
                        <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                     </button>
                 </div>
              </div>
         </div>
          
          {suggestions.length > 0 && query.trim().length > 0 && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-[#1F1F1F] border border-[#333] rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in mx-0 p-1">
                {suggestions.map((suggestion, index) => (
                   <button
                      key={index}
                      onClick={() => {
                         setQuery(suggestion);
                         handleSearch(suggestion);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#2A2A2A] rounded-lg transition-colors group"
                   >
                      <Search className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium text-primary font-sans">{suggestion}</span>
                   </button>
                ))}
             </div>
          )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-background text-primary font-sans selection:bg-scira-accent/20 flex flex-row overflow-hidden`}>
      <AppSidebar 
        currentView={view} 
        onNavigate={setView}
        onNewChat={handleNewChat}
        onToggleHistory={() => setIsHistoryOpen(true)}
        onSignIn={() => setIsAuthModalOpen(true)}
        user={user}
        theme={theme}
        onToggleTheme={cycleTheme}
      />

      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectChat={(id, title) => {}}
        onNewChat={handleNewChat}
        userId={user?.id}
        onSignIn={() => { setIsHistoryOpen(false); setIsAuthModalOpen(true); }}
        onOpenAbout={() => { setIsHistoryOpen(false); setView('about'); }}
        theme={theme}
        onToggleTheme={cycleTheme}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative md:ml-[50px] transition-all duration-300">
         {view === 'about' && <About onBack={() => setView('home')} />}
         {view === 'discover' && <Discover onBack={() => setView('home')} />}

         {view === 'home' && (
            <div className="flex-1 flex flex-col h-full relative">
              {!hasSearched ? (
                <div className="flex flex-col items-center justify-center p-4 w-full h-full animate-fade-in max-w-4xl mx-auto">
                    
                    <div className="mb-8 bg-[#1A1A1A] border border-[#333] rounded-full px-4 py-1.5 flex items-center gap-2">
                       <span className="text-xs text-[#999] font-medium">Free plan</span>
                       <span className="text-xs text-[#555]">•</span>
                       <button className="text-xs text-[#999] hover:text-white transition-colors underline decoration-[#555] underline-offset-2">Upgrade</button>
                    </div>

                    <div className="w-full max-w-2xl mb-12 flex flex-col items-center text-center">
                      <div className="flex items-center gap-4 mb-2">
                         <ImpersioLogo className="w-8 h-8 text-scira-accent animate-spin-slow" />
                         <h1 className="text-5xl md:text-6xl font-normal text-[#EBEBEB] font-serif tracking-tight">
                            {getGreeting()}, {user?.user_metadata?.full_name || 'Guest'}
                         </h1>
                      </div>
                    </div>

                    {renderInputBar(true)}

                    <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-2xl">
                       {[
                         { icon: CodeIcon, label: 'Code' },
                         { icon: GraduationCapIcon, label: 'Learn' },
                         { icon: TrendingUpIcon, label: 'Strategize' },
                         { icon: PenIcon, label: 'Write' },
                         { icon: CoffeeIcon, label: 'Life stuff' },
                       ].map((item, idx) => (
                          <button 
                            key={idx}
                            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#333] hover:bg-[#252525] rounded-xl text-sm text-[#999] hover:text-white transition-all font-medium"
                          >
                             <item.icon className="w-4 h-4" />
                             {item.label}
                          </button>
                       ))}
                    </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col relative h-full">
                    <div className="flex-1 overflow-y-auto pb-40 pt-6 px-4 md:px-0 scroll-smooth">
                      <div className="flex flex-col w-full"> 
                        {messages.map((msg, idx) => (
                            <MessageItem 
                              key={idx}
                              msg={msg}
                              isLast={idx === messages.length - 1}
                              isLoading={isLoading}
                              onSearch={handleSearch}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 z-20 px-4">
                      <div className="max-w-3xl mx-auto">
                          {renderInputBar(false)}
                          <div className="text-center mt-3 text-xs text-[#444]">
                             Llama 3.3 (Preview) can make mistakes. Please double-check responses.
                          </div>
                      </div>
                    </div>
                </div>
              )}
            </div>
         )}
      </main>
    </div>
  );
}
