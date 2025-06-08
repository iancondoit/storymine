import { Entity, TimelineEntry } from './storyMapModels';

/**
 * Extended Entity with enhanced data from the StoryMap API
 */
export interface ExtendedEntity extends Entity {
  // Additional fields that might be available in API responses
  article_ids?: string[];
  articles?: any[];
  article_count?: number;
  co_occurring_entities?: Array<{
    id: string;
    name: string;
    entityType?: string;
    co_occurrence_count?: number;
  }>;
  first_mentioned_at?: string;
  last_mentioned_at?: string;
}

/**
 * Entity with metadata for UI display
 */
export interface EntityWithUI extends ExtendedEntity {
  firstMention?: string;
  lastMention?: string;
  relatedEntities?: Array<{
    id: string;
    name: string;
    type: string;
    strength: number;
  }>;
}

/**
 * Article source for display
 */
export interface ArticleSource {
  id: string;
  title: string;
  date: string;
  url?: string;
}

/**
 * Enhanced timeline entry with UI fields
 */
export interface EnhancedTimelineEntry extends TimelineEntry {
  source: string;
  articleId: string;
} 