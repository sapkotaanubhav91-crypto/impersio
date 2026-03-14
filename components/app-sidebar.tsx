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
import { Compass, GalleryHorizontalEnd, LogIn, Search } from 'lucide-react'

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
        title: 'Sign In',
        icon: LogIn,
        path: '/sign-in'
    }
]

export function AppSidebar() {
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
            <SidebarHeader className="py-6">
                <h1 className="text-2xl font-bold px-4">perplexity</h1>
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
                    </SidebarMenu>

                    <Button className='rounded-full text-white mx-4 mt-4 bg-[#1c7483]'>Sign Up</Button>
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
