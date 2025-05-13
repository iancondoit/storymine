import { Request, Response } from 'express';
import { query } from '../database/connection';

/**
 * Get a list of entities with optional filtering
 */
export const getEntities = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const entityType = req.query.type as string;
    
    // Build query with type filter if provided
    let queryText = `
      SELECT e.id, e.name, e.type, COUNT(ae.article_id) as article_count
      FROM entities e
      LEFT JOIN article_entities ae ON e.id = ae.entity_id
    `;
    
    let countText = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM entities e
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (entityType) {
      queryText += ` WHERE e.type = $${paramIndex}`;
      countText += ` WHERE e.type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }
    
    // Complete the queries
    queryText += `
      GROUP BY e.id, e.name, e.type
      ORDER BY article_count DESC, e.name
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);
    
    // Execute queries
    const entitiesResult = await query(queryText, params);
    const countResult = await query(countText, entityType ? [entityType] : []);
    
    const totalEntities = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalEntities / limit);
    
    // Format response
    res.json({
      page,
      limit,
      totalEntities,
      totalPages,
      entities: entitiesResult.rows
    });
  } catch (error) {
    console.error('Error fetching entities:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
};

/**
 * Get relationships between entities
 */
export const getEntityRelationships = async (req: Request, res: Response) => {
  try {
    const entityName = req.params.name;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!entityName) {
      return res.status(400).json({ error: 'Entity name is required' });
    }
    
    // Query to find co-occurring entities
    const queryText = `
      SELECT e2.name, e2.type, COUNT(*) as co_occurrences
      FROM entities e1
      JOIN article_entities ae1 ON e1.id = ae1.entity_id
      JOIN article_entities ae2 ON ae1.article_id = ae2.article_id
      JOIN entities e2 ON ae2.entity_id = e2.id
      WHERE e1.name = $1 AND e2.name != $1
      GROUP BY e2.name, e2.type
      ORDER BY co_occurrences DESC
      LIMIT $2
    `;
    
    const result = await query(queryText, [entityName, limit]);
    
    res.json({
      entity: entityName,
      relationships: result.rows
    });
  } catch (error) {
    console.error('Error fetching entity relationships:', error);
    res.status(500).json({ error: 'Failed to fetch entity relationships' });
  }
}; 