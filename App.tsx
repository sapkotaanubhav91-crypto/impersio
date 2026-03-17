import React, { useState, useRef, useEffect } from 'react';
import { BrainCircuit, Zap, Code as CodeIcon, CircleDashed, Menu, ChevronDown, Share as ShareIcon, Trash2, Pencil, Plus, Trophy, Plane, Clock, Calendar } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useClerk } from '@clerk/clerk-react';
import { authService } from '@/services/authService';
import { User, ModelOption, SearchModeType } from '@/types';
import { saveToLibrary } from '@/services/libraryService';
import { Discover } from '@/components/Discover';
import { Library } from '@/components/Library';
import { useTheme } from '@/hooks/useTheme';
import { getConversationMessages } from '@/services/chatStorageService';
import { MetaIcon, GeminiIcon, ImpersioLogo } from '@/components/Icons';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { useChat } from '@/hooks/useChat';
import { useUserSync } from '@/hooks/useUserSync';
import { MessageItem } from '@/components/chat/MessageItem';
import { ChatBoxInput } from '@/components/search/ChatBoxInput';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Sports } from '@/components/Sports';
import { Travel } from '@/components/Travel';
import { PredictionPage } from '@/components/PredictionPage';
import Header from '@/components/Header';
import DisplayResult from '@/components/DisplayResult';

const HAS_CLERK_KEY = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZnVubnktbW9ua2V5LTU5LmNsZXJrLmFjY291bnRzLmRldiQ');

