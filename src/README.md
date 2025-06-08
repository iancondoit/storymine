# StoryMine

A web application for exploring historical narratives through genomic data concepts, with an AI assistant named Jordi.

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

## Features

- **Dark Mode Theme**: Modern dark-themed interface with scientific/genomic aesthetic
- **Interactive Components**: DNA-inspired visualizations and UI elements
- **AI Assistant**: Chat with Jordi, your archival research assistant
- **Historical Archive**: Explore interconnected historical documents
- **Responsive Design**: Works on desktop and mobile devices
- **Jordi**: Claude-based AI assistant for exploring the historical archive
- **Entity-Aware Responses**: Intelligent recognition and processing of entities in the newspaper archive
- **Article Exploration**: Discover historical articles from the archive
- **Timeline Views**: Explore historical events chronologically
- **Entity Networks**: Discover connections between people, places, and organizations

## Architecture

StoryMine consists of three main components:

1. **Frontend**: Next.js application with React and Tailwind CSS
2. **Backend**: Node.js API server connecting to the StoryMap API
3. **StoryMap API**: External API accessed via Docker for providing historical data

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/storymine.git
cd storymine

# Install dependencies
npm install
```

### Running the Application

To run the application with Docker (recommended way to access StoryMap API):

```bash
npm run docker:up
```

This will start:
- The backend server on port 3001 (connecting to StoryMap API via Docker)
- The frontend on port 3000 (or next available port)

To stop the Docker containers:

```bash
npm run docker:down
```

For local development without Docker (note: StoryMap API will not be available):

```bash
npm run dev
```

## Theme System

StoryMine uses a dark mode theme by default with scientific/genomic styling.

### Theme Features

- Dark mode with accent colors for genomic elements
- Mathematical/scientific decorations in the background
- DNA helix representations throughout the UI
- Custom Tailwind configuration for consistent styling

### Theme Components

- **ThemeProvider**: Context provider for dark/light mode switching
- **MathDecorations**: Mathematical symbols for background decorations
- **Logo**: DNA-inspired logo with version display
- **StoryMapStatus**: Component displaying API connection status

## Development

### Directory Structure

```
storymine/
├── frontend/             # Next.js frontend application
│   ├── public/           # Static assets
│   └── src/              # Source code
│       ├── components/   # React components
│       ├── pages/        # Next.js pages
│       ├── styles/       # CSS/Tailwind styles
│       ├── tests/        # Jest tests
│       ├── types/        # TypeScript types
│       └── utils/        # Utility functions
├── backend/              # Node.js backend API
│   └── src/              # Source code
├── scripts/              # Utility scripts
├── docs/                 # Documentation
│   ├── development/      # Development documentation
│   ├── jordi/            # Jordi AI assistant documentation
│   └── storymap/         # StoryMap API integration documentation
├── docker-compose.yml    # Docker configuration
└── .dockerignore         # Docker ignore file
```

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests only
npm run frontend:test

# Run backend tests only
npm run backend:test

# Test Docker API integration
npm run test:docker-api
```

### Building for Production

```bash
# Build all components
npm run build

# Run in production mode
npm start
```

## Documentation

### Project Documentation

All project documentation is now organized in the `docs` directory:

- **Development Documentation** (`docs/development/`):
  - Project Status (`PROJECT_STATUS.md`)
  - Roadmap (`STORYMINE_ROADMAP.md`)
  - Development Plan (`DEVELOPMENT_PLAN.md`)
  - Docker Setup (`DOCKER_SETUP.md`)

- **Jordi Documentation** (`docs/jordi/`):
  - Entity-Aware Jordi (`ENTITY_AWARE_JORDI.md`)
  - Jordi Enhancement Plan (`JORDI_ENHANCEMENT_PLAN.md`)
  - Claude Integration (`CLAUDE_INTEGRATION.md`)

- **StoryMap Documentation** (`docs/storymap/`):
  - StoryMap Integration Guide (`STORYMAP_INTEGRATION_GUIDE.md`)
  - StoryMap API Reference (`STORYMAP_API.md`)
  - Integration Progress (`STORYMAP_INTEGRATION_PROGRESS.md`)
  - StoryMap Enhancements (`STORYMAP_ENHANCEMENTS.md`)

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- StoryMine uses sample historical data for demonstration purposes
- DNA visualization inspired by genomic research visualization techniques

## Overview

