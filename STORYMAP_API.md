# StoryMap API

This API provides access to the StoryMap data for StoryMine.

## API Endpoints

### Articles

#### GET /api/articles

Get a list of articles with pagination.

**Parameters:**
- `limit` (optional): Maximum number of articles to return (default: 10)
- `offset` (optional): Offset for pagination (default: 0)

**Example:**
```
GET /api/articles?limit=10&offset=0
```

**Response:**
```json
{
  "articles": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Example Article",
      "content": "This is an example article...",
      "category": "news",
      "publication_date": "1920-01-01",
      "is_advertisement": false,
      "quality_score": 0.95
    },
    ...
  ],
  "limit": 10,
  "offset": 0
}
```

#### GET /api/articles/{article_id}

Get a single article by ID with entities and relationships.

**Example:**
```
GET /api/articles/123e4567-e89b-12d3-a456-426614174000
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Example Article",
  "content": "This is an example article...",
  "processed_content": "This is an example article...",
  "category": "news",
  "publication_date": "1920-01-01",
  "source": "Archive.org",
  "is_advertisement": false,
  "is_classified": false,
  "classification_confidence": 0.95,
  "word_count": 150,
  "quality_score": 0.95,
  "language": "en",
  "created_at": "2023-05-15T10:00:00",
  "updated_at": "2023-05-15T10:00:00",
  "entities": [
    {
      "id": "223e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "entity_type": "person",
      "confidence": 0.9,
      "mentions": "...",
      "aliases": "..."
    },
    ...
  ],
  "relationships": [
    {
      "id": "323e4567-e89b-12d3-a456-426614174000",
      "source_entity_id": "223e4567-e89b-12d3-a456-426614174000",
      "target_entity_id": "423e4567-e89b-12d3-a456-426614174000",
      "relationship_type": "works_for",
      "confidence": 0.8,
      "evidence": "..."
    },
    ...
  ]
}
```

#### POST /api/articles

Create a new article.

**Request:**
```json
{
  "title": "New Article",
  "content": "This is a new article...",
  "source": "API Test",
  "publication_date": "1920-01-01",
  "category": "news"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "New Article",
  "content": "This is a new article...",
  "source": "API Test",
  "created_at": "2023-05-15T10:00:00",
  "status": "processing"
}
```

### Entities

#### GET /api/entities

Get a list of unique entities.

**Parameters:**
- `limit` (optional): Maximum number of entities to return (default: 10)
- `offset` (optional): Offset for pagination (default: 0)

**Example:**
```
GET /api/entities?limit=10&offset=0
```

**Response:**
```json
{
  "entities": [
    {
      "name": "John Doe",
      "entity_type": "person"
    },
    ...
  ],
  "limit": 10,
  "offset": 0
}
```

#### GET /api/entities/{entity_type}

Get a list of entities filtered by type.

**Example:**
```
GET /api/entities/person
```

**Response:**
```json
{
  "entities": [
    {
      "name": "John Doe",
      "entity_type": "person"
    },
    ...
  ],
  "limit": 10,
  "offset": 0
}
```

### Search

#### POST /api/search

Perform a semantic search on articles.

**Request:**
```json
{
  "query": "innovation and technology",
  "threshold": 0.7,
  "limit": 10
}
```

**Response:**
```json
{
  "query": "innovation and technology",
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Example Article",
      "content": "This is an example article about innovation...",
      "similarity": 0.85
    },
    ...
  ]
}
```

### Batch Processing

#### POST /api/batch

Create a new batch processing job.

**Request:**
```json
{
  "article_ids": [
    "123e4567-e89b-12d3-a456-426614174000",
    "223e4567-e89b-12d3-a456-426614174000"
  ],
  "operations": ["update_embeddings", "extract_entities"]
}
```

**Response:**
```json
{
  "batch_id": "batch-123",
  "status": "queued",
  "items_count": 2,
  "created_at": "2023-05-15T10:00:00"
}
```

#### GET /api/batch/{batch_id}

Get the status of a batch job.

**Example:**
```
GET /api/batch/batch-123
```

**Response:**
```json
{
  "batch_id": "batch-123",
  "status": "completed",
  "items_count": 2,
  "items_processed": 2,
  "created_at": "2023-05-15T10:00:00",
  "completed_at": "2023-05-15T10:05:00"
}
```

### Filtering

#### POST /api/filter

Filter articles based on criteria.

**Request:**
```json
{
  "categories": ["news"],
  "date_range": {
    "start": "1920-01-01",
    "end": "1920-12-31"
  },
  "entities": [
    {"name": "John Doe", "entity_type": "person"}
  ],
  "page": 1,
  "limit": 10
}
```

**Response:**
```json
{
  "articles": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Example Article",
      "category": "news",
      "publication_date": "1920-01-01"
    },
    ...
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

## Running the API

### Development
```
python -m src.api.storymine
```

### Production
```
gunicorn src.api.storymine:app
``` 