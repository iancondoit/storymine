# StoryMine API Documentation

This document provides a comprehensive overview of the StoryMine backend API endpoints.

## Base URL

All API endpoints are relative to the base URL:

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.storymine.com/api`

## Authentication

Most endpoints require authentication using JWT tokens.

**Headers**:
```
Authorization: Bearer {token}
```

To obtain a token, use the `/auth/login` endpoint.

## Endpoints

### Authentication

#### Login

```
POST /auth/login
```

Authenticates a user and returns a JWT token.

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "username": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### Articles

#### Get Articles

```
GET /articles
```

Retrieves a list of articles from the StoryMap API.

**Query Parameters**:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | number | Number of articles to return | 10 |
| offset | number | Offset for pagination | 0 |
| query | string | Search query | null |
| startDate | string | Filter by start date (YYYY-MM-DD) | null |
| endDate | string | Filter by end date (YYYY-MM-DD) | null |
| publication | string | Filter by publication | null |

**Response**:
```json
{
  "articles": [
    {
      "id": "123",
      "title": "Roosevelt Begins Third Term as War Looms",
      "content": "President Franklin D. Roosevelt was inaugurated...",
      "publication_date": "1941-01-20",
      "publication": "The Daily Chronicle",
      "entities": [
        {
          "id": "e123",
          "name": "Franklin D. Roosevelt",
          "type": "person"
        }
      ]
    }
  ],
  "limit": 10,
  "offset": 0,
  "total": 120
}
```

#### Get Article by ID

```
GET /articles/:id
```

Retrieves a single article by its ID.

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Article ID |

**Response**:
```json
{
  "id": "123",
  "title": "Roosevelt Begins Third Term as War Looms",
  "content": "President Franklin D. Roosevelt was inaugurated...",
  "publication_date": "1941-01-20",
  "publication": "The Daily Chronicle",
  "entities": [
    {
      "id": "e123",
      "name": "Franklin D. Roosevelt",
      "type": "person"
    }
  ]
}
```

---

### Entities

#### Get Entities

```
GET /entities
```

Retrieves a list of entities from the StoryMap API.

**Query Parameters**:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | number | Number of entities to return | 10 |
| offset | number | Offset for pagination | 0 |
| type | string | Filter by entity type | null |

**Response**:
```json
{
  "entities": [
    {
      "id": "e123",
      "name": "Franklin D. Roosevelt",
      "type": "person"
    },
    {
      "id": "e124",
      "name": "White House",
      "type": "location"
    }
  ],
  "limit": 10,
  "offset": 0
}
```

#### Get Entity by ID

```
GET /entities/:id
```

Retrieves a single entity by its ID.

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Entity ID |

**Response**:
```json
{
  "id": "e123",
  "name": "Franklin D. Roosevelt",
  "type": "person",
  "aliases": ["FDR", "President Roosevelt"],
  "metadata": {
    "birth_date": "1882-01-30",
    "death_date": "1945-04-12"
  }
}
```

#### Get Entity Relationships

```
GET /entities/:id/relationships
```

Retrieves relationships for a specific entity.

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Entity ID |

**Query Parameters**:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| limit | number | Number of relationships to return | 10 |
| offset | number | Offset for pagination | 0 |

**Response**:
```json
{
  "entity_id": "e123",
  "relationships": [
    {
      "id": "r1",
      "source": "e123",
      "target": "e456",
      "type": "works_with",
      "confidence": 0.9
    }
  ],
  "limit": 10,
  "offset": 0,
  "total": 42
}
```

#### Get Entity Network

```
GET /entities/:id/network
```

Retrieves a network of related entities with visualization data.

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Entity ID |

**Query Parameters**:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| depth | number | Network depth | 1 |
| limit | number | Max number of nodes | 20 |

**Response**:
```json
{
  "nodes": [
    {
      "id": "e123",
      "name": "Franklin D. Roosevelt",
      "entity_type": "person",
      "size": 5
    },
    {
      "id": "e456",
      "name": "White House",
      "entity_type": "location",
      "size": 3
    }
  ],
  "edges": [
    {
      "id": "r1",
      "source": "e123",
      "target": "e456",
      "type": "works_at",
      "weight": 0.9
    }
  ],
  "stats": {
    "node_count": 15,
    "edge_count": 22,
    "density": 0.23
  }
}
```

---

### Timeline

#### Get Timeline

```
GET /timeline
```

Retrieves a timeline of articles for a specific entity.

**Query Parameters**:
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| entityId | string | Entity ID | Required |
| startDate | string | Start date (YYYY-MM-DD) | null |
| endDate | string | End date (YYYY-MM-DD) | null |

**Response**:
```json
{
  "entityId": "e123",
  "timelinePoints": [
    {
      "id": "123",
      "title": "Roosevelt Begins Third Term as War Looms",
      "date": "1941-01-20",
      "source": "The Daily Chronicle",
      "entityMentions": 5
    },
    {
      "id": "124",
      "title": "Churchill and Roosevelt Meet Aboard Warships",
      "date": "1941-08-14",
      "source": "The Evening Star",
      "entityMentions": 3
    }
  ]
}
```

---

### Search

#### Search Articles

```
POST /search
```

Performs a semantic search on articles.

**Request Body**:
```json
{
  "query": "Roosevelt war",
  "limit": 10,
  "offset": 0,
  "filters": {
    "startDate": "1940-01-01",
    "endDate": "1945-12-31",
    "publication": "The Daily Chronicle"
  }
}
```

**Response**:
```json
{
  "results": [
    {
      "id": "123",
      "title": "Roosevelt Begins Third Term as War Looms",
      "snippet": "President Franklin D. Roosevelt was inaugurated...",
      "publication_date": "1941-01-20",
      "publication": "The Daily Chronicle",
      "similarity": 0.92
    }
  ],
  "limit": 10,
  "offset": 0,
  "total": 15
}
```

---

### Jordi Chat

#### Send Message

```
POST /chat
```

Sends a message to the Jordi AI assistant.

**Request Body**:
```json
{
  "message": "Tell me about Roosevelt's policies during World War II",
  "conversationId": "optional-conversation-id"
}
```

**Response**:
```json
{
  "response": "Franklin D. Roosevelt implemented several key policies during World War II...",
  "sources": [
    {
      "id": "123",
      "title": "Roosevelt Begins Third Term as War Looms",
      "publication": "The Daily Chronicle",
      "publication_date": "1941-01-20"
    }
  ],
  "entities": [
    {
      "id": "e123",
      "name": "Franklin D. Roosevelt",
      "type": "person"
    },
    {
      "id": "e789",
      "name": "World War II",
      "type": "event"
    }
  ],
  "conversation_id": "conversation-id",
  "token_usage": {
    "input": 123,
    "output": 456
  }
}
```

#### Get Conversation History

```
GET /conversations/:id
```

Retrieves the history of a conversation.

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Conversation ID |

**Response**:
```json
{
  "id": "conversation-id",
  "messages": [
    {
      "role": "user",
      "content": "Tell me about Roosevelt's policies during World War II",
      "timestamp": "2023-06-15T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "Franklin D. Roosevelt implemented several key policies during World War II...",
      "timestamp": "2023-06-15T10:30:05Z"
    }
  ]
}
```

#### Clear Conversation History

```
DELETE /conversations/:id
```

Clears the history of a conversation.

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Conversation ID |

**Response**:
```json
{
  "success": true,
  "message": "Conversation history cleared"
}
```

---

### StoryMap API Status

#### Get API Stats

```
GET /storymap-stats
```

Retrieves status information about the StoryMap API.

**Response**:
```json
{
  "status": "online",
  "articles_count": 50000,
  "entities_count": 15000,
  "response_time": "45ms",
  "last_update": "2023-06-15T10:30:00Z"
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": null
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| INVALID_CREDENTIALS | Invalid username or password |
| UNAUTHORIZED | Missing or invalid JWT token |
| NOT_FOUND | Resource not found |
| VALIDATION_ERROR | Invalid request parameters |
| SERVER_ERROR | Internal server error |
| API_UNAVAILABLE | StoryMap API is unavailable |

## Rate Limiting

The API has rate limiting in place:

- 100 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users

When rate limited, the API will respond with HTTP 429 and a `Retry-After` header. 