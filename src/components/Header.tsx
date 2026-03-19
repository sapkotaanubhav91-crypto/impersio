import { UserButton } from '@clerk/clerk-react'
import { Clock, Link, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import moment from 'moment'

export const Header = ({ searchInputRecord }: any) => {
    return (
        <div className='px-4 py-2 border-b flex justify-between items-center h-14 bg-background'>
            <div className='flex gap-3 items-center'>
                <UserButton />
                <div className='flex gap-1.5 items-center'>
                    <Clock className='h-4 w-4 text-gray-500'/>
                    <h2 className='text-gray-500 text-sm'> { moment(searchInputRecord?.created_at).fromNow() } </h2>
                </div>
            </div>
    
            <h2 className='line-clamp-1 max-w-md text-sm font-medium'>{searchInputRecord?.searchInput}</h2>

            <div className='flex gap-2 items-center'>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"><Link className="h-4 w-4" /></Button>
                <Button size="sm" className="h-8"><Send className="h-4 w-4 mr-2" /> Share </Button>  
            </div>
        </div>
    )
}

export default Header

