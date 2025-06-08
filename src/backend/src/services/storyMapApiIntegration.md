# StoryMap API Integration

This document outlines the approach for integrating the real StoryMap API into the StoryMine application.

## Current Implementation

The current implementation uses a mock API server (scripts/start_storymap.py) that provides sample data for development. The StoryMap API client (backend/src/services/storyMapApi.ts) attempts to connect to various possible API URLs and provides methods for interacting with the API endpoints.

## Integration Approach

To integrate with the real StoryMap API, we'll follow these steps:

1. Create a configuration mechanism for selecting between mock and real APIs
2. Implement tests for the real API endpoints
3. Update the API client to handle the real API responses
4. Add comprehensive logging and error handling

## API Configuration

We'll update the environment configuration to support different API environments:

```typescript
// Possible API environments
enum ApiEnvironment {
  MOCK = 'mock',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

// Environment-specific API URLs
const API_URLS = {
  [ApiEnvironment.MOCK]: ['http://localhost:5001', 'http://127.0.0.1:5001'],
  [ApiEnvironment.DEVELOPMENT]: ['https://dev-storymap-api.example.com'],
  [ApiEnvironment.STAGING]: ['https://staging-storymap-api.example.com'],
  [ApiEnvironment.PRODUCTION]: ['https://storymap-api.example.com']
};

// Get current environment from env vars with fallback to mock
const CURRENT_ENV = (process.env.API_ENVIRONMENT as ApiEnvironment) || ApiEnvironment.MOCK;

// Get API URLs for current environment
const STORYMAP_API_URLS = API_URLS[CURRENT_ENV];
```

## Authentication

The real StoryMap API will require proper authentication:

```typescript
// API authentication
const API_KEY = process.env.STORYMAP_API_KEY || '';
const API_SECRET = process.env.STORYMAP_API_SECRET || '';

// Authentication methods
enum AuthMethod {
  NONE = 'none',
  API_KEY = 'api_key',
  OAUTH = 'oauth'
}

// Current auth method
const AUTH_METHOD = process.env.AUTH_METHOD as AuthMethod || AuthMethod.NONE;

// Authentication headers based on method
const getAuthHeaders = () => {
  switch (AUTH_METHOD) {
    case AuthMethod.API_KEY:
      return { 'Authorization': `Bearer ${API_KEY}` };
    case AuthMethod.OAUTH:
      // Implement OAuth flow
      return { 'Authorization': `Bearer ${getOAuthToken()}` };
    default:
      return {};
  }
};
```

## API Client Enhancement

The API client will be enhanced to:

1. Support different API versions
2. Handle rate limiting
3. Implement retries for failed requests
4. Add comprehensive logging
5. Cache responses where appropriate

## Test Strategy

Following TDD principles, we'll implement:

1. **Unit Tests**: Testing individual API client methods
2. **Integration Tests**: Testing the full request/response cycle
3. **Mock Tests**: Using mocked responses for predictable testing
4. **Live Tests**: Testing against the actual API in non-production environments

## Error Handling

We'll implement comprehensive error handling:

1. Request timeouts
2. Connection errors
3. Authentication failures
4. Rate limiting
5. Invalid responses
6. Data validation errors

## Endpoints to Implement

Based on the STORYMAP_API.md documentation, we'll implement the following endpoints:

1. **Articles**
   - GET /api/articles - List articles with pagination
   - GET /api/articles/{article_id} - Get article details with entities and relationships

2. **Entities**
   - GET /api/entities - List unique entities
   - GET /api/entities/{entity_type} - List entities by type

3. **Search**
   - POST /api/search - Semantic search on articles

4. **Batch Processing**
   - POST /api/batch - Create batch processing job
   - GET /api/batch/{batch_id} - Get batch job status

## Data Validation

We'll implement validation for all API responses to ensure data integrity:

```typescript
// Example validation for article response
const validateArticleResponse = (data: any): Article => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid article data: not an object');
  }
  
  if (!data.id || !data.title || !data.content) {
    throw new Error('Invalid article data: missing required fields');
  }
  
  // Return validated data
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    category: data.category || 'uncategorized',
    publicationDate: data.publication_date,
    // Additional fields with defaults
    source: data.source || 'Unknown',
    isAdvertisement: data.is_advertisement || false,
    qualityScore: data.quality_score || 0,
    // ...other fields
  };
};
```

## Monitoring and Metrics

We'll add monitoring for API performance and reliability:

1. Request/response times
2. Success/failure rates
3. Rate limit tracking
4. Usage patterns

## Implementation Plan

1. Update environment configuration
2. Create interface definitions for API responses
3. Implement validation functions
4. Enhance API client with authentication
5. Add retry and error handling logic
6. Create comprehensive tests
7. Implement caching
8. Add metrics and monitoring

## Next Steps

1. Review current StoryMap API client implementation
2. Create test cases for API integration
3. Implement configuration changes
4. Update API client methods
5. Run tests against mock API
6. Test against real API when available 