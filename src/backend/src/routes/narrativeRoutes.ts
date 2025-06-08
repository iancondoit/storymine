import express from 'express';
import {
  getCuratedStoryOptions,
  exploreStoryInDepth,
  getStoryCategories,
  storyFocusedChat,
  refreshStoryOptions,
  analyzeNarrativePatterns,
  healthCheck
} from '../controllers/narrativeController';

const router = express.Router();

/**
 * JORDI INTELLIGENCE ROUTES
 * Comprehensive story discovery and documentary analysis API
 * 
 * Core Intelligence Routes:
 * - GET  /stories      - Get curated story options with smart filtering
 * - GET  /categories   - Get available categories and year ranges
 * - POST /explore      - Deep story exploration and analysis
 * - POST /chat         - Story-focused conversation
 * - POST /refresh      - Refresh story options (get more)
 * 
 * Health & Legacy:
 * - GET  /health       - Service health check
 * - POST /analyze      - Legacy narrative pattern analysis
 */

// ============================================================================
// CORE INTELLIGENCE ENDPOINTS
// ============================================================================

/**
 * GET CURATED STORY OPTIONS
 * Smart story discovery using StoryMap Intelligence scoring
 * Query: category, yearRange, count
 */
router.get('/stories', getCuratedStoryOptions);

/**
 * GET STORY CATEGORIES & YEAR RANGES
 * Available filtering options for story discovery
 */
router.get('/categories', getStoryCategories);

/**
 * EXPLORE STORY IN DEPTH
 * Deep analysis of specific stories with documentary potential scoring
 * Body: { storyId, focus? }
 */
router.post('/explore', exploreStoryInDepth);

/**
 * STORY-FOCUSED CHAT
 * Intelligent conversation about specific historical stories
 * Body: { storyId, message, conversationHistory? }
 */
router.post('/chat', storyFocusedChat);

/**
 * REFRESH STORY OPTIONS
 * Get fresh set of stories ("Give me more" functionality)
 * Body: { category?, yearRange?, count? }
 */
router.post('/refresh', refreshStoryOptions);

// ============================================================================
// HEALTH & LEGACY ENDPOINTS
// ============================================================================

/**
 * HEALTH CHECK
 * Service status, database connectivity, intelligence capabilities
 */
router.get('/health', healthCheck);

/**
 * LEGACY: ANALYZE NARRATIVE PATTERNS
 * Backward compatibility with old narrative analysis
 * Body: { topic }
 */
router.post('/analyze', analyzeNarrativePatterns);

// ============================================================================
// ROUTE DOCUMENTATION ENDPOINT
// ============================================================================

/**
 * API DOCUMENTATION
 * Self-documenting endpoint describing all available routes
 */
router.get('/docs', (req, res) => {
  res.json({
    service: 'Jordi Intelligence API',
    description: 'Smart story discovery for documentary development using 282,388 pre-scored Atlanta Constitution articles (1920-1961)',
    intelligence: {
      source: 'StoryMap Intelligence Team',
      totalArticles: '282,388',
      scoring: 'Documentary potential, narrative richness, archival value, evidence quality',
      timespan: '1920-1961 Atlanta Constitution',
      capabilities: [
        'Smart category filtering (Politics, Crime, War, Women\'s Stories, etc.)',
        'Year range filtering in 5-year periods',
        'Documentary potential scoring (0-100%)',
        'Narrative richness analysis',
        'Story-focused conversation'
      ]
    },
    endpoints: {
      'GET /api/narrative/stories': {
        description: 'Get curated story options',
        query: {
          category: 'Story category (general, politics, crime, war, business, sports, women, protests, education, entertainment)',
          yearRange: 'Time period (all, 1920-1925, 1925-1930, ..., 1955-1961)',
          count: 'Number of stories to return (default: 10)'
        },
        example: '/api/narrative/stories?category=women&yearRange=1920-1925&count=5'
      },
      'GET /api/narrative/categories': {
        description: 'Get available categories and year ranges'
      },
      'POST /api/narrative/explore': {
        description: 'Deep exploration of specific story',
        body: {
          storyId: 'Story identifier',
          focus: 'Optional focus area'
        }
      },
      'POST /api/narrative/chat': {
        description: 'Story-focused conversation',
        body: {
          storyId: 'Story identifier',
          message: 'User message',
          conversationHistory: 'Optional conversation context'
        }
      },
      'POST /api/narrative/refresh': {
        description: 'Get fresh set of stories',
        body: {
          category: 'Optional category filter',
          yearRange: 'Optional year range filter',
          count: 'Optional count (default: 10)'
        }
      },
      'GET /api/narrative/health': {
        description: 'Service health check'
      }
    },
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router; 