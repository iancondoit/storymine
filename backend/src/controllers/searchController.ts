import { Request, Response } from 'express';
import * as storyMapApi from '../services/storyMapApi';

/**
 * Search articles using semantic search
 * This routes the search query to the StoryMap API
 */
export const searchArticles = async (req: Request, res: Response) => {
  try {
    const searchQuery = req.query.query as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const threshold = parseFloat(req.query.threshold as string) || 0.7;
    const searchType = req.path.split('/').pop(); // Extract 'semantic', 'keyword', or 'hybrid'
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Call the StoryMap API search endpoint
    const result = await storyMapApi.searchArticles(searchQuery, {
      limit,
      threshold,
      search_type: searchType // Pass the search type to the API if it supports it
    });
    
    if (result.error) {
      return res.status(500).json({ 
        status: 'error',
        error: 'Failed to search articles via StoryMap API'
      });
    }
    
    // Format the response to match our expected format
    const articles = (result.data.results || []).map((article: any) => ({
      id: article.id,
      title: article.title,
      // Create a snippet from the content
      snippet: article.content && article.content.length > 200 
        ? article.content.substring(0, 200) + '...' 
        : article.content || '',
      publish_date: article.publication_date,
      publication: article.source,
      section: article.category,
      similarity: article.similarity
    }));
    
    res.json({
      status: 'success',
      query: searchQuery,
      search_type: searchType,
      count: articles.length,
      results: articles
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to search articles'
    });
  }
}; 