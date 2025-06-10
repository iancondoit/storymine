# StoryMine - Jordi Intelligence System

**Version 3.0.0** | Documentary Story Discovery & Development Platform

StoryMine is a sophisticated AI-powered platform that transforms **282,388 pre-scored Atlanta Constitution articles (1920-1961)** into actionable documentary story opportunities using Jordi, an intelligence-driven discovery assistant that combines advanced filtering, documentary potential scoring, and contextual conversation.

## 🎬 Jordi Intelligence System

### Overview
Jordi is StoryMine's AI documentary development assistant that provides:
- **Smart story discovery** using pre-scored documentary potential ratings
- **Enhanced filtering** by categories (Politics, Crime, War, Women's Stories, etc.) and year ranges (1920-1961)
- **Two-tier interface**: Discovery dashboard + story-focused conversation
- **Production-ready insights**: Documentary development guidance and archival research

### Intelligence Data Foundation
- **Source**: StoryMap Intelligence Team pre-processed data
- **Volume**: 282,388 Atlanta Constitution articles with intelligence scoring
- **Scoring**: Documentary potential (0-100%), narrative richness, archival value
- **Time Span**: 1920-1961 (41 years of Atlanta history)
- **Filtering**: 10 story categories + 8 historical time periods

## 🏗️ System Architecture

### Overview
StoryMine v3.0 integrates Jordi intelligence capabilities in a unified container:

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Container                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Frontend      │    │    Backend      │                │
│  │   (Next.js)     │◄──►│   (Express)     │                │
│  │   /jordi        │    │ /api/narrative  │                │
│  │   /jordi/story  │    │ Intelligent API │                │
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
                          │ AWS RDS Postgres │
                          │ StoryMap Intel.  │
                          │ 282K articles    │
                          │ + Intelligence   │
                          │ Scoring Data     │
                          └─────────────────┘
```

### Two-Tier Discovery System

#### 1. **Story Discovery Dashboard** (`/jordi`)
- **Enhanced filtering**: Visual category buttons (Politics 🏛️, Crime ⚖️, War 🎖️, Women's Stories 👩, etc.)
- **Year range selection**: 5-year periods from 1920-1925 through 1955-1961
- **Documentary scoring**: Color-coded potential ratings (Green 80%+, Yellow 60%+, Orange 40%+)
- **"Give me more" functionality**: Refresh stories without overwhelming the interface
- **Story cards**: Title, summary, year, themes, documentary potential percentage

#### 2. **Story-Focused Chat Interface** (`/jordi/story/[storyId]`)
- **Deep conversation**: Contextual Q&A about specific historical stories
- **Documentary development**: Production insights, interview strategies, archival research
- **Historical context**: Period details, significance, connections
- **Guided conversation**: Suggested questions and development focus areas

## 🔍 Intelligence API Endpoints

### Core Narrative API (`/api/narrative/*`)

```bash
# Get curated stories with filtering
GET /api/narrative/stories?category=women&yearRange=1920-1925&count=10

# Get available categories and year ranges
GET /api/narrative/categories

# Deep story exploration
POST /api/narrative/explore
Body: { storyId: "atlanta-jury-women-1920", focus: "production" }

# Story-focused conversation
POST /api/narrative/chat  
Body: { storyId: "story-id", message: "What makes this compelling for documentary?" }

# Refresh story options ("give me more")
POST /api/narrative/refresh
Body: { category: "politics", yearRange: "1930-1935", count: 10 }

# System health check
GET /api/narrative/health

# API documentation
GET /api/narrative/docs
```

### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "id": "atlanta-jury-women-1920",
      "title": "Women Serve on Atlanta Jury for First Time",
      "summary": "Historic moment as three women take their seats...",
      "year": 1920,
      "category": "Women's Stories",
      "documentaryPotential": 92,
      "narrativeScore": 78,
      "themes": ["Women's Rights", "Legal History", "Social Change"]
    }
  ],
  "metadata": {
    "source": "intelligence",
    "category": "women",
    "yearRange": "1920-1925"
  }
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for deployment)
- Railway CLI (for deployment)

### Environment Variables
Create `.env` file with:
```bash
# Database Configuration (StoryMap Intelligence)
DATABASE_URL=postgresql://user:pass@host:5432/storymap_intelligence

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

# Start both backend and frontend
npm run dev

# Backend runs on :3001, Frontend on :3000
# Jordi available at http://localhost:3000/jordi
```

### Production Deployment
```bash
# Deploy to Railway
railway up

# Check Jordi Intelligence status
curl https://your-app.railway.app/api/narrative/health

# Access story discovery
open https://your-app.railway.app/jordi
```

## 📊 Story Categories & Filtering

### Enhanced Category System

1. **📰 All Stories** (general) - Browse all documentary-worthy content
2. **🏛️ Politics** - Elections, government, political movements, New Deal era
3. **⚖️ Crime & Justice** - Trials, investigations, law enforcement, court cases
4. **🎖️ War & Military** - WWI aftermath, WWII buildup, military stories
5. **💼 Business** - Economy, commerce, industry, Great Depression impact
6. **⚾ Sports** - Athletics, games, sporting events, cultural significance
7. **👩 Women's Stories** - Women's rights, suffrage, social change, pioneering figures
8. **✊ Protests & Reform** - Social movements, strikes, demonstrations, activism
9. **📚 Education** - Schools, universities, educational reform, literacy
10. **🎭 Entertainment** - Theater, music, cultural events, arts scene

### Historical Time Periods

- **1920-1925**: Post-WWI adjustment, Roaring Twenties begins
- **1925-1930**: Economic prosperity, cultural transformation
- **1930-1935**: Great Depression onset, New Deal beginnings  
- **1935-1940**: New Deal programs, economic recovery efforts
- **1940-1945**: World War II impact, home front stories
- **1945-1950**: Post-war transition, veterans return, social change
- **1950-1955**: Korean War era, economic prosperity returns
- **1955-1961**: Civil Rights era begins, social transformation

## 🤖 Intelligence Implementation

### Backend Service Stack

#### Core Service: `claudeNarrativeService.ts`
```typescript
// Intelligence-powered story discovery
async getCuratedStoryOptions(options: {
  category?: string;
  yearRange?: string; 
  count?: number;
}): Promise<any>

// Deep story analysis with documentary scoring
async exploreStoryInDepth(storyId: string, focus?: string): Promise<any>

// Story-focused conversation with historical context
async storyFocusedChat(storyId: string, message: string, history: any[]): Promise<any>
```

#### Smart Database Queries
- **Documentary potential filtering**: `WHERE documentary_potential > 0.02`
- **Category-specific searches**: `primary_themes @> '[\"Politics\"]' OR content ILIKE '%politics%'`
- **Year range precision**: `publication_date BETWEEN '1920-01-01' AND '1925-12-31'`
- **Intelligent ordering**: `ORDER BY documentary_potential DESC, narrative_score DESC`

### Frontend Intelligence Interface

#### Story Discovery: `jordi.tsx`
- **Category button filters**: Visual selection with icons
- **Year range controls**: Historical period selection
- **Documentary potential badges**: Color-coded scoring
- **Story cards**: Complete metadata with themes
- **Refresh functionality**: "Give me more" without archive overwhelm

#### Story Chat: `jordi/story/[storyId].tsx`  
- **Story header**: Full context with scoring and themes
- **Conversational interface**: Real-time documentary development Q&A
- **Suggested questions**: Guided conversation starters
- **Historical context**: Period details and significance

## 📈 Documentary Potential Scoring

### Intelligence Scoring System
Each story includes sophisticated pre-scoring from StoryMap Intelligence:

- **Documentary Potential**: 0-100% rating for visual storytelling viability
- **Narrative Score**: Story structure and character development quality
- **Archival Richness**: Available supporting materials and documentation
- **Evidence Quality**: Source reliability and historical detail level

### Visual Indicators
- **🟢 Green (80%+)**: Exceptional documentary potential
- **🟡 Yellow (60-79%)**: High potential with strong elements
- **🟠 Orange (40-59%)**: Moderate potential, development needed
- **⚪ Gray (<40%)**: Limited visual/narrative appeal

## 🔧 Monitoring & Operations

### Health Monitoring
```bash
# Check Jordi intelligence status
curl /api/narrative/health

# Response includes:
{
  "status": "optimal|degraded|error",
  "checks": {
    "database": true,
    "intelligence": true,
    "fallback": true
  },
  "capabilities": {
    "intelligentQueries": true,
    "categoryFiltering": true,
    "documentaryScoring": true
  }
}
```

### Database Integration Strategy
- **Development mode**: Uses fallback stories and curated examples
- **Production activation**: 5-minute switchover to full intelligence once AWS database connected
- **Graceful degradation**: System remains functional with examples if database unavailable
- **Smart fallbacks**: Category-specific story examples maintain user experience

## 📖 Documentation

### Complete System Documentation
- **Jordi Intelligence System**: See `JORDI_INTELLIGENCE_SYSTEM.md` for comprehensive technical details
- **API Documentation**: Self-documenting at `/api/narrative/docs`
- **Architecture Diagrams**: System design and data flow documentation
- **Development Philosophy**: Documentary-first approach and intelligence-driven discovery

### Key Features Implemented ✅
- **Intelligence service**: Complete with smart database queries and fallback systems
- **Enhanced filtering**: Categories + year ranges with visual interface
- **Two-tier discovery**: Dashboard + conversation interfaces
- **Documentary scoring**: Visual potential ratings and intelligence integration
- **Production deployment**: Railway-ready with health monitoring
- **Comprehensive documentation**: Technical details and development insights

## Known Issues & Solutions

### Article Content Access Issue

**Problem**: The StoryMap Intelligence database contains 282,388 historical articles (1920-1961 Atlanta Constitution), but content fields are often NULL/empty due to ETL pipeline issues during historical document processing.

**Impact**: 
- Prevents full-text search functionality
- Limits documentary story generation capabilities
- Requires fallback strategies for content analysis

**Solution Implemented**:
1. **Dual Content Strategy**: Query both `content` and `processed_content` fields
2. **Content Validation**: Filter articles with substantial content (>100 chars)
3. **Intelligent Fallbacks**: Use entity relationships when content unavailable
4. **Pre-scored Metrics**: Leverage `documentary_potential` scores from StoryMap Intelligence

**Developer Notes**:
- Always check both content fields: `content || processed_content`
- Implement content length validation in queries
- Provide meaningful fallbacks for NULL content scenarios
- Document any new content access patterns for team consistency

---

**System Version**: StoryMine v3.0.0  
**Intelligence Data**: StoryMap Intelligence Team (282,388 articles)  
**Last Updated**: June 8, 2025 - Complete Jordi Intelligence System implementation

*StoryMine transforms historical archives into actionable documentary opportunities through intelligent discovery, enhanced filtering, and contextual conversation powered by Jordi.* 