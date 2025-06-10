# Jordi Intelligence System Documentation
**StoryMine v3.0.0 - Documentary Story Discovery & Development Assistant**

---

## Overview

Jordi is StoryMine's AI-powered documentary development assistant that transforms **282,388 pre-scored Atlanta Constitution articles (1920-1961)** into actionable documentary story opportunities using advanced intelligence scoring and filtering capabilities.

### Intelligence Data Foundation
- **Source**: StoryMap Intelligence Team pre-processed data
- **Volume**: 282,388 Atlanta Constitution articles 
- **Time Span**: 1920-1961 (41 years of Atlanta history)
- **Intelligence Fields**: Documentary potential, narrative richness, archival value, evidence quality
- **Scoring System**: 0-1.0 scale with percentile rankings

---

## System Architecture

### Two-Tier Discovery System

#### 1. **Story Discovery Dashboard** (`/jordi`)
- **Enhanced filtering by story categories**: Politics, Crime & Justice, War & Military, Business, Sports, Women's Stories, Protests & Reform, Education, Entertainment
- **Year range filtering**: 5-year periods from 1920-1925 through 1955-1961
- **Smart documentary scoring**: Visual indicators for high-potential stories
- **"Give me more" refresh functionality**: Avoid searching entire 282K+ archive at once
- **Display limit**: 10 story cards at a time for focused discovery

#### 2. **Story-Focused Chatbot** (`/jordi/story/[storyId]`)
- **Deep conversation interface**: Contextual discussions about specific stories
- **Documentary development guidance**: Production insights, interview strategies, archival research
- **Historical context analysis**: Period details, significance, connections
- **Interactive Q&A**: Suggested questions and conversation flow

---

## Technical Implementation

### Backend Intelligence Stack

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

#### Controller & Routes: `narrativeController.ts` + `narrativeRoutes.ts`
```
GET  /api/narrative/stories     - Curated story options with filtering
GET  /api/narrative/categories  - Available categories and year ranges
POST /api/narrative/explore     - Deep story exploration  
POST /api/narrative/chat        - Story-focused conversation
POST /api/narrative/refresh     - Fresh story discovery ("give me more")
GET  /api/narrative/health      - System health check
```

### Frontend Discovery Interface

#### Story Discovery Dashboard: `jordi.tsx`
- **Category button filters**: Visual category selection with icons
- **Year range controls**: Historical period selection (1920s-1960s)
- **Documentary potential badges**: Color-coded scoring (Green 80%+, Yellow 60%+, Orange 40%+)
- **Story cards**: Title, summary, year, category, themes, potential rating
- **Refresh functionality**: Get new stories without full archive search

#### Story Chat Interface: `jordi/story/[storyId].tsx`  
- **Story header**: Full context with scoring, themes, analysis
- **Conversational interface**: Real-time Q&A about documentary development
- **Suggested questions**: Guided conversation starters
- **Historical context**: Period details and significance analysis

---

## Intelligence Scoring System

### StoryMap Intelligence Data Structure

Each article contains sophisticated pre-scoring:

```json
{
  "id": "article_id",
  "storymap_id": "unique_story_identifier", 
  "title": "Historical story title",
  "content": "Full article text",
  "publication_date": "1925-03-15",
  "documentary_potential": 0.85,     // 0-1.0 scoring
  "narrative_score": 0.78,           // Story structure quality
  "archival_richness": 0.72,         // Available supporting materials
  "evidence_quality": 0.91,          // Source reliability and detail
  "source_reliability": 0.88,        // Publication trustworthiness  
  "primary_themes": ["Politics", "Women's Rights"],
  "secondary_themes": ["Legal Reform", "Social Change"],
  "story_categories": ["Documentary-worthy", "Character-driven"],
  "primary_location": "Atlanta, GA",
  "historical_period": "1920s"
}
```

### Documentary Potential Categories
- **90%+ (Exceptional)**: Compelling characters, rich archival materials, strong visual potential
- **70-89% (High)**: Strong narrative elements, good source material, clear documentary angle  
- **50-69% (Moderate)**: Interesting story with development potential, some supporting materials
- **30-49% (Limited)**: Historical significance but limited visual/narrative appeal
- **Below 30%**: Primarily informational value

---

## Deployment & Operational Status

### Current Implementation Status ✅
- **Intelligence service**: Complete with smart database queries
- **Enhanced filtering**: Categories + year ranges operational  
- **Frontend interfaces**: Story discovery dashboard + chat interface built
- **API endpoints**: Full narrative API with health monitoring
- **Fallback systems**: Legacy story examples when database unavailable
- **Documentation**: Self-documenting API at `/api/narrative/docs`

