import { Request, Response } from 'express';
import * as storyMapApi from '../services/storyMapApi';

/**
 * Type definition for article source
 */
interface ArticleSource {
  title: string;
  date: string;
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
    
    // Default response
    let response = "I'm sorry, I couldn't find any relevant information in the archives.";
    let sources: ArticleSource[] = [];
    
    console.log(`Received chat message: "${message}"`);
    
    // Normalize the message for search
    const searchQuery = message.toLowerCase().trim();
    console.log(`Search query: "${searchQuery}"`);
    
    // Search for articles using the StoryMap API's search endpoint
    const searchResult = await storyMapApi.searchArticles(searchQuery, { limit: 5 });
    console.log('Search result:', JSON.stringify(searchResult, null, 2));
    
    if (!searchResult.error && searchResult.data.results && searchResult.data.results.length > 0) {
      const articles = searchResult.data.results.map((article: any) => ({
        title: article.title,
        date: article.publication_date,
        publication: article.source || 'Unknown Source'
      }));

      sources = articles;
      
      // Generate response based on the search results
      const articleSummaries = articles.map((a: ArticleSource, i: number) => 
        `${i+1}. "${a.title}" (${a.publication}, ${a.date})`
      ).join('\n');
      
      // Construct response based on the query
      if (searchQuery.includes('roosevelt')) {
        response = `I found some information about President Roosevelt in our archives. Here are some relevant articles:
        
${articleSummaries}

Franklin D. Roosevelt was the 32nd President of the United States, serving from 1933 until his death in 1945. He led the country during the Great Depression and World War II.`;
      } else {
        response = `I found ${searchResult.data.results.length} articles that might be relevant to your question:
        
${articleSummaries}

Would you like me to provide more details about any of these stories?`;
      }
    } 
    // Only fall back to hardcoded responses if no API results
    else if (message.toLowerCase().includes('roosevelt') || message.toLowerCase().includes('fdr')) {
      response = "Franklin D. Roosevelt was the 32nd President of the United States, serving from 1933 until his death in 1945. He was a central figure in world events during the mid-20th century, leading the United States during a time of worldwide economic depression and war. His program for relief, recovery, and reform, known as the New Deal, involved a great expansion of the role of the federal government in the economy.";
    } else if (message.toLowerCase().includes('civil rights')) {
      response = "The civil rights movement was extensively covered in our archives. Would you like to explore articles about Martin Luther King Jr., the Montgomery Bus Boycott, or the Civil Rights Act of 1964?";
    } else if (message.toLowerCase().includes('world war')) {
      response = "Our archives contain thousands of articles covering World War I and World War II. Is there a specific aspect of either conflict you're interested in?";
    } else if (message.toLowerCase().includes('president') || message.toLowerCase().includes('election')) {
      response = "Presidential elections have been a major focus of news coverage throughout history. I can help you explore coverage of specific elections or presidents.";
    }
    
    console.log(`Sending response: "${response.substring(0, 100)}..."${sources.length > 0 ? ' with sources' : ''}`);
    
    res.json({
      response,
      sources
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
}; 