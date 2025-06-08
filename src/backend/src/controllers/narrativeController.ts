import { Request, Response } from 'express';
import { ClaudeNarrativeService } from '../services/claudeNarrativeService';

const narrativeService = new ClaudeNarrativeService();

/**
 * JORDI NARRATIVE CONTROLLER
 * Handles intelligent story discovery and documentary analysis endpoints
 * 
 * Routes:
 * GET /api/narrative/stories - Get curated story options with filtering
 * GET /api/narrative/categories - Get available categories and year ranges  
 * POST /api/narrative/explore - Deep exploration of specific stories
 * POST /api/narrative/chat - Story-focused conversation
 * GET /api/narrative/health - Service health check
 */

/**
 * GET CURATED STORY OPTIONS
 * Route: GET /api/narrative/stories
 * Query params: category, yearRange, count
 */
export const getCuratedStoryOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category = 'general', yearRange = 'all', count = '10' } = req.query;
    
    console.log(`📚 Story Discovery Request: ${category} (${yearRange}) - ${count} stories`);
    
    const options = {
      category: category as string,
      yearRange: yearRange as string,
      count: parseInt(count as string) || 10
    };

    const result = await narrativeService.getCuratedStoryOptions(options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.stories,
        metadata: result.metadata,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve stories',
        fallback: true
      });
    }
  } catch (error) {
    console.error('❌ Error getting curated stories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
};

/**
 * EXPLORE STORY IN DEPTH  
 * Route: POST /api/narrative/explore
 * Body: { storyId, focus? }
 */
export const exploreStoryInDepth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storyId, focus } = req.body;
    
    if (!storyId) {
      res.status(400).json({
        success: false,
        error: 'Story ID is required'
      });
      return;
    }

    console.log(`🎬 Deep Story Exploration: ${storyId} (${focus || 'general'})`);
    
    const result = await narrativeService.exploreStoryInDepth(storyId, focus);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.story,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Story not found',
        storyId
      });
    }
  } catch (error) {
    console.error('❌ Error exploring story:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
};

/**
 * GET STORY CATEGORIES AND YEAR RANGES
 * Route: GET /api/narrative/categories
 */
export const getStoryCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📊 Categories Request');
    
    const result = await narrativeService.getStoryCategories();
    
    res.json({
      success: true,
      data: {
        categories: result.categories,
        yearRanges: result.yearRanges
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
};

/**
 * STORY-FOCUSED CHAT
 * Route: POST /api/narrative/chat
 * Body: { storyId, message, conversationHistory? }
 */
export const storyFocusedChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storyId, message, conversationHistory = [] } = req.body;
    
    if (!storyId || !message) {
      res.status(400).json({
        success: false,
        error: 'Story ID and message are required'
      });
      return;
    }

    console.log(`💬 Story Chat: ${storyId}`);
    
    const result = await narrativeService.storyFocusedChat(storyId, message, conversationHistory);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          response: result.response,
          storyContext: result.storyContext
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'Story not found',
        storyId
      });
    }
  } catch (error) {
    console.error('❌ Error in story chat:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
};

/**
 * REFRESH STORY OPTIONS
 * Route: POST /api/narrative/refresh
 * Body: { category?, yearRange?, count? }
 */
export const refreshStoryOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category = 'general', yearRange = 'all', count = 10 } = req.body;
    
    console.log(`🔄 Refresh Stories: ${category} (${yearRange})`);
    
    // Get fresh set of stories (similar to getCuratedStoryOptions but via POST)
    const options = { category, yearRange, count };
    const result = await narrativeService.getCuratedStoryOptions(options);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.stories,
        metadata: {
          ...result.metadata,
          refreshed: true,
          refreshTime: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to refresh stories'
      });
    }
  } catch (error) {
    console.error('❌ Error refreshing stories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
};

/**
 * LEGACY SUPPORT: Analyze Narrative Patterns
 * Route: POST /api/narrative/analyze  
 * Body: { topic }
 */
export const analyzeNarrativePatterns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
      return;
    }

    console.log(`🔍 Legacy Analysis: ${topic}`);
    
    const result = await narrativeService.analyzeNarrativePatterns(topic);
    
    res.json({
      success: true,
      data: { analysis: result },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error analyzing patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
};

/**
 * HEALTH CHECK
 * Route: GET /api/narrative/health
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🏥 Health Check Request');
    
    const result = await narrativeService.healthCheck();
    
    const statusCode = result.status === 'optimal' ? 200 : 206; // 206 = Partial Content (degraded mode)
    
    res.status(statusCode).json({
      success: true,
      service: 'claudeNarrativeService',
      status: result.status,
      checks: result.checks,
      capabilities: result.capabilities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      service: 'claudeNarrativeService',
      status: 'error',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
}; 