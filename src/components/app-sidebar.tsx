"use client"
import { useLocation, Link } from 'react-router-dom'
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
import { Search, User, Newspaper, History } from 'lucide-react'
import { useUser, useClerk } from '@clerk/clerk-react'

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
const { isSignedIn } = useUser();
const { openSignUp } = useClerk();

const menuOptions = [...BaseMenuOptions];

return (
<Sidebar className='bg-[#eff0eb] dark:bg-accent border-r-0'>
<SidebarHeader className="py-6 bg-[#eff0eb] dark:bg-accent flex items-center justify-center">
  <img 
    src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg"
    alt="New Sidebar Logo"
    className="h-10 w-auto"
    referrerPolicy="no-referrer"
  />
</SidebarHeader>
<SidebarContent className='bg-[#eff0eb] dark:bg-accent'>
<SidebarGroup>
<SidebarMenu>
{menuOptions.map((menu, index) => (
<SidebarMenuItem key={index}>
<SidebarMenuButton asChild size="lg" className={`p-5 py-6 hover:bg-transparent hover:font-bold ${path === menu.path ? 'font-bold' : ''}`}>
<Link to={menu.path}>
<menu.icon className='h-7 w-7' />
<span className='text-lg'>{menu.title}</span>
</Link>
</SidebarMenuButton>
</SidebarMenuItem>
))}
</SidebarMenu>
{!isSignedIn && (
  <Button 
    className='rounded-full text-white mx-4 mt-4' 
    style={{ backgroundColor: '#1c7483' }}
    onClick={() => openSignUp()}
  >
    Sign Up
  </Button>
)}
            </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className='bg-[#eff0eb] dark:bg-accent'>
  {isSignedIn ? (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg" className={`p-5 py-6 hover:bg-transparent hover:font-bold ${path === '/profile' ? 'font-bold' : ''}`}>
          <Link to="/profile">
            <User className='h-7 w-7' />
            <span className='text-lg'>Profile</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  ) : (
    <div className='p-3'>
      <h2 className='text-gray-500'>Try now</h2>
      <p className='text-gray-400'>Upgrade for image upload, smarter AI, and more Deep Research</p>
      <Button className='rounded-full text-white mt-2' style={{ backgroundColor: '#1c7483' }}>Learn More</Button>
    </div>
  )}
</SidebarFooter>
    </Sidebar>
)
}
export default AppSidebar

