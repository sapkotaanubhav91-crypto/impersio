
import { Message, SearchResult, WidgetData, SavedConversation, Collection } from '../types';
import { db, auth } from '../src/services/firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

const waitForAuth = async () => {
    return new Promise((resolve) => {
        if (auth.currentUser) {
            resolve(auth.currentUser);
        } else {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                if (user) {
                    unsubscribe();
                    resolve(user);
                }
            });
        }
    });
};

export const createConversation = async (title: string, snippet?: string, id?: string): Promise<string | null> => {
  try {
    const user = await waitForAuth() as any;
    const userId = user.uid;

    const convRef = id ? doc(db, 'conversations', id) : doc(collection(db, 'conversations'));
    const newConv = {
      id: convRef.id,
      userId,
      title,
      snippet,
      created_at: serverTimestamp()
    };

    await setDoc(convRef, newConv);
    return convRef.id;
  } catch (e) {
    console.error('Error creating conversation:', e);
    return null;
  }
};

export const deleteConversation = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'conversations', id));
  } catch (e) {
    console.error('Error deleting conversation:', e);
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
    await waitForAuth();
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
        role,
        content,
        images: extraData?.images || null,
        sources: extraData?.sources || null,
        widget: extraData?.widget || null,
        related_questions: extraData?.relatedQuestions || null,
        created_at: serverTimestamp()
    });
  } catch (e) {
    console.error('Error saving message:', e);
  }
};

export const getUserConversations = async (userId: string): Promise<SavedConversation[]> => {
    try {
        const q = query(collection(db, 'conversations'), where('userId', '==', userId), orderBy('created_at', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedConversation));
    } catch (e) {
        console.error('Error fetching conversations:', e);
        return [];
    }
};

export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    await waitForAuth();

    const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('created_at', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            role: data.role,
            content: data.content,
            images: data.images,
            sources: data.sources,
            widget: data.widget,
            relatedQuestions: data.related_questions
        } as Message;
    });
  } catch (e) {
    console.error('Error fetching messages:', e);
    return [];
  }
};

// Collections API - Keeping as is for now as it wasn't requested to be migrated
export const getCollections = async (): Promise<Collection[]> => {
  return [];
};
export const createCollection = async (title: string, description: string, icon: string): Promise<Collection> => {
  return { id: '1', title, description, icon, created_at: new Date().toISOString() };
};
export const deleteCollection = async (id: string) => {};
export const updateConversationSnippet = async (id: string, snippet: string) => {};
export const moveConversationToCollection = async (threadId: string, collectionId: string | null) => {};