StoryMine interfaces with users through a chatbot named Jordi, inspired by a meticulous archivist and newsroom librarian. Jordi helps users:

- Discover compelling historical stories
- Connect related stories into meaningful threads
- Extract insights from vast archives of news content
- Develop documentary-style narratives from historical sources

The application provides a clean, modern interface while leveraging a powerful PostgreSQL database populated by the StoryMap ETL pipeline.

## Features

- Intelligent chat interface with Jordi, your archival assistant
- Access to hundreds of thousands of historical articles
- Entity recognition (people, places, organizations)
- Vector-based semantic search capabilities
- Story threading and relationship discovery
- Modern, scientifically-oriented UI

## Technical Architecture

StoryMine is a web application that connects to a PostgreSQL database maintained by the StoryMap pipeline. The application minimizes processing on the frontend, primarily leveraging the database and LLM capabilities.

## Development

This project follows test-driven development principles, with comprehensive documentation and testing for all features.

### Getting Started

1. Clone the repository
2. Install dependencies
3. Configure database connection
4. Run development server

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

# StoryMine Technical Handoff Document

## Overview

This document provides comprehensive technical guidance for the StoryMine development team on how to access, interpret, and utilize the data processed by StoryMap. It covers database architecture, data formats, API endpoints, vector search capabilities, and integration guidance.

## Database Access

### Connection Details

StoryMine will access data from the PostgreSQL database populated by StoryMap with the following connection parameters:

```python
import psycopg2

# Production connection parameters
db_params = {
    "dbname": "storymap",
    "user": "storymine_app",  # Read-only application user
    "password": "[to be set during deployment]",
    "host": "storymap-db.internal.domain",
    "port": "5432"
}

# Development connection parameters
dev_db_params = {
    "dbname": "storymap_dev",
    "user": "storymine_dev",
    "password": "[to be set during development]",
    "host": "localhost",
    "port": "5432"
}

# Establish connection
conn = psycopg2.connect(**db_params)
```

### Authentication & Security

- StoryMine will be provided a dedicated read-only database user
- Connection should use TLS/SSL for production
- IP whitelisting will be implemented for production access
- The database user password will be provided separately via secure channel

## Data Schema

The PostgreSQL database uses the following schema optimized for vector search and article exploration:

### Core Tables

#### 1. `articles` Table

Stores the primary article content and metadata:

```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(100) UNIQUE,  -- Original ID from StoryDredge
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_embedding vector(384),    -- Vector representation for semantic search
    publish_date DATE,
    publication VARCHAR(100),
    section VARCHAR(50),
    word_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX ON articles(publish_date);
CREATE INDEX ON articles(publication);
CREATE INDEX ON articles(section);
CREATE INDEX ON articles USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);
```

#### 2. `entities` Table

Contains named entities extracted from articles:

```sql
CREATE TABLE entities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,  -- person, location, organization, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX ON entities(name, type);
```

#### 3. `article_entities` Table 

Junction table linking articles to entities:

```sql
CREATE TABLE article_entities (
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
    relevance_score FLOAT,  -- 0.0 to 1.0 indicating relevance to article
    mention_count INTEGER,  -- Number of times entity appears in article
    PRIMARY KEY (article_id, entity_id)
);

CREATE INDEX ON article_entities(entity_id);
CREATE INDEX ON article_entities(relevance_score);
```

#### 4. `tags` Table