### Database Integration Strategy
- **Development mode**: Uses fallback stories and legacy examples
- **Production activation**: 5-minute switchover to full intelligence once AWS database connected
- **Health monitoring**: Real-time database connectivity and intelligence capability checks
- **Graceful degradation**: System remains functional with curated examples if database unavailable

### Performance & Scalability
- **Intelligent pagination**: 10 stories per request to avoid overwhelming interface
- **Smart caching**: Query optimization for 282K+ article searches
- **Category indexing**: Fast filtering using pre-computed themes and content analysis
- **Year range optimization**: Date-based partitioning for quick historical searches

---

## Story Categories & Filtering

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

---

## Development Philosophy & Principles

### Documentary-First Approach
- **Story potential over volume**: Quality curation vs. random sampling
- **Visual storytelling focus**: Archival richness and documentary viability
- **Character-driven narratives**: Human stories within historical events
- **Production-ready insights**: Actionable development guidance

### Intelligence-Driven Discovery
- **Pre-scored relevance**: StoryMap Intelligence team's sophisticated analysis
- **Multi-dimensional filtering**: Category, time period, documentary potential
- **Contextual conversation**: Deep discussion about specific stories
- **Iterative exploration**: "Give me more" functionality for continued discovery

### User Experience Design
- **Focused discovery**: 10 stories at a time to prevent overwhelm
- **Visual intelligence**: Color-coded potential ratings, clear categorization
- **Conversational depth**: Story-specific chat for development insights
- **Historical immersion**: Period context and significance explanation

---

## Future Enhancement Opportunities

### Advanced Intelligence Features
- **Thematic connections**: Link related stories across time periods
- **Character tracking**: Follow individuals across multiple articles
- **Location mapping**: Geographic story distribution and connections
- **Archival integration**: Direct links to available supporting materials

### Production Support Tools
- **Interview subject identification**: Descendants, experts, related figures
- **Filming location guidance**: Historical sites, current accessibility
- **Budget estimation**: Production complexity and resource requirements
- **Distribution insights**: Audience appeal and market positioning

### Collaborative Features
- **Story bookmarking**: Save and organize potential projects
- **Team sharing**: Collaborative story development and notes
- **Producer workflows**: Story pitch development and presentation tools
- **Progress tracking**: Development stage management and milestones

---

## Contact & Support

**System Version**: StoryMine v3.0.0  
**Intelligence Data**: StoryMap Intelligence Team (282,388 articles)  
**API Documentation**: `/api/narrative/docs`  
**Health Check**: `/api/narrative/health`  
**Story Discovery**: `/jordi`  

*This documentation captures the complete Jordi Intelligence System as implemented and reflects the comprehensive work completed in building StoryMine's documentary discovery capabilities.*

---

## Technical Notes for Developers

### Key Implementation Decisions
1. **Two-tier system**: Separate discovery and conversation interfaces for different use cases
2. **Intelligent fallbacks**: System remains functional even when full intelligence unavailable  
3. **Category-first filtering**: Visual button interface vs. dropdown menus for better UX
4. **Smart pagination**: Limited results prevent interface overwhelm from massive dataset
5. **Contextual conversation**: Story-specific chat maintains focus and relevance

### Critical Success Factors
- **StoryMap Intelligence integration**: Pre-scored data enables smart discovery vs. random sampling
- **Enhanced filtering system**: Category + year range combination provides precise story targeting
- **Documentary potential scoring**: Visual indicators help users identify highest-value stories
- **Graceful degradation**: System works with curated examples when full database unavailable
- **Production-ready insights**: Actionable documentary development guidance vs. just story discovery

*Last Updated: June 8, 2025 - Comprehensive system rebuild and intelligence integration*

## CRITICAL: Article Content Access Solution

### The NULL Content Problem

**Issue**: The StoryMap Intelligence database contains 282,388 articles, but the `content` fields are frequently NULL/empty, preventing full-text analysis for documentary story generation.

**Root Cause**: ETL pipeline issues during article content extraction from historical newspaper archives (1920-1961 Atlanta Constitution).

**Solution Implemented**: 
1. **Dual Content Field Strategy**: Query both `content` AND `processed_content` fields
2. **Content Validation**: Filter for articles with substantial content (>100 characters)
3. **Fallback Strategy**: Use entity/relationship data when content unavailable
4. **Intelligence-First Approach**: Leverage pre-scored documentary_potential metrics

### Technical Implementation

```sql
-- Content Access Query Pattern
SELECT content, processed_content 
FROM intelligence_articles 
WHERE (content IS NOT NULL AND length(content) > 100)
   OR (processed_content IS NOT NULL AND length(processed_content) > 100)
```

**Content Priority Order**:
1. `processed_content` (StoryMap's enhanced text)
2. `content` (raw OCR text)  
3. Entity relationship analysis (fallback)
4. Legacy curated examples (final fallback)

--- 