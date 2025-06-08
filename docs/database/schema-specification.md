# StoryMine Database Schema Specification

**Version:** 1.2.0  
**Last Updated:** June 7, 2025  
**Status:** Production Schema (AWS RDS PostgreSQL)

## Overview

The StoryMine database uses a three-table PostgreSQL schema optimized for historical narrative analysis and AI-powered story discovery. The schema is designed to support Jordi's mission of surfacing lost historical stories and enabling intelligent narrative discovery.

## Core Tables

### 1. intelligence_articles

Primary table containing historical documents and articles with rich metadata for narrative analysis.

**Key Fields:**
- `id` (UUID, Primary Key)
- `title` (TEXT, Required) - Article headline
- `content` (TEXT, Required) - Full article text
- `date_published` (DATE) - Publication date
- `source` (VARCHAR) - Source publication name
- `created_at` (TIMESTAMP) - Record creation time

**Indexes:**
- Primary key on `id`
- Index on `date_published` for temporal queries
- Full-text search index on `title` and `content`
- Composite index on `(date_published, source)` for filtering

**Record Count:** 282,388 articles (1920-1961, 42 years)

### 2. intelligence_entities

Entities extracted from articles including people, organizations, locations, and events.

**Key Fields:**
- `id` (UUID, Primary Key)
- `name` (VARCHAR, Required) - Entity name
- `entity_type` (VARCHAR) - Type: PERSON, ORGANIZATION, LOCATION, EVENT, CONCEPT
- `description` (TEXT) - Biographical/descriptive information
- `created_at` (TIMESTAMP) - Record creation time

**Indexes:**
- Primary key on `id`
- Index on `name` for entity lookup
- Index on `entity_type` for type-based queries
- Full-text search index on `description`

**Record Count:** 1,061,535 entities

### 3. intelligence_relationships

Many-to-many relationships connecting articles to entities, enabling network analysis.

**Key Fields:**
- `id` (UUID, Primary Key)
- `article_id` (UUID, Foreign Key → intelligence_articles.id)
- `entity_id` (UUID, Foreign Key → intelligence_entities.id)
- `relevance_score` (DECIMAL) - Relationship strength (0.0-1.0)
- `created_at` (TIMESTAMP) - Record creation time

**Indexes:**
- Primary key on `id`
- Foreign key index on `article_id`
- Foreign key index on `entity_id`
- Composite index on `(article_id, entity_id)` for relationship queries
- Index on `relevance_score` for filtering by strength

**Record Count:** 1,219,127 relationships

## Schema Design Principles

### 1. AI-Optimized Structure
- **Entity Networks**: Enables complex relationship analysis for story discovery
- **Temporal Indexing**: Optimized for time-based narrative queries
- **Full-Text Search**: Supports natural language queries from Jordi
- **Relevance Scoring**: Weighted relationships for intelligent filtering

### 2. Documentary Story Discovery
- **Network Analysis**: Entity co-occurrence patterns reveal story threads
- **Temporal Clustering**: Events grouped by time periods for narrative coherence
- **Cross-Reference Capability**: Articles linked through shared entities
- **Quality Metrics**: Implicit quality through entity relationship density

### 3. Performance Optimization
- **Strategic Indexing**: Query patterns optimized for common Jordi operations
- **UUID Keys**: Efficient joins and relationship traversal
- **Normalized Structure**: Minimal data duplication, optimal storage
- **Connection Pooling**: Supports concurrent AI assistant requests

## Common Query Patterns

### Story Discovery
```sql
-- Find articles with high entity density (documentary potential)
SELECT a.id, a.title, COUNT(r.entity_id) as entity_count
FROM intelligence_articles a
JOIN intelligence_relationships r ON a.id = r.article_id
GROUP BY a.id, a.title
HAVING COUNT(r.entity_id) >= 5
ORDER BY entity_count DESC;
```

### Entity Network Analysis
```sql
-- Find entities that frequently appear together
WITH entity_pairs AS (
  SELECT r1.entity_id as entity1, r2.entity_id as entity2,
         COUNT(*) as shared_articles
  FROM intelligence_relationships r1
  JOIN intelligence_relationships r2 ON r1.article_id = r2.article_id
  WHERE r1.entity_id < r2.entity_id
  GROUP BY r1.entity_id, r2.entity_id
  HAVING COUNT(*) >= 3
)
SELECT e1.name as entity1_name, e2.name as entity2_name, 
       ep.shared_articles
FROM entity_pairs ep
JOIN intelligence_entities e1 ON ep.entity1 = e1.id
JOIN intelligence_entities e2 ON ep.entity2 = e2.id
ORDER BY ep.shared_articles DESC;
```

### Temporal Analysis
```sql
-- Find story threads across time periods
SELECT DATE_TRUNC('year', date_published) as year,
       COUNT(*) as article_count,
       COUNT(DISTINCT r.entity_id) as unique_entities
FROM intelligence_articles a
JOIN intelligence_relationships r ON a.id = r.article_id
WHERE date_published BETWEEN '1940-01-01' AND '1945-12-31'
GROUP BY DATE_TRUNC('year', date_published)
ORDER BY year;
```

## Data Quality Standards

### Referential Integrity
- All `article_id` values in relationships must exist in articles table
- All `entity_id` values in relationships must exist in entities table
- Orphaned relationships are cleaned up automatically

### Data Validation
- All UUIDs must be valid v4 format
- Dates must be within historical range (1900-2000)
- Relevance scores must be between 0.0 and 1.0
- Required fields cannot be NULL or empty

### Performance Thresholds
- Single entity lookup: < 10ms
- Complex relationship queries: < 30s
- Full-text searches: < 5s
- Bulk data imports: < 1 record/ms

## Migration History

### v1.0.0 (Initial Schema)
- Basic three-table structure established
- Primary indexes created
- Foreign key constraints added

### v1.1.0 (Optimization Update)
- Added full-text search indexes
- Optimized composite indexes for common queries
- Added relevance scoring

### v1.2.0 (Production Deployment)
- Performance tuning for AWS RDS
- Connection pooling optimization
- Query timeout configurations

## Maintenance Procedures

### Regular Maintenance
- **Weekly**: Analyze query performance and update statistics
- **Monthly**: Check for orphaned relationships and clean up
- **Quarterly**: Review index usage and optimize as needed

### Monitoring
- Monitor connection pool usage
- Track slow query performance
- Monitor disk space usage
- Alert on failed constraint checks

### Backup Strategy
- Daily automated backups via AWS RDS
- Point-in-time recovery available
- Cross-region backup replication
- Regular restore testing

## Development Guidelines

### Adding New Fields
1. Ensure backward compatibility
2. Add appropriate indexes
3. Update validation rules
4. Document query impact
5. Test with representative data volumes

### Query Optimization
1. Use EXPLAIN ANALYZE for complex queries
2. Avoid SELECT * in production code
3. Use appropriate JOIN types
4. Leverage existing indexes
5. Consider query caching for frequent operations

### Testing Requirements
1. Unit tests for all schema changes
2. Performance tests with production-scale data
3. Integration tests with Jordi AI
4. Backup/restore testing
5. Migration rollback testing

---

**Note**: This schema supports 2.56+ million records optimized for AI-powered historical narrative discovery and documentary story identification. 