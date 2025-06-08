/**
 * Claude AI Service
 * Integration with Anthropic's Claude 3.7 Sonnet API for Jordi assistant
 */
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import axios from 'axios';

// Enhanced message interface
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

// Conversation history interface
interface ConversationHistory {
  id: string;
  messages: Message[];
  lastUpdated: Date;
}

// Context data interface
interface ContextData {
  query?: string;
  articles?: any[];
  entities?: any[];
  timeline?: any[];
  isEntityQuery?: boolean;
  [key: string]: any;
}

/**
 * Interface for Claude response
 */
interface ClaudeResponse {
  text: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Interface for conversation history entry
 */
interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Interface for dataset information
 */
interface DatasetInfo {
  articleCount?: number;
  entityCount?: number;
  lastUpdated?: string;
}

/**
 * Claude AI service for the Jordi assistant
 */
class ClaudeService {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private conversationStore: Map<string, ConversationEntry[]>;
  private maxHistoryLength: number;
  private DEFAULT_SYSTEM_PROMPT: string;
  private DATASET_INFO: string;
  private datasetInfo: DatasetInfo;

  constructor() {
    // Initialize Claude client with proper configuration
    this.client = new Anthropic({
      apiKey: config.CLAUDE_API_KEY,
      // Add default headers if needed
    });
    
    // Set default parameters
    this.model = 'claude-3-haiku-20240307';
    this.maxTokens = 4000;
    this.temperature = 0.7;
    
    // Initialize conversation store
    this.conversationStore = new Map();
    this.maxHistoryLength = 10; // Maximum number of messages to retain in history
    
    // Initialize dataset info - will be updated with real data
    this.datasetInfo = {
      articleCount: 0,
      entityCount: 0
    };
    
    // Update dataset info from database on initialization
    this.updateDatasetInfo();
    
    this.DEFAULT_SYSTEM_PROMPT = `You are Jordi, a specialized historical AI assistant for StoryMine, a documentary story discovery platform.

MISSION:
You are an archival intelligence specialist helping users discover compelling historical stories with documentary potential from the StoryMap Intelligence database.

CRITICAL INSTRUCTION: When provided with specific articles and entities in the context, you MUST reference and use them directly. Do not say "likely contains" or make assumptions - use the actual data provided.

CURRENT DATABASE ACCESS:
- Full access to 282,388+ historical articles (1920-1961) with comprehensive search capabilities
- 1,061,535+ historical entities with relationship networks
- 1,219,127+ documented relationships between entities
- Advanced documentary potential scoring system

YOUR RESPONSE APPROACH:
1. ALWAYS check the context for "RELEVANT HISTORICAL ARTICLES FOUND" and "RELEVANT HISTORICAL ENTITIES"
2. When articles are provided, reference them specifically: "I found X articles including..."
3. Quote or summarize content from the specific articles provided
4. Use documentary scores to highlight the most promising stories
5. Never say "likely contains" - say "the search found" or "the articles show"

YOUR CAPABILITIES:
- Search and analyze historical articles with enhanced keyword and conceptual matching
- Identify narrative threads through entity relationship networks
- Map connections between historical figures, organizations, and events
- Provide historical context using both article content and entity data
- Assess stories for documentary potential using sophisticated scoring algorithms
- Generate story leads and research directions from primary sources

YOUR CHARACTER:
- Knowledgeable historical researcher with documentary expertise
- Warm and engaging, but academically rigorous
- Passionate about uncovering stories through comprehensive database analysis
- Always reference specific findings from the database
- Highlight the documentary potential of historical narratives

RESPONSE STYLE:
- Start responses with specific findings: "I found 15 articles about..." or "The search revealed..."
- Use specific article titles, dates, and content when provided
- Highlight documentary scores and explain their significance
- Suggest documentary angles based on actual article content
- Be conversational but evidence-based
- Provide concrete citations from the StoryMap Intelligence database

When users ask questions, use the specific articles and entities provided in the context to give evidence-based responses about historical events and documentary potential.`;

    this.DATASET_INFO = this.generateDatasetInfo();
  }

