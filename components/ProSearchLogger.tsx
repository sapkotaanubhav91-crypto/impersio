
import React, { useState, useEffect } from 'react';
import { Check, Loader2, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { ProSearchStep } from '../types';

interface ProSearchLoggerProps {
  steps: ProSearchStep[];
  isOpen?: boolean;
}

export const ProSearchLogger: React.FC<ProSearchLoggerProps> = ({ steps }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const isComplete = steps.every(s => s.status === 'completed');

  if (!steps || steps.length === 0) return null;

  // Minimal collapsed view (Reference style)
  if (!isExpanded) {
     return (
       <div className="mb-6 animate-fade-in">
          <button 
             onClick={() => setIsExpanded(true)}
             className="flex items-center gap-2 text-sm text-scira-accent hover:text-scira-accent/80 transition-colors"
          >
             {isComplete ? (
                 <span className="font-medium">All steps completed</span>
             ) : (
                 <span className="font-medium">{completedCount} step{completedCount !== 1 ? 's' : ''} completed</span>
             )}
             <ChevronRight className="w-4 h-4" />
          </button>
       </div>
     );
  }

  // Expanded View
  return (
    <div className="w-full max-w-3xl bg-[#191919] border border-border/50 rounded-xl overflow-hidden mb-6 animate-fade-in font-sans">
      <div 
        className="flex items-center justify-between px-4 py-3 bg-[#202020] border-b border-border/50 cursor-pointer"
        onClick={() => setIsExpanded(false)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">Research Process</span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted" />
      </div>

      <div className="p-4 space-y-4">
           {steps.map((step) => (
             <div key={step.id} className="flex items-start gap-3">
                   <div className={`
                     w-5 h-5 rounded-full flex items-center justify-center shrink-0 border mt-0.5
                     ${step.status === 'completed' ? 'bg-scira-accent border-scira-accent text-white' : 
                       step.status === 'in-progress' ? 'bg-transparent border-scira-accent text-scira-accent' : 
                       'bg-transparent border-border text-muted'}
                   `}>
                      {step.status === 'completed' && <Check className="w-3 h-3" />}
                      {step.status === 'in-progress' && <Loader2 className="w-3 h-3 animate-spin" />}
                   </div>
                   <div className="flex-1">
                      <div className="text-sm font-medium text-primary">{step.title}</div>
                      {step.queries && step.queries.length > 0 && (
                          <div className="mt-1 text-xs text-muted flex flex-col gap-1">
                             {step.queries.map((q, i) => (
                                <div key={i} className="flex items-center gap-1.5 opacity-80">
                                   <Search className="w-3 h-3" /> {q}
                                </div>
                             ))}
                          </div>
                      )}
                   </div>
             </div>
           ))}
      </div>
    </div>
  );
};