// --- Available Models ---
const MODELS: ModelOption[] = [
    // Stable
    { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi k2', icon: Zap, description: "Moonshot AI's Kimi k2 model", category: 'Stable' },
    { id: 'grok-2', name: 'Grok 2.0', icon: Zap, description: "xAI's Grok 2.0 model", category: 'Stable' },
    { id: 'grok-2-vision', name: 'Grok 2.0 Vision', icon: Zap, description: "xAI's Grok 2.0 Vision model", category: 'Stable' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', icon: BrainCircuit, description: "Anthropic's G.O.A.T. model", category: 'Stable' },
    
    // Experimental
    { id: 'llama-3-3-70b', name: 'Llama 3.3 70B', icon: MetaIcon, description: "Meta's Llama model by Cerebras", category: 'Experimental' },
    { id: 'deepseek-r1-distilled', name: 'DeepSeek R1 Distilled', icon: CodeIcon, description: "DeepSeek R1 model by Groq", category: 'Experimental' },
];

export default function App() {
  useTheme();
  useUserSync();
  const { user: clerkUser } = useUser();
  const { openSignIn } = useClerk();
  
  const { 
    messages, 
    setMessages, 
    hasSearched, 
    setHasSearched, 
    isLoading, 
    handleSearch, 
    setActiveConversationId,
    activeConversationId
  } = useChat();
  
  const [query, setQuery] = useState('');
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Prompt sign in on mount if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser && !clerkUser) {
        // Small delay to ensure everything is loaded
        setTimeout(() => {
          openSignIn();
        }, 1500);
      }
    };
    checkAuth();
  }, [clerkUser, openSignIn]);
  const [view, setView] = useState<'home' | 'discover' | 'library' | 'profile' | 'sports' | 'travel' | 'predict'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]); // Default to Grok 2.0
  const [selectedMode, setSelectedMode] = useState<SearchModeType>('web');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Title state
  const [chatTitle, setChatTitle] = useState('New Chat');
  const [isTitleMenuOpen, setIsTitleMenuOpen] = useState(false);

  useEffect(() => { setUser(authService.getCurrentUser()); }, []);
  
  useEffect(() => { 
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages.length, messages[messages.length-1]?.content]);

  // Update title based on query if new chat
  useEffect(() => {
     if (hasSearched && messages.length > 0 && chatTitle === 'New Chat') {
         const firstUserMsg = messages.find(m => m.role === 'user');
         if (firstUserMsg) {
             setChatTitle(firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : ''));
         }
     }
  }, [hasSearched, messages]);

  const onSearch = (overrideQuery?: string) => {
      const q = overrideQuery || query;
      if (!q.trim()) return;

      // Save to library if user is logged in
      const email = clerkUser?.primaryEmailAddress?.emailAddress;
      if (email) {
          const type = (selectedMode === 'extreme' || selectedMode === 'academic') ? 'research' : 'search';
          saveToLibrary(q, email, type);
      }

      // If searching from specialized views, switch to home view to show chat results
      if (view === 'sports' || view === 'travel') {
          setView('home');
      }
      handleSearch(q, selectedModel.id, selectedMode);
      setQuery('');
  };

  const handleNewChat = () => {
      setMessages([]); 
      setHasSearched(false); 
      setActiveConversationId(null); 
      setView('home'); 
      setSelectedModel(MODELS[0]);
      setSelectedMode('web');
      setChatTitle('New Chat');
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              handleNewChat();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const firstUserMsg = messages.find(m => m.role === 'user');
  const searchInputRecord = {
      searchInput: firstUserMsg?.content || chatTitle,
      created_at: new Date() 
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-foreground font-sans selection:bg-[#1c7483]/20 overflow-hidden">
        <SubscriptionModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
        
        <AppSidebar onNewChat={handleNewChat} />

        <main className="flex-1 flex flex-col min-w-0 relative h-full bg-background transition-all duration-300">
             {/* Auth Buttons removed as requested - UserButton is now in the Header component */}
             
             {/* Header - Only visible when searched or in specific views, NOT in sports/travel view */}
             {hasSearched && view === 'home' && (
                 <div className="sticky top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md">
                     <Header searchInputRecord={searchInputRecord} />
                 </div>
             )}

           {/* View Content */}
           {view === 'home' && (
              <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {!hasSearched ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[500px]">

                      {/* New Chat Button Mobile */}
                      <div className="md:hidden absolute top-4 left-4 z-10">
                          <SidebarTrigger />
                      </div>
                      <div className="md:hidden absolute top-4 right-4 z-10">
                          <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-lg text-xs font-medium transition-all">
                              <Plus className="w-3.5 h-3.5" /> New
                          </button>
                      </div>

                       <div className="w-full max-w-2xl flex flex-col items-center justify-center animate-fade-in relative z-10">
                           <div className="flex items-center gap-3 mb-8">
                               <ImpersioLogo className="w-10 h-10 text-foreground" />
                               <h1 className="text-4xl font-normal tracking-tight text-foreground font-sans">
                                  perplexity
                               </h1>
                           </div>
                           
                           <ChatBoxInput 
                               query={query} 
                               setQuery={setQuery} 
                               handleSearch={() => onSearch()} 
                               isInitial={true}
                           />
                      </div>
                  </div>
                ) : (
                  <>
                    <DisplayResult searchInputRecord={searchInputRecord} />
                    <div className="flex-1 overflow-y-auto pb-40 pt-4 px-0 scroll-smooth scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted">
                        <div className="flex flex-col w-full"> 
                        {messages.filter(m => m.role !== 'user').map((msg, idx) => ( 
                            <MessageItem 
                                key={idx} 
                                msg={msg} 
                                isLast={idx === messages.filter(m => m.role !== 'user').length - 1} 
                                isLoading={isLoading} 
                                onShare={() => {}} 
                                onRewrite={onSearch} 
                            /> 
                        ))}
                        <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent pb-6 pt-10">
                        <ChatBoxInput 
                            query={query} 
                            setQuery={setQuery} 
                            handleSearch={() => onSearch()} 
                            isInitial={false}
                        />
                    </div>
                  </>
                )}
              </div>
           )}
           
           {view === 'discover' && <Discover onBack={() => setView('home')} />}
           {view === 'library' && <Library onSelectThread={(id) => { setActiveConversationId(id); getConversationMessages(id).then(msgs => { setMessages(msgs); setHasSearched(true); setView('home'); }); }} />}
           {view === 'sports' && (
              <Sports 
                onSearch={onSearch} 
                query={query} 
                setQuery={setQuery}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                models={MODELS}
              />
           )}
           {view === 'travel' && (
              <Travel
                onSearch={onSearch} 
                query={query} 
                setQuery={setQuery}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                models={MODELS}
              />
           )}
           {view === 'predict' && <PredictionPage />}
           {view === 'profile' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                 <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-8 border border-border shadow-sm">
                    <ImpersioLogo className="w-10 h-10 text-foreground" />
                 </div>
                 <h2 className="text-2xl font-medium tracking-tight mb-2 font-sans">Your Profile</h2>
                 <p className="text-muted max-w-sm text-sm font-sans mb-8">Manage your account settings and subscription.</p>
                 {user ? (
                     <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-sm text-left">
                         <div className="mb-4">
                             <label className="text-xs font-bold uppercase text-muted tracking-wider">Email</label>
                             <div className="text-foreground font-medium">{user.email}</div>
                         </div>
                         <div className="mb-6">
                             <label className="text-xs font-bold uppercase text-muted tracking-wider">Plan</label>
                             <div className="flex items-center gap-2">
                                 <span className="text-foreground font-medium">{user.is_pro ? 'Pro' : 'Free'}</span>
                                 {!user.is_pro && <button onClick={() => setIsProModalOpen(true)} className="text-xs text-foreground hover:underline">Upgrade</button>}
                             </div>
                         </div>
                         <button onClick={() => { authService.signOut(); window.location.reload(); }} className="w-full py-2 bg-surface-hover hover:bg-border rounded-lg text-sm font-medium transition-colors">Sign Out</button>
                     </div>
                 ) : (
                     <button onClick={() => openSignIn()} className="px-6 py-2 bg-foreground text-background rounded-full font-medium">Sign In</button>
                 )}
              </div>
           )}
      </main>
    </div>
    </SidebarProvider>
  );
}
