-- StoryMine Database Setup for StoryMap Intelligence Integration
-- Version: 3.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enhanced articles table for StoryMap Intelligence data
CREATE TABLE IF NOT EXISTS intelligence_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storymap_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    publication_date DATE,
    publication_name VARCHAR(255),
    page_number INTEGER,
    column_number INTEGER,
    
    -- Enhanced Intelligence fields
    narrative_score DECIMAL(4,3),
    documentary_potential DECIMAL(4,3),
    archival_richness DECIMAL(4,3),
    visual_opportunities TEXT[],
    production_complexity VARCHAR(50),
    
    -- Geographic data
    primary_location VARCHAR(255),
    secondary_locations TEXT[],
    coordinates POINT,
    
    -- Temporal data
    narrative_timeframe DATERANGE,
    historical_period VARCHAR(100),
    
    -- Thematic classification
    primary_themes TEXT[],
    secondary_themes TEXT[],
    story_categories TEXT[],
    
    -- Evidence and sourcing
    evidence_quality DECIMAL(4,3),
    source_reliability DECIMAL(4,3),
    corroboration_level INTEGER,
    
    -- Technical metadata
    processing_version VARCHAR(20),
    intelligence_processed_at TIMESTAMP,
    content_hash VARCHAR(64),
    
    -- Indexes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced entities table
CREATE TABLE IF NOT EXISTS intelligence_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storymap_id VARCHAR(255) UNIQUE NOT NULL,
    canonical_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    
    -- Enhanced Intelligence fields
    significance_score DECIMAL(4,3),
    biographical_richness DECIMAL(4,3),
    narrative_centrality DECIMAL(4,3),
    documentary_appeal DECIMAL(4,3),
    
    -- Biographical data
    birth_date DATE,
    death_date DATE,
    birth_location VARCHAR(255),
    occupation TEXT[],
    social_status VARCHAR(100),
    
    -- Contextual information
    time_period VARCHAR(100),
    geographic_scope TEXT[],
    cultural_context TEXT[],
    
    -- Relationship indicators
    network_centrality DECIMAL(4,3),
    influence_score DECIMAL(4,3),
    conflict_involvement DECIMAL(4,3),
    
    -- Visual and narrative elements
    photographic_evidence BOOLEAN DEFAULT FALSE,
    visual_description TEXT,
    personality_traits TEXT[],
    notable_quotes TEXT[],
    
    -- Alternative names and references
    alternate_names TEXT[],
    nicknames TEXT[],
    titles TEXT[],
    
    -- Technical metadata
    processing_version VARCHAR(20),
    intelligence_processed_at TIMESTAMP,
    mention_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced relationships table
CREATE TABLE IF NOT EXISTS intelligence_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storymap_id VARCHAR(255) UNIQUE NOT NULL,
    source_entity_id UUID REFERENCES intelligence_entities(id),
    target_entity_id UUID REFERENCES intelligence_entities(id),
    relationship_type VARCHAR(100) NOT NULL,
    
    -- Enhanced Intelligence fields
    dramatic_tension DECIMAL(4,3),
    narrative_significance DECIMAL(4,3),
    evidence_strength DECIMAL(4,3),
    temporal_stability DECIMAL(4,3),
    
    -- Evidence and context
    evidence_text TEXT,
    evidence_articles TEXT[],
    relationship_context TEXT,
    temporal_context VARCHAR(255),
    
    -- Narrative elements
    conflict_level DECIMAL(4,3),
    emotional_intensity DECIMAL(4,3),
    story_arc_potential DECIMAL(4,3),
    
    -- Supporting data
    first_mention_date DATE,
    last_mention_date DATE,
    mention_frequency INTEGER DEFAULT 1,
    geographic_context TEXT[],
    
    -- Visual storytelling
    visual_evidence BOOLEAN DEFAULT FALSE,
    photographic_opportunities TEXT[],
    
    -- Technical metadata
    processing_version VARCHAR(20),
    intelligence_processed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create story threads table
