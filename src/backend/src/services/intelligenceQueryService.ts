/**
 * Intelligence Query Service for Jordi
 * 
 * This service provides high-level query methods for Jordi to access
 * the rich StoryMap Intelligence data and discover compelling stories.
 * 
 * Optimized for Jordi's core mission: finding lost stories with documentary potential.
 */

import { query } from '../database/connection';
import {
  IntelligenceArticle,
  IntelligenceEntity,
  IntelligenceRelationship,
  IntelligenceStoryThread,
  IntelligenceTimelineEntry
} from '../models/storyMapIntelligenceModels';

export interface DocumentaryStoryQuery {
  limit?: number;
  minDocumentaryPotential?: number;
  minUniquenessScore?: number;
  minNarrativeCompleteness?: number;
  timePeriod?: string;
  themes?: string[];
  geographicScope?: 'local' | 'regional' | 'national' | 'international';
  productionComplexity?: 'simple' | 'moderate' | 'complex' | 'very_complex';
}

export interface EntityConnectionQuery {
  entityId?: string;
  entityName?: string;
  entityType?: string;
  minConfidence?: number;
  includeEvidence?: boolean;
  maxDegrees?: number;
}

export interface TemporalQuery {
  startDate?: string;
  endDate?: string;
  timelineGranularity?: 'day' | 'month' | 'year';
  eventSignificance?: 'local' | 'regional' | 'national' | 'international';
}

export interface StoryResult {
  story: IntelligenceStoryThread;
  keyArticles: IntelligenceArticle[];
  mainCharacters: IntelligenceEntity[];
  criticalRelationships: IntelligenceRelationship[];
  documentaryScore: number;
  reasonsForRecommendation: string[];
}

export class IntelligenceQueryService {
  
  /**
   * JORDI'S SIGNATURE QUERY: Find documentary-worthy stories
   * 
   * This is the core method for Jordi's mission - finding lost stories
   * that would make compelling documentaries.
   */
  async findDocumentaryStories(params: DocumentaryStoryQuery = {}): Promise<StoryResult[]> {
    const {
      limit = 5,
      minDocumentaryPotential = 0.7,
      minUniquenessScore = 0.6,
      minNarrativeCompleteness = 0.7,
      timePeriod,
      themes,
      geographicScope,
      productionComplexity
    } = params;

    let sql = `
      SELECT 
        st.*,
        array_agg(DISTINCT a.id) as article_ids,
        array_agg(DISTINCT e.id) as entity_ids,
        array_agg(DISTINCT r.id) as relationship_ids
      FROM intelligence_story_threads st
      LEFT JOIN intelligence_articles a ON a.id = ANY(
        SELECT jsonb_array_elements_text(st.participating_article_ids)
      )
      LEFT JOIN intelligence_entities e ON e.id = ANY(
        SELECT jsonb_array_elements_text(st.primary_entities)
      )
      LEFT JOIN intelligence_relationships r ON r.id = ANY(
        SELECT jsonb_array_elements_text(st.key_relationships)
      )
      WHERE 
        st.documentary_potential >= $1
        AND st.uniqueness_score >= $2
        AND st.narrative_completeness >= $3
    `;

    const queryParams: any[] = [minDocumentaryPotential, minUniquenessScore, minNarrativeCompleteness];
    let paramIndex = 4;

    // Add optional filters
    if (geographicScope) {
      sql += ` AND st.geographic_scope = $${paramIndex}`;
      queryParams.push(geographicScope);
      paramIndex++;
    }

    if (productionComplexity) {
      sql += ` AND st.production_complexity = $${paramIndex}`;
      queryParams.push(productionComplexity);
      paramIndex++;
    }

    if (themes && themes.length > 0) {
      sql += ` AND st.primary_themes @> $${paramIndex}`;
      queryParams.push(JSON.stringify(themes));
      paramIndex++;
    }

    sql += `
      GROUP BY st.id
      ORDER BY 
        (st.documentary_potential + st.uniqueness_score + st.narrative_completeness) DESC,
        st.historical_significance DESC
      LIMIT $${paramIndex}
    `;
    queryParams.push(limit);

    const result = await query(sql, queryParams);
    
    // Enrich results with related data
    const enrichedResults: StoryResult[] = [];
    
    for (const row of result.rows) {
      const storyThread: IntelligenceStoryThread = row;
      
      // Get key articles
      const keyArticles = await this.getArticlesByIds(row.article_ids.slice(0, 5));
      
      // Get main characters (entities)
      const mainCharacters = await this.getEntitiesByIds(row.entity_ids.slice(0, 10));
      
      // Get critical relationships
      const criticalRelationships = await this.getRelationshipsByIds(row.relationship_ids.slice(0, 5));
      
      // Calculate overall documentary score
      const documentaryScore = this.calculateDocumentaryScore(storyThread, keyArticles, mainCharacters);
      
      // Generate reasons for recommendation
      const reasonsForRecommendation = this.generateRecommendationReasons(storyThread, keyArticles);
      
      enrichedResults.push({
        story: storyThread,
        keyArticles,
        mainCharacters,
        criticalRelationships,
        documentaryScore,
        reasonsForRecommendation
      });
    }

    return enrichedResults;
  }

