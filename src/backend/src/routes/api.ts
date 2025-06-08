import express, { Request, Response } from 'express';
import { getArticles, getArticle } from '../controllers/articleController';
import { searchArticles } from '../controllers/searchController';
import { 
  getEntities, 
  getEntity, 
  getEntityRelationships, 
  getEntityNetwork,
  getEntityTimeline,
  searchEntities
} from '../controllers/entityController';
import { handleChatMessage } from '../controllers/chatController';
import { getStoryMapStats } from '../controllers/storyMapController';
import { claudeService } from '../services/claudeService';
import databaseRouter from './database';
import { query } from '../database/connection';

export const router = express.Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database endpoints
router.use('/database', databaseRouter);

// StoryMap status endpoint
router.get('/storymap-stats', getStoryMapStats);

// Article endpoints
router.get('/articles', getArticles);
router.get('/articles/:id', getArticle);

// Search endpoints
router.get('/search', searchArticles);
router.post('/search', searchArticles);

// Entity endpoints
router.get('/entities', getEntities);
router.get('/entities/search', searchEntities);
router.get('/entities/:id', getEntity);
router.get('/entities/:id/relationships', getEntityRelationships);
router.get('/entities/:id/network', getEntityNetwork);
router.get('/entities/:id/timeline', getEntityTimeline);

// Chat endpoints
router.post('/chat', handleChatMessage);

// Conversation history endpoints
router.get('/conversations/:id', (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const history = claudeService.getConversationHistory(conversationId);
  
  if (!history) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  res.json(history);
});

router.delete('/conversations/:id', (req: Request, res: Response) => {
  const conversationId = req.params.id;
  claudeService.clearConversationHistory(conversationId);
  res.json({ success: true, message: 'Conversation history cleared' });
});

// Placeholders for controllers that haven't been implemented yet
const getTags = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

const getArticlesByTag = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

// Tags
router.get('/tags', getTags);
router.get('/tags/:name/articles', getArticlesByTag);

// Database stats endpoint
router.get('/database/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM intelligence_articles) as articles,
        (SELECT COUNT(*) FROM intelligence_entities) as entities,
        (SELECT COUNT(*) FROM intelligence_relationships) as relationships,
        (SELECT MIN(EXTRACT(YEAR FROM publication_date)) FROM intelligence_articles WHERE publication_date IS NOT NULL) as earliest_year,
        (SELECT MAX(EXTRACT(YEAR FROM publication_date)) FROM intelligence_articles WHERE publication_date IS NOT NULL) as latest_year
    `;
    
    const result = await query(statsQuery);
    const stats = result.rows[0];
    
    res.json({
      articles: parseInt(stats.articles),
      entities: parseInt(stats.entities),
      relationships: parseInt(stats.relationships),
      dateRange: {
        earliest: stats.earliest_year,
        latest: stats.latest_year,
        years: stats.latest_year - stats.earliest_year + 1
      }
    });
  } catch (error) {
    console.error('Error getting database stats:', error);
    res.status(500).json({ error: 'Could not retrieve database statistics' });
  }
});

// Debug endpoint to test Roosevelt article search directly  
router.get('/debug/roosevelt-count', async (req, res) => {
  try {
    const countQuery = `
      SELECT COUNT(*) as count
      FROM intelligence_articles 
      WHERE title ILIKE '%Roosevelt%' OR content ILIKE '%Roosevelt%'
    `;
    
    const sampleQuery = `
      SELECT id, title, SUBSTRING(content, 1, 100) as content_sample, publication_date, publication_name
      FROM intelligence_articles 
      WHERE title ILIKE '%Roosevelt%' OR content ILIKE '%Roosevelt%'
      LIMIT 10
    `;
    
    const countResult = await query(countQuery);
    const sampleResult = await query(sampleQuery);
    
    res.json({
      total_roosevelt_articles: parseInt(countResult.rows[0].count),
      sample_articles: sampleResult.rows,
      storymap_team_expected: 12170,
      match: parseInt(countResult.rows[0].count) >= 12000
    });
  } catch (error) {
    console.error('Error testing Roosevelt search:', error);
    res.status(500).json({ error: 'Could not test Roosevelt search', details: (error as Error).message });
  }
}); 