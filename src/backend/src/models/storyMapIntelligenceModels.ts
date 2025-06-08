/**
 * StoryMap Intelligence Data Models
 * 
 * These models match the new data format delivered by StoryMap Intelligence
 * as specified in the handoff document dated January 2025.
 * 
 * Data Files:
 * - Articles: output/phase1/enhanced_articles_complete.json (1.1GB)
 * - Entities: output/phase2b/entities_filtered_batch_*.json.gz (50MB total, 144 files)
 * - Relationships: output/phase3_stories/story_relationships.json.gz (51MB)
 * - Stories: output/phase3_stories/temporal_narrative.json (75KB)
 */

export interface BaseIntelligenceModel {
  id: string; // UUID v4
  created_at?: string;
  updated_at?: string;
}

/**
 * Enhanced Article from StoryMap Intelligence Phase 1
 * Contains 30+ enriched fields including narrative scoring
 */
export interface IntelligenceArticle extends BaseIntelligenceModel {
  // Core Content
  title: string;
  content: string;
  processed_content: string;
  
  // Publication Details
  publication_date: string; // ISO-8601
  source_publication: string;
  geographic_origin: string;
  page_number?: number;
  column_position?: number;
  
  // Classification
  category: string;
  subcategory?: string;
  is_advertisement: boolean;
  is_classified: boolean;
  classification_confidence: number;
  
  // Quality Metrics (CRITICAL FOR JORDI)
  quality_score: number; // 0.0-1.0 OCR quality
  narrative_score: number; // 0.0-1.0 story coherence
  human_interest_score: number; // 0.0-1.0 emotional elements
  documentary_potential: number; // 0.0-1.0 visual storytelling
  historical_significance: number; // 0.0-1.0 broader importance
  
  // Content Analysis
  word_count: number;
  language: string;
  reading_level: number;
  emotional_tone: 'positive' | 'negative' | 'neutral' | 'mixed';
  urgency_level: 'breaking' | 'routine' | 'feature' | 'opinion';
  
  // Narrative Context
  story_arc_position: 'beginning' | 'development' | 'climax' | 'resolution' | 'standalone';
  narrative_themes: string[];
  time_period_context: string[];
  geographic_scope: string[];
  
  // Relationships
  related_article_ids: string[];
  story_thread_ids: string[];
  sequel_article_id?: string;
  prequel_article_id?: string;
  
  // Media Elements
  has_images: boolean;
  image_descriptions?: string[];
  visual_elements?: string[];
  
  // Processing Metadata
  extraction_confidence: number;
  processing_notes?: string[];
  
  // Linked Data
  entities?: IntelligenceEntity[];
  relationships?: IntelligenceRelationship[];
}

/**
 * High-Quality Entity from StoryMap Intelligence Phase 2B
 * Filtered from 5.94M to 1.4M high-confidence entities
 */
export interface IntelligenceEntity extends BaseIntelligenceModel {
  // Identity
  canonical_name: string;
  aliases: string[];
  entity_type: 'person' | 'location' | 'organization' | 'event' | 'concept' | 'object';
  entity_subtype?: string;
  
  // Recognition Metrics
  recognition_confidence: number; // 0.0-1.0
  total_mentions: number;
  unique_article_mentions: number;
  mention_density: number;
  
  // Biographical/Descriptive Data
  birth_date?: string;
  death_date?: string;
  active_period_start?: string;
  active_period_end?: string;
  biographical_summary?: string;
  historical_role?: string;
  
  // Geographic Context
  primary_location?: string;
  associated_locations: string[];
  geographic_scope: 'local' | 'regional' | 'national' | 'international';
  
  // Organizational Context (for organizations)
  organization_type?: string;
  parent_organization?: string;
  founding_date?: string;
  dissolution_date?: string;
  
  // Temporal Context
  time_period_tags: string[];
  historical_era: string;
  peak_activity_period?: string;
  
  // Significance Metrics (CRITICAL FOR JORDI)
  historical_significance_score: number; // 0.0-1.0
  narrative_importance: number; // 0.0-1.0
  documentary_potential: number; // 0.0-1.0
  public_interest_level: number; // 0.0-1.0
  
