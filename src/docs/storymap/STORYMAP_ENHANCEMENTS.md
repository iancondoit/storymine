# StoryMap Enhancements for Story Discovery

Based on our analysis of the current StoryMap API and data structure, we've identified several enhancements that would help Jordi discover interesting stories more effectively. These changes should be implemented in the StoryMap system rather than adding complexity to StoryMine.

## Current Data Structure

The current article structure includes:
- Basic metadata (id, title, publication, date)
- Content (raw text)
- Simple quality score (currently just 1 for all articles)
- Empty placeholder for entities and relationships

## Missing Elements for Story Discovery

1. **Content Analysis**
   - Named Entity Recognition (NER) - currently empty
   - Relationship extraction - currently empty
   - Sentiment analysis - missing entirely
   - Topic classification - category field is null
   - Unusual/interesting content detection

2. **Search & Filtering**
   - Keyword search (partially works but needs improvement)
   - Entity-based filtering
   - Relationship-based filtering
   - Topic/category filtering
   - Quality-based filtering

3. **Metadata Enrichment**
   - Keywords/tags for articles
   - Relevance scores for search results
   - Historical significance markers
   - Categorization beyond simple topics
   - Cross-reference with known historical events

## Recommended Enhancements

### 1. Entity and Relationship Processing

Implement NLP pipeline in StoryMap to:
- Extract named entities (people, places, organizations)
- Identify relationships between entities
- Store these in the entities and relationships arrays

Example structure:
```json
"entities": [
  {
    "id": "ent_123",
    "name": "Masonic Temple",
    "type": "LOCATION",
    "confidence": 0.92,
    "mentions": [
      {"start": 24, "end": 38},
      {"start": 142, "end": 156}
    ]
  }
],
"relationships": [
  {
    "id": "rel_456",
    "source_entity_id": "ent_123",
    "target_entity_id": "ent_789",
    "type": "LOCATED_IN",
    "confidence": 0.85
  }
]
```

### 2. Content Analysis Enhancements

Add fields for:
- `sentiment`: Object with positive/negative/neutral scores
- `topics`: Array of topic labels with confidence scores
- `newsworthiness_score`: Measurement of historical significance
- `unusualness_score`: How unusual the content is compared to similar articles

### 3. Search API Improvements

Implement or enhance:
- Full-text search with relevance scoring
- Entity-based search (`?entity_type=PERSON&entity_name=Roosevelt`)
- Relationship search (`?relationship_type=AFFILIATED_WITH`)
- Minimum quality threshold filter (`?min_quality=0.7`)
- Sort options (`?sort_by=unusualness&sort_order=desc`)

### 4. Categorization and Tagging

Add:
- Automated topic categorization
- Keyword extraction
- Historical event correlation
- Content clustering by similarity

## Implementation Priority

1. Entity and relationship extraction (highest priority)
2. Search and filtering capabilities 
3. Content analysis and scoring
4. Categorization and tagging

## Technical Approach

1. Use existing NLP libraries (SpaCy, Stanford NLP, Hugging Face)
2. Implement batch processing for historical articles
3. Create specialized models for historical news content
4. Add API endpoints for advanced search and filtering

This approach will enable Jordi to efficiently discover interesting stories within the large dataset without requiring complex processing in StoryMine. 