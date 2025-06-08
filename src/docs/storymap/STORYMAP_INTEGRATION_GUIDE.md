# StoryMap API Integration Guide via Docker

This guide explains how to configure StoryMine to connect to the StoryMap API exclusively using Docker.

## Prerequisites

Before getting started, you need:

1. [Docker](https://docs.docker.com/get-docker/) installed on your system
2. [Docker Compose](https://docs.docker.com/compose/install/) installed on your system
3. Access to the development or production StoryMap API server

## Configuration Steps

### 1. Docker Environment Variables

Update your `docker-compose.yml` file with the following settings for the backend service:

```yaml
backend:
  # ... other settings ...
  environment:
    # ... other environment variables ...
    - API_ENVIRONMENT=development
    - AUTH_METHOD=none
    - STORYMAP_API_URLS=http://host.docker.internal:8080
```

For production, update the environment and URL:

```yaml
backend:
  # ... other settings ...
  environment:
    # ... other environment variables ...
    - API_ENVIRONMENT=production
    - AUTH_METHOD=jwt
    - STORYMAP_API_URLS=https://api.storymap.com/v1
    - STORYMAP_CLIENT_ID=storymine_client
    - STORYMAP_CLIENT_SECRET=your-client-secret-here
```

Replace `your-client-secret-here` with the actual client secret provided by the StoryMap team.

### 2. Starting the Application with Docker

Run the following command to start the application with Docker:

```bash
docker-compose up --build
```

This will start the backend, frontend, and Redis services. The backend will connect to the StoryMap API through Docker networking.

### 3. Testing the Connection

You can test the connection to the StoryMap API with:

```bash
docker-compose exec backend node scripts/docker-api-test.js
```

### 4. Checking API Status

You can check the StoryMap API connection status by visiting:

```
http://localhost:3001/api/storymap-stats
```

If everything is configured correctly, you should see a response with `status: "online"` and details about the API.

## Troubleshooting

### Docker Connection Issues

If you're having trouble connecting to the StoryMap API:

1. Verify that the StoryMap API is running on port 8080
2. Check Docker networking: `host.docker.internal` should resolve to your host machine
3. On Linux, you may need to add `--network=host` to your Docker command
4. Check container logs with `docker-compose logs backend`

### Authentication Errors

If you see authentication errors:

1. Verify your client ID and client secret are correct in `docker-compose.yml`
2. Check that AUTH_METHOD is set to "jwt" for production
3. Ensure the API_ENVIRONMENT matches the URL you're trying to connect to

### Rate Limiting

The StoryMap API has a rate limit of 60 requests per minute. If you exceed this limit, you'll receive HTTP 429 responses with a `Retry-After` header indicating when you can resume requests.

## API Endpoints

The StoryMap API exposes the following endpoints:

- `GET /health` - Health check
- `GET /api/articles` - List articles with pagination
- `GET /api/articles/{id}` - Get article by ID
- `GET /api/entities` - List entities
- `GET /api/entities/{entity_type}` - Get entities by type
- `POST /api/search` - Search articles

Refer to the StoryMap API documentation for complete details on request and response formats.

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/) 