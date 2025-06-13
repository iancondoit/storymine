# StoryMine v4.0.0 - AWS Intelligence Platform

**Historical Documentary Discovery Platform** powered by StoryMap Intelligence

> 🎬 **Major Release**: Now powered by AWS-deployed pre-scored intelligence data with guaranteed quality and zero NULL values

## 🚀 What's New in v4.0.0

### AWS Intelligence Integration
- **282,388 Pre-Scored Articles**: Complete Atlanta Constitution archive (1890-1950)
- **Zero NULL Values**: Guaranteed `documentary_potential` and `narrative_score` for every article
- **Instant Performance**: No more real-time Claude analysis - direct database queries
- **Quality Guaranteed**: StoryMap Intelligence 3-stage validation system

### Enhanced Discovery Features
- **Accumulative Story Discovery**: "Give me more" adds new stories to existing list
- **Visual Quality Indicators**: Real-time documentary potential scoring
- **Thematic Intelligence**: Pre-analyzed themes and locations
- **Historical Context**: 60-year span from Gilded Age to Post-WWII

## 📊 Platform Overview

StoryMine transforms historical newspaper archives into compelling documentary stories using advanced AI analysis and pre-scored intelligence data.

### Core Capabilities
- **Documentary Story Discovery**: Find stories with high visual and narrative potential
- **Intelligent Filtering**: Category, year range, and quality-based filtering  
- **Accumulative Exploration**: Build story collections with "Give me more" functionality
- **Quality Scoring**: Documentary potential (0-100%) and narrative structure analysis
- **Historical Context**: Rich metadata including themes, locations, and entities

### Data Foundation
- **Source**: Atlanta Constitution newspaper archive
- **Time Period**: 1890-1950 (60 years of American history)
- **Volume**: 282,388 articles with complete intelligence scoring
- **Quality**: Zero NULL values, mathematically validated scores
- **Themes**: Politics, Crime, War, Business, Sports, Women's Rights, Social Reform

## 🎯 Use Cases

### Documentary Filmmakers
- Discover high-potential stories with visual elements
- Filter by historical period and thematic content
- Access pre-analyzed narrative structure and conflict
- Identify archival research opportunities

### Historical Researchers  
- Explore 60 years of Atlanta and Southern history
- Find stories by category, year, or documentary potential
- Access entity relationships and story connections
- Discover overlooked historical narratives

### Content Creators
- Find compelling historical stories for modern audiences
- Access pre-scored content for quality assurance
- Explore thematic connections across decades
- Build documentary story collections

## 🏗️ Architecture

### AWS Intelligence Backend
```
StoryMap Intelligence → AWS RDS PostgreSQL → StoryMine API → React Frontend
```

### Key Components
- **Intelligence Database**: Pre-scored articles with guaranteed quality
- **API Layer**: RESTful endpoints for story discovery and exploration
- **React Frontend**: Modern UI with accumulative discovery features
- **Quality Assurance**: Real-time validation and error handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (AWS RDS connection configured)
- Environment variables for database connection

### Installation
```bash
git clone https://github.com/your-org/storymine.git
cd storymine
npm install
```

### Environment Setup
```bash
# Database connection (AWS RDS)
DATABASE_URL=postgresql://user:pass@storymine-production.cmb42682sq1z.us-east-1.rds.amazonaws.com:5432/storymine

# Application settings
NODE_ENV=production
PORT=3000
```

### Development
```bash
# Start development server
npm run dev

# Build for production  
npm run build
npm start
```

### Deployment
```bash
# Railway deployment
railway up

# Manual deployment
npm run build
npm start
```

## 📖 API Documentation

### Story Discovery
```http
GET /api/narrative/stories?category=politics&yearRange=1920-1930&count=10
```

**Response:**
```json
{
  "success": true,
  "stories": [
    {
      "id": "story_12345",
      "title": "Atlanta Mayor Election Sparks Reform Movement",
      "summary": "A compelling dramatic story from 1923 in Atlanta exploring themes of politics, reform, social change...",
      "documentaryPotential": 87,
      "narrativeScore": 74,
      "year": 1923,
      "category": "politics",
      "themes": ["Politics", "Reform", "Social Change"],
      "location": "Atlanta, Georgia"
    }
  ],
  "metadata": {
    "source": "aws_prescored_intelligence",
    "qualityRange": {
      "minDocumentaryPotential": 0.65,
      "maxDocumentaryPotential": 0.92
    }
  }
}
```