  /**
   * Update dataset info from database
   */
  private async updateDatasetInfo(): Promise<void> {
    try {
      const { query } = await import('../database/connection');
      
      // Try Intelligence tables first
      try {
        const articlesResult = await query('SELECT COUNT(*) as count FROM intelligence_articles');
        const entitiesResult = await query('SELECT COUNT(*) as count FROM intelligence_entities');
        
        this.datasetInfo.articleCount = parseInt(articlesResult.rows[0]?.count || '0');
        this.datasetInfo.entityCount = parseInt(entitiesResult.rows[0]?.count || '0');
        
        if (this.datasetInfo.articleCount && this.datasetInfo.articleCount > 0) {
          console.log(`Updated Jordi dataset info: ${this.datasetInfo.articleCount} Intelligence articles, ${this.datasetInfo.entityCount} entities`);
          return;
        }
      } catch (error) {
        // Fall back to legacy tables
        console.log('Intelligence tables not available, checking legacy tables');
      }
      
      // Try legacy tables
      try {
        const articlesResult = await query('SELECT COUNT(*) as count FROM articles');
        const entitiesResult = await query('SELECT COUNT(*) as count FROM entities');
        
        this.datasetInfo.articleCount = parseInt(articlesResult.rows[0]?.count || '0');
        this.datasetInfo.entityCount = parseInt(entitiesResult.rows[0]?.count || '0');
        
        if (this.datasetInfo.articleCount && this.datasetInfo.articleCount > 0) {
          console.log(`Updated Jordi dataset info: ${this.datasetInfo.articleCount} legacy articles, ${this.datasetInfo.entityCount} entities`);
        }
      } catch (error) {
        console.log('No database tables available for dataset info');
      }
    } catch (error) {
      console.warn('Could not update dataset info:', error);
    }
  }

  /**
   * Generate current dataset info string
   */
  private generateDatasetInfo(): string {
    if (this.datasetInfo.articleCount && this.datasetInfo.articleCount > 0) {
      return `DATASET INFORMATION:
- The archive contains ${this.datasetInfo.articleCount} articles and ${this.datasetInfo.entityCount || 0} entities
- Historical newspaper archives with entity relationships and narrative analysis
- StoryMap Intelligence integration for documentary story discovery`;
    } else {
      return `DATASET STATUS:
- StoryMine is ready to receive StoryMap Intelligence data
- Once imported, Jordi will have access to enhanced historical narratives
- Current capabilities include general historical knowledge and research guidance`;
    }
  }

  /**
   * Format context for Jordi
   */
  private formatContextForJordi(context: any): string {
    let formattedContext = '';
    
    // Add database stats if available
    if (context.databaseStats) {
      const stats = context.databaseStats;
      formattedContext += `## STORYMAP INTELLIGENCE DATABASE STATUS:\n`;
      formattedContext += `- Articles: ${stats.articles} (${stats.earliest_year}-${stats.latest_year})\n`;
      formattedContext += `- Entities: ${stats.entities}\n`;
      formattedContext += `- Relationships: ${stats.relationships}\n\n`;
    }
    
    // Add articles if available
    if (context.articles && context.articles.length > 0) {
      formattedContext += '## RELEVANT HISTORICAL ARTICLES FOUND:\n\n';
      
      context.articles.forEach((article: any, index: number) => {
        formattedContext += `### ARTICLE ${index + 1}: ${article.title || 'Untitled'}\n`;
        formattedContext += `Date: ${article.publication_date || 'Unknown date'}\n`;
        formattedContext += `Source: ${article.publication_name || 'Unknown source'}\n`;
        formattedContext += `Content: ${article.content ? article.content.substring(0, 500) + '...' : 'No content available'}\n`;
        if (article.documentaryScore) {
          formattedContext += `Documentary Potential Score: ${article.documentaryScore}/10\n`;
        }
        formattedContext += '\n';
      });
    }
    
    // Add entities if available
    if (context.entities && context.entities.length > 0) {
      formattedContext += '## RELEVANT HISTORICAL ENTITIES:\n\n';
      
      context.entities.forEach((entity: any, index: number) => {
        formattedContext += `### ENTITY ${index + 1}: ${entity.canonical_name || 'Unnamed'}\n`;
        formattedContext += `Type: ${entity.entity_type || 'Unknown type'}\n`;
        
        // Add entity creation date (when first mentioned)
        if (entity.created_at) {
          const dateStr = new Date(entity.created_at).toLocaleDateString();
          formattedContext += `First recorded in database: ${dateStr}\n`;
        }
        
        // Add significance if this was a person vs organization vs location
        if (entity.entity_type === 'PERSON') {
          formattedContext += `Role: Historical figure with documented presence in archives\n`;
        } else if (entity.entity_type === 'ORG') {
          formattedContext += `Role: Organization with historical significance\n`;
        } else if (entity.entity_type === 'GPE') {
          formattedContext += `Role: Geographic/political entity with historical importance\n`;
        }
        
        formattedContext += '\n';
      });
    }
    
    // Add timeline if available
    if (context.timeline && context.timeline.length > 0) {
      formattedContext += '## HISTORICAL TIMELINE:\n\n';
      
      context.timeline.forEach((entry: any) => {
        formattedContext += `### ${entry.date || 'Unknown date'}: ${entry.title || 'Event'}\n`;
        formattedContext += `${entry.content || 'No details available'}\n\n`;
      });
    }
    
    // Add query analysis results
    if (context.queryType) {
      formattedContext += `## SEARCH RESULTS SUMMARY:\n`;
      formattedContext += `Query type: ${context.queryType}\n`;
      formattedContext += `Articles found: ${context.articles?.length || 0}\n`;
      formattedContext += `Entities found: ${context.entities?.length || 0}\n`;
      if (context.articles?.length > 0) {
        formattedContext += `Search status: Full access to StoryMap Intelligence database operational\n`;
      }
      formattedContext += '\n';
    }
    
    return formattedContext;
  }
  