  /**
   * Find connections between entities with story evidence
   */
  async findEntityConnections(params: EntityConnectionQuery): Promise<{
    entity: IntelligenceEntity;
    connections: Array<{
      connectedEntity: IntelligenceEntity;
      relationship: IntelligenceRelationship;
      sharedStories: IntelligenceStoryThread[];
      connectionStrength: number;
    }>;
  } | null> {
    const { entityId, entityName, minConfidence = 0.5, maxDegrees = 2 } = params;
    
    let targetEntity: IntelligenceEntity | null = null;
    
    // Find the target entity
    if (entityId) {
      const entityResult = await query('SELECT * FROM intelligence_entities WHERE id = $1', [entityId]);
      targetEntity = entityResult.rows[0] || null;
    } else if (entityName) {
      const entityResult = await query(
        'SELECT * FROM intelligence_entities WHERE canonical_name ILIKE $1 OR aliases::text ILIKE $1 ORDER BY recognition_confidence DESC LIMIT 1',
        [`%${entityName}%`]
      );
      targetEntity = entityResult.rows[0] || null;
    }

    if (!targetEntity) {
      return null;
    }

    // Find relationships involving this entity
    const relationshipsResult = await query(`
      SELECT 
        r.*,
        e1.canonical_name as source_name,
        e2.canonical_name as target_name
      FROM intelligence_relationships r
      JOIN intelligence_entities e1 ON r.source_entity_id = e1.id
      JOIN intelligence_entities e2 ON r.target_entity_id = e2.id
      WHERE 
        (r.source_entity_id = $1 OR r.target_entity_id = $1)
        AND r.confidence >= $2
      ORDER BY r.confidence DESC, r.narrative_significance DESC
    `, [targetEntity.id, minConfidence]);

    const connections = [];
    
    for (const relRow of relationshipsResult.rows) {
      const relationship: IntelligenceRelationship = relRow;
      
      // Determine the connected entity
      const connectedEntityId = relationship.source_entity_id === targetEntity.id 
        ? relationship.target_entity_id 
        : relationship.source_entity_id;
      
      const connectedEntity = await this.getEntityById(connectedEntityId);
      if (!connectedEntity) continue;
      
      // Find shared stories
      const sharedStories = await this.getSharedStories(targetEntity.id, connectedEntityId);
      
      // Calculate connection strength
      const connectionStrength = this.calculateConnectionStrength(relationship, sharedStories);
      
      connections.push({
        connectedEntity,
        relationship,
        sharedStories,
        connectionStrength
      });
    }

    // Sort by connection strength
    connections.sort((a, b) => b.connectionStrength - a.connectionStrength);

    return {
      entity: targetEntity,
      connections: connections.slice(0, 20) // Limit to top 20 connections
    };
  }

