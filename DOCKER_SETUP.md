# StoryMine Docker Development Environment

This document provides instructions for running the StoryMine application using Docker for development, which simplifies integration with the StoryMap API.

## Prerequisites

1. Install [Docker](https://docs.docker.com/get-docker/)
2. Install [Docker Compose](https://docs.docker.com/compose/install/)

## StoryMap API Details

According to the latest information from the StoryMap team:

- Base URL: `http://localhost:8080`
- Health Check: `GET /health`
- Articles Endpoint: `GET /api/articles`
- Article by ID: `GET /api/articles/{id}`
- No authentication required
- Direct response format (no data/meta wrapper)

## Getting Started

### 1. Verify the StoryMap API is Running

The StoryMap API should be running on port 8080. You can verify this with:

```bash
# Run the quick test script
node quick-api-test.js
```

### 2. Build and Start StoryMine Services

```bash
# From the StoryMine project root
docker-compose up --build
```

This will:
- Build and start the backend service (available at `http://localhost:3001`)
- Build and start the frontend service (available at `http://localhost:3000`)

### 3. Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Backend Health Check**: http://localhost:3001/health

### 4. Testing the StoryMap API Connection

```bash
# From the StoryMine project root
docker-compose exec backend node scripts/docker-api-test.js
```

This script will test the connection to the StoryMap API.

## Configuration

### Environment Variables

All configuration is managed through environment variables in the `docker-compose.yml` file:

#### Backend Service Environment Variables

- `PORT`: The port the backend service listens on (default: 3001)
- `NODE_ENV`: The Node.js environment (development, production)
- `API_ENVIRONMENT`: The StoryMap API environment (mock, development, staging, production)
- `AUTH_METHOD`: Authentication method (set to 'none')
- `STORYMAP_API_URL`: URL of the StoryMap API (default: http://host.docker.internal:8080)

#### Frontend Service Environment Variables

- `NEXT_PUBLIC_API_URL`: URL of the backend API (default: http://localhost:3001/api)

## Article Response Format

Based on the sample data, StoryMap articles have the following structure:

```json
{
  "category": null,
  "classification_confidence": 1.0,
  "content": "",
  "created_at": "1925-01-01T18:00:00",
  "entities": [],
  "id": 1,
  "is_advertisement": false,
  "is_classified": false,
  "language": "en",
  "processed_content": null,
  "publication": "Atlanta Constitution",
  "publication_date": "1925-01-01T18:00:00",
  "quality_score": 1.0,
  "relationships": [],
  "source": "https://archive.org/details/per_atlanta-constitution_1925-01-02_57_204",
  "title": "Untitled Article",
  "updated_at": "1925-01-01T18:00:00",
  "word_count": 0
}
```

## Local Development Environment

```yaml
environment:
  - STORYMAP_API_URL=http://host.docker.internal:8080
  - AUTH_METHOD=none
```

## Troubleshooting

### Connection Issues with StoryMap API

If you're having trouble connecting to the StoryMap API:

1. Verify that the StoryMap API is running on port 8080
2. Try using the quick-api-test.js script outside of Docker
3. Check Docker networking: host.docker.internal should resolve to your host machine
4. On Linux, you may need to add `--network=host` to your Docker command

### Container Startup Issues

If containers fail to start:

```bash
# View container logs
docker-compose logs backend
docker-compose logs frontend

# Restart containers
docker-compose restart
```

## Development Workflow

1. Make changes to the code on your local machine
2. The changes will be automatically picked up due to volume mounting
3. The services will restart automatically when changes are detected 