  /**
   * Format the user query with context
   */
  public formatUserQuery(query: string, context: string): string {
    if (context.trim() === '') {
      return query;
    }
    
    return `${query}

CONTEXT INFORMATION:
${context}

Please respond to my query based on the provided context information.`;
  }
  
  /**
   * Get conversation history - now public for API routes
   */
  public getConversationHistory(conversationId: string): ConversationEntry[] {
    return this.conversationStore.get(conversationId) || [];
  }
  
  /**
   * Clear conversation history - now public for API routes
   */
  public clearConversationHistory(conversationId: string): void {
    this.conversationStore.delete(conversationId);
  }
  
  /**
   * Save a conversation entry
   */
  public saveConversationEntry(conversationId: string, role: 'user' | 'assistant', content: string): void {
    // Get existing conversation or create new one
    const conversation = this.conversationStore.get(conversationId) || [];
    
    // Add new entry
    conversation.push({
      role,
      content
    });
    
    // Trim history if needed
    if (conversation.length > this.maxHistoryLength) {
      conversation.shift(); // Remove oldest message
    }
    
    // Save updated conversation
    this.conversationStore.set(conversationId, conversation);
  }
  
  /**
   * Call Claude API
   */
  public async callClaude(messages: any[]): Promise<ClaudeResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        messages: messages,
        system: this.DEFAULT_SYSTEM_PROMPT
      });
      
      // Extract text from response content safely
      let responseText = '';
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (firstContent.type === 'text' && 'text' in firstContent) {
          responseText = firstContent.text;
        }
      }
      
      return {
        text: responseText,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        }
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to call Claude API: ${error}`);
    }
  }
  
  /**
   * Get a response from Jordi
   */
  async getJordiResponse(query: string, context: any, conversationId: string = 'default'): Promise<ClaudeResponse> {
    try {
      // Get conversation history
      const conversationHistory = this.getConversationHistory(conversationId);
      
      // Format the context for Jordi
      const formattedContext = this.formatContextForJordi(context);
      
      // Check if a custom system instruction is provided
      let systemPrompt = this.DEFAULT_SYSTEM_PROMPT;
      if (context.systemInstruction) {
        systemPrompt = context.systemInstruction + "\n\n" + this.DATASET_INFO;
      } else {
        systemPrompt = this.DEFAULT_SYSTEM_PROMPT + "\n\n" + this.DATASET_INFO;
      }
      
      // Create the chat message array (DO NOT include system message here)
      const messages: any[] = [];
      
      // Add conversation history
      if (conversationHistory.length > 0) {
        // Only add the last few messages to save on tokens
        const recentHistory = conversationHistory.slice(-4);
        recentHistory.forEach((entry: ConversationEntry) => {
          messages.push({ role: entry.role, content: entry.content });
        });
      }
      
      // Add current query with context
      messages.push({
        role: 'user',
        content: this.formatUserQuery(query, formattedContext)
      });
      
      // Call Claude with system prompt passed separately
      console.log(`🤖 Calling Claude with ${messages.length} messages and system prompt`);
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,  // System prompt passed separately
        messages: messages     // Only user/assistant messages
      });
      
      // Extract text from response content safely
      let responseText = '';
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (firstContent.type === 'text' && 'text' in firstContent) {
          responseText = firstContent.text;
        }
      }
      
      const claudeResponse = {
        text: responseText,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        }
      };
      
      console.log(`✅ Claude responded with ${claudeResponse.usage.output_tokens} tokens`);
      
      // Save the conversation
      this.saveConversationEntry(conversationId, 'user', query);
      this.saveConversationEntry(conversationId, 'assistant', responseText);
      
      return claudeResponse;
    } catch (error) {
      console.error('❌ Error getting Jordi response:', error);
      return { 
        text: 'I apologize, but I encountered an error processing your request. Please try again.',
        usage: { input_tokens: 0, output_tokens: 0 }
      };
    }
  }
}

export const claudeService = new ClaudeService(); 