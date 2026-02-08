
import React, { useEffect, useState } from 'react';
import { X, LogOut, Plus, LogIn, Info, Sun, Moon, Monitor } from 'lucide-react';
// Fix: Import SavedConversation from types instead of services/chatStorageService
import { getUserConversations } from '../services/chatStorageService';
import { SavedConversation } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (id: string, title: string) => void;
  onNewChat: () => void;
  userId: string;
  onSignIn: () => void;
  onOpenAbout: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  isOpen, 
  onClose, 
  onSelectChat,
  onNewChat, 
  userId,
  onSignIn,
  onOpenAbout,
  theme,
  onToggleTheme
}) => {
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    // userId is not strictly needed for local mode as everything is shared, but keeping signature
    const data = await getUserConversations(userId || 'guest');
    setConversations(data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    // Clear local user data
    localStorage.removeItem('impersio_local_user');
    window.location.reload();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-border z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-primary">Menu</h2>
          <button 
            onClick={onClose}
            className="p-1 text-muted hover:text-primary rounded-lg hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-scira-accent text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {!userId ? (
             <div className="p-4 flex flex-col items-center justify-center text-center mt-6 mb-6">
                <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-4">
                   <LogIn className="w-6 h-6 text-muted" />
                </div>
                <h3 className="font-medium text-primary mb-2">Personalize</h3>
                <p className="text-sm text-muted mb-4">Set your name to personalize the experience.</p>
                <button 
                  onClick={() => { onClose(); onSignIn(); }}
                  className="px-4 py-2 bg-surface hover:bg-border border border-border rounded-lg text-sm font-medium transition-all"
                >
                  Set Profile
                </button>
             </div>
          ) : (
             <>
                <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wider">History (Local)</div>
                {loading ? (
                  <div className="flex flex-col gap-2 p-2">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-surface animate-pulse rounded-lg" />)}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center text-muted text-sm py-4">
                    No history yet.
                  </div>
                ) : (
                  <div className="space-y-1 mb-6">
                    {conversations.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          onSelectChat(chat.id, chat.title);
                          onClose();
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-surface transition-colors group relative"
                      >
                        <div className="font-medium text-sm text-primary truncate pr-4">{chat.title}</div>
                        <div className="text-xs text-muted mt-1">
                          {new Date(chat.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
             </>
          )}
        </div>

        <div className="p-2 border-t border-border space-y-1">
           <button 
             onClick={onToggleTheme}
             className="w-full flex items-center gap-3 p-3 text-sm text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface"
           >
             {theme === 'light' && <Sun className="w-4 h-4" />}
             {theme === 'dark' && <Moon className="w-4 h-4" />}
             {theme === 'system' && <Monitor className="w-4 h-4" />}
             <span className="capitalize">{theme} Theme</span>
           </button>

          <button 
             onClick={() => { onClose(); onOpenAbout(); }}
             className="w-full flex items-center gap-3 p-3 text-sm text-muted hover:text-primary transition-colors rounded-lg hover:bg-surface"
           >
             <Info className="w-4 h-4" />
             About Impersio
           </button>

          {userId && (
             <button 
               onClick={handleSignOut}
               className="w-full flex items-center gap-3 p-3 text-sm text-muted hover:text-red-500 transition-colors rounded-lg hover:bg-surface"
             >
               <LogOut className="w-4 h-4" />
               Reset Profile
             </button>
          )}
        </div>
      </div>
    </>
  );
};
