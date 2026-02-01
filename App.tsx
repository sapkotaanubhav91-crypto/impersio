import React, { useState, useRef, useEffect } from 'react';
import { 
  Copy,
  Plus,
  ArrowRight,
  Sparkles,
  AlignLeft,
  MessageSquare,
  Zap,
  Check,
  Search,
  ArrowUp,
  Globe,
  Layers,
  Image as ImageIcon,
  PlayCircle,
  ChevronDown
} from 'lucide-react';
import { streamResponse, generateCopilotStep } from './services/geminiService';
import { searchFast, searchMedia } from './services/googleSearchService';
import { authService } from './services/authService';
import { Message, ModelOption, User, CopilotPayload, SearchResult } from './types';
import { Discover } from './components/Discover';
import { About } from './components/About';
import { AuthModal } from './components/AuthModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { HistorySidebar } from './components/HistorySidebar';
import { AppSidebar } from './components/AppSidebar';
import { MessageContent } from './components/MessageContent';
import { useTheme } from './hooks/useTheme';
import { SidebarProvider, SidebarInset, SidebarTrigger } from './components/ui/sidebar';
import { 
  ImpersioLogo,
  ClaudeIcon,
  OpenAIIcon,
  GeminiIcon,
  CodeIcon,
  MetaIcon
} from './components/Icons';

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fastest reasoning model by Google', icon: GeminiIcon },
  { id: 'gpt-4', name: 'GPT-4', description: 'Powerful model via Pollinations.AI', icon: OpenAIIcon },
  { id: 'llama-3.3-70b-groq', name: 'Llama 3.3 (Groq)', description: 'Ultra-fast via Groq', icon: MetaIcon },
  { id: 'llama-3.3-70b-openrouter', name: 'Llama 3.3 (OR)', description: 'Via OpenRouter', icon: MetaIcon },
  { id: 'sonar', name: 'Sonar', description: 'Fast model by Perplexity', icon: Zap },
  { id: 'claude-3-7-sonnet', name: 'Claude 3.7', description: 'Smart model by Anthropic', icon: ClaudeIcon },
  { id: 'deepseek-coder', name: 'DeepSeek', description: 'Code-focused model', icon: CodeIcon },
];

// --- Components ---

