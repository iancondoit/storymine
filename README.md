# StoryMine - Historical Genome Archive

**Version 1.2.0** | Production-Ready Documentary Story Discovery Platform

StoryMine is a sophisticated AI-powered platform that discovers documentary-worthy stories from vast historical archives. Built with Next.js, Express, and powered by Claude AI (Jordi), it analyzes 2.56+ million intelligence records to uncover narrative threads and story connections across time.

## 🏗️ System Architecture

### Overview
StoryMine integrates three main components in a unified Docker container deployed on Railway:

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Container                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Frontend      │    │    Backend      │                │
│  │   (Next.js)     │◄──►│   (Express)     │                │
│  │   Port: 3000    │    │   Port: 3001    │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           │              ┌────────▼────────┐               │
│           └─────────────►│   Static Files   │               │
│                          │   (.next/out)    │               │
│                          └─────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                                   │
                          ┌────────▼────────┐
                          │  AWS RDS Postgres│
                          │ StoryMap Intel.  │
                          │  282K articles   │
                          │  1.06M entities  │
                          │  1.22M relations │
                          └─────────────────┘
```

### Core Components

#### 1. Frontend (Next.js Static Generation)
- **Location**: `src/frontend/`
- **Build Output**: `.next/` static files
- **Key Features**:
  - Static site generation for optimal performance
  - Real-time data display (hardcoded for reliability)
  - Dark/light theme support
  - Responsive design with scientific styling

#### 2. Backend (Express API Server)
- **Location**: `src/backend/`
- **Port**: 3001 (internal container communication)
- **Key Features**:
  - Database connectivity with automatic reconnection
  - Claude AI integration for Jordi chat
  - RESTful API endpoints
  - Comprehensive error handling and logging

#### 3. Database (AWS RDS PostgreSQL)
- **Host**: `storymap-intelligence-database.c123abc456def.us-east-1.rds.amazonaws.com`
- **Database**: `storymap_intelligence`
- **Key Tables**:
  - `intelligence_articles` (282,388 records)
  - `intelligence_entities` (1,061,535 records)  
  - `intelligence_relationships` (1,219,127 records)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for deployment)
- PostgreSQL client (for local testing)
- Railway CLI (for deployment)

### Environment Variables
Create `.env` file with:
```bash
# Database Configuration
DATABASE_HOST=storymap-intelligence-database.c123abc456def.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=storymap_intelligence
DATABASE_USER=postgres
DATABASE_PASSWORD=[provided by StoryMap Intelligence team]

# AI Configuration  
ANTHROPIC_API_KEY=[your claude api key]

# Application
NODE_ENV=production
PORT=3001
```

### Local Development
```bash
# Install dependencies
npm install

# Install backend dependencies
cd src/backend && npm install && cd ../..

# Install frontend dependencies  
cd src/frontend && npm install && cd ../..

# Start backend server
cd src/backend && npm run dev &

# Start frontend development server
cd src/frontend && npm run dev

# Open http://localhost:3000
```

### Production Deployment
```bash
# Deploy to Railway
railway up

# Monitor deployment
railway logs --tail

# Check status
railway status
```

## 🔍 Database Architecture

### Schema Overview
The StoryMap Intelligence database uses a three-table architecture optimized for historical narrative analysis:

#### Core Tables

**intelligence_articles**
- Primary historical documents and articles
- Fields: `id`, `title`, `content`, `date_published`, `source`, `created_at`
- Indexed on: `date_published`, `title`, `content` (full-text search)

**intelligence_entities**  
- People, organizations, locations, events extracted from articles
- Fields: `id`, `name`, `entity_type`, `description`, `created_at`
- Types: PERSON, ORGANIZATION, LOCATION, EVENT, CONCEPT

**intelligence_relationships**
- Many-to-many relationships between articles and entities
- Fields: `id`, `article_id`, `entity_id`, `relevance_score`, `created_at`
- Enables entity network analysis and story thread discovery

### Data Integrity
- **282,388 articles** spanning 1920-1961 (42 years)
- **1,061,535 unique entities** with comprehensive metadata
- **1,219,127 relationships** enabling complex narrative analysis
- Referential integrity maintained via foreign key constraints

## 🤖 Jordi AI Assistant

### Overview
Jordi is StoryMine's Claude-powered AI assistant, specialized in historical analysis and documentary story discovery.

### Architecture
- **Backend Integration**: `src/backend/src/controllers/chatController.ts`
- **AI Provider**: Anthropic Claude (latest model)
- **Context Window**: Full access to StoryMap Intelligence database
- **Response Style**: Conversational yet academically rigorous

### Capabilities
1. **Historical Query Processing**: Natural language questions about people, events, time periods
2. **Story Thread Discovery**: Identifies narrative connections across time and entities
3. **Documentary Potential Assessment**: Evaluates stories for documentary viability
4. **Entity Network Analysis**: Maps relationships between historical figures
5. **Temporal Analysis**: Tracks developments and changes over time

### API Endpoints
```
POST /api/chat
Body: { message: "Find stories about Roosevelt and Churchill" }
Response: { response: "...", context: {...} }
```

## 📊 Monitoring & Diagnostics

### Database Monitoring
```bash
# Continuous monitoring (runs every 30 seconds)
node scripts/monitor_database_connectivity.js --verbose

