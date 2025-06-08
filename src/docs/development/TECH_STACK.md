# StoryMine Tech Stack

This document provides a comprehensive overview of the technologies used in the StoryMine project.

## Frontend Technologies

### Core Framework
- **Next.js** - React framework for server-side rendering and static site generation
- **React** (v18+) - JavaScript library for building user interfaces
- **TypeScript** - Typed superset of JavaScript for improved developer experience

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Emotion** - CSS-in-JS library for component-scoped styling
- **PostCSS** - Tool for transforming CSS with JavaScript plugins

### State Management
- **React Context API** - For global state management
- **React Query** - For data fetching, caching, and state management
- **SWR** - React Hooks library for data fetching and caching

### UI Components
- **HeadlessUI** - Unstyled, accessible UI components
- **Framer Motion** - Animation library for React
- **React Icons** - Icon library

### Data Visualization
- **D3.js** - Data visualization library
- **react-force-graph** - Force-directed graph visualization
- **chart.js** - Charting library with React wrapper

### Testing
- **Jest** - JavaScript testing framework
- **React Testing Library** - Testing utilities for React
- **Cypress** - End-to-end testing framework

### Build Tools
- **Webpack** - Module bundler (included with Next.js)
- **Babel** - JavaScript compiler (included with Next.js)
- **ESLint** - Linting utility
- **Prettier** - Code formatter

## Backend Technologies

### Core Framework
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type safety for JavaScript

### API Layer
- **Express Router** - Routing functionality
- **Axios** - HTTP client for API requests
- **Cors** - Cross-origin resource sharing middleware
- **Body-Parser** - Request body parsing middleware

### Authentication & Security
- **jsonwebtoken (JWT)** - For authentication tokens
- **helmet** - Security headers middleware
- **express-rate-limit** - Rate limiting middleware
- **bcrypt** - Password hashing

### Caching
- **Redis** - In-memory data store for caching
- **node-cache** - In-memory caching for simple cases

### AI Integration
- **Anthropic SDK** - Claude AI integration
- **OpenAI SDK** - Optional integration for additional AI capabilities
- **LangChain** - Framework for working with LLMs

### Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertions for API testing
- **Mocha** - Alternative testing framework
- **Chai** - Assertion library

### Logging & Monitoring
- **Winston** - Logging library
- **Morgan** - HTTP request logger middleware
- **Sentry** - Error tracking

### Database Connectors
- **pg** - PostgreSQL client
- **knex** - SQL query builder
- **ioredis** - Redis client

## DevOps & Infrastructure

### Containers
- **Docker** - Containerization platform
- **Docker Compose** - Multi-container Docker applications

### CI/CD
- **GitHub Actions** - Continuous integration and deployment
- **Jest** - Test runner in CI environment

### Hosting & Deployment
- **Vercel** - Frontend hosting and deployment
- **Heroku** - Backend hosting option
- **AWS** - Cloud infrastructure option

### Monitoring
- **Sentry** - Error tracking and monitoring
- **LogDNA** - Log management

## Development Tools

### Development Environment
- **VS Code** - Code editor with TypeScript integration
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Husky** - Git hooks for code quality checks

### API Development
- **Postman** - API testing and development
- **Swagger/OpenAPI** - API documentation

### Package Management
- **npm** - Node package manager
- **Yarn** - Alternative package manager

## Third-Party Services

### AI Services
- **Anthropic Claude** - AI assistant powering Jordi
- **StoryMap API** - External service for historical data

## Performance Optimization

- **Redis Caching** - For frequent data requests
- **Next.js Image Optimization** - For image performance
- **React.lazy and Suspense** - For code splitting
- **Memoization** - Using React.memo and useMemo

## Version Information

| Technology        | Version   |
|-------------------|-----------|
| Node.js           | ≥ 18.0.0  |
| Next.js           | ≥ 13.0.0  |
| React             | ≥ 18.0.0  |
| TypeScript        | ≥ 4.9.0   |
| Express           | ≥ 4.18.0  |
| Tailwind CSS      | ≥ 3.0.0   |
| Jest              | ≥ 29.0.0  |
| Docker            | ≥ 20.10.0 |
| Docker Compose    | ≥ 2.0.0   |

## Technology Selection Rationale

### Next.js
Selected for its hybrid rendering capabilities, built-in routing, and excellent developer experience.

### TypeScript
Used for type safety, improved IDE support, and better code quality.

### Tailwind CSS
Chosen for rapid UI development with utility classes and reduced CSS overhead.

### Redis
Implemented for high-performance caching and reducing load on the StoryMap API.

### Claude API
Selected for its natural language understanding capabilities and ability to process historical context.

### Docker
Used for consistent development environments and simplified deployment. 