import { Request, Response } from 'express';
import { query } from '../database/connection';

/**
 * Search articles using semantic search
 * This implements a placeholder that will be enhanced later
 */
export const searchArticles = async (req: Request, res: Response) => {
  try {
    const searchQuery = req.query.query as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const searchType = req.path.split('/').pop(); // Extract 'semantic', 'keyword', or 'hybrid'
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // For now, this is a simple keyword search as we don't have the vector DB set up yet
    // This will be replaced with proper semantic search implementation
    let queryText: string;
    let params: any[];
    
    switch (searchType) {
      case 'semantic':
        // Placeholder for semantic search
        // In a real implementation, this would use vector similarity search
        queryText = `
          SELECT id, title, content, publish_date, publication, section
          FROM articles
          WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
          ORDER BY ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) DESC
          LIMIT $2 OFFSET $3
        `;
        params = [searchQuery, limit, offset];
        break;
        
      case 'keyword':
        // Standard keyword search
        queryText = `
          SELECT id, title, content, publish_date, publication, section
          FROM articles
          WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
          ORDER BY ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) DESC
          LIMIT $2 OFFSET $3
        `;
        params = [searchQuery, limit, offset];
        break;
        
      case 'hybrid':
      default:
        // Placeholder for hybrid search
        // In a real implementation, this would combine vector similarity with keyword search
        queryText = `
          SELECT id, title, content, publish_date, publication, section
          FROM articles
          WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
          ORDER BY ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) DESC
          LIMIT $2 OFFSET $3
        `;
        params = [searchQuery, limit, offset];
        break;
    }
    
    const result = await query(queryText, params);
    
    // Format the response
    const articles = result.rows.map(article => ({
      id: article.id,
      title: article.title,
      // Create a snippet from the content
      snippet: article.content.length > 200 
        ? article.content.substring(0, 200) + '...' 
        : article.content,
      publish_date: article.publish_date,
      publication: article.publication,
      section: article.section
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