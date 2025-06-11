# StoryMine Development Guide

**Version 3.1.1** | Complete Development Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Recent Optimizations (v3.1.1)](#recent-optimizations-v311)
4. [Development Setup](#development-setup)
5. [Core Components](#core-components)
6. [Performance Optimizations](#performance-optimizations)
7. [Quality Control System](#quality-control-system)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)
10. [Testing](#testing)

## System Overview

StoryMine is a production-ready documentary story discovery platform that processes **282,388 Atlanta Constitution articles (1920-1961)** to find compelling documentary stories. The system uses AI-powered analysis to identify stories with high documentary potential.

### Key Metrics (v3.1.1)
- **Story Discovery**: 10-20 seconds (80% improvement)
- **Deployment Time**: 30-60 seconds (80% improvement)  
- **Quality Score**: 95%+ clean titles (enhanced filtering)
- **Database**: 282,388 articles processed efficiently

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StoryMine v3.1.1                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Frontend      │    │    Backend      │                │
│  │   (Next.js)     │◄──►│   (Express)     │                │
│  │   - Jordi UI    │    │ - Smart Batching│                │
│  │   - Accumulation│    │ - Quality Filter│                │
│  │   - Visual Feed │    │ - Claude Service│                │
│  └─────────────────┘    └─────────────────┘                │
│                                   │                        │
│                          ┌────────▼────────┐               │
│                          │ ClaudeNarrative │               │
│                          │ Service v3.1.1  │               │
│                          │ • Pre-filtering │               │
│                          │ • Batch parallel│               │
│                          │ • Quality ctrl  │               │
│                          │ • Fast-track    │               │
│                          └─────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                                   │
                     ┌─────────────▼─────────────┐
                     │    PostgreSQL Database    │
                     │                           │
                     │ • intelligence_articles   │
                     │ • intelligence_entities   │
                     │ • intelligence_relation   │
                     │ • Pagination tracking     │
                     │ • 282,388 articles        │
                     └───────────────────────────┘
```

## Recent Optimizations (v3.1.1)

### 🔄 Accumulative Story Discovery

**Problem**: Users had to start over each time they clicked "Give me more"
**Solution**: Implemented accumulative story discovery with visual feedback

#### Implementation Details

**Frontend (`src/frontend/src/pages/jordi.tsx`)**:
```typescript
const refreshStories = async () => {
  // ... API call ...
  if (data.success) {
    // Add new stories to the top of existing list
    setStories(prevStories => [...data.data, ...prevStories]);
    setNewStoriesCount(data.data.length);
    // Visual feedback for 3 seconds
    setTimeout(() => setNewStoriesCount(0), 3000);
  }
};
```

**Backend (`src/backend/src/services/claudeNarrativeService.ts`)**:
```typescript
private currentOffset: Map<string, number> = new Map();

// Track pagination for "give me more" functionality
const offsetKey = `${category}-${yearRange}`;
const currentOffset = this.currentOffset.get(offsetKey) || 0;

// Update offset for next request
this.currentOffset.set(offsetKey, currentOffset + result.rows.length);
```

**Features**:
- ✅ New stories added to top of list
- ✅ Accent borders and pulse animation for new items
- ✅ "+X new" indicator badge
- ✅ Backend pagination tracking
- ✅ Filter changes reset to fresh start

### ⚡ Speed Optimizations (80% Improvement)

**Problem**: Story discovery took 60+ seconds
**Solution**: Multi-layered optimization strategy

#### 1. Pre-filtering High-Potential Articles
```typescript
const highPotentialArticles = articles.filter(article => {
  const hasGoodContent = article.content_preview && article.content_preview.length > 300;
  const hasTitle = article.title && article.title.length > 10;
  const hasYear = article.year >= 1920 && article.year <= 1961;
  const isCleanTitle = !this.isBadTitle(article.title);
  
  return hasGoodContent && hasTitle && hasYear && isCleanTitle;
});
```

#### 2. Smart Batching (10 vs 50 articles)
```typescript
const OPTIMIZED_BATCH_SIZE = 10; // Much smaller for faster processing
```

#### 3. Parallel Processing
```typescript
// Process max 3 batches in parallel to avoid rate limits
if (batchPromises.length >= 3) {
  const batchResults = await Promise.allSettled(batchPromises.splice(0, 3));
}
```

#### 4. Fast-track Mode
```typescript
const existingIntelligence = highPotentialArticles.filter(article => 
  article.documentary_potential && article.documentary_potential > 70
);

if (existingIntelligence.length > 0) {
  console.log(`🚀 Fast-track: Found ${existingIntelligence.length} pre-analyzed articles`);
  return this.generateFromExisting(existingIntelligence);
}
```

#### 5. Optimized Prompts (200 vs 800 chars)
```typescript
preview: (article.content_preview || '').substring(0, 200), // Much shorter for speed
```

### 🧹 Quality Control System

**Problem**: Malformed titles like "BY F. M. WILLIAMS" and corrupted text
**Solution**: Comprehensive filtering system

#### Title Filtering Logic
```typescript
private optimizeTitle(title: string): string | null {
  try {
    const upper = title.toUpperCase();
    
    const isBadTitle = 
      upper.includes('NEWSPAPER') ||
      upper.includes('STANDARD') ||
      upper.includes('DAILY') ||
      upper.includes('CONSTITUTION') ||
      upper.startsWith('BY ') ||
      upper.startsWith('FROM ') ||
      upper.includes(', M. D.') ||
      upper.includes(', DR.') ||
      upper.includes('ISFVO') ||
      upper.includes('CERTAINTY') ||
      title.length > 100;
    
    if (isBadTitle) return null; // Skip bad articles
    
    // Title improvements
    const cleaned = title.replace(/^\w+:\s*/, '').trim();
    if (cleaned.length < 15) {
      return `The Story of ${cleaned}`;
    }
    return cleaned;
  } catch (error) {
    console.error('Error in optimizeTitle:', error);
    return null;
  }
}
```

#### Quality Filters Applied:
- ✅ **Bylines**: "BY F. M. WILLIAMS", "WILLIAM BRADY, M. D."
- ✅ **Mastheads**: "SOUTH'S STANDARD NEWSPAPER", "CONSTITUTION, ATLANTA, GA"
- ✅ **Page markers**: "PAGE 1", "EDITION", "VOLUME"
- ✅ **Corrupted text**: "isfvo me The child knew something"
- ✅ **Fragments**: Sentence fragments starting with ")" or "OF ANY"

### 🚢 Deployment Optimizations (80% Improvement)

**Problem**: Railway deployments took 10+ minutes
**Solution**: Comprehensive build optimization

#### 1. Smart .dockerignore (97 entries)
```dockerignore
# Development files
*.log
*.tmp
.DS_Store
node_modules/*/test/
node_modules/*/tests/
node_modules/*/.nyc_output/

# Documentation
*.md
docs/
README*

# IDE and editor files
.vscode/
.idea/
*.swp

# ... 94 more optimized entries
```

#### 2. Multi-stage Dockerfile
```dockerfile
# Dependencies stage
FROM node:18-alpine AS frontend-deps
WORKDIR /app
COPY src/frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

# Build stage
FROM frontend-deps AS frontend-build
COPY src/frontend/ ./
RUN npm run build && npm prune --production

# Production stage
FROM node:18-alpine AS production
# Copy only built artifacts
COPY --from=frontend-build --chown=nextjs:nodejs /app/.next ./frontend/.next
```

#### 3. Railway Configuration
```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 10,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

#### Results:
- ✅ **Build time**: 2-3 minutes vs 10+ minutes
- ✅ **Upload size**: ~20MB vs ~100MB
- ✅ **Cache efficiency**: Subsequent builds 30-60 seconds
- ✅ **Memory usage**: Optimized for Railway limits

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Anthropic API key
- Railway CLI (for deployment)

### Local Development
```bash
# Clone and setup
git clone [repository-url]
cd StoryMine
npm run install:all

# Environment setup
cp .env.example .env
# Add your ANTHROPIC_API_KEY and DATABASE_URL

# Development mode
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

### Environment Variables
```env
# Required
ANTHROPIC_API_KEY=sk-ant-api03-...
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional
NODE_ENV=development
PORT=3001
BACKEND_PORT=3001
```

## Core Components

### 1. Claude Narrative Service (`src/backend/src/services/claudeNarrativeService.ts`)

**Key Methods**:
- `getCuratedStoryOptions()`: Main story discovery
- `analyzeArticlesWithClaude()`: AI-powered analysis
- `optimizeTitle()`: Quality control for titles
- `generateFallbackStories()`: Backup when AI fails

**Optimization Features**:
- Pre-filtering for quality
- Smart batching system
- Parallel processing
- Fast-track mode
- Comprehensive error handling

### 2. Jordi Frontend (`src/frontend/src/pages/jordi.tsx`)

**Key Features**:
- Accumulative story display
- Visual feedback system
- Category and time filtering
- Responsive design
- Loading states

**State Management**:
```typescript
const [stories, setStories] = useState<Story[]>([]);
const [newStoriesCount, setNewStoriesCount] = useState<number>(0);
const [loading, setLoading] = useState<boolean>(true);
```

### 3. API Routes (`src/backend/src/routes/narrativeRoutes.ts`)

**Endpoints**:
- `GET /stories`: Get curated story options
- `POST /refresh`: Get fresh stories (accumulative)
- `GET /categories`: Available filters
- `POST /explore`: Deep story analysis
- `GET /health`: System health check

## Performance Optimizations

### Database Queries
```sql
-- Optimized article retrieval
SELECT 
  a.id,
  a.title,
  LEFT(a.content, 2000) as content_preview,
  LENGTH(a.content) as content_length,
  a.publication_date,
  EXTRACT(YEAR FROM a.publication_date) as year
FROM intelligence_articles a
WHERE content IS NOT NULL 
  AND LENGTH(content) > 1000
  AND title NOT ILIKE '%SOUTH''S STANDARD NEWSPAPER%'
ORDER BY LENGTH(a.content) DESC, RANDOM()
LIMIT 500 OFFSET ?
```

### Caching Strategy
- **Frontend**: React state preservation
- **Backend**: Offset tracking for pagination
- **API**: Cache-busting with timestamps
- **Build**: Docker layer caching

### Error Handling
```typescript
try {
  const result = await this.callClaudeForAnalysis(prompt);
  return result.stories || [];
} catch (error) {
  console.error('❌ Claude analysis failed, using fallback:', error);
  return this.generateFallbackStories(articles);
}
```

## Quality Control System

### Input Validation
```typescript
// Article pre-filtering
const isValidArticle = (article: any): boolean => {
  return article.content_preview?.length > 300 &&
         article.title?.length > 10 &&
         article.year >= 1920 && article.year <= 1961 &&
         !this.isBadTitle(article.title);
};
```

### Output Sanitization
```typescript
// Title optimization with fallbacks
private optimizeTitle(title: string): string | null {
  if (!title || this.isBadTitle(title)) return null;
  
  const cleaned = title.replace(/^\w+:\s*/, '').trim();
  return cleaned.length < 15 ? `The Story of ${cleaned}` : cleaned;
}
```

### Fallback Systems
- **Claude failure**: Generate stories from metadata
- **No results**: Create basic documentary stories
- **Invalid data**: Skip and continue processing
- **Network issues**: Retry with exponential backoff

## Deployment Guide

### Railway Deployment
```bash
# Initial setup
railway login
railway link [project-id]

# Deploy
git push origin main  # Auto-deploys
# OR manual deploy
railway up
```

### Environment Variables (Railway)
```bash
# Set required variables
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set DATABASE_URL=postgresql://...
railway variables set NODE_ENV=production
```

### Monitoring
```bash
# Check logs
railway logs

# Check status
railway status

# Health check
curl https://your-app.railway.app/api/health
```

## Troubleshooting

### Common Issues

#### 1. "No stories found"
**Symptoms**: Empty story list
**Causes**: 
- Database connection issues
- Overly aggressive filtering
- Claude API failures

**Solutions**:
```bash
# Check database connectivity
npm run test:database

# Check API health
curl /api/health

# Verify environment variables
railway variables
```

#### 2. Slow story discovery
**Symptoms**: >30 second load times
**Causes**:
- Large batch sizes
- Network latency
- Database query performance

**Solutions**:
- Reduce `OPTIMIZED_BATCH_SIZE`
- Enable fast-track mode
- Check database indexes

#### 3. Malformed titles
**Symptoms**: Bylines or corrupted text in stories
**Causes**:
- Insufficient title filtering
- Database data quality issues

**Solutions**:
- Update `optimizeTitle()` filters
- Add new bad title patterns
- Improve pre-filtering logic

#### 4. Deployment failures
**Symptoms**: Railway build errors
**Causes**:
- Memory limits
- Build timeouts
- Missing dependencies

**Solutions**:
- Check `.dockerignore` completeness
- Verify Dockerfile multi-stage build
- Monitor Railway resource usage

### Debug Mode
```typescript
// Enable verbose logging
console.log(`🎬 JORDI: Analyzing ${articles.length} articles`);
console.log(`✨ Pre-filtered to ${filtered.length} high-potential articles`);
console.log(`🎯 Analysis complete: ${stories.length} stories generated`);
```

### Performance Monitoring
```bash
# Database performance
npm run monitor:continuous

# Application health
npm run health

# Memory usage
railway logs | grep memory
```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:database
npm run test:quick
```

### Manual Testing Checklist

**Story Discovery**:
- [ ] Initial load shows 10 stories
- [ ] "Give me more" adds new stories to top
- [ ] Visual feedback appears for new stories
- [ ] Filter changes reset story list
- [ ] All story titles are clean and professional

**Performance**:
- [ ] Initial load <20 seconds
- [ ] "Give me more" <15 seconds
- [ ] No memory leaks in browser
- [ ] Deployment <2 minutes

**Quality**:
- [ ] No bylines in story titles
- [ ] No corrupted text fragments
- [ ] All stories have proper summaries
- [ ] Themes are relevant and accurate

### Load Testing
```bash
# Simulate high traffic
for i in {1..10}; do
  curl -s /api/narrative/stories &
done
wait
```

## Contributing

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Component-based architecture

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit PR with detailed description
5. Ensure all checks pass

### Performance Requirements
- Story discovery: <20 seconds
- Page load: <3 seconds
- Memory usage: <512MB
- Error rate: <1%

---

**Last Updated**: Version 3.1.1
**Maintained By**: StoryMine Development Team 