
import React from 'react';
import { 
  Search,
  Compass,
  Library,
  Plus,
  PanelLeftClose,
  MoreHorizontal
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  useSidebar
} from './ui/sidebar';
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
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar transition-all duration-300">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden px-2">
             <ImpersioLogo className="w-8 h-8 text-primary" />
             <span className="text-xl font-medium tracking-tight text-primary">impersio</span>
          </div>
          {/* Mobile/Collapsed Logo */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
             <ImpersioLogo className="w-8 h-8 text-primary" />
          </div>

          <button 
            onClick={toggleSidebar}
            className="p-1.5 text-muted hover:text-primary hover:bg-surface-hover rounded-md transition-colors group-data-[collapsible=icon]:hidden"
          >
             <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 flex flex-col gap-4">
        {/* New Thread Button */}
        <div className="px-1">
          <button 
            onClick={onNewChat}
            className={`
              w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-full border border-border bg-white dark:bg-[#1C1C1C] hover:bg-surface-hover shadow-sm transition-all group
              group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded-full
            `}
            title="New Thread"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted group-hover:text-primary group-data-[collapsible=icon]:hidden">New Thread</span>
              <Plus className="w-4 h-4 text-muted group-hover:text-primary group-data-[collapsible=icon]:block hidden" />
            </div>
            <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
               <div className="w-5 h-5 flex items-center justify-center rounded-md border border-border/50 bg-surface/50">
                  <span className="text-[10px] text-muted">K</span>
               </div>
            </div>
            {/* Expanded State Plus Icon for Desktop */}
             <Plus className="w-4 h-4 text-muted group-hover:text-primary group-data-[collapsible=icon]:hidden" />
          </button>
        </div>

        {/* Primary Menu */}
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={currentView === 'home'} 
              onClick={() => onNavigate('home')}
              tooltip="Home"
              className="px-3 py-2.5 h-auto rounded-lg hover:bg-surface-hover group transition-colors"
            >
              <Search className={`w-5 h-5 ${currentView === 'home' ? 'text-primary' : 'text-muted group-hover:text-primary'}`} />
              <span className={`text-[15px] font-medium ${currentView === 'home' ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={currentView === 'discover'} 
              onClick={() => onNavigate('discover')}
              tooltip="Discover"
              className="px-3 py-2.5 h-auto rounded-lg hover:bg-surface-hover group transition-colors"
            >
              <Compass className={`w-5 h-5 ${currentView === 'discover' ? 'text-primary' : 'text-muted group-hover:text-primary'}`} />
              <span className={`text-[15px] font-medium ${currentView === 'discover' ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>Discover</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={currentView === 'library'} 
              onClick={() => onNavigate('library')}
              tooltip="Library"
              className="px-3 py-2.5 h-auto rounded-lg hover:bg-surface-hover group transition-colors"
            >
              <Library className={`w-5 h-5 ${currentView === 'library' ? 'text-primary' : 'text-muted group-hover:text-primary'}`} />
              <span className={`text-[15px] font-medium ${currentView === 'library' ? 'text-primary' : 'text-muted group-hover:text-primary'}`}>Library</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        {user ? (
           <button 
             className="w-full flex items-center gap-2 p-2 hover:bg-surface-hover rounded-lg transition-colors group group-data-[collapsible=icon]:justify-center"
             onClick={onSignIn} // Open profile/settings
           >
              <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-xs font-medium text-primary border border-border">
                  {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0 group-data-[collapsible=icon]:hidden">
                 <div className="text-sm font-medium text-primary truncate">{user.full_name || 'User'}</div>
              </div>
           </button>
        ) : (
          <button 
            onClick={onSignIn}
            className="w-full flex items-center gap-2 p-2 hover:bg-surface-hover rounded-lg transition-colors group group-data-[collapsible=icon]:justify-center"
          >
             <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-muted">
                 <MoreHorizontal className="w-4 h-4" />
             </div>
             <span className="text-sm font-medium text-muted group-hover:text-primary group-data-[collapsible=icon]:hidden">Sign Up</span>
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
