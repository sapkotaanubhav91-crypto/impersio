import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight,
  Search,
  ArrowUp,
  Share2,
  Copy,
  RotateCcw,
  Check,
  ChevronDown,
  BrainCircuit,
  Zap,
  Code as CodeIcon,
  CircleDashed,
  Paperclip,
  Globe,
  Plus
} from 'lucide-react';
import { streamResponse } from './services/geminiService';
import { searchFast } from './services/googleSearchService';
import { authService } from './services/authService';
import { Message, User, SearchResult, ModelOption } from './types';
import { Discover } from './components/Discover';
import { Library } from './components/Library';
import { AuthModal } from './components/AuthModal';
import { AppSidebar } from './components/AppSidebar';
import { MessageContent } from './components/MessageContent';
import { useTheme } from './hooks/useTheme';
import { SidebarProvider, SidebarInset } from './components/ui/sidebar';
import { createConversation, saveMessage, getConversationMessages } from './services/chatStorageService';
import { ModelSelector } from './components/ModelSelector';
import { MetaIcon, GeminiIcon, ImpersioLogo } from './components/Icons';
import { SubscriptionModal } from './components/SubscriptionModal';
import { Thinking } from './components/Thinking';

// --- Available Models ---
const MODELS: ModelOption[] = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', icon: GeminiIcon, description: 'Fast & Intelligent' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', icon: GeminiIcon, description: 'High Reasoning' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1t2', icon: BrainCircuit, description: 'Deep Thinking (New)', isReasoning: true },
    { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120b', icon: CircleDashed, description: 'Open Reasoning', isReasoning: true },
    { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2', icon: Zap, description: 'Advanced Logic' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', icon: MetaIcon, description: 'Latest Architecture' },
    { id: 'qwen/qwen3-32b', name: 'Qwen 3', icon: CodeIcon, description: 'Coding Expert' },
];

