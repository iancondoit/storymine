import { Request, Response } from 'express';

/**
 * Get statistics from the StoryMap API
 * Note: StoryMap API is not used in production - we connect directly to AWS database
 */
export const getStoryMapStats = async (_req: Request, res: Response) => {
  try {
    // StoryMap API is not available in production deployment
    // We connect directly to the AWS PostgreSQL database instead
    return res.status(503).json({
      status: 'offline',
      message: 'StoryMap API is currently unavailable'
    });
  } catch (error) {
    console.error('Error in StoryMap stats controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch StoryMap statistics'
    });
  }
}; 