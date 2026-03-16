import React from 'react';
import { 
  Globe, 
  MessageSquare, 
  GraduationCap, 
  Search, 
  Database,
  ChevronDown,
  Check,
  ScanSearch
} from 'lucide-react';
import { SearchModeType } from '../../types';

interface ModeSelectorProps {
  selectedMode: SearchModeType;
  onSelect: (mode: SearchModeType) => void;
  isOpen: boolean;
  onToggle: () => void;
  trigger?: React.ReactNode;
}

const MODES: { id: SearchModeType; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'web', label: 'Web', icon: Globe, description: 'Exa + Tavily' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, description: 'No Search' },
  { id: 'academic', label: 'Academic', icon: GraduationCap, description: 'Exa + Firecrawl' },
  { id: 'extreme', label: 'Deep Research', icon: Search, description: 'Valyu' },
  { id: 'scraping', label: 'Scraping', icon: ScanSearch, description: 'Firecrawl' },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onSelect, isOpen, onToggle, trigger }) => {
  return (
    <div className="relative">
      {trigger ? (
        <div onClick={onToggle}>{trigger}</div>
      ) : (
        <button 
            onClick={onToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isOpen ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-black' : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            <span className="text-sm font-medium text-foreground">
                {MODES.find(m => m.id === selectedMode)?.label || 'Web'}
            </span>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#202020] border border-gray-200 dark:border-black rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-1 space-y-0.5">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => { onSelect(mode.id); onToggle(); }}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${isSelected ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                  >
                    <div className={`mt-0.5 p-1.5 rounded-md ${isSelected ? 'bg-white dark:bg-black shadow-sm text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${isSelected ? 'text-[#1c7483]' : 'text-foreground'}`}>
                          {mode.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1c7483]" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{mode.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};