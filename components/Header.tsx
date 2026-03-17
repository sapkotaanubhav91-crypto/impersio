import React from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { Clock, Link as LinkIcon, Send, User as UserIcon } from 'lucide-react';
import moment from 'moment';
import { Button } from './ui/button';
import { authService } from '../services/authService';

interface SearchInputRecord {
  created_at?: string | Date;
  searchInput?: string;
}

interface HeaderProps {
  searchInputRecord?: SearchInputRecord;
}

function Header({ searchInputRecord }: HeaderProps) {
  const { user: clerkUser } = useUser();
  const customUser = authService.getCurrentUser();

  return (
    <div className="p-4 border-b flex justify-between items-center bg-background w-full">
      <div className="flex gap-2 items-center">
        {clerkUser ? (
          <UserButton />
        ) : customUser ? (
          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
            <UserIcon className="w-4 h-4 text-muted" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
            <UserIcon className="w-4 h-4 text-muted" />
          </div>
        )}
        <div className="flex gap-1 items-center">
          <Clock className="h-5 w-5 text-gray-500" />
          <h2 className="text-gray-500 text-sm">
            {searchInputRecord?.created_at ? moment(searchInputRecord.created_at).fromNow() : 'Just now'}
          </h2>
        </div>
      </div>

      <div className="flex gap-3 items-center mt-2">
        <Button variant="outline" size="sm">
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button size="sm" className="gap-2">
          <Send className="h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
}

export default Header;