# One-time health check
node scripts/monitor_database_connectivity.js --interval=0

# View monitoring logs
tail -f logs/database_monitoring.log
```

### Operations Testing
```bash
# Test all database operations
node scripts/test_database_operations.js --verbose

# Quick connectivity test
node scripts/test_database_operations.js

# View test reports
cat logs/database_operations_report.json
```

### Log Files
- **Database Monitoring**: `logs/database_monitoring.log`
- **Operations Testing**: `logs/database_operations_test.log`  
- **Health Reports**: `logs/database_health_report.json`
- **Railway Logs**: `railway logs`

### Key Metrics
- **Connection Health**: Response time, success rate, error patterns
- **Data Integrity**: Record counts, orphaned relationships, date validity
- **Performance**: Query response times, complex join performance
- **Uptime**: 24-hour success rate, consecutive failure tracking

## 🔧 API Reference

### Core Endpoints

#### Database Statistics
```
GET /api/database/stats
Response: {
  articles: 282388,
  entities: 1061535, 
  relationships: 1219127,
  dateRange: {
    earliest: "1920",
    latest: "1961", 
    years: 42
  }
}
```

#### Health Check
```
GET /api/health
Response: {
  status: "healthy",
  database: "connected",
  timestamp: "2024-01-01T12:00:00Z"
}
```

#### Jordi Chat
```
POST /api/chat  
Body: { message: "Tell me about World War II intelligence operations" }
Response: {
  response: "Based on the StoryMap Intelligence archive...",
  context: { articlesFound: 1547, entitiesIdentified: 89 }
}
```

#### Story Discovery
```
GET /api/stories/discover?topic=espionage&timeframe=1940-1945
Response: {
  stories: [...],
  narrativeScore: 0.87,
  documentaryPotential: "high"
}
```

## 🏗️ Development Guide

### Project Structure
```
StoryMine/
├── src/
│   ├── frontend/          # Next.js application
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/       # Next.js pages & API routes
│   │   │   ├── styles/      # CSS and styling
│   │   │   └── utils/       # Frontend utilities
│   │   ├── public/          # Static assets
│   │   └── package.json     # Frontend dependencies
│   └── backend/           # Express API server  
│       ├── src/
│       │   ├── controllers/ # Route handlers
│       │   ├── database/    # DB connection & queries
│       │   ├── models/      # Data models
│       │   ├── routes/      # API route definitions
│       │   ├── services/    # Business logic
│       │   └── utils/       # Backend utilities
│       └── package.json     # Backend dependencies
├── scripts/               # Monitoring & testing scripts
├── logs/                 # Application logs
├── docs/                 # Documentation
├── Dockerfile            # Container configuration
├── railway.json          # Railway deployment config
└── README.md            # This file
```

### Adding New Features

#### 1. Database Queries
Add new queries in `src/backend/src/database/`:
```javascript
// src/backend/src/database/storyQueries.js
async function findDocumentaryStories(criteria) {
  const query = `
    SELECT a.*, COUNT(r.entity_id) as entity_count
    FROM intelligence_articles a
    JOIN intelligence_relationships r ON a.id = r.article_id
    WHERE ...
  `;
  return await executeQuery(query, [criteria]);
}
```

#### 2. API Endpoints
Add routes in `src/backend/src/routes/`:
```javascript
// src/backend/src/routes/stories.js
router.get('/discover', async (req, res) => {
  try {
    const stories = await findDocumentaryStories(req.query);
    res.json({ stories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 3. Frontend Components
Add React components in `src/frontend/src/components/`:
```jsx
// src/frontend/src/components/StoryDiscovery.tsx
export default function StoryDiscovery() {
  const [stories, setStories] = useState([]);
  
  useEffect(() => {
    fetch('/api/stories/discover')
      .then(res => res.json())
      .then(setStories);
  }, []);
  
  return <div>{/* Story display logic */}</div>;
}
```

### Testing Strategy

#### Unit Tests
```bash
# Backend tests
cd src/backend && npm test

# Frontend tests  
cd src/frontend && npm test
```

#### Integration Tests
```bash
# Full operations test
node scripts/test_database_operations.js --verbose

# Database connectivity test
node scripts/monitor_database_connectivity.js --interval=0
```

#### Performance Testing
```bash
# Stress test database operations
node scripts/test_database_operations.js --stress

# Monitor under load
node scripts/monitor_database_connectivity.js --interval=5 --verbose
```

## 🔐 Security & Access Control

### Database Security
- **SSL Connection**: Required for all production database connections
- **Network Security**: AWS Security Group restricts access to Railway IPs
- **Credentials**: Environment variable based, never hardcoded
- **Connection Pooling**: Prevents connection exhaustion attacks

### API Security
- **CORS Configuration**: Restricted to specific origins in production
- **Rate Limiting**: Implemented to prevent abuse
- **Input Validation**: All user inputs sanitized and validated
- **Error Handling**: Generic error messages to prevent information leakage

### Railway Deployment Security
- **Environment Isolation**: Production environment variables separate from development
- **Build Security**: Multi-stage Docker builds minimize attack surface
- **Health Checks**: Automated monitoring for security incidents

## 🚨 Troubleshooting

### Common Issues

#### "Database Connection Failed"
```bash
# Check connectivity
node scripts/monitor_database_connectivity.js --interval=0

# Verify environment variables
echo $DATABASE_HOST
echo $DATABASE_PASSWORD

# Test manual connection
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME
```

#### "Frontend Shows 'Loading...'"
This was a known issue resolved in v1.2.0. If it reoccurs:
```bash
# Check if stats are hardcoded correctly
grep -n "282,388" src/frontend/src/pages/index.tsx

# Verify Next.js build
cd src/frontend && npm run build

# Check static generation
ls -la .next/static/
```

#### "Jordi Not Responding"
```bash
# Check Claude API key
echo $ANTHROPIC_API_KEY

# Test chat endpoint
curl -X POST localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Check backend logs
railway logs --tail
```

#### "Railway Deployment Stuck"
```bash
# Force redeploy
railway up --force

# Check build logs
railway logs --build

# Verify Docker configuration
docker build -t storymine-test .
```

### Performance Issues

#### Slow Database Queries
```bash
# Run performance tests
node scripts/test_database_operations.js --verbose

# Check query performance
# Enable PostgreSQL slow query logging
# Analyze with EXPLAIN ANALYZE
```

#### High Memory Usage
```bash
# Monitor Railway metrics
railway status

# Check for memory leaks in Node.js
# Add --inspect flag to server startup
```

### Recovery Procedures

#### Database Connection Lost
The system automatically retries database connections. Monitor with:
```bash
node scripts/monitor_database_connectivity.js --verbose
```

#### Complete System Failure
1. Check Railway service status
2. Review recent deployment logs
3. Rollback if necessary: `railway rollback`
4. Contact StoryMap Intelligence team for database issues

## 📈 Performance Optimization

### Database Optimization
- **Indexing Strategy**: Optimized indexes on frequently queried columns
- **Query Optimization**: Efficient JOINs and WHERE clauses
- **Connection Pooling**: Reuses database connections
- **Query Caching**: Frequently requested data cached in memory

### Frontend Optimization  
- **Static Generation**: Next.js pre-builds pages for fastest loading
- **Image Optimization**: Automatic image compression and lazy loading
- **Code Splitting**: JavaScript bundles split for faster initial load
- **CDN Integration**: Static assets served via Railway's global CDN

### Backend Optimization
- **Async Operations**: Non-blocking I/O for all database operations
- **Memory Management**: Efficient data structures and garbage collection
- **Compression**: Response compression for faster data transfer
- **Error Recovery**: Graceful degradation and automatic retry logic

## 🔄 Deployment Process

### Development Workflow
1. **Local Development**: Test changes locally with development database
2. **Testing**: Run comprehensive test suite
3. **Code Review**: Peer review of all changes
4. **Staging**: Deploy to staging environment (if available)
5. **Production**: Deploy to Railway with monitoring

### Deployment Steps
```bash
# 1. Prepare deployment
git add .
git commit -m "Description of changes"

# 2. Run tests
node scripts/test_database_operations.js

# 3. Deploy to Railway
railway up

# 4. Monitor deployment
railway logs --tail

# 5. Verify functionality
curl https://storymine-production.up.railway.app/api/health
```

### Rollback Process
```bash
# If deployment fails
railway rollback

# Or deploy previous version
git revert HEAD
railway up
```

## 📞 Support & Maintenance

### Team Contacts
- **Development Team**: [Your team contact]
- **StoryMap Intelligence Team**: [Database team contact]
- **Railway Support**: [Railway support if needed]

### Maintenance Schedule
- **Database Monitoring**: Continuous (24/7)
- **Performance Testing**: Weekly
- **Security Updates**: As needed
- **Feature Updates**: Monthly releases

### Emergency Procedures
1. **Database Outage**: Contact StoryMap Intelligence team immediately
2. **Railway Service Issues**: Check Railway status page, contact support
3. **Security Incidents**: Immediate response protocol, log review
4. **Data Corruption**: Database backup restoration procedures

## 📚 Additional Resources

### Documentation
- **API Documentation**: `/docs/api/` (when available)
- **Database Schema**: `/docs/database/`
- **Deployment Guide**: `/docs/deployment/`

### External Links
- [Next.js Documentation](https://nextjs.org/docs)
- [Railway Documentation](https://docs.railway.app)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com)

### Monitoring Dashboards
- **Railway Metrics**: Railway dashboard
- **Database Health**: `logs/database_health_report.json`
- **Application Logs**: `railway logs`

---

**StoryMine v1.2.0** - Built for documentary story discovery and historical narrative analysis.

For technical support or questions about this documentation, contact the development team. 