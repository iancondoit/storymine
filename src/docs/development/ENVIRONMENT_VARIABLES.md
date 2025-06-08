# Environment Variables Reference

This document provides a comprehensive reference of all environment variables used in StoryMine.

## Backend Environment Variables

These variables should be defined in the `backend/.env` file.

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Port on which the backend server will listen | `3001` | Yes |
| `NODE_ENV` | Environment mode: development, test, production | `development` | Yes |
| `CORS_ORIGIN` | CORS allowed origins (comma-separated) | `http://localhost:3000` | Yes |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` | No |
| `REQUEST_TIMEOUT` | API request timeout in milliseconds | `30000` | No |

### StoryMap API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_ENVIRONMENT` | StoryMap API environment (development, staging, production) | `development` | Yes |
| `AUTH_METHOD` | Authentication method for StoryMap API (none, jwt) | `none` | Yes |
| `STORYMAP_API_URLS` | Comma-separated list of StoryMap API URLs to try | `http://host.docker.internal:8080` | Yes |
| `STORYMAP_CLIENT_ID` | Client ID for StoryMap API authentication | — | Only if AUTH_METHOD=jwt |
| `STORYMAP_CLIENT_SECRET` | Client secret for StoryMap API authentication | — | Only if AUTH_METHOD=jwt |
| `DEFAULT_PAGE_SIZE` | Default pagination size for API requests | `20` | No |
| `MAX_PAGE_SIZE` | Maximum pagination size for API requests | `100` | No |

### Claude AI Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CLAUDE_API_KEY` | Anthropic API key for Claude | — | Yes |
| `CLAUDE_MODEL` | Claude model to use | `claude-3-sonnet-20240229` | No |
| `CLAUDE_MAX_TOKENS` | Maximum tokens for Claude responses | `4096` | No |
| `MAX_HISTORY_LENGTH` | Maximum number of messages to keep in conversation history | `10` | No |

### Redis Cache Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CACHE_ENABLED` | Enable Redis caching | `true` | No |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` | Yes if CACHE_ENABLED=true |
| `CACHE_TTL` | Default cache TTL in seconds | `300` | No |

### Authentication and Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT token generation | — | Yes |
| `JWT_EXPIRY` | JWT token expiry time in seconds | `86400` | No |
| `RATE_LIMIT` | API rate limit (requests per minute) | `120` | No |
| `ENABLE_HELMET` | Enable Helmet security headers | `true` | No |

### Optional Integrations

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SENTRY_DSN` | Sentry DSN for error tracking | — | No |
| `LOGDNA_KEY` | LogDNA API key for log aggregation | — | No |
| `OPENAI_API_KEY` | OpenAI API key (alternative to Claude) | — | No |

## Frontend Environment Variables

These variables should be defined in the `frontend/.env.local` file.

### API Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | URL of the backend API | `http://localhost:3001/api` | Yes |
| `NEXT_PUBLIC_WEBSOCKET_URL` | URL for WebSocket connection | `ws://localhost:3001` | No |

### Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_APP_NAME` | Application name | `StoryMine` | No |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `1.0.0` | No |
| `NEXT_PUBLIC_DEFAULT_THEME` | Default theme (light/dark) | `dark` | No |

### Analytics and Monitoring

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_ANALYTICS_ID` | Google Analytics ID | — | No |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend error tracking | — | No |

### Feature Flags

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_ENABLE_JORDI` | Enable Jordi AI assistant | `true` | No |
| `NEXT_PUBLIC_ENABLE_NETWORK_VIS` | Enable network visualizations | `true` | No |
| `NEXT_PUBLIC_ENABLE_TIMELINE` | Enable timeline feature | `true` | No |

## Docker Environment Variables

These variables are defined in the `docker-compose.yml` file and override the corresponding `.env` variables.

### Backend Service

```yaml
backend:
  environment:
    - PORT=3001
    - NODE_ENV=development
    - API_ENVIRONMENT=development
    - AUTH_METHOD=none
    - STORYMAP_API_URLS=http://host.docker.internal:8080
    - DEFAULT_PAGE_SIZE=20
    - MAX_PAGE_SIZE=100
    - CACHE_ENABLED=true
    - REDIS_URL=redis://redis:6379
    - API_TIMEOUT=15000
    - MAX_CONNECTIONS=100
    - RATE_LIMIT=120
    - TOKEN_EXPIRY=86400
```

### Frontend Service

```yaml
frontend:
  environment:
    - NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Environment Setup Examples

### Development Environment

**backend/.env**
```
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug

API_ENVIRONMENT=development
AUTH_METHOD=none
STORYMAP_API_URLS=http://host.docker.internal:8080

CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-sonnet-20240229

CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379

JWT_SECRET=your_local_secret_key_here
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_DEFAULT_THEME=dark
NEXT_PUBLIC_ENABLE_JORDI=true
```

### Production Environment

**backend/.env**
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://storymine.com
LOG_LEVEL=info

API_ENVIRONMENT=production
AUTH_METHOD=jwt
STORYMAP_API_URLS=https://api.storymap.com/v1
STORYMAP_CLIENT_ID=storymine_client
STORYMAP_CLIENT_SECRET=production_secret_key_here

CLAUDE_API_KEY=production_claude_api_key_here
CLAUDE_MODEL=claude-3-sonnet-20240229

CACHE_ENABLED=true
REDIS_URL=redis://redis-production:6379

JWT_SECRET=production_secret_key_here
RATE_LIMIT=300
ENABLE_HELMET=true

SENTRY_DSN=your_sentry_dsn_here
```

**frontend/.env.production**
```
NEXT_PUBLIC_API_URL=https://api.storymine.com
NEXT_PUBLIC_APP_VERSION=1.2.0
NEXT_PUBLIC_ANALYTICS_ID=UA-123456789-1
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

## Managing Environment Variables

### Local Development

For local development, create `.env` files based on the examples:

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your values
```

### Docker Development

When using Docker, environment variables are set in the `docker-compose.yml` file and override any values in the `.env` files.

### CI/CD Pipeline

For continuous integration and deployment, set environment variables in your CI/CD configuration:

**GitHub Actions Example**
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production
      # ... other environment variables
    steps:
      # ... build steps
```

### Production Deployment

For production deployment, use environment variable management provided by your hosting platform:

- **Vercel**: Set environment variables in the Vercel dashboard
- **Heroku**: Use `heroku config:set VARIABLE=value`
- **AWS**: Use AWS Parameter Store or Secrets Manager
- **Docker Swarm/Kubernetes**: Use secrets and config maps

## Security Considerations

- Never commit `.env` files to version control
- Use different JWT secrets for each environment
- Rotate API keys and secrets regularly
- Consider using a secrets management service for production deployments
- Set appropriate permissions for `.env` files (e.g., `chmod 600 .env`) 