Stores article classification tags:

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);
```

#### 5. `article_tags` Table

Junction table linking articles to tags:

```sql
CREATE TABLE article_tags (
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    confidence FLOAT,  -- 0.0 to 1.0 indicating tag confidence 
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX ON article_tags(tag_id);
```

### Views

For convenience, StoryMine can access these pre-built views:

#### 1. `article_full_view`

```sql
CREATE VIEW article_full_view AS
SELECT 
    a.id, a.title, a.content, a.publish_date, a.publication, a.section,
    (
        SELECT json_agg(json_build_object(
            'name', e.name,
            'type', e.type,
            'relevance', ae.relevance_score,
            'mentions', ae.mention_count
        ))
        FROM article_entities ae
        JOIN entities e ON ae.entity_id = e.id
        WHERE ae.article_id = a.id
    ) as entities,
    (
        SELECT json_agg(json_build_object(
            'name', t.name,
            'confidence', at.confidence
        ))
        FROM article_tags at
        JOIN tags t ON at.tag_id = t.id
        WHERE at.article_id = a.id
    ) as tags
FROM articles a;
```

## Data Content & Format

### Article Fields

Each article contains the following fields:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| id | Integer | Unique database ID | 1234 |
| external_id | String | Original ID from StoryDredge | `per_atlanta-constitution_1925-01-01_57_203` |
| title | Text | Article headline | "ACCEPTED HERE" |
| content | Text | Full article text | "The civil rights movement in Atlanta..." |
| content_embedding | Vector(384) | Numerical vector representation | [0.123, 0.456, ...] |
| publish_date | Date | Publication date | 1925-01-01 |
| publication | String | Source publication name | "Atlanta Constitution" |
| section | String | Newspaper section | "business", "sports", "opinion" |
| word_count | Integer | Number of words in article | 350 |

### Entity Fields

Entities represent people, places, organizations, and other named elements:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| name | Text | Entity name | "Martin Luther King" |
| type | String | Entity type | "person", "location", "organization" |
| relevance_score | Float | Relevance to article (0-1) | 0.85 |
| mention_count | Integer | Times mentioned in article | 7 |

### Tag Fields

Tags represent thematic classifications:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| name | String | Tag name | "civil rights", "politics", "economy" |
| confidence | Float | Confidence score (0-1) | 0.92 |

## Vector Search Integration

StoryMine interfaces with the vector search capability through the following methods:

### 1. Direct Database Query

For backend implementation, you can query the database directly:

```python
def semantic_search(conn, query_text, limit=10):
    """
    Perform semantic search using vector embeddings
    
    Args:
        conn: Database connection
        query_text: The search query text
        limit: Maximum number of results to return
    
    Returns:
        List of articles most semantically similar to the query
    """
    # Import sentence-transformers for embedding generation
    from sentence_transformers import SentenceTransformer
    
    # Generate embedding for query
    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_embedding = model.encode(query_text)
    
    # Format embedding for PostgreSQL
    query_vector = f"[{','.join(map(str, query_embedding))}]"
    
    # Execute search query
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            id, title, content, publish_date, publication, section,
            1 - (content_embedding <=> %s::vector) AS similarity
        FROM articles
        ORDER BY content_embedding <=> %s::vector
        LIMIT %s;
    """, (query_vector, query_vector, limit))
    
    # Fetch results
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "publish_date": row[3],
            "publication": row[4],
            "section": row[5],
            "similarity": row[6]
        })
    
    cursor.close()
    return results
```

### 2. REST API

StoryMap provides a REST API that StoryMine can use for vector search:

```
GET /api/v1/search/semantic?query={query_text}&limit={limit}
```

Response format:

```json
{
  "status": "success",
  "count": 3,
  "results": [
    {
      "id": 1234,
      "title": "The civil rights movement in Atlanta",
      "snippet": "The civil rights movement in Atlanta was a significant part...",
      "publish_date": "1925-01-01",
      "publication": "Atlanta Constitution",
      "section": "news",
      "similarity": 0.8245,
      "url": "/api/v1/articles/1234"
    },
    // Additional results...
  ]
}
```

### 3. Hybrid Search

To combine keyword and semantic search for optimal results:

```python
def hybrid_search(conn, query_text, limit=10):
    """Combines keyword and semantic search for better results"""
    
    # Sentence transformer model for embedding generation
    model = SentenceTransformer('all-MiniLM-L6-v2')
    query_embedding = model.encode(query_text)
    query_vector = f"[{','.join(map(str, query_embedding))}]"
    
    # Execute hybrid search query
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            id, title, content, publish_date, publication, section,
            ts_rank(to_tsvector('english', title || ' ' || content), 
                    plainto_tsquery('english', %s)) * 0.3 +
            (1 - (content_embedding <=> %s::vector)) * 0.7 AS hybrid_score
        FROM articles
        WHERE to_tsvector('english', title || ' ' || content) @@ 
              plainto_tsquery('english', %s) OR
              1 - (content_embedding <=> %s::vector) > 0.5
        ORDER BY hybrid_score DESC
        LIMIT %s;
    """, (query_text, query_vector, query_text, query_vector, limit))
    
    # Process results
    results = []
    for row in cursor.fetchall():
        results.append({
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "publish_date": row[3],
            "publication": row[4],
            "section": row[5],
            "score": row[6]
        })
    
    cursor.close()
    return results
