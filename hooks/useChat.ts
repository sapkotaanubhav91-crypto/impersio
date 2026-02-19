import { useState } from 'react';
import { Message, SearchResult } from '../types';
import { performMultiSearch } from '../lib/search';
import { streamResponse, generateSearchQueries } from '../ai/gemini';
import { createConversation, saveMessage } from '../services/chatStorageService';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleSearch = async (query: string, modelId: string) => {
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    if (!hasSearched) setHasSearched(true);

    let currentId = activeConversationId;
    if (!currentId) {
       currentId = await createConversation(query);
       setActiveConversationId(currentId);
    }

    const userMsg: Message = { role: 'user', content: query };
    const assistantMsg: Message = { 
        role: 'assistant', 
        content: '', 
        reasoning: '', 
        sources: [], 
        copilotEvents: [] 
    };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    
    if (currentId) await saveMessage(currentId, 'user', query);
    
    try {
      // 1. THINKING & PLANNING
      setMessages(prev => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        if (last) {
            last.copilotEvents = [{ id: '1', status: 'loading', message: 'Analyzing request...' }];
        }
        return newMsgs;
      });

      // Skip query generation for speed
      // const { queries, plan } = await generateSearchQueries(query);

      // 2. SEARCH EXECUTION
      setMessages(prev => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        if (last && last.copilotEvents) {
             last.copilotEvents[0].status = 'completed';
             last.copilotEvents[0].message = 'Fast Search'; 
             
             last.copilotEvents.push({ 
                id: '2', 
                status: 'loading', 
                message: `Searching sources...`, 
                items: [query] 
            });
        }
        return newMsgs;
      });

      // Execute Parallel Search Engine
      const allResults = await performMultiSearch(query);

      // 3. RESULTS PROCESSING
      setMessages(prev => {
            const newMsgs = [...prev];
            const last = newMsgs[newMsgs.length - 1];
            if (last && last.copilotEvents) {
                const lastIdx = last.copilotEvents.length - 1;
                last.copilotEvents[lastIdx].status = 'completed';
                
                last.sources = allResults;
                last.copilotEvents.push({ id: '3', status: 'completed', message: `Found ${allResults.length} relevant results` });
            }
            return newMsgs;
       });

      // 4. STREAM ANSWER
      await streamResponse(
        query, 
        modelId, 
        [], 
        allResults, 
        [], 
        false, 
        false, 
        (chunk, reasoning) => {
          setMessages(prev => {
              const newMsgs = [...prev];
              const last = newMsgs[newMsgs.length - 1];
              if (last) {
                  if (chunk) last.content = chunk;
                  if (reasoning) last.reasoning = reasoning;
              }
              return newMsgs;
          });
        },
        () => {},
        (related) => {
          setMessages(prev => {
              const newMsgs = [...prev];
              const last = newMsgs[newMsgs.length - 1];
              if (last) last.relatedQuestions = related;
              return newMsgs;
          });
        },
        (fullContent, widget, related) => {
           if (currentId) saveMessage(currentId, 'assistant', fullContent, { sources: allResults, relatedQuestions: related });
        },
        undefined,
        (rankedSources) => {
           setMessages(prev => {
              const newMsgs = [...prev];
              const last = newMsgs[newMsgs.length - 1];
              if (last) last.sources = rankedSources;
              return newMsgs;
          });
        }
      );
      
    } catch (e) {
        console.error(e);
        setMessages(prev => {
            const newMsgs = [...prev];
            const last = newMsgs[newMsgs.length - 1];
            if (last) last.content = "I encountered an error while searching. Please try again.";
            return newMsgs;
        });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    hasSearched,
    setHasSearched,
    isLoading,
    handleSearch,
    activeConversationId,
    setActiveConversationId
  };
};