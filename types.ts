
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
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  publishedDate?: string;
  image?: string;
}

export interface WidgetData {
  type: 'time' | 'weather' | 'stock' | 'slides';
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

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
  
  // Media Gallery
  images?: SearchResult[]; 
  videos?: SearchResult[];

  relatedQuestions?: string[];
  
  // Copilot specific
  isCopilotActive?: boolean;
  copilotStep?: CopilotPayload;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_pro?: boolean;
  pro_expiry?: string;
}
