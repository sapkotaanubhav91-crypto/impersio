import React, { useState } from 'react';
import { Share2, RotateCcw, Copy, Check, Loader2, Search, Globe, CircleDashed, ArrowRight, AlignLeft } from 'lucide-react';
import { Message } from '../../types';
import { Thinking } from '../Thinking';
import { MessageContent } from '../MessageContent';
import { ImpersioLogo } from '../Icons';

import { SourceCard } from './SourceCard';

interface MessageItemProps {
  msg: Message;
  isLast: boolean;
  isLoading: boolean;
  onShare: () => void;
  onRewrite: (query: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ msg, isLast, isLoading, onShare, onRewrite }) => {
  if (msg.role === 'user') {
    return (
      <div className="w-full max-w-3xl mx-auto pt-10 pb-6 px-4 animate-fade-in">
          <h1 className="text-[32px] font-medium text-foreground tracking-tight leading-tight font-sans">
            {msg.content}
          </h1>
       </div>
    );
  }

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-12 px-4 animate-fade-in font-sans">
      <div className="flex flex-col gap-6">
        
        {/* Copilot Events - HIDDEN as per request */}
        {/* {msg.copilotEvents && ... } */}

        {/* Sources Section (Above Answer) */}
        {msg.sources && msg.sources.length > 0 && (
          <SourceCard sources={msg.sources} />
        )}

        {/* Answer Section */}
        <div className="min-h-[20px] animate-in fade-in slide-in-from-bottom-3 duration-700">
          
          {/* Reasoning / Thinking Block */}
          {msg.reasoning && (
             <Thinking content={msg.reasoning} isComplete={!isLoading || !isLast || !!msg.content} />
          )}

          {isLoading && isLast && !msg.content && !msg.reasoning ? (
             <div className="w-full space-y-2 py-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
             </div>
          ) : (
            <div className="w-full">
              <MessageContent content={msg.content} isStreaming={isLast && isLoading} sources={msg.sources} />
              
              {!isLoading && msg.content && (
                <div className="mt-6 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <button onClick={onShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border/50 text-muted hover:text-primary transition-colors text-xs font-medium">
                         <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                      <button onClick={() => onRewrite(msg.content)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border/50 text-muted hover:text-primary transition-colors text-xs font-medium">
                         <RotateCcw className="w-3.5 h-3.5" /> Rewrite
                      </button>
                      <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border/50 text-muted hover:text-primary transition-colors text-xs font-medium">
                         {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                         {copied ? 'Copied' : 'Copy'}
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Section */}
        {msg.relatedQuestions && msg.relatedQuestions.length > 0 && !isLoading && (
           <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 pt-4 border-t border-border/50">
               <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <CircleDashed className="w-4 h-4" /> Related
                  </span>
               </div>
              <div className="flex flex-col gap-2">
                 {msg.relatedQuestions.map((q, i) => (
                    <button 
                      key={i}
                      onClick={() => onRewrite(q)}
                      className="w-full text-left py-2.5 px-4 rounded-lg bg-surface border border-border/50 hover:bg-surface-hover text-sm font-medium text-[#1c7483] transition-all flex items-center justify-between group"
                    >
                       <span>{q}</span>
                       <ArrowRight className="w-4 h-4 text-muted opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                    </button>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
