import React, { useState, useEffect, useRef, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  isStreaming: boolean;
}

export const MessageContent = memo(({ content, isStreaming }: MessageContentProps) => {
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
    // If strictly not streaming and we have nothing displayed yet (and content exists), snap to end.
    // This handles the case where we might have missed the init logic or props changed (e.g. history load).
    if (!isStreaming && displayedContent === '' && content.length > 0) {
        setDisplayedContent(content);
    }
  }, [isStreaming]);

  useEffect(() => {
    const animate = () => {
      const target = contentRef.current;
      
      setDisplayedContent(prev => {
        // If we've caught up, stop updating
        if (prev === target) return prev;
        
        // If target is smaller (deletion/reset), snap to it
        if (target.length < prev.length) return target;

        // Calculate chars to add
        const diff = target.length - prev.length;
        if (diff <= 0) return prev;

        // Adaptive Typing Speed
        // Large buffer -> fast catch up
        // Small buffer -> smooth typing
        let charsToAdd = 1;
        if (diff > 200) charsToAdd = 20;      // Massive jump (e.g. paste)
        else if (diff > 50) charsToAdd = 5;   // Big chunk
        else if (diff > 10) charsToAdd = 2;   // Medium chunk
        else charsToAdd = 1;                  // Standard typing
        
        return target.slice(0, prev.length + charsToAdd);
      });
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="markdown-body text-muted/90 font-light w-full min-w-0">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
            p: ({node, ...props}) => <p className="mb-4 text-[16px] leading-relaxed" {...props} />,
            li: ({node, ...props}) => <li className="mb-1 text-[16px]" {...props} />,
            strong: ({node, ...props}) => <strong className="font-semibold text-primary" {...props} />
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {/* Optional: Add a blinking cursor if strictly streaming and not done */}
      {isStreaming && displayedContent.length < content.length && (
         <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-scira-accent animate-pulse rounded-full" />
      )}
    </div>
  );
});