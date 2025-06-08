# StoryMine Architecture

## System Overview

StoryMine is built with a modern three-tier architecture consisting of:

1. **Frontend** - A Next.js application with React components
2. **Backend** - A Node.js API server
3. **StoryMap API** - An external service accessed via Docker

## Architecture Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │       │                 │
│    Frontend     │◄─────►│     Backend     │◄─────►│   StoryMap API  │
│    (Next.js)    │       │    (Node.js)    │       │    (Docker)     │
│                 │       │                 │       │                 │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        │                         │                         │
        ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  React Components │     │   Express Routes  │     │  Article Database │
│  Tailwind CSS    │     │   Claude API      │     │  Entity Database  │
│  User Interface  │     │   StoryMap Client │     │  Vector Search    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

## Component Details

### Frontend (Next.js)
- **User Interface**: React components with Tailwind CSS styling
- **State Management**: React context and hooks
- **Routing**: Next.js pages and API routes
- **Chat Interface**: Real-time messaging with Jordi assistant
- **Visualizations**: Interactive entity network and timeline displays

### Backend (Node.js)
- **API Server**: Express.js handling frontend requests
- **StoryMap Client**: Custom client for communicating with StoryMap API
- **Claude Integration**: Proxy for Anthropic's Claude API for AI assistant capabilities
- **Caching Layer**: Redis-based caching for improved performance
- **Authentication**: JWT-based authentication system

### StoryMap API (Docker)
- **Data Provider**: Access to historical articles and entities
- **Vector Search**: Semantic search capabilities for article discovery
- **Entity Resolution**: Entity recognition and relationship mapping
- **Timeline Generation**: Historical event timeline creation
- **Data Processing**: ETL pipeline for processing historical content

## Data Flow

1. **User Request Flow**:
   - User interacts with frontend (search, chat, browse)
   - Frontend sends request to backend API
   - Backend processes request and communicates with StoryMap API
   - StoryMap API returns data to backend
   - Backend processes data and returns to frontend
   - Frontend renders response to user

2. **Jordi Assistant Flow**:
   - User sends query to Jordi
   - Backend retrieves relevant articles from StoryMap API
   - Backend sends user query + context to Claude API
   - Claude returns AI response
   - Response is enhanced with entity information
   - Enhanced response is returned to user

## Integration Points

### Frontend ↔ Backend
- REST API for data retrieval
- WebSocket for real-time chat functionality
- JWT tokens for authentication

### Backend ↔ StoryMap API
- Docker container communication
- REST API for article and entity data
- Vector embeddings for semantic search 