  /**
   * Create a timeline of events with documentary potential
   */
  async createDocumentaryTimeline(params: TemporalQuery): Promise<Array<{
    date: string;
    events: IntelligenceTimelineEntry[];
    articles: IntelligenceArticle[];
    documentaryMoments: Array<{
      title: string;
      description: string;
      visualPotential: number;
      emotionalImpact: number;
    }>;
  }>> {
    const { startDate, endDate, eventSignificance = 'regional' } = params;
    
    let sql = `
      SELECT 
        te.*,
        array_agg(DISTINCT a.id) as related_article_ids
      FROM intelligence_timeline_entries te
      LEFT JOIN intelligence_articles a ON a.id = ANY(
        SELECT jsonb_array_elements_text(te.related_article_ids)
      )
      WHERE te.documentary_potential >= 0.6
    `;

    const queryParams: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      sql += ` AND te.date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND te.date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    if (eventSignificance) {
      sql += ` AND te.event_significance = $${paramIndex}`;
      queryParams.push(eventSignificance);
      paramIndex++;
    }

    sql += `
      GROUP BY te.id
      ORDER BY te.date ASC, te.documentary_potential DESC
    `;

    const result = await query(sql, queryParams);
    
    // Group by date and enrich
    const timelineMap = new Map();
    
    for (const row of result.rows) {
      const entry: IntelligenceTimelineEntry = row;
      const dateKey = entry.date;
      
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, {
          date: dateKey,
          events: [],
          articles: [],
          documentaryMoments: []
        });
      }
      
      const timelineEntry = timelineMap.get(dateKey);
      timelineEntry.events.push(entry);
      
      // Get related articles
      if (row.related_article_ids) {
        const articles = await this.getArticlesByIds(row.related_article_ids);
        timelineEntry.articles.push(...articles);
      }
      
      // Generate documentary moments
      timelineEntry.documentaryMoments.push({
        title: entry.event_title,
        description: entry.event_description,
        visualPotential: entry.documentary_potential || 0,
        emotionalImpact: entry.human_interest_level || 0
      });
    }

    return Array.from(timelineMap.values());
  }

  /**
   * Helper methods for data enrichment
   */
  private async getArticlesByIds(ids: string[]): Promise<IntelligenceArticle[]> {
    if (!ids || ids.length === 0) return [];
    
    const result = await query(
      'SELECT * FROM intelligence_articles WHERE id = ANY($1) ORDER BY documentary_potential DESC',
      [ids]
    );
    return result.rows;
  }

  private async getEntitiesByIds(ids: string[]): Promise<IntelligenceEntity[]> {
    if (!ids || ids.length === 0) return [];
    
    const result = await query(
      'SELECT * FROM intelligence_entities WHERE id = ANY($1) ORDER BY documentary_potential DESC',
      [ids]
    );
    return result.rows;
  }

  private async getRelationshipsByIds(ids: string[]): Promise<IntelligenceRelationship[]> {
    if (!ids || ids.length === 0) return [];
    
    const result = await query(
      'SELECT * FROM intelligence_relationships WHERE id = ANY($1) ORDER BY dramatic_tension DESC',
      [ids]
    );
    return result.rows;
  }

  private async getEntityById(id: string): Promise<IntelligenceEntity | null> {
    const result = await query('SELECT * FROM intelligence_entities WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  private async getSharedStories(entityId1: string, entityId2: string): Promise<IntelligenceStoryThread[]> {
    const result = await query(`
      SELECT DISTINCT st.*
      FROM intelligence_story_threads st
      WHERE 
        st.primary_entities::jsonb ? $1
        AND st.primary_entities::jsonb ? $2
      ORDER BY st.documentary_potential DESC
      LIMIT 5
    `, [entityId1, entityId2]);
    
    return result.rows;
  }

  /**
   * Scoring and analysis methods
   */
  private calculateDocumentaryScore(
    story: IntelligenceStoryThread,
    articles: IntelligenceArticle[],
    entities: IntelligenceEntity[]
  ): number {
    const storyScore = (
      story.documentary_potential * 0.3 +
      story.uniqueness_score * 0.25 +
      story.narrative_completeness * 0.2 +
      story.dramatic_tension * 0.15 +
      story.visual_potential * 0.1
    );

    const articleScore = articles.length > 0 
      ? articles.reduce((sum, a) => sum + (a.documentary_potential || 0), 0) / articles.length 
      : 0;

    const entityScore = entities.length > 0
      ? entities.reduce((sum, e) => sum + (e.documentary_potential || 0), 0) / entities.length
      : 0;

    return Math.round((storyScore * 0.6 + articleScore * 0.25 + entityScore * 0.15) * 100) / 100;
  }

  private calculateConnectionStrength(
    relationship: IntelligenceRelationship,
    sharedStories: IntelligenceStoryThread[]
  ): number {
    const relationshipStrength = (
      relationship.confidence * 0.3 +
      relationship.narrative_significance * 0.25 +
      relationship.dramatic_tension * 0.2 +
      relationship.evidence_strength * 0.15 +
      (relationship.cross_reference_count || 0) / 10 * 0.1
    );

    const storyStrength = sharedStories.length > 0
      ? sharedStories.reduce((sum, s) => sum + s.documentary_potential, 0) / sharedStories.length
      : 0;

    return Math.round((relationshipStrength * 0.7 + storyStrength * 0.3) * 100) / 100;
  }

  private generateRecommendationReasons(
    story: IntelligenceStoryThread,
    articles: IntelligenceArticle[]
  ): string[] {
    const reasons: string[] = [];

    if (story.documentary_potential >= 0.8) {
      reasons.push(`Exceptional visual storytelling potential (${Math.round(story.documentary_potential * 100)}%)`);
    }

    if (story.uniqueness_score >= 0.8) {
      reasons.push(`Highly unique and previously overlooked story (${Math.round(story.uniqueness_score * 100)}% uniqueness)`);
    }

    if (story.dramatic_tension >= 0.7) {
      reasons.push(`Strong narrative tension and conflict (${Math.round(story.dramatic_tension * 100)}% dramatic tension)`);
    }

    if (story.human_interest_level >= 0.7) {
      reasons.push(`Compelling human elements and emotional resonance (${Math.round(story.human_interest_level * 100)}% human interest)`);
    }

    if (story.contemporary_relevance >= 0.6) {
      reasons.push(`Relevant to modern audiences and current issues (${Math.round(story.contemporary_relevance * 100)}% contemporary relevance)`);
    }

    if (story.production_complexity === 'simple' || story.production_complexity === 'moderate') {
      reasons.push(`Feasible production complexity (${story.production_complexity})`);
    }

    if (story.archival_material_richness >= 0.7) {
      reasons.push(`Rich archival materials available for production (${Math.round(story.archival_material_richness * 100)}% material richness)`);
    }

    if (articles.some(a => a.has_images)) {
      reasons.push('Historical visual elements available from newspaper archives');
    }

    return reasons;
  }

  /**
   * Advanced query methods for specific Jordi use cases
   */
  
  /**
   * Find stories similar to a given story thread
   */
  async findSimilarStories(storyId: string, limit: number = 5): Promise<IntelligenceStoryThread[]> {
    const originalStory = await query(
      'SELECT * FROM intelligence_story_threads WHERE id = $1',
      [storyId]
    );

    if (originalStory.rows.length === 0) {
      return [];
    }

    const story = originalStory.rows[0];

    // Find stories with similar themes, geographic scope, and time period
    const result = await query(`
      SELECT *,
        (
          CASE WHEN primary_themes::jsonb && $2::jsonb THEN 0.3 ELSE 0 END +
          CASE WHEN geographic_scope = $3 THEN 0.2 ELSE 0 END +
          CASE WHEN thread_type = $4 THEN 0.2 ELSE 0 END +
          CASE WHEN ABS(EXTRACT(YEAR FROM start_date) - EXTRACT(YEAR FROM $5::date)) <= 5 THEN 0.2 ELSE 0 END +
          CASE WHEN genre_tags::jsonb && $6::jsonb THEN 0.1 ELSE 0 END
        ) as similarity_score
      FROM intelligence_story_threads
      WHERE 
        id != $1
        AND documentary_potential >= 0.6
      ORDER BY similarity_score DESC, documentary_potential DESC
      LIMIT $7
    `, [
      storyId,
      JSON.stringify(story.primary_themes),
      story.geographic_scope,
      story.thread_type,
      story.start_date,
      JSON.stringify(story.genre_tags),
      limit
    ]);

    return result.rows;
  }

  /**
   * Get comprehensive story context for Jordi's detailed analysis
   */
  async getStoryContext(storyId: string): Promise<{
    story: IntelligenceStoryThread;
    fullArticles: IntelligenceArticle[];
    allEntities: IntelligenceEntity[];
    allRelationships: IntelligenceRelationship[];
    timeline: IntelligenceTimelineEntry[];
    relatedStories: IntelligenceStoryThread[];
    productionNotes: {
      difficulty: string;
      visualAssets: string[];
      locationRequirements: string[];
      expertInterviews: string[];
      archivalSources: number;
    };
  } | null> {
    const storyResult = await query('SELECT * FROM intelligence_story_threads WHERE id = $1', [storyId]);
    
    if (storyResult.rows.length === 0) {
      return null;
    }

    const story: IntelligenceStoryThread = storyResult.rows[0];

    // Get all related data
    const fullArticles = await this.getArticlesByIds(story.participating_article_ids);
    const allEntities = await this.getEntitiesByIds([...story.primary_entities, ...story.supporting_entities]);
    const allRelationships = await this.getRelationshipsByIds(story.key_relationships);
    
    // Get timeline entries related to this story
    const timelineResult = await query(`
      SELECT * FROM intelligence_timeline_entries 
      WHERE story_thread_ids::jsonb ? $1 
      ORDER BY date ASC
    `, [storyId]);
    const timeline: IntelligenceTimelineEntry[] = timelineResult.rows;

    // Get related stories
    const relatedStories = await this.findSimilarStories(storyId, 3);

    // Generate production notes
    const productionNotes = {
      difficulty: story.production_complexity,
      visualAssets: fullArticles
        .filter(a => a.has_images)
        .flatMap(a => a.visual_elements || [])
        .slice(0, 10),
      locationRequirements: story.primary_locations || [],
      expertInterviews: allEntities
        .filter(e => e.documentary_potential >= 0.7)
        .map(e => `${e.canonical_name} (${e.entity_type})`)
        .slice(0, 5),
      archivalSources: fullArticles.length
    };

    return {
      story,
      fullArticles,
      allEntities,
      allRelationships,
      timeline,
      relatedStories,
      productionNotes
    };
  }
} 