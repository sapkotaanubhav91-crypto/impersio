
import { Message, SearchResult, WidgetData, SavedConversation, Collection } from '../types';

const CONVERSATIONS_KEY = 'impersio_local_conversations';
const MESSAGES_PREFIX = 'impersio_local_msgs_';
const COLLECTIONS_KEY = 'impersio_local_collections';

export const createConversation = async (title: string, snippet?: string): Promise<string | null> => {
  try {
    const id = crypto.randomUUID();
    const newConv: SavedConversation = {
      id,
      title,
      snippet,
      created_at: new Date().toISOString()
    };

    const existing = localStorage.getItem(CONVERSATIONS_KEY);
    const conversations = existing ? JSON.parse(existing) : [];
    conversations.unshift(newConv);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    
    return id;
  } catch (e) {
    console.error('Error creating conversation:', e);
    return null;
  }
};

export const deleteConversation = async (id: string) => {
  const existing = localStorage.getItem(CONVERSATIONS_KEY);
  if (!existing) return;
  const conversations = JSON.parse(existing);
  const filtered = conversations.filter((c: any) => c.id !== id);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
  localStorage.removeItem(`${MESSAGES_PREFIX}${id}`);
};

export const updateConversationSnippet = async (id: string, snippet: string) => {
  const existing = localStorage.getItem(CONVERSATIONS_KEY);
  if (!existing) return;
  const conversations = JSON.parse(existing);
  const index = conversations.findIndex((c: any) => c.id === id);
  if (index !== -1) {
    conversations[index].snippet = snippet;
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }
};

export const moveConversationToCollection = async (threadId: string, collectionId: string | null) => {
  const existing = localStorage.getItem(CONVERSATIONS_KEY);
  if (!existing) return;
  const conversations = JSON.parse(existing);
  const index = conversations.findIndex((c: any) => c.id === threadId);
  if (index !== -1) {
    conversations[index].collection_id = collectionId;
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  }
};

export const saveMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  extraData?: {
    images?: string[];
    sources?: SearchResult[];
    widget?: WidgetData;
    relatedQuestions?: string[];
  }
) => {
  try {
    const key = `${MESSAGES_PREFIX}${conversationId}`;
    const existing = localStorage.getItem(key);
    const messages = existing ? JSON.parse(existing) : [];

    const newMessage = {
        role,
        content,
        images: extraData?.images,
        sources: extraData?.sources,
        widget: extraData?.widget,
        related_questions: extraData?.relatedQuestions,
        created_at: new Date().toISOString()
    };

    messages.push(newMessage);
    localStorage.setItem(key, JSON.stringify(messages));
    
    // Auto-update snippet if this is the first assistant response
    if (role === 'assistant') {
      updateConversationSnippet(conversationId, content.substring(0, 150));
    }
  } catch (e) {
    console.error('Error saving message:', e);
  }
};

export const getUserConversations = async (userId: string): Promise<SavedConversation[]> => {
    const existing = localStorage.getItem(CONVERSATIONS_KEY);
    return existing ? JSON.parse(existing) : [];
};

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const key = `${MESSAGES_PREFIX}${conversationId}`;
  const existing = localStorage.getItem(key);
  const rawMessages = existing ? JSON.parse(existing) : [];

  return rawMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      images: msg.images,
      sources: msg.sources,
      widget: msg.widget,
      relatedQuestions: msg.related_questions
  }));
};

// Collections API
export const getCollections = async (): Promise<Collection[]> => {
  const existing = localStorage.getItem(COLLECTIONS_KEY);
  return existing ? JSON.parse(existing) : [];
};

export const createCollection = async (title: string, description: string, icon: string): Promise<Collection> => {
  const id = crypto.randomUUID();
  const newCol: Collection = {
    id,
    title,
    description,
    icon,
    created_at: new Date().toISOString()
  };
  const existing = await getCollections();
  existing.unshift(newCol);
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(existing));
  return newCol;
};

export const deleteCollection = async (id: string) => {
  const existing = await getCollections();
  const filtered = existing.filter(c => c.id !== id);
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(filtered));
  
  // Also detach threads
  const threads = await getUserConversations('guest');
  threads.forEach(t => {
    if (t.collection_id === id) {
      moveConversationToCollection(t.id, null);
    }
  });
};
