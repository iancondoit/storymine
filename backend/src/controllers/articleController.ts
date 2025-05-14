import { Request, Response } from 'express';
import * as storyMapApi from '../services/storyMapApi';

/**
 * Get a list of articles with pagination
 */
export const getArticles = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    
    // Map query parameters for StoryMap API
    const apiParams = {
      limit,
      offset,
      // Map any additional filters 
      ...(req.query.publication && { publication: req.query.publication }),
      ...(req.query.from && { from_date: req.query.from }),
      ...(req.query.to && { to_date: req.query.to }),
      ...(req.query.section && { category: req.query.section })
    };
    
    // Call StoryMap API
    const result = await storyMapApi.getArticles(apiParams);
    
    if (result.error) {
      return res.status(result.error ? 500 : 200).json({ 
        error: result.error ? 'Error fetching articles from StoryMap API' : null 
      });
    }
    
    // Transform the response to match our expected format
    const articles = result.data.articles || [];
    const totalArticles = result.data.total || articles.length;
    const totalPages = Math.ceil(totalArticles / limit);
    
    res.json({
      page,
      limit,
      totalArticles,
      totalPages,
      articles: articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        publish_date: article.publication_date,
        publication: article.source,
        section: article.category,
        word_count: article.word_count || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
};

/**
 * Get a single article by ID
 */
export const getArticle = async (req: Request, res: Response) => {
  try {
    const articleId = req.params.id;
    
    // Call StoryMap API
    const result = await storyMapApi.getArticleById(articleId);
    
    if (result.error) {
      return res.status(404).json({ 
        error: `Article with ID ${articleId} not found or error accessing StoryMap API` 
      });
    }
    
    // Transform the article to our expected format if needed
    const article = result.data;
    
    res.json(article);
  } catch (error) {
    console.error(`Error fetching article with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
}; 