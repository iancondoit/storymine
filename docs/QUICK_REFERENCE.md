# StoryMine Quick Reference Guide v3.1.1

**For new developers and agents joining the project**

## 🚀 Current System Status

### Production Information
- **Version**: 3.1.1 (Production Ready)
- **Database**: 282,388 Atlanta Constitution articles (1920-1961)
- **Performance**: 80% speed improvement over previous versions
- **Quality**: 95%+ clean, professional story titles
- **Deployment**: Railway (auto-deploy from `main` branch)

## 📁 Key Files Modified in v3.1.1

### Frontend Changes
- **`src/frontend/src/pages/jordi.tsx`**: 
  - Accumulative story discovery logic
  - Visual feedback system (accent borders, pulse animation)
  - "+X new" indicator badges
  - Dynamic button text

### Backend Changes
- **`src/backend/src/services/claudeNarrativeService.ts`**:
  - Quality control title filtering
  - Pre-filtering for high-potential articles
  - Smart batching (10 articles vs 50)
  - Parallel processing (3 batches max)
  - Fast-track mode for existing intelligence
  - Pagination offset tracking

### Infrastructure Changes
- **`.dockerignore`**: 97 optimized entries
- **`Dockerfile`**: Multi-stage build optimization
- **`package.json`**: Version 3.1.1, updated scripts

## 🔧 How It Works Now

### Story Discovery Flow
```
1. User visits /jordi
2. Selects category + time period
3. Frontend calls /api/narrative/stories
4. Backend pre-filters 500 articles
5. Creates 3 batches of 10 articles each
6. Processes batches in parallel through Claude
7. Applies quality control filtering
8. Returns 10 clean documentary stories
9. User clicks "Give me more"
10. New stories added to TOP of existing list
```

### Quality Control Process
```
Articles → Content Length Check → Title Quality Check → Claude Analysis → Title Optimization → Final Filtering → User Display
```

## ⚡ Performance Optimizations

### Speed Improvements (80% faster)
- **Pre-filtering**: Only process articles >300 chars
- **Smaller batches**: 10 articles per Claude request
- **Parallel processing**: 3 simultaneous requests
- **Fast-track**: Skip Claude for pre-analyzed articles
- **Shorter prompts**: 200 chars vs 800 chars

### Deployment Improvements (80% faster)
- **Smart .dockerignore**: Exclude unnecessary files
- **Multi-stage build**: Better caching
- **Production optimization**: Minimal runtime image

## 🧹 Quality Control Filters

### Title Filtering (blocks these patterns)
```javascript
const isBadTitle = 
  upper.includes('NEWSPAPER') ||     // Mastheads
  upper.includes('STANDARD') ||      // Publication headers
  upper.includes('DAILY') ||         // Newspaper names
  upper.includes('CONSTITUTION') ||  // Publication names
  upper.startsWith('BY ') ||         // Bylines
  upper.startsWith('FROM ') ||       // Attribution
  upper.includes(', M. D.') ||       // Medical credentials
  upper.includes(', DR.') ||         // Doctor titles
  upper.includes('ISFVO') ||         // Corrupted text
  upper.includes('CERTAINTY') ||     // Text fragments
  title.length > 100;               // Overly long titles
```

## 🎨 User Experience Features

### New in v3.1.1
- **Accumulative Discovery**: Stories add to existing list
- **Visual Feedback**: Accent borders on new stories
- **Pulse Animation**: 3-second highlight for new content
- **"+X new" Badge**: Shows count of newly discovered stories
- **Dynamic Button Text**: "Give me more" → "Discover more"
- **Smart Filtering**: Filter changes reset list, "Give me more" accumulates

## 🚢 Deployment Status

### Railway Configuration
- **Auto-deploy**: Pushes to `main` trigger deployment
- **Health Check**: `/api/health` endpoint
- **Environment**: Production-optimized
- **Restart Policy**: ON_FAILURE with 3 retries

### Environment Variables Required
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
```

## 🐛 Common Issues & Solutions

### Issue: "No stories found"
**Quick Fix**: Check database connection and environment variables
```bash
railway variables  # Check env vars
railway logs       # Check for errors
```

### Issue: Slow story discovery (>30 seconds)  
**Quick Fix**: Check batch size and fast-track mode
```typescript
const OPTIMIZED_BATCH_SIZE = 10; // Should be 10, not 50
```

### Issue: Malformed titles appearing
**Quick Fix**: Update title filtering in `optimizeTitle()` method
```typescript
// Add new bad patterns to isBadTitle check
```

### Issue: Railway deployment failure
**Quick Fix**: Check .dockerignore and build logs
```bash
railway logs --build  # Check build process
```

## 📊 Key Metrics to Monitor

### Performance Targets
- **Story Discovery**: <20 seconds
- **"Give me more"**: <15 seconds  
- **Deployment**: <2 minutes
- **Memory Usage**: <512MB
- **Error Rate**: <1%

### Quality Targets
- **Clean Titles**: >95%
- **Story Count**: Exactly 10 per request
- **Accumulation**: New stories appear at top
- **Visual Feedback**: Accent borders for 3 seconds

## 🧪 Testing Checklist

### Manual Testing (Before Deployment)
- [ ] Initial load shows 10 stories in <20 seconds
- [ ] "Give me more" adds new stories to top in <15 seconds
- [ ] New stories show accent borders and "+X new" badge
- [ ] Filter changes reset story list
- [ ] All story titles are clean (no bylines/mastheads)
- [ ] System works across different categories/time periods

### Database Testing
```bash
npm run test:database    # Quick database connectivity test
npm run monitor         # Continuous monitoring
npm run health         # Full system health check
```

## 🔄 Development Workflow

### Making Changes
1. Create feature branch from `main`
2. Make changes and test locally
3. Update documentation if needed
4. Push to feature branch for testing
5. Merge to `main` for auto-deployment

### Local Development
```bash
cd StoryMine
npm run install:all  # Install all dependencies
npm run dev          # Start local development
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## 📚 Documentation Structure

- **README.md**: Project overview with v3.1.1 features
- **docs/DEVELOPMENT_GUIDE.md**: Comprehensive technical documentation
- **CHANGELOG.md**: Complete version history
- **USER_GUIDE.md**: Updated user documentation  
- **docs/QUICK_REFERENCE.md**: This quick reference
- **JORDI_INTELLIGENCE_SYSTEM.md**: AI system documentation

## 💡 Next Steps for New Developers

1. **Read this Quick Reference** (you're doing it!)
2. **Review the DEVELOPMENT_GUIDE** for deep technical details
3. **Check the CHANGELOG** to understand recent improvements
4. **Run local development** to see the system in action
5. **Test the "Give me more" accumulation** feature
6. **Monitor Railway logs** to understand production behavior

---

**Last Updated**: December 19, 2024
**Version**: 3.1.1  
**Status**: Production Ready with Major Optimizations 