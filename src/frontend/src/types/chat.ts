/**
 * Types related to chat functionality
 */

export type MessageRole = 'user' | 'assistant';

export interface ArticleSource {
  id?: string;
  title: string;
  date: string;
  publication: string;
}

export interface EntitySource {
  id: string;
  name: string;
  type: string;
  articleCount?: number;
  firstMention?: string;
  lastMention?: string;
  relatedEntities?: Array<{
    id: string;
    name: string;
    type: string;
    strength: number;
  }>;
}

export interface TimelineEntry {
  date: string;
  title: string;
  publication: string;
  id: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: ArticleSource[];
  entities?: EntitySource[];
  timeline?: TimelineEntry[];
}

export interface Source {
  id: number;
  title: string;
  publication: string;
  date: string;
  url?: string;
}

export interface StorySuggestion {
  id: string;
  title: string;
  source: string;
  description: string;
} 