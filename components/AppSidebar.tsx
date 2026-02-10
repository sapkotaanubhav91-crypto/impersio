import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus,
  Clock,
  LayoutGrid,
  MoreHorizontal,
  ArrowUpCircle,
  Bell,
  Newspaper,
  User as UserIcon,
  Trophy,
  Plane,
  GraduationCap,
  Scale,
  Settings,
  TrendingUp
} from 'lucide-react';
import { ImpersioLogo } from './Icons';
import { User } from '../types';

interface AppSidebarProps {
  currentView: 'home' | 'discover' | 'library' | 'profile' | 'sports';
  onNavigate: (view: 'home' | 'discover' | 'library' | 'profile' | 'sports') => void;
  onNewChat: () => void;
  onSignIn: () => void;
  user: User | null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ 
  currentView,
  onNavigate,
  onNewChat,
  onSignIn,
  user
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-[72px] flex-none h-full flex flex-col items-center bg-[#fcfcf9] dark:bg-[#191919] border-r border-[#e5e5e5] dark:border-[#333] py-6 z-50 font-sans transition-all duration-300">
      {/* Logo */}
      <div className="mb-8 cursor-pointer" onClick={() => onNavigate('home')}>
         <ImpersioLogo className="w-8 h-8 text-[#1c7483]" />
      </div>

      {/* New Thread Button */}
      <div className="mb-6">
        <button 
          onClick={onNewChat}
          className="w-10 h-10 rounded-full bg-[#f3f3ee] hover:bg-[#e8e8e6] dark:bg-[#2A2A2A] dark:hover:bg-[#333] flex items-center justify-center transition-colors group shadow-sm hover:shadow-md"
          title="New Thread"
        >
          <Plus className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-4 w-full items-center">
        
        <button 
          onClick={() => onNavigate('home')}
          className="group flex flex-col items-center gap-1 w-full px-1"
        >
          <div className={`p-1.5 rounded-lg transition-colors ${currentView === 'home' ? 'bg-[#e8e8e6] dark:bg-[#333] text-primary' : 'text-muted group-hover:text-primary group-hover:bg-[#f3f3ee] dark:group-hover:bg-[#2A2A2A]'}`}>
             <Clock className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-medium ${currentView === 'home' ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>History</span>
        </button>

        <button 
          onClick={() => onNavigate('discover')}
          className="group flex flex-col items-center gap-1 w-full px-1"
        >
          <div className={`p-1.5 rounded-lg transition-colors ${currentView === 'discover' ? 'bg-[#e8e8e6] dark:bg-[#333] text-primary' : 'text-muted group-hover:text-primary group-hover:bg-[#f3f3ee] dark:group-hover:bg-[#2A2A2A]'}`}>
             <Newspaper className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-medium ${currentView === 'discover' ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>Discover</span>
        </button>

        <button 
          onClick={() => onNavigate('library')}
          className="group flex flex-col items-center gap-1 w-full px-1"
        >
          <div className={`p-1.5 rounded-lg transition-colors ${currentView === 'library' ? 'bg-[#e8e8e6] dark:bg-[#333] text-primary' : 'text-muted group-hover:text-primary group-hover:bg-[#f3f3ee] dark:group-hover:bg-[#2A2A2A]'}`}>
             <LayoutGrid className="w-5 h-5" />
          </div>
          <span className={`text-[10px] font-medium ${currentView === 'library' ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>Spaces</span>
        </button>

        {/* MORE BUTTON WITH POPUP */}
        <div className="relative group w-full px-1 flex flex-col items-center" ref={moreRef}>
            <button 
               onClick={() => setIsMoreOpen(!isMoreOpen)}
               className="flex flex-col items-center gap-1 w-full"
            >
              <div className={`p-1.5 rounded-lg transition-colors ${isMoreOpen || currentView === 'sports' ? 'bg-[#e8e8e6] dark:bg-[#333] text-primary' : 'text-muted hover:text-primary hover:bg-[#f3f3ee] dark:hover:bg-[#2A2A2A]'}`}>
                 <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium ${isMoreOpen || currentView === 'sports' ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>More</span>
            </button>
            
            {isMoreOpen && (
                <div className="absolute left-full ml-3 bottom-0 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="flex flex-col">
                        <MenuItem icon={TrendingUp} label="Finance" onClick={() => setIsMoreOpen(false)} />
                        <MenuItem icon={Plane} label="Travel" onClick={() => setIsMoreOpen(false)} />
                        <MenuItem icon={GraduationCap} label="Academic" onClick={() => setIsMoreOpen(false)} />
                        
                        <button 
                            onClick={() => {
                                onNavigate('sports');
                                setIsMoreOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-hover transition-colors ${currentView === 'sports' ? 'text-scira-accent bg-surface-hover' : 'text-primary'}`}
                        >
                            <Trophy className="w-4 h-4" />
                            <span className="text-sm font-medium">Sports</span>
                        </button>
                        
                        <MenuItem icon={Scale} label="Patents" onClick={() => setIsMoreOpen(false)} />
                        
                        <div className="h-px bg-border my-1" />
                        
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-muted hover:text-primary hover:bg-surface-hover transition-colors">
                            <span className="text-xs font-medium ml-7">Customize Sidebar</span>
                            <ArrowUpCircle className="w-3 h-3 rotate-90 opacity-50" />
                        </button>
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-4 mb-2 w-full">
         <button className="text-muted hover:text-primary transition-colors p-2" title="Upgrade">
             <ArrowUpCircle className="w-5 h-5" />
         </button>
         
         <div className="relative">
            <button className="text-muted hover:text-primary transition-colors p-2">
                <Bell className="w-5 h-5" />
            </button>
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#1c7483] rounded-full border border-background"></div>
         </div>

         <button 
            onClick={onSignIn}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-border transition-all"
         >
            {user ? (
                <span className="text-[10px] font-bold text-primary">{user.email?.[0].toUpperCase()}</span>
            ) : (
                <UserIcon className="w-4 h-4 text-muted" />
            )}
         </button>
      </div>
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-primary hover:bg-surface-hover transition-colors"
    >
        <Icon className="w-4 h-4 text-muted" />
        <span className="text-sm font-medium">{label}</span>
    </button>
);
