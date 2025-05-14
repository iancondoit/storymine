import { Request, Response } from 'express';
import { 
  getArticles, 
  getEntities, 
  pingStoryMapApi 
} from '../services/storyMapApi';

/**
 * Get statistics from the StoryMap API
 */
export const getStoryMapStats = async (_req: Request, res: Response) => {
  try {
    // Check if StoryMap API is available
    const apiUrl = await pingStoryMapApi();
    
    if (!apiUrl) {
      return res.status(503).json({
        status: 'offline',
        message: 'StoryMap API is currently unavailable'
      });
    }

    // Get article count
    const articlesResult = await getArticles({ limit: 1 });
    
    // Get entity count
    const entitiesResult = await getEntities({ limit: 1 });
    
    // If any of the requests failed
    if (articlesResult.error || entitiesResult.error) {
      return res.status(200).json({
        status: 'degraded',
        apiUrl,
        articleCount: articlesResult.error ? null : articlesResult.data.total,
        entityCount: entitiesResult.error ? null : entitiesResult.data.total,
        lastUpdated: new Date().toISOString()
      });
    }

    // Return stats if everything is available
    return res.status(200).json({
      status: 'online',
      apiUrl,
      articleCount: articlesResult.data.total,
      entityCount: entitiesResult.data.total || 0, // Default to 0 if not provided
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching StoryMap stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch StoryMap statistics'
    });
  }
}; 