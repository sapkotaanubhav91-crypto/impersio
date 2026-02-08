
import React, { useState, useEffect } from 'react';
import { ChevronDown, BrainCircuit, Loader2 } from 'lucide-react';

interface ThinkingProps {
  content: string;
  isComplete: boolean;
}

export const Thinking: React.FC<ThinkingProps> = ({ content, isComplete }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isComplete) {
      const timer = setInterval(() => setDuration(d => d + 0.1), 100);
      return () => clearInterval(timer);
    } else {
        // Auto-collapse when done if it's very long, otherwise leave open or user preference
        // For now, let's keep it open if it was open, or collapse if the user hadn't interacted? 
        // Perplexity collapses by default after done usually, let's collapse it to keep UI clean.
        setIsOpen(false); 
    }
  }, [isComplete]);

  if (!content) return null;

  return (
    <div className="mb-6 w-full max-w-3xl animate-fade-in">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-2 select-none group"
      >
        {isComplete ? (
           <BrainCircuit className="w-4 h-4 text-emerald-500" />
        ) : (
           <Loader2 className="w-4 h-4 animate-spin text-scira-accent" />
        )}
        
        <span className="font-medium">
            {isComplete ? 'Reasoned' : 'Thinking'}
        </span>
        
        <span className="text-muted/50 text-xs">
            {duration.toFixed(1)}s
        </span>

        <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="pl-3 border-l-2 border-border/60 ml-1.5">
           <div className="text-sm text-muted/80 leading-relaxed whitespace-pre-wrap font-mono text-[13px] bg-surface/50 p-3 rounded-r-lg rounded-bl-lg">
             {content}
             {!isComplete && <span className="inline-block w-1.5 h-3 ml-1 bg-scira-accent animate-pulse align-middle" />}
           </div>
        </div>
      )}
    </div>
  );
};
