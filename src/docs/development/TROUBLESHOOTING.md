# Troubleshooting Guide

This document provides solutions for common issues you might encounter while developing or running the StoryMine application.

## Table of Contents

- [Docker Issues](#docker-issues)
- [Frontend Issues](#frontend-issues)
- [Backend Issues](#backend-issues)
- [StoryMap API Integration Issues](#storymap-api-integration-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Testing Issues](#testing-issues)
- [Deployment Issues](#deployment-issues)

## Docker Issues

### Container Fails to Start

**Symptom**: Docker containers fail to start or exit immediately.

**Solutions**:

1. Check the logs:
   ```bash
   docker-compose logs
   ```

2. Ensure Docker daemon is running:
   ```bash
   docker info
   ```

3. Clean up Docker resources:
   ```bash
   docker-compose down -v
   docker system prune -a
   docker-compose up --build
   ```

4. Verify Docker Compose file syntax:
   ```bash
   docker-compose config
   ```

### Port Conflicts

**Symptom**: "Port is already allocated" error when starting containers.

**Solutions**:

1. Find and kill processes using the ports:
   ```bash
   # For macOS/Linux
   lsof -i :3000
   lsof -i :3001
   kill -9 <PID>
   
   # For Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```

2. Modify ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "3002:3000"  # Map to different host port
   ```

### host.docker.internal Resolution

**Symptom**: Services can't connect to the host machine.

**Solutions**:

1. For Linux hosts, add `--add-host=host.docker.internal:host-gateway` to Docker command or in compose file:
   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```

2. For Windows/macOS, verify Docker Desktop settings:
   - Ensure "Expose daemon on tcp://localhost:2375" is unchecked
   - Check if network mode is correct

3. Use container IP instead:
   ```bash
   # Find the container IP
   docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' container_name
   ```

## Frontend Issues

### Build Failures

**Symptom**: Next.js build fails with errors.

**Solutions**:

1. Check for TypeScript errors:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```

2. Clear Next.js cache:
   ```bash
   cd frontend
   rm -rf .next
   npm run build
   ```

3. Update dependencies:
   ```bash
   cd frontend
   npm update
   ```

### API Connection Errors

**Symptom**: Frontend can't connect to backend API.

**Solutions**:

1. Verify environment variables:
   ```
   # Check frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

2. Check CORS settings in browser console:
   - Look for Cross-Origin errors
   - Verify CORS middleware is enabled in backend

3. Test API with curl or Postman:
   ```bash
   curl http://localhost:3001/api/health
   ```

### Styling Issues

**Symptom**: Tailwind styles not applying correctly.

**Solutions**:

1. Verify Tailwind configuration:
   ```bash
   cd frontend
   npx tailwindcss --help
   ```

2. Clear CSS cache:
   ```bash
   cd frontend
   rm -rf .next/cache
   npm run dev
   ```

3. Check for conflicting styles or incorrectly nested classes.

## Backend Issues

### Server Won't Start

**Symptom**: Backend server fails to start.

**Solutions**:

1. Check for syntax errors:
   ```bash
   cd backend
   npx tsc --noEmit
   ```

2. Verify dependencies are installed:
   ```bash
   cd backend
   npm ci
   ```

3. Check environment variables:
   ```bash
   cd backend
   cat .env
   ```

### Database Connection Failures

**Symptom**: Server fails to connect to database.

**Solutions**:

1. Check database URL in environment variables:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   ```

2. Verify database is running:
   ```bash
   # For PostgreSQL
   pg_isready -h localhost -p 5432
   ```

3. Test connection with a different client:
   ```bash
   psql -h localhost -U username -d dbname
   ```

### Memory Leaks

**Symptom**: Backend service memory usage grows over time.

**Solutions**:

1. Enable heap dumps and analyze with Chrome DevTools:
   ```bash
   node --inspect --expose-gc backend/dist/server.js
   ```

2. Check for unresolved Promises or event listeners not being cleaned up.

3. Implement proper cleanup in middleware and controllers.

## StoryMap API Integration Issues

### Connection Failures

**Symptom**: Application can't connect to StoryMap API.

**Solutions**:

1. Verify Docker setup:
   ```bash
   # Check if StoryMap API container is running
   docker ps
   
   # Test connection to StoryMap API
   npm run test:docker-api
   ```

2. Check environment variables:
   ```
   # In backend/.env
   STORYMAP_API_URLS=http://host.docker.internal:8080
   ```

3. Verify StoryMap API is running on expected port:
   ```bash
   curl http://localhost:8080/health
   ```

### Authentication Issues

**Symptom**: Receiving 401 Unauthorized from StoryMap API.

**Solutions**:

1. Check authentication settings:
   ```
   # In backend/.env
   AUTH_METHOD=jwt
   STORYMAP_CLIENT_ID=storymine_client
   STORYMAP_CLIENT_SECRET=your-client-secret-here
   ```

2. Verify token generation and expiration:
   ```bash
   # Generate a test token
   cd backend
   node scripts/generate-test-token.js
   ```

3. Check for clock skew between systems.

### Rate Limiting

**Symptom**: Receiving 429 Too Many Requests from StoryMap API.

**Solutions**:

1. Implement request throttling:
   ```javascript
   // Add rate limiting to your requests
   const limiter = new RateLimiter({
     maxRequests: 50,
     perMinute: 60
   });
   
   // Use limiter before making API calls
   await limiter.wait();
   ```

2. Add exponential backoff for retries:
   ```javascript
   let retries = 0;
   const maxRetries = 3;
   
   while (retries < maxRetries) {
     try {
       return await makeApiCall();
     } catch (error) {
       if (error.status === 429) {
         const delay = Math.pow(2, retries) * 1000;
         await new Promise(resolve => setTimeout(resolve, delay));
         retries++;
       } else {
         throw error;
       }
     }
   }
   ```

## Authentication Issues

### JWT Token Problems

**Symptom**: Invalid or expired JWT tokens.

**Solutions**:

1. Check token expiration settings:
   ```javascript
   // Set reasonable expiration time
   const token = jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1d' });
   ```

2. Implement token refresh:
   ```javascript
   function refreshTokenIfNeeded(token) {
     const decoded = jwt.decode(token);
     const expiryTime = decoded.exp * 1000;
     const currentTime = Date.now();
     
     // Refresh if less than 10 minutes until expiry
     if (expiryTime - currentTime < 10 * 60 * 1000) {
       return fetchNewToken();
     }
     
     return Promise.resolve(token);
   }
   ```

3. Verify secret keys match between token generation and verification.

## Performance Issues

### Slow API Responses

**Symptom**: API responses take too long.

**Solutions**:

1. Implement caching:
   ```javascript
   // Simple cache using node-cache
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 300 }); // 5 minute TTL
   
   async function getArticleWithCache(id) {
     const cacheKey = `article_${id}`;
     const cached = cache.get(cacheKey);
     
     if (cached) {
       return cached;
     }
     
     const article = await fetchArticle(id);
     cache.set(cacheKey, article);
     return article;
   }
   ```

2. Optimize database queries:
   - Add indexes
   - Use specific column selection instead of SELECT *
   - Limit result sets with pagination

3. Enable compression:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

### Memory Usage

**Symptom**: High memory usage in Node.js processes.

**Solutions**:

1. Limit request body size:
   ```javascript
   app.use(express.json({ limit: '1mb' }));
   ```

2. Stream large responses:
   ```javascript
   // Instead of loading all data in memory
   response.pipe(res);
   ```

3. Implement proper pagination:
   ```javascript
   app.get('/articles', (req, res) => {
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 20;
     const offset = (page - 1) * limit;
     
     // Use offset and limit in database query
   });
   ```

## Testing Issues

### Jest Tests Failing

**Symptom**: Unit or integration tests fail.

**Solutions**:

1. Update test snapshots:
   ```bash
   npm test -- -u
   ```

2. Check for environmental differences between CI and local:
   ```javascript
   // Use environment-specific configuration in tests
   const config = process.env.NODE_ENV === 'test' 
     ? require('./config.test') 
     : require('./config');
   ```

3. Mock external dependencies:
   ```javascript
   // Mock StoryMap API client
   jest.mock('../src/services/storyMapApiClient', () => ({
     getArticles: jest.fn().mockResolvedValue([{ id: 1, title: 'Test' }]),
     getArticle: jest.fn().mockResolvedValue({ id: 1, title: 'Test' })
   }));
   ```

### E2E Tests Flaky

**Symptom**: Cypress or other E2E tests are unreliable.

**Solutions**:

1. Increase timeouts for async operations:
   ```javascript
   // In Cypress test
   cy.get('.element', { timeout: 10000 })
   ```

2. Add retry mechanisms:
   ```javascript
   // In Cypress configuration
   {
     retries: {
       runMode: 2,
       openMode: 1
     }
   }
   ```

3. Use more specific selectors:
   ```javascript
   // Instead of
   cy.get('button')
   
   // Use
   cy.get('[data-testid="submit-button"]')
   ```

## Deployment Issues

### Build Failures in CI

**Symptom**: Builds fail in CI but work locally.

**Solutions**:

1. Check environment variables in CI:
   ```yaml
   # Add necessary environment variables to CI config
   env:
     NODE_ENV: production
     NEXT_PUBLIC_API_URL: https://api.example.com
   ```

2. Verify Node.js version in CI matches local:
   ```yaml
   # Specify Node.js version
   node_version: 18
   ```

3. Check for platform-specific dependencies:
   ```json
   // In package.json, use cross-platform alternatives
   "scripts": {
     "clean": "rimraf dist",  // Instead of rm -rf
     "copy": "copyfiles assets/* dist/"  // Instead of cp
   }
   ```

### Production Environment Issues

**Symptom**: Application behaves differently in production.

**Solutions**:

1. Check environment-specific code:
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     // Production-specific behavior
   } else {
     // Development behavior
   }
   ```

2. Verify production environment variables:
   ```
   NODE_ENV=production
   API_URL=https://api.production.com
   ```

3. Test with production builds locally:
   ```bash
   NODE_ENV=production npm run build
   npm run start
   ```

## Additional Resources

- [Docker Troubleshooting Guide](https://docs.docker.com/engine/troubleshooting/)
- [Next.js Debugging Guide](https://nextjs.org/docs/advanced-features/debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Express.js Troubleshooting](https://expressjs.com/en/advanced/troubleshooting.html)
- [Jest Troubleshooting](https://jestjs.io/docs/troubleshooting) 