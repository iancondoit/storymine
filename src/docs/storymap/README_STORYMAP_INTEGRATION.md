# StoryMap API Integration via Docker

This document provides instructions for integrating with the StoryMap API in the StoryMine application using Docker.

## Overview

We've implemented a Docker-based integration that allows the application to interact with the StoryMap API in a controlled and isolated environment.

## Key Features

- Docker-based configuration
- Environment-specific settings in docker-compose.yml
- Isolated network communication
- No direct/local API connections
- Comprehensive error handling and retry mechanisms
- Validation of API responses
- Detailed logging of requests and responses

## Setting Up the Docker Integration

### 1. Docker Configuration

All configuration is managed through environment variables in the `docker-compose.yml` file:

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  environment:
    - PORT=3001
    - NODE_ENV=development
    - API_ENVIRONMENT=development
    - AUTH_METHOD=none
    - STORYMAP_API_URLS=http://localhost:8080,http://host.docker.internal:8080
    - DEFAULT_PAGE_SIZE=20
    - MAX_PAGE_SIZE=100
    # Additional settings...
```

### 2. Running the Integration

Build and start the Docker containers:

```bash
docker-compose up --build
```

This will:
- Build and start the backend service (available at `http://localhost:3001`)
- Build and start the frontend service (available at `http://localhost:3000`)
- Configure the connection to the StoryMap API

### 3. Testing the Docker API Connection

```bash
docker-compose exec backend node scripts/docker-api-test.js
```

This script will test the connection to the StoryMap API through Docker.

## API Client Methods

The StoryMapApiClient provides the following methods when used through Docker:

- `ping()` - Check API availability
- `getArticles()` - Get a list of articles with pagination
- `getArticle()` - Get a single article by ID
- `getEntities()` - Get a list of entities
- `getEntitiesByType()` - Get entities by type
- `searchArticles()` - Perform semantic search
- `getEntityRelationships()` - Get relationships for a specific entity
- `getEntityNetwork()` - Get network of related entities with visualization data

## Implementation Details

### 1. Docker Networking

The backend container connects to the StoryMap API using Docker networking:

- `host.docker.internal` resolves to the host machine on Windows and macOS
- On Linux, additional configuration may be needed

### 2. Error Handling

The client implements comprehensive error handling, including:

- Connection errors
- Authentication errors
- Rate limiting
- Server errors
- Validation errors

### 3. Retry Mechanism

Failed requests are automatically retried using exponential backoff:

- Network errors and 5xx server errors trigger automatic retries
- Rate-limited requests (429) respect the Retry-After header

## Current Status

The StoryMap API integration has been implemented in multiple phases:

### Phase 1: API Connection Setup ✅

- ✅ Docker environment configurations
- ✅ Authentication methods
- ✅ Error handling with retries
- ✅ Request/response logging
- ✅ Unit and integration tests

### Phase 2: Data Model Integration ✅

- ✅ TypeScript interfaces for all API entities
- ✅ Response formats for lists, search results, and batch operations
- ✅ Controllers updated to use the new client
- ✅ Entity relationship models and network visualization support
- ✅ Query optimization for relationship endpoints

### Phase 3: Advanced Features 🔄

- 🔄 Caching layer for frequently accessed entities
- 🔄 Batch operations for relationship analysis
- 🔄 Timeline-based entity analysis
- 🔄 Performance optimizations for large datasets

## Roadmap

1. **Completed:**
   - Docker-based connection setup
   - Data model integration
   - Entity relationship mapping
   - Network visualization support
   - Test coverage for all API client methods

2. **In Progress:**
   - Response caching layer
   - Batch processing optimization

3. **Upcoming:**
   - Authentication Improvements
     - Implement OAuth flow
     - Add token refresh functionality
     - Store API credentials securely
   - Advanced Visualization
     - Timeline visualizations
     - Geospatial entity mapping
     - Dynamic relationship graphs
   - Monitoring and Metrics
     - Track API response times
     - Monitor error rates
     - Create dashboards for API performance

## Troubleshooting

### Docker-Specific Issues

1. **Docker Container Connection Issues**
   - Verify ports are correctly mapped in docker-compose.yml
   - Check container logs with `docker-compose logs backend`
   - Ensure Docker networks are configured correctly

2. **Host.Docker.Internal Resolution**
   - This works automatically on Windows and macOS
   - On Linux, add `--add-host=host.docker.internal:host-gateway` to Docker command
   - Or use `--network=host` flag

3. **API Connection Failed**
   - Check if the StoryMap API is running on the expected port
   - Verify Docker networking settings
   - Check container logs for connectivity errors

4. **Authentication Errors**
   - Verify your API keys in docker-compose.yml
   - Check the AUTH_METHOD setting matches your credentials

5. **Rate Limiting**
   - Implement queuing for high-volume operations
   - Add delays between requests when appropriate

## Entity Relationship API Examples

### 1. Get Entity Relationships

```javascript
// Example request
fetch('/api/entities/e123/relationships?limit=10')
  .then(response => response.json())
  .then(data => {
    console.log('Entity relationships:', data);
    // {
    //   entity_id: 'e123',
    //   relationships: [
    //     {
    //       id: 'r1',
    //       source: 'e123',
    //       target: 'e456',
    //       type: 'works_for',
    //       confidence: 0.9
    //     },
    //     ...
    //   ],
    //   limit: 10,
    //   offset: 0,
    //   total: 42
    // }
  });
```

### 2. Get Entity Network

```javascript
// Example request
fetch('/api/entities/e123/network?depth=2&limit=20')
  .then(response => response.json())
  .then(data => {
    console.log('Entity network:', data);
    // {
    //   nodes: [
    //     { id: 'e123', name: 'John Doe', entity_type: 'person', size: 5 },
    //     { id: 'e456', name: 'Acme Corp', entity_type: 'organization', size: 3 },
    //     ...
    //   ],
    //   edges: [
    //     { 
    //       id: 'r1',
    //       source: 'e123',
    //       target: 'e456',
    //       type: 'works_for',
    //       weight: 0.9
    //     },
    //     ...
    //   ],
    //   stats: {
    //     node_count: 15,
    //     edge_count: 22,
    //     density: 0.23
    //   }
    // }
  });
```

### 3. Visualization with D3.js

```javascript
fetch('/api/entities/e123/network')
  .then(response => response.json())
  .then(data => {
    // Set up D3 force-directed graph
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.edges).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Add links (edges)
    const link = svg.append('g')
      .selectAll('line')
      .data(data.edges)
      .enter().append('line')
      .attr('stroke-width', d => Math.sqrt(d.weight))
      .attr('stroke', '#999');
    
    // Add nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', d => d.size || 5)
      .attr('fill', d => {
        // Color by entity type
        switch(d.entity_type) {
          case 'person': return '#4285F4';
          case 'organization': return '#EA4335';
          case 'location': return '#34A853';
          default: return '#FBBC05';
        }
      });
      
    // Add labels
    const text = svg.append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('dx', 12)
      .attr('dy', 4);
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      text
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
  });
``` 