  // Context and Classification
  thematic_tags: string[];
  social_role?: string;
  political_affiliation?: string;
  professional_categories?: string[];
  
  // Relationship Context
  notable_associates: string[]; // Entity IDs
  co_occurrence_strength: Record<string, number>; // Entity ID -> strength
  network_centrality_score: number;
  
  // Modern Relevance
  modern_relevance_score?: number;
  contemporary_connections?: string[];
  
  // Quality and Source
  data_quality_score: number;
  source_diversity: number; // How many different articles mention this entity
  verification_status: 'verified' | 'probable' | 'uncertain';
  
  // Processing
  entity_linking_score?: number;
  disambiguation_notes?: string[];
}

/**
 * Story-Backed Relationship from StoryMap Intelligence Phase 3
 * 1.2M relationships with evidence and narrative context
 */
export interface IntelligenceRelationship extends BaseIntelligenceModel {
  // Core Relationship
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  relationship_subtype?: string;
  
  // Evidence and Context
  confidence: number; // 0.0-1.0
  evidence_strength: number; // 0.0-1.0
  supporting_article_ids: string[];
  evidence_quotes: string[];
  contextual_quotes: string[];
  
  // Temporal Evolution
  first_documented: string; // ISO-8601
  last_documented: string; // ISO-8601
  relationship_duration?: string; // human readable
  temporal_stability: number; // 0.0-1.0
  evolution_pattern?: 'strengthening' | 'weakening' | 'stable' | 'cyclical';
  
  // Narrative Context (CRITICAL FOR JORDI)
  narrative_significance: number; // 0.0-1.0
  dramatic_tension: number; // 0.0-1.0 conflict/interest level
  human_interest_factor: number; // 0.0-1.0 emotional/personal appeal
  documentary_potential: number; // 0.0-1.0 visual storytelling potential
  
  // Relationship Characteristics
  relationship_intensity: 'weak' | 'moderate' | 'strong' | 'defining';
  relationship_nature: 'positive' | 'negative' | 'neutral' | 'complex';
  public_visibility: 'private' | 'semi-public' | 'public' | 'highly_public';
  
  // Geographic and Social Context
  primary_location?: string;
  social_context: string[];
  institutional_context?: string[];
  
  // Story Context
  story_thread_ids: string[];
  narrative_role: string; // 'protagonist', 'antagonist', 'supporting', 'catalyst', etc.
  plot_significance?: string;
  
  // Modern Relevance
  historical_parallels?: string[];
  contemporary_relevance?: number;
  
  // Quality Metrics
  verification_level: 'confirmed' | 'probable' | 'speculative';
  source_reliability: number; // 0.0-1.0
  cross_reference_count: number;
  
  // Processing
  extraction_method: string;
  confidence_factors: string[];
  disambiguation_notes?: string[];
}

/**
 * Temporal Narrative/Story Thread from StoryMap Intelligence Phase 3
 * Narrative structures connecting related articles across time
 */
export interface IntelligenceStoryThread extends BaseIntelligenceModel {
  // Core Story
  thread_title: string;
  thread_description: string;
  thread_type: 'biographical' | 'event_sequence' | 'institutional' | 'social_movement' | 'conflict' | 'development';
  
  // Temporal Structure
  start_date: string; // ISO-8601
  end_date: string; // ISO-8601
  duration_months: number;
  chronological_structure: 'linear' | 'cyclical' | 'episodic' | 'complex';
  
  // Content
  article_count: number;
  participating_article_ids: string[];
  key_article_ids: string[]; // Most important articles in the thread
  
  // Entities and Relationships
  primary_entities: string[]; // Entity IDs of main characters
  supporting_entities: string[]; // Entity IDs of supporting characters
  key_relationships: string[]; // Relationship IDs central to story
  
