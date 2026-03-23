import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { User, ModelOption, SearchModeType } from '@/types';
import { saveToLibrary } from '@/services/libraryService';
import { Discover } from '@/components/Discover.tsx';
import { Library } from '@/components/Library.tsx';
import { useTheme } from '@/hooks/useTheme';
import { getConversationMessages } from '@/services/chatStorageService';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { useChat } from '@/hooks/useChat';
import { useUserSync } from '@/hooks/useUserSync';
import { Header } from '@/components/Header.tsx';
import { DisplayResult } from '@/components/DisplayResult.tsx';
import AppSidebar from '@/components/app-sidebar';
import ChatBoxInput from '@/components/ChatBoxInput';
import ChatBoxLogo from '@/components/ChatBoxLogo';

// --- Available Models ---
const MODELS: ModelOption[] = [
    { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2', description: "Moonshot AI's Kimi K2", category: 'Stable', provider: 'groq' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', description: "OpenAI GPT-OSS 120B", category: 'Experimental', provider: 'groq' },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nvidia Nemotron 3 Super', description: "Nvidia Nemotron 3 Super 120B", category: 'Experimental', provider: 'openrouter' },
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
    handleSearch, 
    setActiveConversationId,
  } = useChat();
  
  const [query, setQuery] = useState('');
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Prompt sign in on mount if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = authService.getCurrentUser();
      if (!currentUser && !clerkUser) {
        setTimeout(() => {
          openSignIn();
        }, 1500);
      }
    };
    checkAuth();
  }, [clerkUser, openSignIn]);

  const location = useLocation();
  const navigate = useNavigate();
  
  const view = location.pathname === '/discover' ? 'discover' : 
               location.pathname === '/library' ? 'library' : 
               location.pathname === '/profile' ? 'profile' : 'home';

  const [user, setUser] = useState<User | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [selectedMode, setSelectedMode] = useState<SearchModeType>('web');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Title state
  const [chatTitle, setChatTitle] = useState('New Chat');

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

      const email = clerkUser?.primaryEmailAddress?.emailAddress;
      if (email) {
          const type = (selectedMode === 'extreme' || selectedMode === 'academic') ? 'research' : 'search';
          saveToLibrary(q, email, type).catch(err => console.error('Failed to save to library:', err));
      }

      handleSearch(q, selectedModel.id, selectedMode);
      setQuery('');
  };

  const handleNewChat = () => {
      setMessages([]); 
      setHasSearched(false); 
      setActiveConversationId(null); 
      navigate('/'); 
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
      <div className="flex h-screen w-full bg-background text-foreground font-sans selection:bg-[#1c7483]/20 overflow-hidden">
        <SubscriptionModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
        <AppSidebar />

        <main className="flex-1 flex flex-col min-w-0 relative h-full bg-background transition-all duration-300">
             {hasSearched && view === 'home' && (
                 <div className="sticky top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md">
                     <Header searchInputRecord={searchInputRecord} />
                 </div>
             )}

           {view === 'home' && (
              <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {!hasSearched ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[500px]">
                      <div className="absolute top-4 left-4 z-10">
                          <UserButton />
                      </div>
                      <div className="md:hidden absolute top-4 right-4 z-10">
                          <button onClick={handleNewChat} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-lg text-xs font-medium transition-all">
                              <Plus className="w-3.5 h-3.5" /> New
                          </button>
                      </div>

                        <div className="w-full max-w-3xl flex flex-col items-center justify-center animate-fade-in relative z-10">
                            <div className="mb-8">
                                <ChatBoxLogo className="h-14 w-auto" />
                            </div>
                            
                            <ChatBoxInput 
                                query={query} 
                                setQuery={setQuery} 
                                onSearch={() => onSearch()} 
                                selectedMode={selectedMode}
                                setSelectedMode={setSelectedMode}
                                models={MODELS}
                                selectedModel={selectedModel}
                                setSelectedModel={setSelectedModel}
                            />

                       </div>

                      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 text-sm text-muted font-medium">
                          <a href="#" className="hover:text-foreground transition-colors">Pro</a>
                          <a href="#" className="hover:text-foreground transition-colors">Enterprise</a>
                          <a href="#" className="hover:text-foreground transition-colors">API</a>
                          <a href="#" className="hover:text-foreground transition-colors">Blog</a>
                          <a href="#" className="hover:text-foreground transition-colors">Careers</a>
                          <a href="#" className="hover:text-foreground transition-colors">Store</a>
                          <a href="#" className="hover:text-foreground transition-colors">Finance</a>
                          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                              English <ChevronDown className="w-3 h-3" />
                          </button>
                      </div>
                      <button className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-muted hover:text-foreground transition-colors">
                          ?
                      </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto pb-40 pt-4 px-0 scroll-smooth scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted">
                        <div className="flex flex-col w-full mt-6"> 
                        {messages.map((msg, idx) => ( 
                            msg.role === 'assistant' && (
                                <DisplayResult 
                                    key={idx}
                                    searchInputRecord={{ searchInput: messages[idx - 1]?.content || 'Search' }}
                                    images={msg.images}
                                    videos={msg.videos}
                                    sources={msg.sources}
                                    answer={msg.content}
                                />
                            )
                        ))}
                        <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent pb-0 pt-10 px-4">
                        <div className="max-w-3xl mx-auto w-full">
                           <ChatBoxInput 
                               query={query} 
                               setQuery={setQuery} 
                               onSearch={() => onSearch()} 
                               selectedMode={selectedMode}
                               setSelectedMode={setSelectedMode}
                               models={MODELS}
                               selectedModel={selectedModel}
                               setSelectedModel={setSelectedModel}
                               isChatView={true}
                           />
                        </div>
                    </div>
                  </>
                )}
              </div>
           )}
           
           {view === 'discover' && <Discover onBack={() => navigate('/')} />}
           {view === 'library' && <Library onSelectThread={(id) => { setActiveConversationId(id); getConversationMessages(id).then(msgs => { setMessages(msgs); setHasSearched(true); navigate('/'); }); }} />}
           
           {view === 'profile' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                 <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-8 border border-border shadow-sm">
                    <h1 className="text-xl font-bold text-[#1c7483]">P</h1>
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
  );
}
