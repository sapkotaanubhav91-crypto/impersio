
import React from 'react';
import { 
  Plus,
  Clock,
  LayoutGrid,
  MoreHorizontal,
  ArrowUpCircle,
  Bell,
  Newspaper,
  User as UserIcon
} from 'lucide-react';
import { ImpersioLogo } from './Icons';
import { User } from '../types';

interface AppSidebarProps {
  currentView: 'home' | 'discover' | 'library' | 'profile';
  onNavigate: (view: 'home' | 'discover' | 'library' | 'profile') => void;
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

        <button 
           className="group flex flex-col items-center gap-1 w-full px-1"
        >
          <div className="p-1.5 rounded-lg transition-colors text-muted group-hover:text-primary group-hover:bg-[#f3f3ee] dark:group-hover:bg-[#2A2A2A]">
             <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-muted group-hover:text-primary">More</span>
        </button>

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
