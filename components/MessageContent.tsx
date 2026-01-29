
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

const CitationPill = ({ source, label }: { source: SearchResult; label: string }) => {
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

  return (
    <span className="relative inline-block ml-1 align-baseline">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`citation-pill select-none ${isOpen ? 'bg-primary text-background ring-1 ring-primary' : ''}`}
        type="button"
      >
        {label}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 max-w-[90vw] bg-surface border border-border rounded-xl shadow-elegant p-4 z-50 animate-in fade-in zoom-in-95 duration-200 cursor-auto text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-3">
             {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-sidebar border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${new URL(source.link).hostname}&sz=32`}
                          className="w-3.5 h-3.5 opacity-80"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                          alt=""
                        />
                    </div>
                    <h4 className="text-sm font-semibold text-primary truncate font-sans" title={source.title}>
                        {source.title}
                    </h4>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-muted hover:text-primary p-1 rounded-md hover:bg-surface-hover transition-colors flex-shrink-0 -mr-1 -mt-1"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            {/* Snippet */}
            <div className="bg-sidebar p-3 rounded-lg border border-border/50">
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
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-background hover:opacity-90 rounded-lg text-xs font-medium transition-all font-sans"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Source
                </a>
                <button 
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-surface hover:bg-surface-hover text-primary border border-border rounded-lg text-xs font-medium transition-all min-w-[80px] font-sans"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-scira-accent" /> : <Copy className="w-3.5 h-3.5" />}
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

                 const firstIndex = indices[0];
                 const source = sources[firstIndex - 1];
                 
                 if (!source) return null;

                 let domain = "source";
                 try {
                     const hostname = new URL(source.link).hostname.replace('www.', '');
                     domain = hostname.split('.')[0];
                     if (domain.length < 3) domain = hostname;
                 } catch(e) {}

                 const count = indices.length;
                 const label = count > 1 ? `${domain} +${count - 1}` : domain;

                 return (
                    <React.Fragment key={i}>
                      <CitationPill source={source} label={label} />
                    </React.Fragment>
                 );
             }
             return <React.Fragment key={i}>{part}</React.Fragment>;
          })}
        </>
     );
  };

  return (
    <div className="markdown-body text-primary font-normal w-full min-w-0">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
            p: ({node, children, ...props}: any) => {
                return (
                    <p className="mb-5 text-[16px] md:text-[17px] leading-8 text-primary/90 font-sans tracking-wide" {...props}>
                       {React.Children.map(children, child => {
                           if (typeof child === 'string') return renderTextWithCitations(child);
                           return child;
                       })}
                    </p>
                );
            },
            li: ({node, children, ...props}: any) => (
                <li className="mb-2 text-[16px] md:text-[17px] leading-8 pl-1 font-sans text-primary/90" {...props}>
                   {React.Children.map(children, child => {
                       if (typeof child === 'string') return renderTextWithCitations(child);
                       return child;
                   })}
                </li>
            ),
            h1: ({node, ...props}: any) => <h1 className="text-3xl font-serif font-normal text-primary mt-8 mb-4 border-b border-border/50 pb-2" {...props} />,
            h2: ({node, ...props}: any) => <h2 className="text-2xl font-serif font-normal text-primary mt-8 mb-4" {...props} />,
            h3: ({node, ...props}: any) => <h3 className="text-xl font-serif font-normal text-primary mt-6 mb-3 text-scira-accent" {...props} />,
            strong: ({node, ...props}: any) => <strong className="font-semibold text-primary" {...props} />,
            blockquote: ({node, ...props}: any) => <blockquote className="border-l-2 border-scira-accent pl-4 italic text-muted my-4 font-serif text-lg" {...props} />
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