CREATE TABLE IF NOT EXISTS intelligence_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storymap_id VARCHAR(255) UNIQUE NOT NULL,
    thread_title VARCHAR(500) NOT NULL,
    
    -- Core narrative data
    start_date DATE,
    end_date DATE,
    duration_days INTEGER,
    geographic_scope TEXT[],
    
    -- Documentary potential scoring
    documentary_score DECIMAL(4,3),
    narrative_coherence DECIMAL(4,3),
    archival_richness DECIMAL(4,3),
    visual_potential DECIMAL(4,3),
    
    -- Production planning
    production_complexity VARCHAR(50),
    interview_potential DECIMAL(4,3),
    location_accessibility DECIMAL(4,3),
    
    -- Thematic classification
    primary_themes TEXT[],
    secondary_themes TEXT[],
    story_categories TEXT[],
    target_audience TEXT[],
    
    -- Evidence and sourcing
    evidence_count INTEGER DEFAULT 0,
    source_diversity DECIMAL(4,3),
    fact_checkability DECIMAL(4,3),
    
    -- Narrative structure
    story_arc_type VARCHAR(100),
    climax_events TEXT[],
    resolution_type VARCHAR(100),
    
    -- Visual storytelling
    visual_opportunities TEXT[],
    photographic_evidence BOOLEAN DEFAULT FALSE,
    archival_footage_potential BOOLEAN DEFAULT FALSE,
    
    -- Characters and relationships
    main_characters TEXT[],
    supporting_characters TEXT[],
    antagonists TEXT[],
    
    -- Technical metadata
    processing_version VARCHAR(20),
    intelligence_processed_at TIMESTAMP,
    article_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create story-article junction table
CREATE TABLE IF NOT EXISTS story_articles (
    story_id UUID REFERENCES intelligence_stories(id),
    article_id UUID REFERENCES intelligence_articles(id),
    relevance_score DECIMAL(4,3),
    narrative_role VARCHAR(100),
    sequence_order INTEGER,
    PRIMARY KEY (story_id, article_id)
);

-- Create story-entity junction table  
CREATE TABLE IF NOT EXISTS story_entities (
    story_id UUID REFERENCES intelligence_stories(id),
    entity_id UUID REFERENCES intelligence_entities(id),
    role_type VARCHAR(100),
    importance_score DECIMAL(4,3),
    character_arc TEXT,
    PRIMARY KEY (story_id, entity_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_documentary_potential ON intelligence_articles(documentary_potential DESC);
CREATE INDEX IF NOT EXISTS idx_articles_narrative_score ON intelligence_articles(narrative_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_publication_date ON intelligence_articles(publication_date);
CREATE INDEX IF NOT EXISTS idx_articles_themes ON intelligence_articles USING gin(primary_themes);
CREATE INDEX IF NOT EXISTS idx_articles_location ON intelligence_articles(primary_location);

CREATE INDEX IF NOT EXISTS idx_entities_significance ON intelligence_entities(significance_score DESC);
CREATE INDEX IF NOT EXISTS idx_entities_type ON intelligence_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON intelligence_entities(canonical_name);
CREATE INDEX IF NOT EXISTS idx_entities_trgm ON intelligence_entities USING gin(canonical_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_relationships_dramatic_tension ON intelligence_relationships(dramatic_tension DESC);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON intelligence_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON intelligence_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON intelligence_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_stories_documentary_score ON intelligence_stories(documentary_score DESC);
CREATE INDEX IF NOT EXISTS idx_stories_dates ON intelligence_stories(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_stories_themes ON intelligence_stories USING gin(primary_themes);

-- Create search indexes
CREATE INDEX IF NOT EXISTS idx_articles_fulltext ON intelligence_articles USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_entities_fulltext ON intelligence_entities USING gin(to_tsvector('english', canonical_name));

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON intelligence_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON intelligence_entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON intelligence_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON intelligence_stories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW high_potential_stories AS
SELECT 
    s.*,
    COUNT(sa.article_id) as article_count,
    AVG(a.documentary_potential) as avg_documentary_potential
FROM intelligence_stories s
LEFT JOIN story_articles sa ON s.id = sa.story_id
LEFT JOIN intelligence_articles a ON sa.article_id = a.id
WHERE s.documentary_score >= 0.7
GROUP BY s.id
ORDER BY s.documentary_score DESC;

CREATE OR REPLACE VIEW significant_entities AS
SELECT 
    e.*,
    COUNT(r1.id) + COUNT(r2.id) as total_relationships
FROM intelligence_entities e
LEFT JOIN intelligence_relationships r1 ON e.id = r1.source_entity_id
LEFT JOIN intelligence_relationships r2 ON e.id = r2.target_entity_id
WHERE e.significance_score >= 0.6
GROUP BY e.id
ORDER BY e.significance_score DESC;

-- Insert initial data quality check
INSERT INTO intelligence_articles (storymap_id, title, content, narrative_score, documentary_potential)
VALUES ('test-001', 'Database Setup Complete', 'StoryMine Intelligence database schema has been successfully created.', 1.0, 1.0)
ON CONFLICT (storymap_id) DO NOTHING;

-- Success message
SELECT 'StoryMine Intelligence Database Setup Complete!' as status; 