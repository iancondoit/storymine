import { Request, Response } from 'express';
import { query } from '../database/connection';

/**
 * Get a list of articles with pagination
 */
export const getArticles = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    // Optional filters
    const publication = req.query.publication as string;
    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;
    const section = req.query.section as string;
    
    // Build where clause based on filters
    let whereClause = '';
    const params: any[] = [];
    let paramCount = 1;
    
    if (publication) {
      whereClause += `publication = $${paramCount} `;
      params.push(publication);
      paramCount++;
    }
    
    if (fromDate) {
      whereClause += whereClause ? 'AND ' : '';
      whereClause += `publish_date >= $${paramCount} `;
      params.push(fromDate);
      paramCount++;
    }
    
    if (toDate) {
      whereClause += whereClause ? 'AND ' : '';
      whereClause += `publish_date <= $${paramCount} `;
      params.push(toDate);
      paramCount++;
    }
    
    if (section) {
      whereClause += whereClause ? 'AND ' : '';
      whereClause += `section = $${paramCount} `;
      params.push(section);
      paramCount++;
    }
    
    if (whereClause) {
      whereClause = 'WHERE ' + whereClause;
    }
    
    // Query to get paginated articles
    const queryText = `
      SELECT id, title, publish_date, publication, section, word_count
      FROM articles
      ${whereClause}
      ORDER BY publish_date DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    // Add pagination parameters
    params.push(limit, offset);
    
    // Count total matching articles for pagination
    const countText = `
      SELECT COUNT(*) as total
      FROM articles
      ${whereClause}
    `;
    
    // Execute both queries
    const articlesResult = await query(queryText, params);
    const countResult = await query(countText, params.slice(0, paramCount - 1));
    
    const totalArticles = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalArticles / limit);
    
    res.json({
      page,
      limit,
      totalArticles,
      totalPages,
      articles: articlesResult.rows
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
}; 