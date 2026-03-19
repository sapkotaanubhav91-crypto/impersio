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
import { Compass, GalleryHorizontalEnd, LogIn, Search } from 'lucide-react'
import ImpersioLogo from './ImpersioLogo'

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

function AppSidebar() {
const location = useLocation();
const path = location.pathname;

return (
<Sidebar className='bg-accent'>
<SidebarHeader className="py-6 bg-accent">
<ImpersioLogo />
</SidebarHeader>
<SidebarContent className='bg-accent'>
<SidebarGroup>
<SidebarMenu>
{MenuOptions.map((menu, index) => (
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
<Button className='rounded-full text-white mx-4 mt-4' style={{ backgroundColor: '#1c7483' }}>Sign Up</Button>
            </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className='bg-accent'>
            <div className='p-3'>
                <h2 className='text-gray-500'>Try now</h2>
                <p className='text-gray-400'>Upgrade for image upload, smarter AI, and more Deep Research</p>
                <Button className='rounded-full text-white' style={{ backgroundColor: '#1c7483' }}>Learn More</Button>
            </div>
        </SidebarFooter>
    </Sidebar>
)
}
export default AppSidebar

