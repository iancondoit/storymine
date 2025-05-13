import { Request, Response } from 'express';
import { query } from '../database/connection';

/**
 * Type definition for article source
 */
interface ArticleSource {
  title: string;
  date: Date;
  publication: string;
}

/**
 * Handle chat messages from the frontend
 * This is a placeholder that will be expanded with LLM integration
 */
export const handleChatMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    
    // For now, we'll implement a simple keyword-based response
    // In the future, this will use the LLM for more sophisticated responses
    
    // Default response
    let response = "I'm sorry, I couldn't find any relevant information in the archives.";
    let sources: ArticleSource[] = [];
    
    // First try to find real articles in the database using a more flexible search
    // This converts user query to individual terms for better matching
    const searchWords = message.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    
    if (searchWords.length > 0) {
      console.log(`Searching with terms: ${searchWords.join(', ')}`);
      
      // First search method: Articles directly containing the search terms
      let searchResult = null;
      
      // Join search terms with OR operators for more flexible matching
      const tsQuery = searchWords.join(' | ');
      console.log(`Searching articles with query: ${tsQuery}`);
      
      // 1. Try direct text search in articles
      searchResult = await query(`
        SELECT id, title, content, publish_date, publication
        FROM articles
        WHERE to_tsvector('english', title || ' ' || content) @@ to_tsquery('english', $1)
        ORDER BY publish_date DESC
        LIMIT 3
      `, [tsQuery]);

      // 2. If no results, try searching by entity name
      if (searchResult.rows.length === 0) {
        console.log('No direct matches, searching by entity names');
        
        searchResult = await query(`
          SELECT DISTINCT a.id, a.title, a.content, a.publish_date, a.publication
          FROM articles a
          JOIN article_entities ae ON a.id = ae.article_id
          JOIN entities e ON ae.entity_id = e.id
          WHERE e.name ILIKE ANY(array[${searchWords.map(word => `'%${word}%'`).join(', ')}])
          ORDER BY a.publish_date DESC
          LIMIT 3
        `);
      }
      
      // 3. If still no results, try searching by tags
      if (searchResult.rows.length === 0) {
        console.log('No entity matches, searching by tags');
        
        searchResult = await query(`
          SELECT DISTINCT a.id, a.title, a.content, a.publish_date, a.publication
          FROM articles a
          JOIN article_tags at ON a.id = at.article_id
          JOIN tags t ON at.tag_id = t.id
          WHERE t.name ILIKE ANY(array[${searchWords.map(word => `'%${word}%'`).join(', ')}])
          ORDER BY a.publish_date DESC
          LIMIT 3
        `);
      }
      
      if (searchResult.rows.length > 0) {
        const articles = searchResult.rows.map(article => ({
          title: article.title,
          date: article.publish_date,
          publication: article.publication
        }));

        sources = articles;
        
        response = `I found ${searchResult.rowCount} articles that might be relevant to your question:
        
${articles.map((a, i) => `${i+1}. "${a.title}" (${a.publication}, ${new Date(a.date).toLocaleDateString()})`).join('\n')}

Would you like me to provide more details about any of these stories?`;
      } 
      // Only fall back to hardcoded responses if no database results
      else if (message.toLowerCase().includes('civil rights')) {
        response = "The civil rights movement was extensively covered in our archives. Would you like to explore articles about Martin Luther King Jr., the Montgomery Bus Boycott, or the Civil Rights Act of 1964?";
      } else if (message.toLowerCase().includes('world war')) {
        response = "Our archives contain thousands of articles covering World War I and World War II. Is there a specific aspect of either conflict you're interested in?";
      } else if (message.toLowerCase().includes('president') || message.toLowerCase().includes('election')) {
        response = "Presidential elections have been a major focus of news coverage throughout history. I can help you explore coverage of specific elections or presidents.";
      }
    }
    
    // In a real implementation, we would:
    // 1. Use the user's message to query the database for relevant articles
    // 2. Generate vector embeddings for semantic search
    // 3. Pass relevant articles as context to the LLM
    // 4. Format and return the LLM's response
    
    res.json({
      response,
      sources
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
}; 