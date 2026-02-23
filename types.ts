
import React from 'react';

export interface SearchMode {
  id: string;
  label: string;
  icon: React.ElementType;
  isDeep?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
  icon: React.ElementType;
  provider?: 'gemini' | 'groq' | 'openrouter';
  isReasoning?: boolean;
  category?: 'Stable' | 'Experimental';
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  publishedDate?: string;
  image?: string;
  type?: 'web' | 'video' | 'academic' | 'social' | 'code' | 'finance';
  metadata?: any;
}

export interface WidgetData {
  type: 'time' | 'weather' | 'stock' | 'slides' | 'crypto' | 'place' | 'movie';
  data: any; 
}

export interface SlidesWidgetData {
  title: string;
  slides: {
    title: string;
    content: string[];
    image?: string;
    chart?: {
        title?: string;
        data: { label: string; value: number }[];
    };
  }[];
}

export interface ProSearchStep {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  queries?: string[];
  finding?: string;
}

export interface CopilotPayload {
  question: string;
  type: 'text' | 'selection';
  options?: string[];
  answer?: string | string[]; 
}

export interface CopilotEvent {
  id: string;
  message: string;
  status: 'pending' | 'loading' | 'completed';
  items?: string[]; // For "Searching web" queries
}

export type SearchModeType = 
  | 'web' 
  | 'chat' 
  | 'x' 
  | 'stocks' 
  | 'code' 
  | 'academic' 
  | 'extreme' 
  | 'reddit' 
  | 'github' 
  | 'crypto' 
  | 'prediction' 
  | 'youtube' 
  | 'spotify' 
  | 'connectors' 
  | 'memory' 
  | 'voice' 
  | 'xql'
  | 'scraping';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string; // New field for DeepSeek/Reasoning models
  sources?: SearchResult[];
  
  // Media Gallery
  images?: SearchResult[]; 
  videos?: SearchResult[];

  relatedQuestions?: string[];
  
  // Copilot specific
  isCopilotActive?: boolean; // True if we are currently in the copilot flow (before final answer)
  copilotStep?: CopilotPayload; // The interactive widget data
  copilotEvents?: CopilotEvent[]; // The log of steps (Understanding -> Searching...)
  
  mode?: SearchModeType;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_pro?: boolean;
  pro_expiry?: string;
}

export interface SavedConversation {
  id: string;
  title: string;
  snippet?: string;
  collection_id?: string;
  created_at: string;
}

export interface Collection {
  id: string;
  title: string;
  description?: string;
  icon: string; // Emoji or Lucide icon name
  created_at: string;
}