const CopilotWidget = ({ 
    step, 
    onAnswer 
}: { 
    step: CopilotPayload, 
    onAnswer: (ans: string) => void 
}) => {
    const [input, setInput] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        setIsSubmitting(true);
        if (step.type === 'selection') {
            onAnswer(selected.join(', '));
        } else {
            onAnswer(input);
        }
    };

    const handleSkip = () => {
        setIsSubmitting(true);
        onAnswer("Skip");
    };

    return (
        <div className="w-full bg-surface border border-border rounded-lg p-6 mb-8 animate-fade-in shadow-sm font-sans">
            <div className="flex items-center gap-2 mb-3 text-primary font-medium">
                <Sparkles className="w-4 h-4 text-scira-accent" />
                <span className="text-sm font-semibold">Copilot</span>
            </div>
            
            <h3 className="text-base text-primary mb-5 leading-relaxed">{step.question}</h3>
            
            {step.type === 'text' && (
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full bg-background border border-border rounded-md px-4 py-2.5 text-primary text-sm focus:outline-none focus:border-scira-accent mb-6 placeholder:text-muted/60"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
            )}

            {step.type === 'selection' && step.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {step.options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => setSelected(prev => 
                                prev.includes(opt) ? prev.filter(p => p !== opt) : [...prev, opt]
                            )}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md border text-sm text-left transition-all ${
                                selected.includes(opt) 
                                    ? 'bg-scira-accent/5 border-scira-accent text-primary' 
                                    : 'bg-transparent border-transparent hover:bg-surface-hover text-muted hover:text-primary'
                            }`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                selected.includes(opt) ? 'bg-scira-accent border-scira-accent' : 'border-muted'
                            }`}>
                                {selected.includes(opt) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="truncate">{opt}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex items-center gap-2">
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-[#21808D] hover:bg-[#1A6A76] text-white rounded-md text-sm font-medium transition-colors"
                >
                    Continue
                </button>
                <button 
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 bg-[#F2F2F2] hover:bg-[#E5E5E5] dark:bg-[#333] dark:hover:bg-[#444] text-primary rounded-md text-sm font-medium transition-colors"
                >
                    Skip
                </button>
            </div>
        </div>
    );
};

interface MessageItemProps {
  msg: Message;
  isLast: boolean;
  isLoading: boolean;
  onCopilotAnswer: (ans: string) => void;
  modelName: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ 
  msg, 
  isLast, 
  isLoading,
  onCopilotAnswer,
  modelName
}) => {
  // User Message (Title Style)
  if (msg.role === 'user') {
    return (
      <div className="w-full max-w-7xl mx-auto pt-10 pb-6 px-4 md:px-8 animate-fade-in border-b border-border/20">
         <h1 className="text-[32px] md:text-[36px] font-medium text-primary font-serif tracking-tight leading-[1.2]">
            {msg.content}
         </h1>
      </div>
    );
  }

  // Copilot Active State
  if (msg.isCopilotActive && msg.copilotStep) {
      return (
          <div className="w-full max-w-3xl mx-auto px-4 md:px-0 pb-12 pt-8">
              <CopilotWidget step={msg.copilotStep} onAnswer={onCopilotAnswer} />
          </div>
      );
  }

  // Assistant Message (Split Layout)
  return (
      <div className="w-full max-w-7xl mx-auto pb-16 px-4 md:px-8 animate-fade-in pt-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10">
            {/* LEFT COLUMN: Main Content */}
            <div className="min-w-0 flex flex-col gap-8">
                
                {/* Copilot Status Bar (Collapsible Look) */}
                <div className="flex items-center justify-between py-3 px-4 bg-surface border border-border rounded-xl">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Sparkles className="w-4 h-4 text-scira-accent" />
                        <span>Copilot</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                        <span>{isLoading ? 'Thinking...' : 'Completed'}</span>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && isLast && !msg.content && (
                    <div className="flex items-center gap-3 text-primary font-medium">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-scira-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(33,128,141,0.6)]" />
                        </div>
                        <span className="text-lg font-sans text-primary">Summarizing · {modelName}</span>
                    </div>
                )}

                {/* Sources - Compact Cards */}
                {msg.sources && msg.sources.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <AlignLeft className="w-5 h-5" />
                            <h3 className="text-lg font-medium font-sans">Sources</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {msg.sources.slice(0, 4).map((source, idx) => (
                                <a 
                                    key={idx}
                                    href={source.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-col p-3 rounded-lg bg-surface hover:bg-surface-hover border border-border transition-all h-[80px] justify-between group"
                                >
                                    <div className="text-[13px] font-medium text-primary line-clamp-2 leading-snug font-sans">
                                        {source.title}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full bg-border/50 overflow-hidden shrink-0">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${new URL(source.link).hostname}&sz=32`}
                                                className="w-full h-full object-cover opacity-80"
                                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                                alt=""
                                            />
                                        </div>
                                        <div className="text-[11px] text-muted truncate">
                                            {source.displayLink}
                                        </div>
                                    </div>
                                </a>
                            ))}
                            {msg.sources.length > 4 && (
                                <button className="flex items-center justify-center p-3 rounded-lg bg-surface hover:bg-surface-hover border border-border transition-all h-[80px] text-xs font-medium text-muted hover:text-primary">
                                    View {msg.sources.length - 4} more
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Answer Content */}
                {msg.content && (
                    <div className="min-h-[20px]">
                        <div className="flex items-center gap-2 mb-2 text-primary">
                            <AlignLeft className="w-5 h-5 text-scira-accent" />
                            <h3 className="text-lg font-medium font-sans">Answer</h3>
                        </div>
                        <MessageContent 
                            content={msg.content} 
                            isStreaming={isLast && isLoading} 
                            sources={msg.sources}
                        />
                    </div>
                )}

                {/* Related Questions */}
                {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                    <div className="pt-4 border-t border-border mt-2">
                        <div className="flex items-center gap-2 mb-3 text-primary">
                            <Layers className="w-5 h-5" />
                            <h3 className="text-lg font-medium font-sans">Related</h3>
                        </div>
                        <div className="flex flex-col gap-0">
                            {msg.relatedQuestions.map((q, idx) => (
                                <div 
                                key={idx} 
                                className="flex items-center justify-between py-3 hover:bg-surface-hover cursor-pointer border-b border-border/40 group transition-colors px-1"
                                onClick={() => { /* Handle click */ }}
                                >
                                    <span className="text-primary/90 font-medium text-[15px]">{q}</span>
                                    <Plus className="w-4 h-4 text-muted group-hover:text-primary transition-transform group-hover:rotate-90" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Media Gallery */}
            <div className="flex flex-col gap-6">
                
                {/* Images Section */}
                {msg.images && msg.images.length > 0 && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-2 gap-2">
                            {/* Featured large image */}
                            {msg.images[0] && (
                                <div className="col-span-2 aspect-video rounded-xl overflow-hidden border border-border bg-surface-hover relative group cursor-pointer">
                                    <img 
                                        src={msg.images[0].image} 
                                        alt={msg.images[0].title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                            )}
                            {/* Smaller images */}
                            {msg.images.slice(1, 3).map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-border bg-surface-hover relative group cursor-pointer">
                                     <img 
                                        src={img.image} 
                                        alt={img.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                            ))}
                            {/* View More Placeholder */}
                            {msg.images.length > 3 && (
                                <div className="aspect-square rounded-xl overflow-hidden border border-border bg-surface-hover flex items-center justify-center cursor-pointer hover:bg-border/50 transition-colors">
                                    <div className="flex flex-col items-center gap-1 text-muted">
                                        <ImageIcon className="w-5 h-5" />
                                        <span className="text-xs font-medium">View more</span>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                )}

                {/* Videos Section */}
                {msg.videos && msg.videos.length > 0 && (
                     <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
                        <div className="flex flex-col gap-3">
                             {msg.videos.slice(0, 3).map((vid, idx) => (
                                 <a 
                                    key={idx}
                                    href={vid.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex gap-3 p-2 rounded-xl bg-surface hover:bg-surface-hover border border-border transition-colors group"
                                 >
                                     <div className="w-24 h-16 rounded-lg bg-black/10 overflow-hidden relative shrink-0">
                                         {vid.image ? (
                                             <img src={vid.image} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="" />
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                                 <PlayCircle className="w-6 h-6 text-white/50" />
                                             </div>
                                         )}
                                         <div className="absolute inset-0 flex items-center justify-center">
                                             <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                                <PlayCircle className="w-4 h-4 text-white fill-current" />
                                             </div>
                                         </div>
                                     </div>
                                     <div className="flex flex-col justify-center min-w-0">
                                         <span className="text-xs font-medium text-primary line-clamp-2 leading-snug group-hover:text-[#21808D] transition-colors">
                                             {vid.title}
                                         </span>
                                         <span className="text-[10px] text-muted mt-1">YouTube</span>
                                     </div>
                                 </a>
                             ))}
                        </div>
                     </div>
                )}

            </div>
        </div>

      </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopilotMode, setIsCopilotMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODEL_OPTIONS[0]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [view, setView] = useState<'home' | 'discover' | 'about'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, messages[messages.length-1]?.content]);

  // Handle Search Initiation
  const handleSearch = async (overrideQuery?: string) => {
    const finalQuery = overrideQuery || query;
    if (!finalQuery.trim() || isLoading) return;

    setIsLoading(true);
    setQuery(''); 
    
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    if (!hasSearched) setHasSearched(true);

    // 1. Create new messages locally first
    const userMsg: Message = { role: 'user', content: finalQuery };
    const assistantMsg: Message = { role: 'assistant', content: '', sources: [], images: [], videos: [] };

    // 2. Update state safely
    setMessages(prev => [...prev, userMsg, assistantMsg]);

    // 3. Construct history for the API call (including the new user message)
    // Note: We cannot use 'messages' state here as it is stale.
    const currentHistory = [...messages, userMsg];

    try {
        // --- COPILOT LOGIC ---
        // Only run copilot analysis step if mode is explicitly ON
        if (isCopilotMode) {
             const copilotStep = await generateCopilotStep(finalQuery);
             
             if (copilotStep) {
                 // Update last message to be a Copilot interaction
                 setMessages(prev => {
                     const newMsgs = [...prev];
                     const last = newMsgs[newMsgs.length - 1];
                     // Safety check
                     if (last) {
                         last.isCopilotActive = true;
                         last.copilotStep = copilotStep;
                         last.content = finalQuery; 
                     }
                     return newMsgs;
                 });
                 setIsLoading(false); 
                 return;
             }
        }

        // --- STANDARD SEARCH ---
        await executeSearch(finalQuery, currentHistory);

    } catch (e) {
        console.error(e);
        setIsLoading(false);
    }
  };

  const executeSearch = async (searchQuery: string, history: Message[]) => {
      setIsLoading(true);

      // --- SEARCH DECISION ---
      // STRICT: Only search if Copilot Mode is ON, otherwise use pure LLM.
      const needsSearch = isCopilotMode;
      
      let results: SearchResult[] = [];
      let images: SearchResult[] = [];
      let videos: SearchResult[] = [];

      if (needsSearch) {
          try {
              // Parallelize Text and Media Search
              const [textRes, mediaRes] = await Promise.all([
                  searchFast(searchQuery),
                  searchMedia(searchQuery)
              ]);
              
              results = textRes.results;
              images = mediaRes.images;
              videos = mediaRes.videos;
          } catch (e) {
              console.warn("Search failed, proceeding with generation only", e);
          }
      }
      
      // Update sources and media immediately
      setMessages(prev => {
          const newMsgs = [...prev];
          if (newMsgs.length === 0) return prev;
          
          const last = newMsgs[newMsgs.length - 1];
          // Safety check for last message existence
          if (last) {
              last.sources = results;
              last.images = images;
              last.videos = videos;
              last.isCopilotActive = false; 
          }
          return newMsgs;
      });

      await streamResponse(
          searchQuery,
          selectedModel.id, 
          history.slice(-6),
          results,
          [],
          false,
          false,
          (chunk) => {
              setMessages(prev => {
                  const newMsgs = [...prev];
                  if (newMsgs.length === 0) return prev;
                  const last = newMsgs[newMsgs.length - 1];
                  if (last) {
                      last.content = chunk;
                  }
                  return newMsgs;
              });
          },
          () => {},
          (related) => {
              setMessages(prev => {
                  const newMsgs = [...prev];
                  if (newMsgs.length === 0) return prev;
                  const last = newMsgs[newMsgs.length - 1];
                  if (last) {
                    last.relatedQuestions = related;
                  }
                  return newMsgs;
              });
          },
          undefined,
          undefined,
          (sources) => {
              setMessages(prev => {
                  const newMsgs = [...prev];
                  if (newMsgs.length === 0) return prev;
                  const last = newMsgs[newMsgs.length - 1];
                  if (last && (!last.sources || last.sources.length === 0)) {
                      last.sources = sources;
                  }
                  return newMsgs;
              });
          }
      );
      
      setIsLoading(false);
  };

  const handleCopilotAnswer = async (answer: string) => {
      // Find the question we are answering
      const lastMsg = messages[messages.length - 1];
      const originalQuery = lastMsg.content; 
      
      // We need to pass the history up to the user message
      // Messages state has [..., UserMsg, AssistantMsg(Copilot)]
      // We want to reuse the AssistantMsg or replace it.
      // Let's reset the assistant message to empty and load it.
      
      const refinedQuery = `${originalQuery} (User Clarification: ${answer})`;
      
      setMessages(prev => {
          const newMsgs = [...prev];
          const last = newMsgs[newMsgs.length - 1];
          if (last) {
            last.isCopilotActive = false; 
            last.content = ''; // Reset content to stream new answer
            last.copilotStep = undefined;
          }
          return newMsgs;
      });

      // Pass history excluding the last assistant placeholder which is currently active
      const historyForGen = messages.slice(0, -1);
      
      await executeSearch(refinedQuery, historyForGen);
  };

  const renderInputBar = (isInitial: boolean) => {
    return (
        <div className={`w-full max-w-3xl mx-auto relative z-30 ${isInitial ? '' : 'pb-6'}`}>
          <div className={`
            relative flex items-center w-full bg-surface
            ${isInitial ? 'rounded-xl border border-border min-h-[120px] p-4 flex-col' : 'rounded-full border border-border px-4 py-2.5 shadow-sm hover:shadow-md'}
            transition-all duration-300
            focus-within:ring-1 focus-within:ring-border/50
          `}>
             <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                    }
                }}
                placeholder={isInitial ? "Ask anything..." : "Ask follow-up..."}
                className={`w-full bg-transparent text-primary placeholder:text-muted/50 font-normal focus:outline-none resize-none overflow-hidden font-sans leading-relaxed
                    ${isInitial ? 'text-[18px] mb-auto px-1' : 'text-[16px] flex-1 py-1'}
                `}
                style={{ minHeight: isInitial ? '28px' : '24px' }}
                rows={1}
                autoFocus={isInitial}
              />
              
              {/* Controls */}
              <div className={`flex items-center gap-4 ${isInitial ? 'w-full justify-between mt-auto' : 'ml-2'}`}>
                  {isInitial && (
                      <div className="flex items-center gap-4 text-muted text-sm font-medium">
                         <button className="flex items-center gap-2 hover:text-primary transition-colors">
                            <Search className="w-4 h-4" /> Focus
                         </button>
                         <button className="flex items-center gap-2 hover:text-primary transition-colors">
                             <Plus className="w-4 h-4 rounded-full border border-current p-0.5" /> File
                         </button>
                      </div>
                  )}

                  <div className="flex items-center gap-3 ml-auto">
                        
                        {/* Copilot Toggle inside the search bar */}
                        <div 
                            className="flex items-center gap-2 cursor-pointer group select-none bg-surface-hover/50 px-2 py-1 rounded-full border border-transparent hover:border-border transition-all" 
                            onClick={() => setIsCopilotMode(!isCopilotMode)}
                        >
                            <div className={`
                                w-8 h-4.5 rounded-full relative transition-colors duration-200 ease-in-out
                                ${isCopilotMode ? 'bg-[#21808D]' : 'bg-border'}
                            `}>
                                <div className={`
                                    absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm
                                    ${isCopilotMode ? 'translate-x-3.5' : 'translate-x-0'}
                                `} />
                            </div>
                            <span className={`text-xs font-medium ${isCopilotMode ? 'text-[#21808D]' : 'text-muted'}`}>Copilot</span>
                        </div>

                        {/* Divider */}
                        {!isInitial && <div className="h-5 w-[1px] bg-border mx-1"></div>}
                        
                        <button 
                            onClick={() => handleSearch()}
                            className={`flex items-center justify-center rounded-full transition-all duration-200 
                                ${isInitial ? 'w-8 h-8 bg-[#21808D] text-white' : 'w-8 h-8 bg-[#21808D] text-white hover:opacity-90'}
                                ${!query.trim() ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
                            `}
                            disabled={!query.trim()}
                        >
                            {isInitial ? <ArrowRight className="w-4 h-4" /> : <ArrowUp className="w-5 h-5" />}
                        </button>
                  </div>
              </div>
          </div>
        </div>
    );
  };

  return (
    <SidebarProvider>
      <div className={`min-h-screen bg-background text-primary font-sans selection:bg-[#21808D]/20 flex flex-row overflow-hidden w-full`}>
        <AppSidebar 
          currentView={view} 
          onNavigate={setView}
          onNewChat={() => { setMessages([]); setHasSearched(false); }}
          onToggleHistory={() => setIsHistoryOpen(true)}
          onSignIn={() => setIsAuthModalOpen(true)}
          onUpgrade={() => setIsSubscriptionModalOpen(true)}
          user={user}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />

        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onSelectChat={() => {}}
          onNewChat={() => { setMessages([]); setHasSearched(false); }}
          userId={user?.id || ''}
          onSignIn={() => setIsAuthModalOpen(true)}
          onOpenAbout={() => setView('about')}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        />

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <SubscriptionModal isOpen={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} />

        <SidebarInset>
           <div className="absolute inset-0 flex flex-col min-w-0 overflow-hidden">
             <div className="md:hidden fixed top-3 left-3 z-50">
                 <SidebarTrigger />
             </div>

             {view === 'about' && <About onBack={() => setView('home')} />}
             {view === 'discover' && <Discover onBack={() => setView('home')} />}

             {view === 'home' && (
                <div className="flex-1 flex flex-col h-full relative">
                  {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center p-4 w-full h-full animate-fade-in max-w-4xl mx-auto">
                        <div className="w-full max-w-2xl mb-8 flex flex-col items-center text-center">
                             <h1 className="text-[40px] md:text-[44px] font-normal text-primary font-serif tracking-tight text-[#111] dark:text-[#EEE]">
                                Where knowledge begins
                             </h1>
                        </div>
                        {renderInputBar(true)}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col relative h-full">
                        <div className="flex-1 overflow-y-auto pb-44 pt-6 px-0 scroll-smooth">
                          <div className="flex flex-col w-full"> 
                            {messages.map((msg, idx) => (
                                <MessageItem 
                                  key={idx}
                                  msg={msg}
                                  isLast={idx === messages.length - 1}
                                  isLoading={isLoading}
                                  onCopilotAnswer={handleCopilotAnswer}
                                  modelName={selectedModel.name}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-12 pb-0 z-20 px-4">
                              {renderInputBar(false)}
                        </div>
                    </div>
                  )}
                </div>
             )}
           </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}