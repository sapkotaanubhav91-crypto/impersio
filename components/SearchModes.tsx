import React from 'react';
import { Video, FileText, CheckCircle, Zap, Image, Globe, Presentation } from 'lucide-react';
import { XIcon, RedditIcon } from './Icons';
import { SearchMode } from '../types';

interface SearchModesProps {
  activeMode: string | null;
  onSelect: (id: string) => void;
}

const modes: SearchMode[] = [
  { id: 'fast', label: 'Fast RAG', icon: Zap },
  { id: 'web', label: 'Web', icon: Globe },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'slides', label: 'Slides', icon: Presentation },
  { id: 'x', label: 'X Search', icon: XIcon },
  { id: 'reddit', label: 'Reddit Search', icon: RedditIcon },
  { id: 'research', label: 'Research', icon: FileText, isDeep: true },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'factcheck', label: 'Fact Check', icon: CheckCircle },
];

export const SearchModes: React.FC<SearchModesProps> = ({ activeMode, onSelect }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 animate-fade-in mt-4">
      {modes.map((mode) => (
        mode.id !== 'web' && ( // Skip 'web' here as it's the default toggle/implied
        <button
          key={mode.id}
          onClick={() => onSelect(activeMode === mode.id ? 'web' : mode.id)}
          className={`
            flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 border hover:scale-105 active:scale-95
            ${activeMode === mode.id 
              ? 'bg-scira-accent/10 text-scira-accent border-scira-accent/20' 
              : 'bg-transparent text-muted hover:text-scira-accent border-transparent hover:bg-surface-hover hover:border-border'}
          `}
        >
          <mode.icon className="w-3.5 h-3.5" />
          <span>{mode.label}</span>
          {mode.isDeep && (
            <span className={`ml-1 px-1 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wider uppercase ${activeMode === mode.id ? 'bg-scira-accent text-background' : 'bg-deep-badge-bg text-deep-badge-text'}`}>
              DEEP
            </span>
          )}
        </button>
        )
      ))}
    </div>
  );
};