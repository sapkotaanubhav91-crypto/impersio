import React, { useState, useEffect, useRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SearchResult } from '../types';
import { ExternalLink, Copy, Check, X } from 'lucide-react';

interface MessageContentProps {
  content: string;
  isStreaming: boolean;
  sources?: SearchResult[];
}

interface CitationPillProps {
  source: SearchResult;
  label: string;
  index: number;
}

const CitationPill: React.FC<CitationPillProps> = ({ source, label, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(source.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get domain for the label
  let domain = "Source";
  try {
     const hostname = new URL(source.link).hostname.replace('www.', '');
     domain = hostname.split('.')[0];
     if (domain.length > 15) domain = domain.substring(0, 12) + '...';
  } catch(e) {}

  return (
    <span className="relative inline-block align-middle mx-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`select-none inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-all border border-transparent
        ${isOpen 
            ? 'bg-primary text-background' 
            : 'bg-[#2A2A2A] hover:bg-[#333] text-gray-400 hover:text-gray-200'
        }`}
        type="button"
        title={source.title}
      >
        <span className="text-[11px] font-medium truncate max-w-[100px]">{domain}</span>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 max-w-[90vw] bg-surface border border-border rounded-xl shadow-elegant p-4 z-50 animate-in fade-in zoom-in-95 duration-200 cursor-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
             {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-sidebar border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${new URL(source.link).hostname}&sz=32`}
                          className="w-4 h-4 opacity-90"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          alt=""
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h4 className="text-sm font-semibold text-primary truncate font-sans" title={source.title}>
                            {domain}
                        </h4>
                        <span className="text-[10px] text-muted truncate">{source.title}</span>
                    </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-muted hover:text-primary p-1 rounded-md hover:bg-surface-hover transition-colors flex-shrink-0 -mr-1 -mt-1"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            {/* Snippet */}
            <div className="bg-sidebar/50 p-3 rounded-lg border border-border/50">
                <p className="text-xs text-muted leading-relaxed line-clamp-4 font-sans">
                    {source.snippet}
                </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
                <a 
                    href={source.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1c7483] text-white hover:opacity-90 rounded-lg text-xs font-bold transition-all font-sans"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Source
                </a>
                <button 
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover text-primary border border-border rounded-lg text-xs font-medium transition-all min-w-[80px] font-sans"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
          </div>
          
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-surface border-b border-r border-border rotate-45"></div>
        </div>
      )}
    </span>
  );
};

export const MessageContent = memo(({ content, isStreaming, sources = [] }: MessageContentProps) => {
  const [displayedContent, setDisplayedContent] = useState(() => {
    if (!isStreaming) return content;
    return '';
  });
  
  const contentRef = useRef(content);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!isStreaming && displayedContent === '' && content.length > 0) {
        setDisplayedContent(content);
    }
  }, [isStreaming]);

  useEffect(() => {
    const animate = () => {
      const target = contentRef.current;
      
      setDisplayedContent(prev => {
        if (prev === target) return prev;
        if (target.length < prev.length) return target;

        const diff = target.length - prev.length;
        if (diff <= 0) return prev;

        let charsToAdd = 1;
        if (diff > 200) charsToAdd = 20;
        else if (diff > 50) charsToAdd = 5;
        else if (diff > 10) charsToAdd = 2;
        else charsToAdd = 1;
        
        return target.slice(0, prev.length + charsToAdd);
      });
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const renderTextWithCitations = (text: string) => {
     const parts = text.split(/((?:\[\d+\])+)/g);
     
     return (
        <>
          {parts.map((part, i) => {
             if (part.match(/^(\[\d+\])+$/)) {
                 const indices = part.match(/\d+/g)?.map(Number) || [];
                 if (indices.length === 0) return null;

                 return (
                    <React.Fragment key={i}>
                      {indices.map(idx => {
                          const source = sources[idx - 1];
                          if (!source) return null;
                          return <CitationPill key={idx} source={source} label={`${idx}`} index={idx} />;
                      })}
                    </React.Fragment>
                 );
             }
             return <React.Fragment key={i}>{part}</React.Fragment>;
          })}
        </>
     );
  };

  return (
    <div className="markdown-body text-primary font-sans font-normal w-full min-w-0">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
            p: ({node, children, ...props}: any) => {
                return (
                    <p className="mb-5 text-[16px] md:text-[17px] leading-8 text-primary/90 font-sans font-light tracking-wide" {...props}>
                       {React.Children.map(children, child => {
                           if (typeof child === 'string') return renderTextWithCitations(child);
                           return child;
                       })}
                    </p>
                );
            },
            ul: ({node, ordered, ...props}: any) => <ul className="list-none space-y-2 mb-6" {...props} />,
            ol: ({node, ordered, ...props}: any) => <ol className="list-decimal list-outside space-y-2 mb-6 ml-4" {...props} />,
            li: ({node, ordered, children, ...props}: any) => (
                <li className="text-[16px] md:text-[17px] leading-8 pl-4 font-sans font-light text-primary/90 relative" {...props}>
                   <span className="absolute left-0 top-[0.7em] w-1.5 h-1.5 bg-muted rounded-full opacity-60"></span>
                   {React.Children.map(children, child => {
                       if (typeof child === 'string') return renderTextWithCitations(child);
                       return child;
                   })}
                </li>
            ),
            h1: ({node, ...props}: any) => <h1 className="text-3xl font-sans font-medium text-primary mt-8 mb-4" {...props} />,
            h2: ({node, ...props}: any) => <h2 className="text-2xl font-sans font-medium text-primary mt-8 mb-4" {...props} />,
            h3: ({node, ...props}: any) => <h3 className="text-lg font-sans font-semibold text-primary mt-6 mb-3 flex items-center gap-2" {...props} />,
            strong: ({node, ...props}: any) => <strong className="font-semibold text-primary" {...props} />,
            blockquote: ({node, ...props}: any) => <blockquote className="border-l-2 border-scira-accent pl-4 italic text-muted my-4 font-sans text-lg bg-surface/50 py-2 rounded-r-lg" {...props} />,
            code: ({node, inline, className, children, ...props}: any) => {
                if (inline) {
                    return <code className="bg-surface-hover text-primary px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
                }
                return (
                    <div className="bg-[#1E1E1E] rounded-xl p-4 my-4 overflow-x-auto border border-border/20 shadow-sm">
                        <code className="text-gray-200 text-sm font-mono leading-relaxed" {...props}>
                            {children}
                        </code>
                    </div>
                );
            }
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {isStreaming && displayedContent.length < content.length && (
         <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-scira-accent animate-pulse rounded-full" />
      )}
    </div>
  );
});
