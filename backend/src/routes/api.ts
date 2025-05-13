import express, { Request, Response } from 'express';
import { getArticles } from '../controllers/articleController';
import { searchArticles } from '../controllers/searchController';
import { getEntities, getEntityRelationships } from '../controllers/entityController';
import { handleChatMessage } from '../controllers/chatController';

export const router = express.Router();

// Placeholders for controllers that haven't been implemented yet
const getArticle = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

const getEntityTimeline = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

const getTags = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

const getArticlesByTag = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

// Chat
router.post('/chat', handleChatMessage);

// Articles
router.get('/articles', getArticles);
router.get('/articles/:id', getArticle);

// Search
router.get('/search/semantic', searchArticles);
router.get('/search/keyword', searchArticles);
router.get('/search/hybrid', searchArticles);

// Entities
router.get('/entities', getEntities);
router.get('/entities/:name/relationships', getEntityRelationships);
router.get('/entities/:name/timeline', getEntityTimeline);

// Tags
router.get('/tags', getTags);
router.get('/tags/:name/articles', getArticlesByTag); 