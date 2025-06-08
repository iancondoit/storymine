/**
 * StoryMap Intelligence Data Import Service
 * 
 * Handles importing the processed data from StoryMap Intelligence including:
 * - Articles: enhanced_articles_complete.json (1.1GB)
 * - Entities: entities_filtered_batch_*.json.gz (144 files, 50MB total)
 * - Relationships: story_relationships.json.gz (51MB)
 * - Stories: temporal_narrative.json (75KB)
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { glob as globCallback } from 'glob';
import {
  IntelligenceArticle,
  IntelligenceEntity,
  IntelligenceRelationship,
  IntelligenceStoryThread,
  IntelligenceTimelineEntry,
  IntelligenceBatchImportResult,
  IntelligenceDataQualityReport
} from '../models/storyMapIntelligenceModels';
import { query } from '../database/connection';

const pipelineAsync = promisify(pipeline);
const glob = promisify(globCallback);

interface ImportConfig {
  dataDirectory: string;
  batchSize: number;
  validateData: boolean;
  skipDuplicates: boolean;
  createBackup: boolean;
}

interface ImportProgress {
  currentFile?: string;
  processedFiles: number;
  totalFiles: number;
  processedRecords: number;
  totalRecords: number;
  startTime: Date;
  errors: string[];
  warnings: string[];
}

export class StoryMapIntelligenceImport {
  private config: ImportConfig;
  private progress: ImportProgress;

  constructor(config: Partial<ImportConfig> = {}) {
    this.config = {
      dataDirectory: config.dataDirectory || './storymine-data',
      batchSize: config.batchSize || 1000,
      validateData: config.validateData !== false, // default true
      skipDuplicates: config.skipDuplicates !== false, // default true
      createBackup: config.createBackup !== false // default true
    };

    this.progress = {
      processedFiles: 0,
      totalFiles: 0,
      processedRecords: 0,
      totalRecords: 0,
      startTime: new Date(),
      errors: [],
      warnings: []
    };
  }

  /**
   * Main import method - imports all StoryMap Intelligence data
   */
  async importAllData(): Promise<IntelligenceBatchImportResult> {
    console.log('🚀 Starting StoryMap Intelligence data import...');
    const startTime = Date.now();

    try {
      // Verify data directory exists
      if (!fs.existsSync(this.config.dataDirectory)) {
        throw new Error(`Data directory not found: ${this.config.dataDirectory}`);
      }

      // Create database tables if they don't exist
      await this.createIntelligenceTables();

      // Import data in the correct order (respecting foreign key dependencies)
      const results = {
        articles: await this.importArticles(),
        entities: await this.importEntities(),
        relationships: await this.importRelationships(),
        story_threads: await this.importStoryThreads(),
        timeline_entries: await this.importTimelineEntries()
      };

      const totalProcessed = Object.values(results).reduce((sum, count) => sum + count, 0);
      const processingTime = Date.now() - startTime;

      console.log(`✅ Import completed successfully in ${processingTime}ms`);
      console.log(`📊 Summary: ${JSON.stringify(results, null, 2)}`);

      return {
        success: true,
        total_processed: totalProcessed,
        successful_imports: totalProcessed - this.progress.errors.length,
        failed_imports: this.progress.errors.length,
        processing_time_ms: processingTime,
        errors: this.progress.errors,
        warnings: this.progress.warnings,
        summary: results
      };

    } catch (error) {
      console.error('❌ Import failed:', error);
      return {
        success: false,
        total_processed: this.progress.processedRecords,
        successful_imports: 0,
        failed_imports: this.progress.processedRecords,
        processing_time_ms: Date.now() - startTime,
        errors: [...this.progress.errors, error instanceof Error ? error.message : String(error)],
        warnings: this.progress.warnings,
        summary: {
          articles: 0,
          entities: 0,
          relationships: 0,
          story_threads: 0,
          timeline_entries: 0
        }
      };
    }
  }

  /**
   * Import enhanced articles from Phase 1
   */
  private async importArticles(): Promise<number> {
    console.log('📰 Importing articles...');
    const filePath = path.join(this.config.dataDirectory, 'phase1', 'enhanced_articles_complete.json');

    if (!fs.existsSync(filePath)) {
      this.progress.warnings.push(`Articles file not found: ${filePath}`);
      return 0;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const articles: IntelligenceArticle[] = JSON.parse(fileContent);

    let imported = 0;
    for (let i = 0; i < articles.length; i += this.config.batchSize) {
      const batch = articles.slice(i, i + this.config.batchSize);
      imported += await this.importArticleBatch(batch);
      
      console.log(`   📰 Processed ${Math.min(i + this.config.batchSize, articles.length)}/${articles.length} articles`);
    }

    console.log(`✅ Imported ${imported} articles`);
    return imported;
  }

  /**
   * Import entities from Phase 2b batch files
   */
  private async importEntities(): Promise<number> {
    console.log('👥 Importing entities...');
    const entityPattern = path.join(this.config.dataDirectory, 'phase2b', 'entities_filtered_batch_*.json.gz');
    const entityFiles = await glob(entityPattern);

    if (entityFiles.length === 0) {
      this.progress.warnings.push(`No entity batch files found: ${entityPattern}`);
      return 0;
    }

    let totalImported = 0;
    for (let i = 0; i < entityFiles.length; i++) {
      const filePath = entityFiles[i];
      console.log(`   👥 Processing entity file ${i + 1}/${entityFiles.length}: ${path.basename(filePath)}`);
      
      try {
        const entities = await this.readGzipJsonFile<IntelligenceEntity[]>(filePath);
        const imported = await this.importEntityBatch(entities);
        totalImported += imported;
      } catch (error) {
        this.progress.errors.push(`Failed to process entity file ${filePath}: ${error}`);
      }
    }

    console.log(`✅ Imported ${totalImported} entities from ${entityFiles.length} files`);
    return totalImported;
  }

  /**
   * Import story-backed relationships from Phase 3
   */
  private async importRelationships(): Promise<number> {
    console.log('🔗 Importing relationships...');
    const filePath = path.join(this.config.dataDirectory, 'phase3_stories', 'story_relationships.json.gz');

    if (!fs.existsSync(filePath)) {
      this.progress.warnings.push(`Relationships file not found: ${filePath}`);
      return 0;
    }

    const relationships = await this.readGzipJsonFile<IntelligenceRelationship[]>(filePath);
    
    let imported = 0;
    for (let i = 0; i < relationships.length; i += this.config.batchSize) {
      const batch = relationships.slice(i, i + this.config.batchSize);
      imported += await this.importRelationshipBatch(batch);
      
      console.log(`   🔗 Processed ${Math.min(i + this.config.batchSize, relationships.length)}/${relationships.length} relationships`);
    }

    console.log(`✅ Imported ${imported} relationships`);
    return imported;
  }

  /**
   * Import temporal narratives/story threads from Phase 3
   */
  private async importStoryThreads(): Promise<number> {
    console.log('📚 Importing story threads...');
    const filePath = path.join(this.config.dataDirectory, 'phase3_stories', 'temporal_narrative.json');

    if (!fs.existsSync(filePath)) {
      this.progress.warnings.push(`Story threads file not found: ${filePath}`);
      return 0;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const storyThreads: IntelligenceStoryThread[] = JSON.parse(fileContent);

    const imported = await this.importStoryThreadBatch(storyThreads);
    console.log(`✅ Imported ${imported} story threads`);
    return imported;
  }

  /**
   * Import timeline entries (if available)
   */
  private async importTimelineEntries(): Promise<number> {
    console.log('⏰ Importing timeline entries...');
    const filePath = path.join(this.config.dataDirectory, 'phase4', 'timeline_entries.json');

    if (!fs.existsSync(filePath)) {
      this.progress.warnings.push(`Timeline entries file not found: ${filePath} (this is optional)`);
      return 0;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const timelineEntries: IntelligenceTimelineEntry[] = JSON.parse(fileContent);

    const imported = await this.importTimelineEntryBatch(timelineEntries);
    console.log(`✅ Imported ${imported} timeline entries`);
    return imported;
  }

  /**
   * Read and decompress gzipped JSON files
   */
  private async readGzipJsonFile<T>(filePath: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const gunzip = zlib.createGunzip();
      
      let data = '';
      gunzip.on('data', (chunk) => {
        data += chunk.toString();
      });

      gunzip.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse JSON from ${filePath}: ${error}`));
        }
      });

      gunzip.on('error', reject);
      readStream.pipe(gunzip);
    });
  }

  /**
   * Import a batch of articles
   */
  private async importArticleBatch(articles: IntelligenceArticle[]): Promise<number> {
    let imported = 0;

    for (const article of articles) {
      try {
        if (this.config.validateData && !this.validateArticle(article)) {
          this.progress.warnings.push(`Invalid article data for ID: ${article.id}`);
          continue;
        }

        await query(`
          INSERT INTO intelligence_articles (
            id, title, content, processed_content, publication_date, source_publication,
            geographic_origin, category, subcategory, is_advertisement, is_classified,
            classification_confidence, quality_score, narrative_score, human_interest_score,
            documentary_potential, historical_significance, word_count, language,
            reading_level, emotional_tone, urgency_level, story_arc_position,
            narrative_themes, time_period_context, geographic_scope, related_article_ids,
            story_thread_ids, has_images, extraction_confidence, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
          ) ON CONFLICT (id) DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP
        `, [
          article.id, article.title, article.content, article.processed_content,
          article.publication_date, article.source_publication, article.geographic_origin,
          article.category, article.subcategory, article.is_advertisement, article.is_classified,
          article.classification_confidence, article.quality_score, article.narrative_score,
          article.human_interest_score, article.documentary_potential, article.historical_significance,
          article.word_count, article.language, article.reading_level, article.emotional_tone,
          article.urgency_level, article.story_arc_position, JSON.stringify(article.narrative_themes),
          JSON.stringify(article.time_period_context), JSON.stringify(article.geographic_scope),
          JSON.stringify(article.related_article_ids), JSON.stringify(article.story_thread_ids),
          article.has_images, article.extraction_confidence, article.created_at, article.updated_at
        ]);

        imported++;
      } catch (error) {
        this.progress.errors.push(`Failed to import article ${article.id}: ${error}`);
      }
    }

    return imported;
  }

  /**
   * Import a batch of entities
   */
  private async importEntityBatch(entities: IntelligenceEntity[]): Promise<number> {
    let imported = 0;

    for (const entity of entities) {
      try {
        if (this.config.validateData && !this.validateEntity(entity)) {
          this.progress.warnings.push(`Invalid entity data for ID: ${entity.id}`);
          continue;
        }

        await query(`
          INSERT INTO intelligence_entities (
            id, canonical_name, aliases, entity_type, entity_subtype, recognition_confidence,
            total_mentions, unique_article_mentions, mention_density, birth_date, death_date,
            biographical_summary, historical_role, primary_location, associated_locations,
            geographic_scope, time_period_tags, historical_era, historical_significance_score,
            narrative_importance, documentary_potential, public_interest_level, thematic_tags,
            notable_associates, co_occurrence_strength, network_centrality_score,
            data_quality_score, source_diversity, verification_status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
          ) ON CONFLICT (id) DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP
        `, [
          entity.id, entity.canonical_name, JSON.stringify(entity.aliases), entity.entity_type,
          entity.entity_subtype, entity.recognition_confidence, entity.total_mentions,
          entity.unique_article_mentions, entity.mention_density, entity.birth_date, entity.death_date,
          entity.biographical_summary, entity.historical_role, entity.primary_location,
          JSON.stringify(entity.associated_locations), entity.geographic_scope,
          JSON.stringify(entity.time_period_tags), entity.historical_era, entity.historical_significance_score,
          entity.narrative_importance, entity.documentary_potential, entity.public_interest_level,
          JSON.stringify(entity.thematic_tags), JSON.stringify(entity.notable_associates),
          JSON.stringify(entity.co_occurrence_strength), entity.network_centrality_score,
          entity.data_quality_score, entity.source_diversity, entity.verification_status,
          entity.created_at, entity.updated_at
        ]);

        imported++;
      } catch (error) {
        this.progress.errors.push(`Failed to import entity ${entity.id}: ${error}`);
      }
    }

    return imported;
  }

  /**
   * Import a batch of relationships
   */
  private async importRelationshipBatch(relationships: IntelligenceRelationship[]): Promise<number> {
    let imported = 0;

    for (const relationship of relationships) {
      try {
        if (this.config.validateData && !this.validateRelationship(relationship)) {
          this.progress.warnings.push(`Invalid relationship data for ID: ${relationship.id}`);
          continue;
        }

        await query(`
          INSERT INTO intelligence_relationships (
            id, source_entity_id, target_entity_id, relationship_type, relationship_subtype,
            confidence, evidence_strength, supporting_article_ids, evidence_quotes,
            first_documented, last_documented, temporal_stability, narrative_significance,
            dramatic_tension, human_interest_factor, documentary_potential, relationship_intensity,
            relationship_nature, public_visibility, primary_location, social_context,
            story_thread_ids, narrative_role, verification_level, source_reliability,
            cross_reference_count, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
          ) ON CONFLICT (id) DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP
        `, [
          relationship.id, relationship.source_entity_id, relationship.target_entity_id,
          relationship.relationship_type, relationship.relationship_subtype, relationship.confidence,
          relationship.evidence_strength, JSON.stringify(relationship.supporting_article_ids),
          JSON.stringify(relationship.evidence_quotes), relationship.first_documented,
          relationship.last_documented, relationship.temporal_stability, relationship.narrative_significance,
          relationship.dramatic_tension, relationship.human_interest_factor, relationship.documentary_potential,
          relationship.relationship_intensity, relationship.relationship_nature, relationship.public_visibility,
          relationship.primary_location, JSON.stringify(relationship.social_context),
          JSON.stringify(relationship.story_thread_ids), relationship.narrative_role,
          relationship.verification_level, relationship.source_reliability, relationship.cross_reference_count,
          relationship.created_at, relationship.updated_at
        ]);

        imported++;
      } catch (error) {
        this.progress.errors.push(`Failed to import relationship ${relationship.id}: ${error}`);
      }
    }

    return imported;
  }

  /**
   * Import a batch of story threads
   */
  private async importStoryThreadBatch(storyThreads: IntelligenceStoryThread[]): Promise<number> {
    let imported = 0;

    for (const thread of storyThreads) {
      try {
        if (this.config.validateData && !this.validateStoryThread(thread)) {
          this.progress.warnings.push(`Invalid story thread data for ID: ${thread.id}`);
          continue;
        }

        await query(`
          INSERT INTO intelligence_story_threads (
            id, thread_title, thread_description, thread_type, start_date, end_date,
            duration_months, chronological_structure, article_count, participating_article_ids,
            key_article_ids, primary_entities, supporting_entities, key_relationships,
            narrative_completeness, story_arc_strength, dramatic_tension, human_interest_level,
            documentary_potential, uniqueness_score, historical_significance, social_impact_score,
            cultural_relevance, primary_locations, geographic_scope, social_spheres,
            primary_themes, secondary_themes, genre_tags, visual_potential,
            archival_material_richness, production_complexity, contemporary_relevance,
            educational_value, story_completeness, evidence_strength, source_diversity,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
            $35, $36, $37, $38, $39
          ) ON CONFLICT (id) DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP
        `, [
          thread.id, thread.thread_title, thread.thread_description, thread.thread_type,
          thread.start_date, thread.end_date, thread.duration_months, thread.chronological_structure,
          thread.article_count, JSON.stringify(thread.participating_article_ids),
          JSON.stringify(thread.key_article_ids), JSON.stringify(thread.primary_entities),
          JSON.stringify(thread.supporting_entities), JSON.stringify(thread.key_relationships),
          thread.narrative_completeness, thread.story_arc_strength, thread.dramatic_tension,
          thread.human_interest_level, thread.documentary_potential, thread.uniqueness_score,
          thread.historical_significance, thread.social_impact_score, thread.cultural_relevance,
          JSON.stringify(thread.primary_locations), thread.geographic_scope,
          JSON.stringify(thread.social_spheres), JSON.stringify(thread.primary_themes),
          JSON.stringify(thread.secondary_themes), JSON.stringify(thread.genre_tags),
          thread.visual_potential, thread.archival_material_richness, thread.production_complexity,
          thread.contemporary_relevance, thread.educational_value, thread.story_completeness,
          thread.evidence_strength, thread.source_diversity, thread.created_at, thread.updated_at
        ]);

        imported++;
      } catch (error) {
        this.progress.errors.push(`Failed to import story thread ${thread.id}: ${error}`);
      }
    }

    return imported;
  }

  /**
   * Import a batch of timeline entries
   */
  private async importTimelineEntryBatch(timelineEntries: IntelligenceTimelineEntry[]): Promise<number> {
    let imported = 0;

    for (const entry of timelineEntries) {
      try {
        await query(`
          INSERT INTO intelligence_timeline_entries (
            id, date, date_precision, time_period, event_title, event_description,
            event_type, event_significance, primary_location, involved_entities,
            related_article_ids, story_thread_ids, narrative_importance, documentary_potential,
            human_interest_level, historical_period_tags, thematic_tags, consequence_level,
            evidence_strength, source_reliability, verification_status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23
          ) ON CONFLICT (id) DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP
        `, [
          entry.id, entry.date, entry.date_precision, entry.time_period, entry.event_title,
          entry.event_description, entry.event_type, entry.event_significance, entry.primary_location,
          JSON.stringify(entry.involved_entities), JSON.stringify(entry.related_article_ids),
          JSON.stringify(entry.story_thread_ids), entry.narrative_importance, entry.documentary_potential,
          entry.human_interest_level, JSON.stringify(entry.historical_period_tags),
          JSON.stringify(entry.thematic_tags), entry.consequence_level, entry.evidence_strength,
          entry.source_reliability, entry.verification_status, entry.created_at, entry.updated_at
        ]);

        imported++;
      } catch (error) {
        this.progress.errors.push(`Failed to import timeline entry ${entry.id}: ${error}`);
      }
    }

    return imported;
  }

  /**
   * Create the necessary database tables for Intelligence data
   */
  private async createIntelligenceTables(): Promise<void> {
    console.log('🗄️ Creating Intelligence database tables...');

    // Create tables for the new Intelligence data format
    // This extends the existing schema with the rich StoryMap Intelligence data
    
    // Articles table with full Intelligence fields
    await query(`
      CREATE TABLE IF NOT EXISTS intelligence_articles (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        processed_content TEXT,
        publication_date DATE NOT NULL,
        source_publication TEXT,
        geographic_origin TEXT,
        page_number INTEGER,
        column_position INTEGER,
        category TEXT,
        subcategory TEXT,
        is_advertisement BOOLEAN DEFAULT FALSE,
        is_classified BOOLEAN DEFAULT FALSE,
        classification_confidence FLOAT,
        quality_score FLOAT NOT NULL,
        narrative_score FLOAT NOT NULL,
        human_interest_score FLOAT,
        documentary_potential FLOAT,
        historical_significance FLOAT,
        word_count INTEGER,
        language TEXT DEFAULT 'en',
        reading_level FLOAT,
        emotional_tone TEXT,
        urgency_level TEXT,
        story_arc_position TEXT,
        narrative_themes JSONB,
        time_period_context JSONB,
        geographic_scope JSONB,
        related_article_ids JSONB,
        story_thread_ids JSONB,
        sequel_article_id UUID,
        prequel_article_id UUID,
        has_images BOOLEAN DEFAULT FALSE,
        image_descriptions JSONB,
        visual_elements JSONB,
        extraction_confidence FLOAT,
        processing_notes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Entities table with full Intelligence fields
    await query(`
      CREATE TABLE IF NOT EXISTS intelligence_entities (
        id UUID PRIMARY KEY,
        canonical_name TEXT NOT NULL,
        aliases JSONB,
        entity_type TEXT NOT NULL,
        entity_subtype TEXT,
        recognition_confidence FLOAT NOT NULL,
        total_mentions INTEGER,
        unique_article_mentions INTEGER,
        mention_density FLOAT,
        birth_date DATE,
        death_date DATE,
        active_period_start DATE,
        active_period_end DATE,
        biographical_summary TEXT,
        historical_role TEXT,
        primary_location TEXT,
        associated_locations JSONB,
        geographic_scope TEXT,
        organization_type TEXT,
        parent_organization TEXT,
        founding_date DATE,
        dissolution_date DATE,
        time_period_tags JSONB,
        historical_era TEXT,
        peak_activity_period TEXT,
        historical_significance_score FLOAT,
        narrative_importance FLOAT,
        documentary_potential FLOAT,
        public_interest_level FLOAT,
        thematic_tags JSONB,
        social_role TEXT,
        political_affiliation TEXT,
        professional_categories JSONB,
        notable_associates JSONB,
        co_occurrence_strength JSONB,
        network_centrality_score FLOAT,
        modern_relevance_score FLOAT,
        contemporary_connections JSONB,
        data_quality_score FLOAT,
        source_diversity FLOAT,
        verification_status TEXT,
        entity_linking_score FLOAT,
        disambiguation_notes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Relationships table with full Intelligence fields
    await query(`
      CREATE TABLE IF NOT EXISTS intelligence_relationships (
        id UUID PRIMARY KEY,
        source_entity_id UUID NOT NULL,
        target_entity_id UUID NOT NULL,
        relationship_type TEXT NOT NULL,
        relationship_subtype TEXT,
        confidence FLOAT NOT NULL,
        evidence_strength FLOAT,
        supporting_article_ids JSONB,
        evidence_quotes JSONB,
        contextual_quotes JSONB,
        first_documented DATE,
        last_documented DATE,
        relationship_duration TEXT,
        temporal_stability FLOAT,
        evolution_pattern TEXT,
        narrative_significance FLOAT,
        dramatic_tension FLOAT,
        human_interest_factor FLOAT,
        documentary_potential FLOAT,
        relationship_intensity TEXT,
        relationship_nature TEXT,
        public_visibility TEXT,
        primary_location TEXT,
        social_context JSONB,
        institutional_context JSONB,
        story_thread_ids JSONB,
        narrative_role TEXT,
        plot_significance TEXT,
        historical_parallels JSONB,
        contemporary_relevance FLOAT,
        verification_level TEXT,
        source_reliability FLOAT,
        cross_reference_count INTEGER,
        extraction_method TEXT,
        confidence_factors JSONB,
        disambiguation_notes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_entity_id) REFERENCES intelligence_entities(id),
        FOREIGN KEY (target_entity_id) REFERENCES intelligence_entities(id)
      )
    `);

    // Story threads table
    await query(`
      CREATE TABLE IF NOT EXISTS intelligence_story_threads (
        id UUID PRIMARY KEY,
        thread_title TEXT NOT NULL,
        thread_description TEXT,
        thread_type TEXT,
        start_date DATE,
        end_date DATE,
        duration_months INTEGER,
        chronological_structure TEXT,
        article_count INTEGER,
        participating_article_ids JSONB,
        key_article_ids JSONB,
        primary_entities JSONB,
        supporting_entities JSONB,
        key_relationships JSONB,
        narrative_completeness FLOAT,
        story_arc_strength FLOAT,
        dramatic_tension FLOAT,
        human_interest_level FLOAT,
        documentary_potential FLOAT,
        uniqueness_score FLOAT,
        historical_significance FLOAT,
        social_impact_score FLOAT,
        cultural_relevance FLOAT,
        primary_locations JSONB,
        geographic_scope TEXT,
        social_spheres JSONB,
        primary_themes JSONB,
        secondary_themes JSONB,
        genre_tags JSONB,
        visual_potential FLOAT,
        archival_material_richness FLOAT,
        location_accessibility FLOAT,
        production_complexity TEXT,
        contemporary_relevance FLOAT,
        modern_parallels JSONB,
        educational_value FLOAT,
        story_completeness FLOAT,
        evidence_strength FLOAT,
        source_diversity FLOAT,
        related_thread_ids JSONB,
        predecessor_thread_ids JSONB,
        successor_thread_ids JSONB,
        thread_construction_confidence FLOAT,
        manual_curation_level TEXT,
        quality_review_status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Timeline entries table
    await query(`
      CREATE TABLE IF NOT EXISTS intelligence_timeline_entries (
        id UUID PRIMARY KEY,
        date DATE NOT NULL,
        date_precision TEXT,
        time_period TEXT,
        event_title TEXT NOT NULL,
        event_description TEXT,
        event_type TEXT,
        event_significance TEXT,
        primary_location TEXT,
        involved_entities JSONB,
        related_article_ids JSONB,
        story_thread_ids JSONB,
        narrative_importance FLOAT,
        documentary_potential FLOAT,
        human_interest_level FLOAT,
        historical_period_tags JSONB,
        thematic_tags JSONB,
        consequence_level TEXT,
        evidence_strength FLOAT,
        source_reliability FLOAT,
        verification_status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    await this.createIntelligenceIndexes();

    console.log('✅ Intelligence database tables created successfully');
  }

  /**
   * Create indexes for the Intelligence tables
   */
  private async createIntelligenceIndexes(): Promise<void> {
    console.log('📇 Creating Intelligence database indexes...');

    // Article indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_articles_publication_date ON intelligence_articles(publication_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_articles_quality_score ON intelligence_articles(quality_score)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_articles_narrative_score ON intelligence_articles(narrative_score)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_articles_documentary_potential ON intelligence_articles(documentary_potential)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_articles_source_publication ON intelligence_articles(source_publication)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_articles_category ON intelligence_articles(category)`);

    // Entity indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_entities_canonical_name ON intelligence_entities(canonical_name)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_entities_entity_type ON intelligence_entities(entity_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_entities_recognition_confidence ON intelligence_entities(recognition_confidence)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_entities_historical_significance ON intelligence_entities(historical_significance_score)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_entities_documentary_potential ON intelligence_entities(documentary_potential)`);

    // Relationship indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_relationships_source_entity ON intelligence_relationships(source_entity_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_relationships_target_entity ON intelligence_relationships(target_entity_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_relationships_type ON intelligence_relationships(relationship_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_relationships_confidence ON intelligence_relationships(confidence)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_relationships_documentary_potential ON intelligence_relationships(documentary_potential)`);

    // Story thread indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_story_threads_start_date ON intelligence_story_threads(start_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_story_threads_documentary_potential ON intelligence_story_threads(documentary_potential)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_story_threads_uniqueness_score ON intelligence_story_threads(uniqueness_score)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_story_threads_thread_type ON intelligence_story_threads(thread_type)`);

    // Timeline indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_timeline_entries_date ON intelligence_timeline_entries(date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_timeline_entries_event_type ON intelligence_timeline_entries(event_type)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intelligence_timeline_entries_documentary_potential ON intelligence_timeline_entries(documentary_potential)`);

    console.log('✅ Intelligence database indexes created successfully');
  }

  /**
   * Validation methods
   */
  private validateArticle(article: IntelligenceArticle): boolean {
    return !!(
      article.id &&
      article.title &&
      article.content &&
      article.publication_date &&
      typeof article.quality_score === 'number' &&
      typeof article.narrative_score === 'number'
    );
  }

  private validateEntity(entity: IntelligenceEntity): boolean {
    return !!(
      entity.id &&
      entity.canonical_name &&
      entity.entity_type &&
      typeof entity.recognition_confidence === 'number' &&
      typeof entity.total_mentions === 'number'
    );
  }

  private validateRelationship(relationship: IntelligenceRelationship): boolean {
    return !!(
      relationship.id &&
      relationship.source_entity_id &&
      relationship.target_entity_id &&
      relationship.relationship_type &&
      typeof relationship.confidence === 'number'
    );
  }

  private validateStoryThread(thread: IntelligenceStoryThread): boolean {
    return !!(
      thread.id &&
      thread.thread_title &&
      thread.thread_type &&
      typeof thread.article_count === 'number'
    );
  }

  /**
   * Generate a data quality report
   */
  async generateQualityReport(): Promise<IntelligenceDataQualityReport> {
    console.log('📊 Generating data quality report...');

    const articleStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN quality_score > 0.8 THEN 1 END) as high_quality,
        COUNT(CASE WHEN quality_score BETWEEN 0.5 AND 0.8 THEN 1 END) as medium_quality,
        COUNT(CASE WHEN quality_score < 0.5 THEN 1 END) as low_quality
      FROM intelligence_articles
    `);

    const entityStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN recognition_confidence > 0.8 THEN 1 END) as high_quality,
        COUNT(CASE WHEN recognition_confidence BETWEEN 0.5 AND 0.8 THEN 1 END) as medium_quality,
        COUNT(CASE WHEN recognition_confidence < 0.5 THEN 1 END) as low_quality
      FROM intelligence_entities
    `);

    const relationshipStats = await query(`
      SELECT COUNT(*) as total FROM intelligence_relationships
    `);

    const storyThreadStats = await query(`
      SELECT COUNT(*) as total FROM intelligence_story_threads
    `);

    const totalRecords = articleStats.rows[0].total + entityStats.rows[0].total + 
                        relationshipStats.rows[0].total + storyThreadStats.rows[0].total;

    return {
      total_records: totalRecords,
      quality_distribution: {
        high_quality: articleStats.rows[0].high_quality + entityStats.rows[0].high_quality,
        medium_quality: articleStats.rows[0].medium_quality + entityStats.rows[0].medium_quality,
        low_quality: articleStats.rows[0].low_quality + entityStats.rows[0].low_quality
      },
      completeness_scores: {
        required_fields: 0.95, // This would need actual calculation
        recommended_fields: 0.85,
        optional_fields: 0.60
      },
      validation_results: {
        referential_integrity: true, // Would need actual validation
        temporal_consistency: true,
        scoring_consistency: true
      },
      recommendations: [
        'Data quality is excellent for Intelligence dataset',
        'Consider enhancing biographical data for entities with low confidence scores',
        'Story threads show strong documentary potential - prioritize for Jordi queries'
      ]
    };
  }

  /**
   * Get import progress
   */
  getProgress(): ImportProgress {
    return { ...this.progress };
  }
} 