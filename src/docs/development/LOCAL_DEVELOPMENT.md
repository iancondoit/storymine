# Local Development Guide

This guide provides detailed instructions for setting up your local development environment for StoryMine.

## Prerequisites

Make sure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Docker** and **Docker Compose**
- **Git**
- A code editor (recommended: VS Code)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/storymine.git
cd storymine
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Set Up Environment Variables

Create necessary `.env` files:

```bash
# Frontend environment variables
cp frontend/.env.example frontend/.env.local

# Backend environment variables
cp backend/.env.example backend/.env
```

Edit the files to add your specific configuration:

**backend/.env**:
```
# Server configuration
PORT=3001
NODE_ENV=development

# StoryMap API configuration
API_ENVIRONMENT=development
AUTH_METHOD=none
STORYMAP_API_URLS=http://host.docker.internal:8080

# Claude API configuration (if available)
CLAUDE_API_KEY=your_claude_api_key_here
```

**frontend/.env.local**:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. IDE Setup

#### VS Code Configuration

Create a `.vscode` folder with the following files:

**settings.json**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": [
    "./frontend",
    "./backend"
  ],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

**extensions.json**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "mikestead.dotenv",
    "ms-azuretools.vscode-docker",
    "orta.vscode-jest"
  ]
}
```

## Development Workflows

### Running the Application

#### Option 1: Using Docker (Recommended)

Docker provides a consistent development environment and includes the StoryMap API:

```bash
# Start all services with Docker
npm run docker:up

# Stop all services
npm run docker:down
```

#### Option 2: Local Development Server

For faster feedback while developing, you can run the frontend and backend services locally:

```bash
# Run both frontend and backend
npm run dev

# Run only the frontend
npm run frontend:dev

# Run only the backend
npm run backend:dev
```

Note: When running locally, you'll need the StoryMap API available through Docker.

### Development Best Practices

#### 1. Branch Management

Follow a feature branch workflow:

```bash
# Create a feature branch
git checkout -b feature/new-feature

# Make your changes and commit them
git add .
git commit -m "Add new feature"

# Push changes to remote
git push origin feature/new-feature
```

#### 2. Code Style and Formatting

The project uses ESLint and Prettier for code quality and formatting:

```bash
# Check for linting issues
npm run lint

# Automatically fix linting issues
npm run lint:fix

# Format code
npm run format
```

#### 3. Testing

Follow Test-Driven Development (TDD) practices:

```bash
# Run all tests
npm test

# Run tests in watch mode for development
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

#### 4. Component Development

For frontend component development:

1. Create a new component file in `frontend/src/components/`
2. Create a corresponding test file
3. Write tests first, then implement the component
4. Import and use the component in your pages

Example:
```jsx
// frontend/src/components/Button/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function Button({ text, onClick, type = 'primary' }) {
  return (
    <button 
      className={`btn btn-${type}`} 
      onClick={onClick}
    >
      {text}
    </button>
  );
}

Button.propTypes = {
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['primary', 'secondary', 'danger'])
};
```

#### 5. API Development

For backend API development:

1. Create a controller in `backend/src/controllers/`
2. Create a route in `backend/src/routes/`
3. Write tests for the controller
4. Register the route in `backend/src/routes/index.js`

### Debugging Techniques

#### Frontend Debugging

1. **Browser DevTools**:
   - Use Chrome or Firefox DevTools to inspect components
   - Set breakpoints in the Sources panel
   - Monitor network requests

2. **React DevTools**:
   - Install the React Developer Tools browser extension
   - Inspect component props and state

3. **Console Logging**:
   - Use `console.log()`, `console.warn()`, and `console.error()`
   - Consider using `debugger` statements for complex logic

#### Backend Debugging

1. **Logging**:
   - Use Winston logger to log important events
   - Set different log levels based on environment

2. **Node.js Debugger**:
   - Start the backend with `--inspect` flag
   - Connect with Chrome DevTools or VS Code debugger

3. **Postman/Insomnia**:
   - Use API tools to test endpoints independently

#### Docker Debugging

1. **Container Logs**:
   ```bash
   # View logs from all containers
   docker-compose logs

   # View logs from a specific container
   docker-compose logs backend
   
   # Follow logs in real-time
   docker-compose logs -f backend
   ```

2. **Shell Access**:
   ```bash
   # Get a shell in a container
   docker-compose exec backend sh
   ```

### Common Issues and Solutions

#### 1. Port Conflicts

**Issue**: "Address already in use" error when starting the application.

**Solution**:
```bash
# Find processes using the ports
lsof -i :3000
lsof -i :3001

# Kill the processes
kill -9 <PID>
```

#### 2. Docker Container Not Starting

**Issue**: Docker containers fail to start or exit immediately.

**Solution**:
```bash
# Check container logs
docker-compose logs

# Remove all containers and volumes
docker-compose down -v

# Rebuild and start
docker-compose up --build
```

#### 3. API Connection Issues

**Issue**: Frontend cannot connect to backend API.

**Solution**:
- Check that the backend is running
- Verify NEXT_PUBLIC_API_URL in frontend/.env.local
- Check for CORS issues in the browser console
- Ensure the ports are correct

## Performance Optimization

### Frontend Performance

1. **Code Splitting**:
   - Use dynamic imports for large components
   - Implement React.lazy and Suspense for route-based code splitting

2. **Image Optimization**:
   - Use Next.js Image component
   - Optimize image sizes and formats

3. **Memoization**:
   - Use React.memo for components that render often
   - Implement useMemo and useCallback for expensive calculations

### Backend Performance

1. **Caching**:
   - Use Redis for frequently accessed data
   - Implement in-memory caching for simple cases

2. **Database Queries**:
   - Optimize database queries with proper indexing
   - Use pagination for large datasets

3. **Asynchronous Processing**:
   - Use async/await for non-blocking operations
   - Consider using worker threads for CPU-intensive tasks

## Version Control Guidelines

### Commit Messages

Follow conventional commits format:

```
feat: add new feature
fix: resolve bug in login process
docs: update README
style: format code with prettier
refactor: improve performance of search algorithm
test: add tests for article controller
chore: update dependencies
```

### Pull Requests

All changes should go through pull requests:

1. Create a feature branch
2. Make changes and commit them
3. Push to remote and create a PR
4. Request code review
5. Address feedback
6. Merge only when all checks pass

## Deployment

### Staging Deployment

```bash
# Build for staging
NODE_ENV=staging npm run build

# Deploy to staging
npm run deploy:staging
```

### Production Deployment

```bash
# Build for production
NODE_ENV=production npm run build

# Deploy to production
npm run deploy:production
```

## Additional Resources

- [API Documentation](API_DOCUMENTATION.md)
- [Tech Stack Overview](TECH_STACK.md)
- [Project Architecture](ARCHITECTURE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md) 