"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { Compass, GalleryHorizontalEnd, Search, Command, Globe } from 'lucide-react'

const MenuOptions = [
    {
        title: 'Home',
        icon: Search,
        path: '/'
    },
    {
        title: 'Discover',
        icon: Compass,
        path: '/discover'
    },
    {
        title: 'Library',
        icon: GalleryHorizontalEnd,
        path: '/library'
    },
    {
        title: 'Domains',
        icon: Globe,
        path: '/domains'
    }
]

const HAS_CLERK_KEY = !!(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZnVubnktbW9ua2V5LTU5LmNsZXJrLmFjY291bnRzLmRldiQ');

export function AppSidebar({ onNewChat }: { onNewChat?: () => void }) {
    const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

    useEffect(() => {
        const handleLocationChange = () => {
            setPath(window.location.pathname);
        };
        window.addEventListener('popstate', handleLocationChange);
        return () => window.removeEventListener('popstate', handleLocationChange);
    }, []);
    return (
        <Sidebar>
            <SidebarHeader className="py-6 pb-2">
                <h1 className="text-2xl font-bold px-4 mb-4">perplexity</h1>
                <div className="px-4">
                    <button 
                        onClick={() => onNewChat ? onNewChat() : window.location.href = '/'}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors text-sm font-medium text-foreground border border-transparent dark:border-black"
                    >
                        <span>New Thread</span>
                        <div className="flex items-center gap-1 px-2 py-1 bg-black/5 dark:bg-white/10 rounded-md text-[10px] font-medium text-muted">
                            <Command className="w-3 h-3" />
                            <span>K</span>
                        </div>
                    </button>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {MenuOptions.map((menu, index) => (
                            <SidebarMenuItem key={index}>
                                <SidebarMenuButton 
                                    asChild 
                                    size="lg" 
                                    className={`p-5 py-6 hover:bg-transparent hover:font-bold ${path === menu.path ? 'font-bold bg-surface-hover' : ''}`}
                                >
                                    <button onClick={(e) => {
                                        e.preventDefault();
                                        window.history.pushState({}, '', menu.path);
                                        window.dispatchEvent(new PopStateEvent('popstate'));
                                    }}>
                                        <menu.icon className='h-7 w-7' />
                                        <span className='text-lg'>{menu.title}</span>
                                    </button>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                        {HAS_CLERK_KEY ? (
                            <SignedOut>
                                <SidebarMenuItem className="mt-2 px-4">
                                    <SignInButton mode="modal">
                                        <Button className='w-full rounded-full text-white bg-foreground hover:bg-foreground/90 py-5 text-base'>Sign In</Button>
                                    </SignInButton>
                                </SidebarMenuItem>
                            </SignedOut>
                        ) : (
                            <SidebarMenuItem className="mt-2 px-4">
                                <Button 
                                    onClick={() => alert("Clerk is not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to your environment variables.")}
                                    className='w-full rounded-full text-white bg-foreground hover:bg-foreground/90 py-5 text-base'
                                >
                                    Sign In (Setup Required)
                                </Button>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SignedOut>
                    <div className='p-3'>
                        <h2 className='text-gray-500'> Try now </h2>
                        <p className='text-gray-400'> Upgrade for image upload , smarter ai, and more Deepresearch</p>
                        <Button className='rounded-full text-white bg-foreground hover:bg-foreground/90'>Learn More</Button>
                    </div>
                </SignedOut>
                <SignedIn>
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3">
                            <UserButton afterSignOutUrl="/" />
                            <span className="text-sm font-medium">Profile</span>
                        </div>
                    </div>
                </SignedIn>
            </SidebarFooter>
        </Sidebar>
    )
}
