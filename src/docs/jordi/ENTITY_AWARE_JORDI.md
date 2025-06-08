# Entity-Aware Jordi Enhancement

This document describes the implementation of Entity-Aware capabilities for Jordi, our AI assistant for exploring historical news archives.

## Overview

Entity-Aware Jordi refers to the enhanced ability of the StoryMine assistant to understand, identify, and provide information about entities (people, places, organizations, etc.) mentioned in the news archive. This enhancement makes Jordi more intelligent about named entities and their relationships, allowing for more context-rich responses and a more sophisticated understanding of user queries.

## Implementation Details

### 1. Entity Service

We created a dedicated `entityService` that handles all entity-related operations:

- `getEntity(entityId)`: Fetches detailed information about a specific entity
- `searchEntities(searchTerm, entityType, limit)`: Searches for entities matching a term
- `getEntityTimeline(entityId, startDate, endDate)`: Generates a timeline for an entity
- `getEntityRelationships(entityId, depth)`: Retrieves network of relationships

The service includes caching to optimize performance and reduce API load, with configurable TTL values for different types of requests.

### 2. Extended Types

We defined extended type interfaces in `extendedTypes.ts` to handle the rich data structure of entities:

- `ExtendedEntity`: Enhanced entity with additional metadata like article IDs, related entities
- `EntityWithUI`: Entity with frontend-friendly fields
- `ArticleSource`: Simplified article reference
- `EnhancedTimelineEntry`: Timeline entry with source information

### 3. Enhanced Chat Controller

The `chatController.ts` was updated to recognize entity-focused queries with several capabilities:

- Entity query detection through regex patterns
- Timeline query detection for historical questions
- Relationship query detection for connections between entities
- Context preparation with relevant entity data for Jordi

### 4. Entity-Aware API Endpoints

New endpoints were added to the API:

- `GET /api/entities/search`: Search for entities
- `GET /api/entities/:id`: Get detailed entity information
- `GET /api/entities/:id/timeline`: Get entity timeline
- `GET /api/entities/:id/relationships`: Get entity relationships
- `GET /api/entities/:id/network`: Get entity network visualization

## Query Recognition

Jordi can now recognize several types of entity-focused queries:

### Entity Information Queries
- "Who is [Person]?"
- "What is [Organization]?"
- "Tell me about [Entity]"
- "Information on [Entity]"

### Timeline Queries
- "Timeline for [Entity]"
- "History of [Entity]"
- "When did [Entity]..."
- "Chronology of [Event]"

### Relationship Queries
- "Relationship between [Entity1] and [Entity2]"
- "How is [Entity1] connected to [Entity2]?"
- "Who is [Entity] connected to?"
- "Associations of [Entity]"

## Usage Example

When a user asks: "Tell me about Birmingham during the 1920s"

1. The system recognizes "Birmingham" as a potential entity
2. It retrieves information about Birmingham from the StoryMap API
3. It filters the timeline to focus on the 1920s
4. It fetches related articles and entities from that period
5. Jordi formulates a response that includes:
   - Key facts about Birmingham
   - Significant events during the 1920s
   - Notable people and organizations connected to Birmingham in that era
   - Sources from the news archive

## Testing

The implementation includes:
- Unit tests for the entity service
- An integration test script (`test-entity-service.js`)
- Test endpoints for direct API testing

## Future Enhancements

Planned improvements to Entity-Aware Jordi:

1. **Entity Disambiguation**: Better handling of ambiguous entities (e.g., distinguishing between Birmingham, UK and Birmingham, AL)
2. **Entity Relationship Visualization**: Interactive network graphs for entity relationships
3. **Temporal Awareness**: Enhanced understanding of time periods and historical context
4. **Entity-Based Article Recommendations**: Suggesting related articles based on entity connections
5. **Comparative Entity Analysis**: Comparing different entities across the same time periods

## Conclusion

Entity-Aware Jordi represents a significant enhancement to the StoryMine application, providing users with more contextual, informative responses about the entities in our historical news archive. The implementation leverages the structured entity data from the StoryMap API and enhances Jordi's ability to understand and respond to entity-focused queries. 