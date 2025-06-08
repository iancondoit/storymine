# Advisory: StoryMap API Integration Update - CRITICAL

Version: 1.0.0
Status: ACTIVE
Project: StoryMine
Created: 2025-01-31
Last Updated: 2025-01-31

## URGENT: StoryMap API Now Operational

**CRITICAL UPDATE**: StoryMap has completed their infrastructure repair and the API is now fully operational. You can begin integration immediately.

## Context

StoryMap has successfully completed Phase 1 Infrastructure Repair with the following major changes:

1. **API Framework Migration**: Migrated from deprecated Flask to modern FastAPI
2. **Complete Code Cleanup**: Removed 1,150+ lines of deprecated code
3. **Database Schema Alignment**: Fixed all schema mismatches
4. **Docker Infrastructure**: Resolved networking issues
5. **Performance Optimization**: Sub-second response times achieved

## Updated API Specifications

### Base Configuration
- **API Base URL**: `http://localhost:8080` (unchanged)
- **Framework**: FastAPI (NEW - was Flask)
- **Documentation**: Auto-generated at `http://localhost:8080/docs` (NEW)
- **Health Check**: `GET /health` (NEW endpoint)

### Updated Endpoints
```bash
# NEW FastAPI Endpoints (replace old Flask endpoints)
GET /health                    # System health check
GET /articles?limit=N&offset=N # Paginated article list  
GET /articles/{id}             # Individual article details
GET /entities?limit=N&offset=N # Entity list (ready for population)
GET /entities/{id}             # Individual entity details
```

### Updated Response Schema
```json
{
  "id": "string",              # NOW string-based IDs (was integer)
  "title": "string",
  "content": "string", 
  "publication_date": "YYYY-MM-DD",  # Field name confirmed
  "publication": "string",     # Field name confirmed (not 'source')
  "source": "string",          # Additional field
  "category": "string",
  "entities": [],              # Ready for population
  "relationships": []          # Ready for population
}
```

### Critical Changes for Your Integration

1. **Article IDs are now strings**: Update your frontend/backend to handle string IDs like `"1925-02-02--action-is-demanded"`

2. **HTTP Status Codes**: Implement proper error handling for:
   - `200` - Success
   - `404` - Article not found
   - `422` - Validation error
   - `500` - Server error

3. **Pagination**: Use `limit` and `offset` parameters:
   ```bash
   GET /articles?limit=10&offset=0
   ```

4. **Health Monitoring**: Use the new health endpoint:
   ```bash
   GET /health
   # Returns: {"status": "healthy", "database": "connected"}
   ```

## Immediate Action Items

### 1. Update Your Docker Configuration
Your existing `docker-compose.yml` should work, but verify:
```yaml
backend:
  environment:
    - STORYMAP_API_URLS=http://host.docker.internal:8080
```

### 2. Test the New API
Run these tests immediately:
```bash
# Test health endpoint
curl http://localhost:8080/health

# Test articles endpoint
curl http://localhost:8080/articles?limit=5

# Test specific article
curl http://localhost:8080/articles/1925-02-02--action-is-demanded
```

### 3. Update Your Code
- Replace any Flask-specific API calls with FastAPI endpoints
- Update article ID handling from integer to string
- Implement proper HTTP status code handling
- Add health check monitoring

### 4. Integration Testing
- Test end-to-end data flow from StoryMap to your frontend
- Verify Jordi can access real article data
- Test error handling and edge cases
- Validate performance with the current 222 articles

## Available Test Data

- **Current Dataset**: 222 Atlanta Constitution articles
- **Date Range**: Historical articles from 1920s-1950s
- **Format**: Fully structured JSON with metadata
- **Performance**: Sub-second response times confirmed

## Documentation Resources

1. **Auto-Generated API Docs**: `http://localhost:8080/docs`
2. **StoryMap Completion Report**: Available in PM reports
3. **Integration Handoff Package**: Complete technical specifications provided

## Expected Timeline

- **Immediate**: Begin API connection testing
- **Week 1**: Complete integration with new FastAPI endpoints
- **Week 1**: Replace all mock data with real article content
- **Week 2**: Optimize performance and implement caching

## Support and Escalation

- **Technical Issues**: Test the health endpoint first, then escalate to PM
- **Integration Problems**: Document specific error messages and API responses
- **Performance Concerns**: Monitor response times and report any issues >3 seconds

## Success Criteria

Your integration is successful when:
- [ ] Health endpoint returns "healthy" status
- [ ] Articles endpoint returns real article data
- [ ] Frontend displays actual historical articles (not mock data)
- [ ] Jordi can access and reference real article content
- [ ] End-to-end query works: User → Jordi → StoryMap → Real Articles

## Next Steps After Integration

Once your integration is complete:
1. Report Phase 1 completion using `python scripts/complete_phase.py Phase1`
2. Begin Phase 2: Claude API integration and RAG system
3. Coordinate with StoryMap for entity processing and relationship data

**This is the breakthrough we've been waiting for! The ecosystem blocker is resolved and you can now access real historical data. Begin integration immediately.** 