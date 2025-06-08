/**
 * StoryMap API Models
 * Type definitions for StoryMap API entities and responses
 */

/**
 * Base model with common fields
 */
export interface BaseModel {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Article model
 */
export interface Article extends BaseModel {
  title: string;
  content: string;
  processed_content?: string;
  publication_date?: string;
  category?: string;
  source?: string;
  is_advertisement?: boolean;
  is_classified?: boolean;
  classification_confidence?: number;
  quality_score?: number;
  word_count?: number;
  language?: string;
  entities?: Entity[];
  relationships?: Relationship[];
}

/**
 * Article list response
 */
export interface ArticleListResponse {
  articles: Article[];
  limit: number;
  offset: number;
  total: number;
}

/**
 * Entity model
 */
export interface Entity extends BaseModel {
  name: string;
  entity_type: string; // person, organization, location, event, etc.
  confidence?: number;
  mentions?: string[];
  aliases?: string[];
  metadata?: Record<string, any>;
}

/**
 * Entity list response
 */
export interface EntityListResponse {
  entities: Entity[];
  limit: number;
  offset: number;
  total?: number;
}

/**
 * Relationship model
 */
export interface Relationship extends BaseModel {
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string; // works_for, located_in, part_of, etc.
  confidence?: number;
  evidence?: string;
  metadata?: Record<string, any>;
}

/**
 * Relationship list response
 */
export interface RelationshipListResponse {
  relationships: Relationship[];
  limit: number;
  offset: number;
  total?: number;
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  query: string;
  threshold?: number;
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
}

/**
 * Search filters
 */
export interface SearchFilters {
  start_date?: string;
  end_date?: string;
  categories?: string[];
  sources?: string[];
  entity_types?: string[];
  entity_ids?: string[];
}

/**
 * Search result item
 */
export interface SearchResultItem {
  id: string;
  title: string;
  content: string;
  publication_date?: string;
  source?: string;
  category?: string;
  similarity: number;
  highlights?: string[];
}

/**
 * Search response
 */
export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  limit?: number;
  offset?: number;
  total?: number;
  execution_time_ms?: number;
}

/**
 * Batch job operations
 */
export enum BatchOperation {
  UPDATE_EMBEDDINGS = 'update_embeddings',
  EXTRACT_ENTITIES = 'extract_entities',
  PROCESS_CONTENT = 'process_content',
  CLASSIFY_CONTENT = 'classify_content'
}

/**
 * Batch job status
 */
export enum BatchStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Batch job create request
 */
export interface BatchJobCreateRequest {
  article_ids: string[];
  operations: BatchOperation[];
}

/**
 * Batch job response
 */
export interface BatchJobResponse {
  batch_id: string;
  status: BatchStatus;
  items_count: number;
  items_processed?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

/**
 * Timeline entry
 */
export interface TimelineEntry {
  date: string;
  title: string;
  content: string;
  article_id: string;
  source?: string;
  entities?: Entity[];
}

/**
 * Timeline response
 */
export interface TimelineResponse {
  query?: string;
  start_date?: string;
  end_date?: string;
  entries: TimelineEntry[];
  total: number;
}

/**
 * Network node (entity in a network graph)
 */
export interface NetworkNode extends Entity {
  group?: string;
  size?: number;
  importance?: number;
  color?: string;
}

/**
 * Network edge (relationship in a network graph)
 */
export interface NetworkEdge extends Relationship {
  weight?: number;
  arrow?: boolean;
  color?: string;
  label?: string;
}

/**
 * Network graph
 */
export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

/**
 * Network statistics
 */
export interface NetworkStats {
  node_count: number;
  edge_count: number;
  density?: number;
  clusters?: {
    count: number;
    sizes: number[];
  };
  centrality?: {
    [key: string]: number;
  };
}

/**
 * Network response
 */
export interface NetworkResponse {
  entity_id: string;
  depth: number;
  network: NetworkGraph;
  stats: NetworkStats;
} 