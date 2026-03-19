import { useState } from 'react';

export const useChat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleSearch = (query: string, _modelId: string, _mode: string) => {
    setHasSearched(true);
    setMessages([...messages, { role: 'user', content: query }]);
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'This is a mock response.' }]);
      setIsLoading(false);
    }, 1000);
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