### Categories & Filters
```http
GET /api/narrative/categories
```

**Available Categories:**
- General Interest
- Politics & Government  
- Crime & Justice
- War & Military
- Business & Economy
- Sports & Athletics
- Women's Stories
- Protests & Reform
- Education
- Entertainment & Culture

**Year Ranges:**
- 1890-1900: Gilded Age, Industrial Growth
- 1900-1910: Progressive Era Begins  
- 1910-1920: WWI Era, Social Change
- 1920-1930: Roaring Twenties, Prosperity
- 1930-1940: Great Depression, New Deal
- 1940-1950: WWII, Post-war Transition

## 🎬 Story Discovery Workflow

### 1. Initial Discovery
```javascript
// Load stories with filters
const response = await fetch('/api/narrative/stories?category=women&yearRange=1920-1930');
const { stories } = await response.json();
```

### 2. Accumulative Exploration  
```javascript
// Add more stories to existing collection
const moreStories = await fetch('/api/narrative/refresh', {
  method: 'POST',
  body: JSON.stringify({ category: 'women', yearRange: '1920-1930' })
});
```

### 3. Story Deep Dive
```javascript
// Explore specific story in detail
const storyDetails = await fetch('/api/narrative/explore', {
  method: 'POST', 
  body: JSON.stringify({ storyId: 'story_12345', focus: 'documentary' })
});
```

## 📈 Quality Metrics

### Documentary Potential Scoring
- **90-100%**: Exceptional stories with strong visual elements
- **80-89%**: Compelling stories with good narrative structure  
- **70-79%**: Significant stories with documentary value
- **60-69%**: Notable stories with development potential
- **50-59%**: Interesting stories requiring additional context

### Data Quality Assurance
- **Zero NULL Values**: All articles have valid scores
- **Mathematical Validation**: Scores guaranteed within 0.0-1.0 range
- **3-Stage Verification**: Input, scoring, and deployment validation
- **Real-time Monitoring**: Continuous quality checks

## 🔧 Technical Details

### Database Schema
```sql
-- Primary intelligence table
intelligence_articles (
  storymap_id SERIAL PRIMARY KEY,
  title VARCHAR(500),
  content TEXT,
  publication_date DATE,
  documentary_potential FLOAT NOT NULL, -- 0.0-1.0
  narrative_score FLOAT NOT NULL,       -- 0.0-1.0  
  primary_themes TEXT[],
  secondary_themes TEXT[],
  primary_location VARCHAR(200),
  secondary_locations TEXT[]
);
```

### Performance Optimizations
- **Indexed Queries**: Fast filtering by date, category, and quality
- **Pagination Support**: Efficient "give me more" functionality
- **Connection Pooling**: Optimized database connections
- **Caching Strategy**: Reduced API response times

## 🛠️ Development

### Project Structure
```
src/
├── backend/
│   ├── controllers/     # API route handlers
│   ├── services/        # Business logic (Claude integration)
│   ├── database/        # Database connection and setup
│   └── routes/          # API route definitions
├── frontend/
│   ├── pages/           # Next.js pages
│   ├── components/      # React components  
│   └── styles/          # CSS and styling
└── docs/                # Documentation
```

### Key Files
- `src/backend/src/services/claudeNarrativeService.ts` - Core intelligence service
- `src/frontend/src/pages/jordi.tsx` - Main discovery interface
- `src/backend/src/database/connection.ts` - AWS database connection

## 📚 Documentation

- [Development Guide](docs/DEVELOPMENT_GUIDE.md) - Technical implementation details
- [User Guide](USER_GUIDE.md) - Platform usage instructions  
- [API Reference](docs/API_REFERENCE.md) - Complete API documentation
- [Changelog](CHANGELOG.md) - Version history and updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **StoryMap Intelligence Team** - AWS deployment and data quality assurance
- **Atlanta Constitution Archive** - Historical newspaper content (1890-1950)
- **Railway Platform** - Deployment and hosting infrastructure
- **Claude AI** - Original content analysis and intelligence development

---

**StoryMine v4.0.0** - Transforming historical archives into compelling documentary stories with AWS-powered intelligence.

*Built with ❤️ for documentary filmmakers, historians, and storytellers* 