```

## Entity and Relationship Exploration

StoryMine should leverage the entity relationship data for story exploration:

### Entity Co-occurrence

To find relationships between entities:

```python
def get_entity_relationships(conn, entity_name, limit=10):
    """Find entities that co-occur in articles with the given entity"""
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e2.name, e2.type, COUNT(*) as co_occurrences
        FROM entities e1
        JOIN article_entities ae1 ON e1.id = ae1.entity_id
        JOIN article_entities ae2 ON ae1.article_id = ae2.article_id
        JOIN entities e2 ON ae2.entity_id = e2.id
        WHERE e1.name = %s AND e2.name != %s
        GROUP BY e2.name, e2.type
        ORDER BY co_occurrences DESC
        LIMIT %s;
    """, (entity_name, entity_name, limit))
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "entity": row[0],
            "type": row[1],
            "co_occurrences": row[2]
        })
    
    cursor.close()
    return results
```

### Entity Timeline

To track entity mentions over time:

```python
def get_entity_timeline(conn, entity_name, interval='month'):
    """Get a timeline of mentions for a specific entity"""
    
    # Define date truncation based on interval
    date_trunc = f"date_trunc('{interval}', publish_date)"
    
    cursor = conn.cursor()
    cursor.execute(f"""
        SELECT {date_trunc} as period, COUNT(*) as mention_count
        FROM articles a
        JOIN article_entities ae ON a.id = ae.article_id
        JOIN entities e ON ae.entity_id = e.id
        WHERE e.name = %s AND a.publish_date IS NOT NULL
        GROUP BY period
        ORDER BY period;
    """, (entity_name,))
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "period": row[0],
            "count": row[1]
        })
    
    cursor.close()
    return results
```

## Data Processing Recommendations

For optimal StoryMine performance, consider these processing approaches:

### Client-Side Caching

Implement client-side caching to reduce database load:

```javascript
// Example using local storage in a web application
function fetchArticleWithCache(articleId) {
  const cacheKey = `article_${articleId}`;
  
  // Check cache first
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const {data, timestamp} = JSON.parse(cached);
    
    // Cache valid for 24 hours
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return Promise.resolve(data);
    }
  }
  
  // Fetch from API
  return fetch(`/api/v1/articles/${articleId}`)
    .then(response => response.json())
    .then(data => {
      // Store in cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      return data;
    });
}
```

### Batch Processing

For operations involving multiple articles:

```python
def process_articles_in_batches(conn, process_func, batch_size=100):
    """Process articles in batches to avoid memory issues"""
    
    cursor = conn.cursor()
    
    # Get total count
    cursor.execute("SELECT COUNT(*) FROM articles")
    total_count = cursor.fetchone()[0]
    
    # Process in batches
    for offset in range(0, total_count, batch_size):
        cursor.execute("""
            SELECT id, title, content, publish_date, publication, section
            FROM articles
            ORDER BY id
            LIMIT %s OFFSET %s
        """, (batch_size, offset))
        
        batch = cursor.fetchall()
        process_func(batch)
        
        print(f"Processed {offset + len(batch)} of {total_count} articles")
    
    cursor.close()
```

### Generating UI Content

For narrative generation and visualization:

```python
def generate_story_clusters(conn, time_period=None, min_articles=3):
    """Generate story clusters for UI display"""
    
    date_clause = ""
    params = []
    
    if time_period:
        date_clause = "WHERE a.publish_date BETWEEN %s AND %s"
        params = [time_period['start'], time_period['end']]
    
    cursor = conn.cursor()
    cursor.execute(f"""
        WITH entity_groups AS (
            SELECT e.name, e.type, COUNT(DISTINCT a.id) as article_count
            FROM entities e
            JOIN article_entities ae ON e.id = ae.entity_id
            JOIN articles a ON ae.article_id = a.id
            {date_clause}
            GROUP BY e.name, e.type
            HAVING COUNT(DISTINCT a.id) >= %s
        )
        SELECT name, type, article_count
        FROM entity_groups
        ORDER BY article_count DESC
        LIMIT 50;
    """, params + [min_articles])
    
    # Process results for UI
    results = []
    for row in cursor.fetchall():
        entity_name = row[0]
        
        # Get articles for this entity
        cursor.execute("""
            SELECT a.id, a.title, a.publish_date, a.publication
            FROM articles a
            JOIN article_entities ae ON a.id = ae.article_id
            JOIN entities e ON ae.entity_id = e.id
            WHERE e.name = %s
            ORDER BY ae.relevance_score DESC
            LIMIT 5;
        """, (entity_name,))
        
        articles = []
        for article_row in cursor.fetchall():
            articles.append({
                "id": article_row[0],
                "title": article_row[1],
                "date": article_row[2],
                "publication": article_row[3]
            })
        
        results.append({
            "entity": entity_name,
            "type": row[1],
            "article_count": row[2],
            "top_articles": articles
        })
    
    cursor.close()
    return results
```

## Data Volumes and Performance Considerations

StoryMine should be prepared to handle the following data volumes:

- **Total Articles**: Initial dataset ~500,000 articles, growing by ~1,000 per week
- **Entities**: ~1.5 million unique entities
- **Entity-Article Relationships**: ~15 million relationships
- **Tags**: ~5,000 unique tags

Performance recommendations:

1. **Pagination**: All listing endpoints should use pagination with a default limit of 20-50 items
2. **Asynchronous Loading**: Implement asynchronous loading for heavy operations
3. **Query Limits**: Place reasonable limits on all search operations
4. **Pre-computed Views**: Utilize materialized views for complex, frequently accessed data
5. **Background Processing**: Use message queues for background processing of heavy operations

## Integration Guidelines

### API Authentication

StoryMine will authenticate to the StoryMap API using JWT tokens:

```javascript
async function getAuthToken() {
  const response = await fetch('/api/v1/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: 'storymine_app',
      client_secret: process.env.STORYMAP_API_SECRET
    })
  });
  
  const data = await response.json();
  return data.access_token;
}

async function fetchWithAuth(url, options = {}) {
  const token = await getAuthToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
}
```

### Event-Based Updates

For real-time updates, StoryMine can subscribe to a websocket:

```javascript
const socket = new WebSocket('wss://storymap-api.internal.domain/updates');

socket.onopen = () => {
  console.log('Connected to StoryMap updates');
  
  // Subscribe to article updates
  socket.send(JSON.stringify({
    action: 'subscribe',
    channel: 'article_updates'
  }));
};

socket.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  if (update.type === 'new_article') {
    // Handle new article
    notifyUser(update.data);
    updateCache(update.data);
  } else if (update.type === 'update_article') {
    // Handle article update
    refreshDisplayedArticle(update.data);
  }
};
```

## Deployment and Environment Setup

StoryMine will connect to the following StoryMap environments:

1. **Development**: For testing during feature development
   - Base URL: `https://storymap-dev.internal.domain`
   - Database: `storymap_dev`

2. **Staging**: For pre-production verification
   - Base URL: `https://storymap-staging.internal.domain`
   - Database: `storymap_staging`

3. **Production**: Live environment
   - Base URL: `https://storymap-api.internal.domain`
   - Database: `storymap`

## Monitoring and Debugging

StoryMap provides the following monitoring endpoints for StoryMine integration:

```
GET /api/v1/health              # Basic health check
GET /api/v1/health/database     # Database health
GET /api/v1/metrics             # Performance metrics (requires admin)
GET /api/v1/metrics/search      # Search performance metrics
```

Example integration health check:

```javascript
async function checkIntegrationHealth() {
  try {
    // Check API health
    const apiHealth = await fetch('/api/v1/health')
      .then(res => res.json());
    
    // Check search functionality
    const searchTest = await fetchWithAuth('/api/v1/search/semantic?query=test&limit=1')
      .then(res => res.json());
    
    // Check article retrieval
    const articleTest = await fetchWithAuth('/api/v1/articles/1')
      .then(res => res.json());
    
    return {
      status: 'healthy',
      api: apiHealth.status,
      search: searchTest.status === 'success',
      article: articleTest.status === 'success'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}
```

## Recent Enhancements

### Entity-Aware Jordi

The StoryMine application now features an enhanced version of Jordi that can:

- Recognize and respond to entity-focused queries
- Generate timelines for people, places, and organizations
- Provide relationship information between different entities
- Offer rich contextual responses about historical figures and locations

See [ENTITY_AWARE_JORDI.md](ENTITY_AWARE_JORDI.md) for complete details.

## Conclusion

This document provides the technical foundation for the StoryMine development team to build on top of the StoryMap data processing pipeline. By leveraging the defined database schema, vector search capabilities, and integration patterns, StoryMine can focus on building an engaging user interface for exploring historical newspaper content. 