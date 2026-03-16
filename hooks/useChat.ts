import { useState } from 'react';
import { Message, SearchResult, SearchModeType } from '../types';
import { performMultiSearch } from '../lib/search';
import { streamResponse, generateSearchQueries } from '../services/geminiService';
import { createConversation, saveMessage } from '../services/chatStorageService';
import { searchForMode, executeToolsForMode } from '../services/toolService';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleSearch = async (query: string, modelId: string, forcedMode?: SearchModeType, passedConversationId?: string) => {
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    if (!hasSearched) setHasSearched(true);

    let currentId = passedConversationId || activeConversationId;
    if (!currentId) {
       currentId = await createConversation(query);
       setActiveConversationId(currentId);
    } else if (passedConversationId && !activeConversationId) {
       setActiveConversationId(passedConversationId);
    }

    const userMsg: Message = { role: 'user', content: query, mode: forcedMode };
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
      // 1. SEARCH EXECUTION
      // Default to 'web' if no mode is forced
      const mode: SearchModeType = forcedMode || 'web';
      let allResults: SearchResult[] = [];
      let toolData: any = null;

      // Update UI to show searching state
      setMessages(prev => {
        const newMsgs = [...prev];
        const lastIndex = newMsgs.length - 1;
        const last = newMsgs[lastIndex];
        
        if (last) {
            const newLast = { ...last };
            newLast.copilotEvents = [{ 
                id: '1', 
                status: 'loading', 
                message: `Generating search plan...`, 
                items: [] 
            }];
            newMsgs[lastIndex] = newLast;
        }
        return newMsgs;
      });

      if (mode === 'chat') {
        // Skip search
      } else if (mode === 'crypto' || mode === 'stocks' || mode === 'weather') {
        // Execute specific tool AND search for context
        toolData = await executeToolsForMode(mode, query);
        allResults = await searchForMode(mode, query);
      } else {
        // Standard search with mode-specific context
        
        let queries: string[] = [query];
        let plan = "Direct Search";

        // OPTIMIZATION: For 'web' mode (default), skip LLM query generation to meet <500ms latency target.
        // Only generate queries for 'deep' or explicit research modes if we had them.
        if (mode !== 'web') {
             // 1. Generate Queries (Slow path)
             const gen = await generateSearchQueries(query);
             queries = gen.queries;
             plan = gen.plan;
        }
        
        setMessages(prev => {
            const newMsgs = [...prev];
            const lastIndex = newMsgs.length - 1;
            const last = newMsgs[lastIndex];
            
            if (last && last.copilotEvents) {
                const newLast = { ...last };
                const newEvents = [...last.copilotEvents];
                
                // Update first event
                newEvents[0] = { ...newEvents[0], status: 'completed', message: plan };
                
                // Add second event if not exists
                if (!newEvents.some(e => e.id === '2')) {
                    newEvents.push({
                        id: '2',
                        status: 'loading',
                        message: mode === 'web' ? `Searching sources...` : `Searching ${queries.length} vectors...`,
                        items: queries
                    });
                }
                
                newLast.copilotEvents = newEvents;
                newMsgs[lastIndex] = newLast;
            }
            return newMsgs;
        });

        // 2. Execute Parallel Search
        const searchPromises = queries.map(q => searchForMode(mode, q));
        const resultsArray = await Promise.all(searchPromises);
        
        // 3. Flatten and Deduplicate
        const flatResults = resultsArray.flat();
        const seenUrls = new Set<string>();
        allResults = [];
        
        for (const res of flatResults) {
            if (!seenUrls.has(res.link)) {
                seenUrls.add(res.link);
                allResults.push(res);
            }
        }
        
        // Limit to top 20 results
        allResults = allResults.slice(0, 20);
      }

      // 2. RESULTS PROCESSING
      setMessages(prev => {
            const newMsgs = [...prev];
            const lastIndex = newMsgs.length - 1;
            const last = newMsgs[lastIndex];
            
            if (last && last.copilotEvents) {
                const newLast = { ...last };
                const newEvents = [...last.copilotEvents];
                const lastEventIdx = newEvents.length - 1;
                
                // Update last event
                newEvents[lastEventIdx] = { ...newEvents[lastEventIdx], status: 'completed' };
                
                // Add new event if not exists
                if (!newEvents.some(e => e.id === '3')) {
                    newEvents.push({ id: '3', status: 'completed', message: `Found ${allResults.length} sources` });
                }
                
                newLast.copilotEvents = newEvents;
                newLast.sources = allResults;
                newMsgs[lastIndex] = newLast;
            }
            return newMsgs;
       });

      // 3. STREAM ANSWER
      await streamResponse(
        query, // Use original query
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
        undefined, // deepFindings
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