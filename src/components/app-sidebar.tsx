"use client"
import { useLocation, Link } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { Search, Newspaper, History, Plus, Bell, CircleUser, ArrowUp } from 'lucide-react'

const BaseMenuOptions = [
  {
    title: 'Home',
    icon: Search,
    path: '/'
  },
  {
    title: 'Discover',
    icon: Newspaper,
    path: '/discover'
  },
  {
    title: 'Library',
    icon: History,
    path: '/library'
  }
]

function AppSidebar() {
  const location = useLocation();
  const path = location.pathname;
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className='bg-[#f4f4f4] border-r-0 w-24 flex flex-col items-center py-4'>
      <SidebarHeader className="bg-transparent flex items-center justify-center mb-4">
        <img 
          src="https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/logos/perplexity-kcjtmnt09fjb1qgfxcdbd.png/perplexity-e6a4e1t06hd6dhczot580o.png?_a=DATAiZAAZAA0"
          alt="Perplexity Logo"
          className="h-10 w-10"
          referrerPolicy="no-referrer"
        />
      </SidebarHeader>
      <SidebarContent className='bg-transparent flex flex-col items-center w-full'>
        <SidebarGroup className="flex flex-col items-center w-full">
          <SidebarMenu className="flex flex-col items-center w-full">
            <SidebarMenuItem className="mb-4">
              <SidebarMenuButton size="lg" onClick={() => setOpenMobile(false)} className="flex flex-col items-center justify-center p-2 hover:bg-gray-200 rounded-lg h-auto">
                <Plus className='h-7 w-7' />
                <span className='text-xs mt-1'>New</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {BaseMenuOptions.map((menu, index) => (
              <SidebarMenuItem key={index} className="mb-2 w-full flex justify-center">
                <SidebarMenuButton asChild size="lg" className={`flex flex-col items-center justify-center p-2 hover:bg-gray-200 rounded-lg h-auto ${path === menu.path ? 'bg-gray-200 font-bold' : ''}`}>
                  <Link to={menu.path} onClick={() => setOpenMobile(false)} className="flex flex-col items-center gap-1">
                    <menu.icon className='h-7 w-7' />
                    <span className='text-xs'>{menu.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='bg-transparent flex flex-col items-center w-full mt-auto'>
        <SidebarMenu className="flex flex-col items-center w-full">
          <SidebarMenuItem className="mb-2">
            <SidebarMenuButton size="lg" onClick={() => setOpenMobile(false)} className="flex flex-col items-center justify-center p-2 hover:bg-gray-200 rounded-lg h-auto">
              <Bell className='h-7 w-7' />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mb-2">
            <SidebarMenuButton size="lg" onClick={() => setOpenMobile(false)} className="flex flex-col items-center justify-center p-2 hover:bg-gray-200 rounded-lg h-auto">
              <CircleUser className='h-7 w-7' />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mb-2">
            <SidebarMenuButton size="lg" onClick={() => setOpenMobile(false)} className="flex flex-col items-center justify-center p-2 hover:bg-gray-200 rounded-lg h-auto">
              <ArrowUp className='h-7 w-7' />
              <span className='text-xs mt-1'>Upgrade</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
export default AppSidebar

