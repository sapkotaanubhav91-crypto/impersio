import React, { useState } from 'react';
import { Layers, Plus } from 'lucide-react';
import { SearchResult } from '../../types';

interface SourceCardProps {
  sources: SearchResult[];
}

export const SourceCard: React.FC<SourceCardProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displaySources = isExpanded ? sources : sources.slice(0, 4);
  const remainingCount = sources.length - 4;
  
  return (
    <div className="w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-gray-500" />
          <span className="text-lg font-medium text-primary font-sans">Sources</span>
      </div>

      <div className="flex flex-wrap gap-2">
          {displaySources.map((source, idx) => (
              <a 
                key={idx} 
                href={source.link} 
                target="_blank" 
                rel="noreferrer" 
                className="flex flex-col justify-between w-[160px] h-[72px] p-2.5 bg-[#F4F4F4] dark:bg-[#2F2F2F] hover:bg-[#EAEAEA] dark:hover:bg-[#3A3A3A] rounded-xl transition-colors group text-decoration-none"
              >
                  <div className="flex items-center gap-1.5 w-full">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${new URL(source.link).hostname}&sz=32`} 
                        className="w-3.5 h-3.5 rounded-sm bg-white" 
                        alt="" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'; }}
                      />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{new URL(source.link).hostname.replace('www.', '')}</span>
                  </div>
                  <h4 className="text-xs font-medium text-primary line-clamp-2 leading-snug">{source.title}</h4>
              </a>
          ))}
          
          {!isExpanded && remainingCount > 0 && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="flex flex-col items-center justify-center w-[72px] h-[72px] bg-[#F4F4F4] dark:bg-[#2F2F2F] hover:bg-[#EAEAEA] dark:hover:bg-[#3A3A3A] rounded-xl transition-colors text-gray-500 dark:text-gray-400"
              >
                  <div className="flex items-center gap-0.5 text-sm font-medium">
                      <Plus className="w-4 h-4" />
                      {remainingCount}
                  </div>
                  <span className="text-[10px] font-medium mt-0.5">View all</span>
              </button>
          )}
      </div>
    </div>
  );
};
