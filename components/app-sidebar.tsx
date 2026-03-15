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
import { Compass, GalleryHorizontalEnd, Search, Command } from 'lucide-react'

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
    }
]

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
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#f3f3f1] dark:bg-[#2A2A2A] hover:bg-[#e5e5e5] dark:hover:bg-[#333] rounded-full transition-colors text-sm font-medium text-primary border border-transparent dark:border-white/5"
                    >
                        <span>New Thread</span>
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#e5e5e5] dark:bg-[#3A3A3A] rounded-md text-[10px] font-medium text-muted">
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
                                <SidebarMenuButton asChild size="lg" className={`p-5 py-6 hover:bg-transparent hover:font-bold ${path === menu.path ? 'font-bold' : ''}`}>
                                    <a href={menu.path}>
                                        <menu.icon className='h-7 w-7' />
                                        <span className='text-lg'>{menu.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                        <SidebarMenuItem className="mt-2 px-4">
                            <Button className='w-full rounded-full text-white bg-[#1c7483] hover:bg-[#1c7483]/90 py-5 text-base'>Sign Up</Button>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <div className='p-3'>
                    <h2 className='text-gray-500'> Try now </h2>
                    <p className='text-gray-400'> Upgrade for image upload , smarter ai, and more Deepresearch</p>
                    <Button className='rounded-full text-white bg-[#1c7483]'>Learn More</Button>
                </div>
                </SidebarFooter>
        </Sidebar>
    )
}
