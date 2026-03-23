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
import { Compass, GalleryHorizontalEnd, Search, User } from 'lucide-react'
import ImpersioLogo from './ImpersioLogo'
import { useUser, useClerk } from '@clerk/clerk-react'

const BaseMenuOptions = [
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

function AppSidebar() {
const location = useLocation();
const path = location.pathname;
const { isSignedIn } = useUser();
const { openSignUp } = useClerk();

const menuOptions = [...BaseMenuOptions];

if (isSignedIn) {
  menuOptions.push({
    title: 'Profile',
    icon: User,
    path: '/profile'
  });
}

return (
<Sidebar className='bg-[#eff0eb] dark:bg-accent border-r-0'>
<SidebarHeader className="py-6 bg-[#eff0eb] dark:bg-accent flex items-center justify-center">
  <ImpersioLogo variant="full" className="h-10 w-auto" />
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
        {!isSignedIn && (
          <SidebarFooter className='bg-[#eff0eb] dark:bg-accent'>
              <div className='p-3'>
                  <h2 className='text-gray-500'>Try now</h2>
                  <p className='text-gray-400'>Upgrade for image upload, smarter AI, and more Deep Research</p>
                  <Button className='rounded-full text-white mt-2' style={{ backgroundColor: '#1c7483' }}>Learn More</Button>
              </div>
          </SidebarFooter>
        )}
    </Sidebar>
)
}
export default AppSidebar