const MessageItem: React.FC<{ 
  msg: Message; 
  isLast: boolean; 
  isLoading: boolean;
  onShare: () => void;
  onRewrite: (query: string) => void;
}> = ({ msg, isLast, isLoading, onShare, onRewrite }) => {
  if (msg.role === 'user') {
    return (
      <div className="w-full max-w-3xl mx-auto pt-10 pb-6 px-4 animate-fade-in">
         <h1 className="text-[32px] font-medium text-primary font-sans tracking-tight leading-tight">
           {msg.content}
         </h1>
      </div>
    );
  }

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-12 px-4 animate-fade-in">
      <div className="flex flex-col gap-6">
        
        {/* Sources Section (Above Answer) */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-primary flex items-center gap-2">
                 <Globe className="w-4 h-4" /> Sources
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {msg.sources.slice(0, 4).map((source, idx) => (
                <a 
                  key={idx} href={source.link} target="_blank" rel="noreferrer"
                  className="flex-shrink-0 w-44 flex flex-col p-3 rounded-lg bg-surface hover:bg-surface-hover border border-border transition-all h-[80px] justify-between group"
                >
                  <div className="text-xs font-medium text-primary line-clamp-2 leading-snug group-hover:text-scira-accent transition-colors">
                    {source.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-auto">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${new URL(source.link).hostname}&sz=32`} 
                      className="w-3 h-3 rounded-full opacity-60 grayscale group-hover:grayscale-0 transition-all" 
                      alt=""
                    />
                    <div className="text-[10px] text-muted font-medium truncate flex-1">
                      {source.displayLink}
                    </div>
                  </div>
                </a>
              ))}
              {msg.sources.length > 4 && (
                 <button className="flex-shrink-0 h-[80px] w-20 flex items-center justify-center rounded-lg bg-surface border border-border text-xs text-muted font-medium hover:bg-surface-hover transition-colors">
                    View {msg.sources.length - 4} more
                 </button>
              )}
            </div>
          </div>
        )}

        {/* Answer Section */}
        <div className="min-h-[20px] animate-in fade-in slide-in-from-bottom-3 duration-700">
           <div className="flex items-center gap-2 mb-3">
              <ImpersioLogo className="w-5 h-5 text-scira-accent" />
              <span className="text-sm font-medium text-primary">Answer</span>
            </div>
          
          {/* Reasoning / Thinking Block */}
          {msg.reasoning && (
             <Thinking content={msg.reasoning} isComplete={!isLoading || !isLast || !!msg.content} />
          )}

          {isLoading && isLast && !msg.content && !msg.reasoning ? (
             <div className="w-full space-y-4 opacity-10 py-2">
                <div className="h-4 bg-primary rounded-full w-full" />
                <div className="h-4 bg-primary rounded-full w-[90%]" />
             </div>
          ) : (
            <div className="w-full">
              <MessageContent content={msg.content} isStreaming={isLast && isLoading} sources={msg.sources} />
              
              {!isLoading && (
                <div className="mt-6 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <button onClick={onShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border/50 text-muted hover:text-primary transition-colors text-xs font-medium">
                         <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                      <button onClick={() => onRewrite(msg.content)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border/50 text-muted hover:text-primary transition-colors text-xs font-medium">
                         <RotateCcw className="w-3.5 h-3.5" /> Rewrite
                      </button>
                      <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border/50 text-muted hover:text-primary transition-colors text-xs font-medium">
                         {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                         {copied ? 'Copied' : 'Copy'}
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Section */}
        {msg.relatedQuestions && msg.relatedQuestions.length > 0 && !isLoading && (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 pt-4 border-t border-border/50">
               <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-primary flex items-center gap-2">
                      <CircleDashed className="w-4 h-4" /> Related
                  </span>
               </div>
              <div className="flex flex-col gap-2">
                 {msg.relatedQuestions.map((q, i) => (
                    <button 
                      key={i}
                      onClick={() => onRewrite(q)}
                      className="w-full text-left py-2.5 px-4 rounded-lg bg-surface border border-border/50 hover:bg-surface-hover text-sm font-medium text-primary transition-all flex items-center justify-between group"
                    >
                       <span>{q}</span>
                       <ArrowRight className="w-4 h-4 text-muted opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                    </button>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isCopilotMode, setIsCopilotMode] = useState(false); // Pro Mode Toggle
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [view, setView] = useState<'home' | 'discover' | 'library' | 'profile'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setUser(authService.getCurrentUser()); }, []);
  useEffect(() => { 
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages.length, messages[messages.length-1]?.content]);

  const handleSearch = async (overrideQuery?: string) => {
    const finalQuery = overrideQuery || query;
    if (!finalQuery.trim() || isLoading) return;
    
    setIsLoading(true);
    setQuery(''); 
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    if (!hasSearched) setHasSearched(true);

    let currentId = activeConversationId;
    if (!currentId) {
       currentId = await createConversation(finalQuery);
       setActiveConversationId(currentId);
    }

    const userMsg: Message = { role: 'user', content: finalQuery };
    const assistantMsg: Message = { role: 'assistant', content: '', reasoning: '', sources: [], isCopilotActive: isCopilotMode };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    
    if (currentId) await saveMessage(currentId, 'user', finalQuery);
    
    try {
      // 1. Web Search
      const textRes = await searchFast(finalQuery);
      let results = textRes.results;
      
      setMessages(prev => {
          const newMsgs = [...prev];
          const last = newMsgs[newMsgs.length - 1];
          if (last) last.sources = results;
          return newMsgs;
      });

      // 2. Generation with Selected Model
      await streamResponse(
        finalQuery, 
        selectedModel.id, 
        [], 
        results, 
        [], 
        false, 
        false, 
        (chunk, reasoning) => {
          setMessages(prev => {
              const newMsgs = [...prev];
              const last = newMsgs[newMsgs.length - 1];
              if (last) {
                  if (chunk) last.content = chunk;
                  if (reasoning) last.reasoning = reasoning;
              }
              return newMsgs;
          });
        },
        () => {},
        (related) => {
          setMessages(prev => {
              const newMsgs = [...prev];
              const last = newMsgs[newMsgs.length - 1];
              if (last) last.relatedQuestions = related;
              return newMsgs;
          });
        },
        (fullContent, widget, related) => {
           if (currentId) saveMessage(currentId, 'assistant', fullContent, { sources: results, relatedQuestions: related });
        },
        undefined,
        (rankedSources) => {
           setMessages(prev => {
              const newMsgs = [...prev];
              const last = newMsgs[newMsgs.length - 1];
              if (last) last.sources = rankedSources;
              return newMsgs;
          });
        }
      );
    } catch (e) {
        console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputBar = (isInitial: boolean) => {
    return (
      <div className={`w-full ${isInitial ? 'max-w-3xl' : 'max-w-3xl'} mx-auto relative z-30 px-4`}>
        <div className={`
          relative flex flex-col w-full bg-surface border border-border transition-all duration-300
          ${isInitial ? 'rounded-[20px] p-4 shadow-sm hover:border-border/80 hover:shadow-md' : 'rounded-full p-2 px-4 shadow-elegant mb-6'}
        `}>
          {isInitial ? (
             <>
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-primary placeholder:text-muted/60 font-medium focus:outline-none resize-none overflow-hidden font-sans text-xl mb-4 leading-relaxed"
                  style={{ minHeight: '52px' }}
                  rows={1}
                  autoFocus
                />
                
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-hover hover:bg-border/50 text-muted hover:text-primary font-medium text-xs transition-colors">
                       <span className="font-bold">Focus</span>
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-hover hover:bg-border/50 text-muted hover:text-primary font-medium text-xs transition-colors">
                       <Paperclip className="w-3.5 h-3.5" /> Attach
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     {/* Perplexity-style Pro Toggle */}
                    <div className="flex items-center gap-2 mr-2">
                       <button 
                         onClick={() => setIsCopilotMode(!isCopilotMode)}
                         className={`
                           flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold border transition-all select-none
                           ${isCopilotMode ? 'bg-surface text-scira-accent border-scira-accent/30' : 'bg-transparent text-muted border-transparent hover:bg-surface-hover'}
                         `}
                       >
                          <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${isCopilotMode ? 'bg-scira-accent' : 'bg-border'}`}>
                             <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${isCopilotMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                          <span>Pro</span>
                       </button>
                    </div>

                    <div className="h-5 w-px bg-border/60 mx-1" />

                    {/* Submit Button */}
                    <button 
                      onClick={() => handleSearch()}
                      disabled={!query.trim()}
                      className={`
                        flex items-center justify-center rounded-full w-8 h-8 transition-all duration-200
                        ${query.trim() ? 'bg-scira-accent hover:bg-scira-accent-hover text-white shadow-md' : 'bg-border/50 text-muted cursor-not-allowed'}
                      `}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
             </>
          ) : (
            <div className="flex items-center gap-3 w-full h-[46px]">
               <button className="p-2 text-muted hover:text-primary transition-colors rounded-full shrink-0 hover:bg-surface-hover">
                  <Plus className="w-5 h-5 opacity-60" />
               </button>
               <input
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                 placeholder="Ask follow-up..."
                 className="flex-1 bg-transparent text-primary placeholder:text-muted/60 font-medium focus:outline-none text-[15px]"
               />
               <div className="flex items-center gap-3 shrink-0">
                   {/* Model Selector in Footer */}
                   <ModelSelector
                        selectedModel={selectedModel}
                        models={MODELS}
                        onSelect={setSelectedModel}
                        isOpen={isModelMenuOpen}
                        onToggle={() => setIsModelMenuOpen(!isModelMenuOpen)}
                        isPro={!!user?.is_pro}
                        onOpenProModal={() => setIsProModalOpen(true)}
                        trigger={
                           <button className="text-xs font-medium text-muted hover:text-primary bg-surface-hover px-2 py-1 rounded-md transition-colors flex items-center gap-1">
                              {selectedModel.name} <ChevronDown className="w-3 h-3" />
                           </button>
                        }
                  />
                  <div className="h-4 w-px bg-border mx-1" />
                  <button 
                    onClick={() => handleSearch()}
                    disabled={!query.trim()}
                    className={`flex items-center justify-center rounded-full w-8 h-8 transition-all ${query.trim() ? 'bg-scira-accent text-white' : 'bg-border/30 text-muted'}`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-primary font-sans selection:bg-scira-accent/20 flex flex-row overflow-hidden w-full">
        <AppSidebar 
          currentView={view} 
          onNavigate={setView} 
          onNewChat={() => { setMessages([]); setHasSearched(false); setActiveConversationId(null); setView('home'); setSelectedModel(MODELS[0]); }}
          onSignIn={() => setIsAuthModalOpen(true)}
          user={user}
        />
        
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <SubscriptionModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
        
        <SidebarInset>
           <div className="absolute inset-0 flex flex-col min-w-0 overflow-hidden bg-background">
             {view === 'home' && (
                <div className="flex-1 flex flex-col h-full relative">
                  {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center p-4 w-full h-full animate-fade-in relative pb-32">
                        <div className="w-full max-w-2xl mb-8 flex flex-col items-center text-center">
                             <h1 className="text-4xl font-medium tracking-tight text-primary font-sans mb-2">
                                Where knowledge begins
                             </h1>
                        </div>
                        {renderInputBar(true)}
                        
                        {/* Suggestion Chips */}
                        <div className="mt-8 flex flex-wrap justify-center gap-3 opacity-60 max-w-2xl">
                            {['History of Apple', 'How does AI work?', 'Best movies 2024', 'React vs Vue'].map(item => (
                                <button key={item} onClick={() => { setQuery(item); handleSearch(item); }} className="px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-medium text-muted hover:text-primary hover:border-primary/30 transition-all">
                                  {item}
                                </button>
                            ))}
                        </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto pb-48 pt-0 px-0 scroll-smooth">
                      <div className="flex flex-col w-full"> 
                        {messages.map((msg, idx) => ( 
                          <MessageItem key={idx} msg={msg} isLast={idx === messages.length - 1} isLoading={isLoading} onShare={() => {}} onRewrite={handleSearch} /> 
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                  )}
                  {hasSearched && (
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-10 pb-6 z-20">
                        {renderInputBar(false)}
                    </div>
                  )}
                </div>
             )}
             {view === 'discover' && <Discover onBack={() => setView('home')} />}
             {view === 'library' && <Library onSelectThread={(id) => { setActiveConversationId(id); getConversationMessages(id).then(msgs => { setMessages(msgs); setHasSearched(true); setView('home'); }); }} />}
             {view === 'profile' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                   <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-8 border border-border shadow-sm">
                      <ImpersioLogo className="w-10 h-10 text-scira-accent" />
                   </div>
                   <h2 className="text-2xl font-medium tracking-tight mb-2">Your Profile</h2>
                   <p className="text-muted max-w-sm text-sm">Settings and preferences coming soon.</p>
                </div>
             )}
           </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}