  // Narrative Analysis (CRITICAL FOR JORDI)
  narrative_completeness: number; // 0.0-1.0
  story_arc_strength: number; // 0.0-1.0
  dramatic_tension: number; // 0.0-1.0
  human_interest_level: number; // 0.0-1.0
  documentary_potential: number; // 0.0-1.0
  uniqueness_score: number; // 0.0-1.0 how unusual/interesting
  
  // Historical Context
  historical_significance: number; // 0.0-1.0
  social_impact_score: number; // 0.0-1.0
  cultural_relevance: number; // 0.0-1.0
  
  // Geographic and Social Context
  primary_locations: string[];
  geographic_scope: 'local' | 'regional' | 'national' | 'international';
  social_spheres: string[]; // 'political', 'economic', 'cultural', etc.
  
  // Thematic Classification
  primary_themes: string[];
  secondary_themes: string[];
  genre_tags: string[]; // 'tragedy', 'triumph', 'mystery', 'scandal', etc.
  
  // Production Considerations (FOR DOCUMENTARY POTENTIAL)
  visual_potential: number; // 0.0-1.0 availability of visual elements
  archival_material_richness: number; // 0.0-1.0
  location_accessibility: number; // 0.0-1.0 for modern filming
  production_complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  
  // Modern Relevance
  contemporary_relevance: number; // 0.0-1.0
  modern_parallels: string[];
  educational_value: number; // 0.0-1.0
  
  // Quality and Completeness
  story_completeness: number; // 0.0-1.0
  evidence_strength: number; // 0.0-1.0
  source_diversity: number; // 0.0-1.0
  
  // Related Stories
  related_thread_ids: string[];
  predecessor_thread_ids: string[];
  successor_thread_ids: string[];
  
  // Processing
  thread_construction_confidence: number;
  manual_curation_level: 'none' | 'minimal' | 'moderate' | 'extensive';
  quality_review_status: 'pending' | 'reviewed' | 'approved';
}

/**
 * Timeline Entry for chronological navigation
 * Optimized for temporal queries and historical context
 */
export interface IntelligenceTimelineEntry extends BaseIntelligenceModel {
  // Temporal
  date: string; // ISO-8601
  date_precision: 'exact' | 'approximate' | 'before' | 'after' | 'circa';
  time_period: string; // '1920s', 'Early Depression Era', etc.
  
  // Event
  event_title: string;
  event_description: string;
  event_type: 'political' | 'social' | 'economic' | 'cultural' | 'technological' | 'natural' | 'personal';
  event_significance: 'local' | 'regional' | 'national' | 'international';
  
  // Context
  primary_location: string;
  involved_entities: string[]; // Entity IDs
  related_article_ids: string[];
  story_thread_ids: string[];
  
  // Narrative Context
  narrative_importance: number; // 0.0-1.0
  documentary_potential: number; // 0.0-1.0
  human_interest_level: number; // 0.0-1.0
  
  // Classification
  historical_period_tags: string[];
  thematic_tags: string[];
  consequence_level: 'minimal' | 'moderate' | 'significant' | 'transformative';
  
  // Quality
  evidence_strength: number; // 0.0-1.0
  source_reliability: number; // 0.0-1.0
  verification_status: 'confirmed' | 'probable' | 'speculative';
}

/**
 * Batch Import Response Types
 */
export interface IntelligenceBatchImportResult {
  success: boolean;
  total_processed: number;
  successful_imports: number;
  failed_imports: number;
  processing_time_ms: number;
  errors: string[];
  warnings: string[];
  summary: {
    articles: number;
    entities: number;
    relationships: number;
    story_threads: number;
    timeline_entries: number;
  };
}

/**
 * Data Quality Report
 */
export interface IntelligenceDataQualityReport {
  total_records: number;
  quality_distribution: {
    high_quality: number; // >0.8
    medium_quality: number; // 0.5-0.8
    low_quality: number; // <0.5
  };
  completeness_scores: {
    required_fields: number;
    recommended_fields: number;
    optional_fields: number;
  };
  validation_results: {
    referential_integrity: boolean;
    temporal_consistency: boolean;
    scoring_consistency: boolean;
  };
  recommendations: string[];
} 