
import React from 'react';
import { Video, FileText, Globe } from 'lucide-react';
import { RedditIcon, XIcon, TelescopeIcon } from './Icons';
import { SearchMode } from '../types';

interface SearchModesProps {
  activeMode: string | null;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const modes: SearchMode[] = [
  { id: 'web', label: 'All', icon: Globe },
  { id: 'research', label: 'Academic', icon: FileText, isDeep: true },
  { id: 'x', label: 'Social', icon: XIcon },
  { id: 'videos', label: 'Video', icon: Video },
];

export const SearchModes: React.FC<SearchModesProps> = ({ activeMode, onSelect, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-3 w-48 bg-[#1E1E1E] border border-border rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
       <div className="px-3 py-2 text-xs font-medium text-muted border-b border-border/50 mb-1">
          Focus
       </div>
       <div className="flex flex-col gap-0.5">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                onSelect(mode.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left rounded-lg transition-colors
                ${activeMode === mode.id ? 'bg-[#2A2A2A] text-white' : 'text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-white'}
              `}
            >
              <mode.icon className="w-4 h-4" />
              <span>{mode.label}</span>
            </button>
          ))}
       </div>
    </div>
  );
};
