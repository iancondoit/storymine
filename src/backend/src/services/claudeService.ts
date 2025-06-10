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
    
    this.DEFAULT_SYSTEM_PROMPT = `You are Jordi, a specialized documentary story discovery assistant for StoryMine, working with historical Atlanta Constitution newspaper archives from 1920-1961.

MISSION:
You help documentary filmmakers and researchers discover compelling historical narratives from 282,388+ pre-analyzed articles with documentary potential scoring.

CRITICAL ANALYSIS APPROACH:
When provided with articles and entities, you MUST analyze them as a professional documentary researcher:

1. **Evaluate Documentary Potential**: Look for human stories, turning points, conflicts, secrets revealed, triumph/tragedy
2. **Identify Narrative Threads**: Find character arcs, story progressions, dramatic tension
3. **Assess Archival Value**: Note mentions of photographs, documents, witnesses, interviews
4. **Suggest Production Angles**: Recommend documentary treatments, interview strategies, research directions

YOUR ANALYTICAL FRAMEWORK:

**High Documentary Potential (80-100%):**
- Personal transformation stories with clear character arcs
- Previously unknown or secret historical events
- Stories with living witnesses or rich archival materials
- Historical turning points with dramatic tension
- Injustice/triumph narratives with emotional resonance

**Medium Documentary Potential (50-79%):**
- Important historical events with good documentation
- Interesting characters but limited archival material
- Community stories with broader significance
- Business/political stories with human elements

**Lower Documentary Potential (20-49%):**
- Routine news events without unique angles
- Stories lacking visual storytelling possibilities
- Limited character development or dramatic arc

RESPONSE STRUCTURE:
1. **Story Assessment**: Start with the most compelling documentary opportunities
2. **Character Analysis**: Identify key figures and their roles in the narrative
3. **Historical Context**: Explain why this matters for understanding the era
4. **Production Recommendations**: Suggest specific documentary approaches
5. **Research Directions**: Recommend follow-up research and archival exploration

DOCUMENTARY PERSPECTIVE:
- Think like a documentary producer evaluating stories for film potential
- Prioritize human interest over pure historical significance
- Look for visual storytelling opportunities
- Consider modern audience appeal and relevance
- Suggest narrative structures and interview opportunities

When users ask questions, provide evidence-based insights that help them understand both the historical significance and documentary potential of the material.`;

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
   * Format context data for Jordi's analysis
   */
  private formatContextForJordi(context: any): string {
    let formattedContext = '';
    
    // Add database statistics
    if (context.databaseStats) {
      formattedContext += `## STORYMAP INTELLIGENCE DATABASE STATUS:\n`;
      formattedContext += `Total Articles: ${context.databaseStats.articles}\n`;
      formattedContext += `Total Entities: ${context.databaseStats.entities}\n`;
      formattedContext += `Historical Period: ${context.databaseStats.earliest_year}-${context.databaseStats.latest_year}\n`;
      formattedContext += `Search Query: "${context.query}"\n\n`;
    }
    
    // Add articles with enhanced formatting
    if (context.articles && context.articles.length > 0) {
      formattedContext += `## DOCUMENTARY-READY ARTICLES FOUND (${context.articles.length} articles):\n\n`;
      
      context.articles.forEach((article: any, index: number) => {
        const score = article.documentaryScore || article.documentary_potential || 50;
        const year = article.publication_date ? new Date(article.publication_date).getFullYear() : 'Unknown';
        
        formattedContext += `### Article ${index + 1}: ${article.title}\n`;
        formattedContext += `**Year:** ${year} | **Documentary Score:** ${score}/100\n`;
        formattedContext += `**Content Length:** ${article.content_length || (article.content?.length || 0)} characters\n`;
        
        // Include cleaned content summary
        if (article.content_summary) {
          formattedContext += `**Story Summary:** ${article.content_summary}\n`;
        } else if (article.content && article.content.length > 200) {
          // Clean and summarize content on the fly
          const cleanContent = this.cleanContent(article.content);
          const summary = cleanContent.substring(0, 400) + (cleanContent.length > 400 ? '...' : '');
          formattedContext += `**Story Content:** ${summary}\n`;
        }
        
        formattedContext += '\n---\n\n';
      });
    }
    
    // Add entities with better categorization
    if (context.entities && context.entities.length > 0) {
      formattedContext += `## HISTORICAL ENTITIES DISCOVERED (${context.entities.length} entities):\n\n`;
      
      // Group entities by type for better analysis
      const entityGroups = {
        PERSON: context.entities.filter((e: any) => e.entity_type === 'PERSON'),
        ORG: context.entities.filter((e: any) => e.entity_type === 'ORG'),
        GPE: context.entities.filter((e: any) => e.entity_type === 'GPE'),
        OTHER: context.entities.filter((e: any) => !['PERSON', 'ORG', 'GPE'].includes(e.entity_type))
      };
      
      if (entityGroups.PERSON.length > 0) {
        formattedContext += `**Key Historical Figures (${entityGroups.PERSON.length}):** `;
        formattedContext += entityGroups.PERSON.map((e: any) => e.canonical_name).join(', ') + '\n\n';
      }
      
      if (entityGroups.ORG.length > 0) {
        formattedContext += `**Organizations & Institutions (${entityGroups.ORG.length}):** `;
        formattedContext += entityGroups.ORG.map((e: any) => e.canonical_name).join(', ') + '\n\n';
      }
      
      if (entityGroups.GPE.length > 0) {
        formattedContext += `**Places & Locations (${entityGroups.GPE.length}):** `;
        formattedContext += entityGroups.GPE.map((e: any) => e.canonical_name).join(', ') + '\n\n';
      }
      
      if (entityGroups.OTHER.length > 0) {
        formattedContext += `**Other Entities (${entityGroups.OTHER.length}):** `;
        formattedContext += entityGroups.OTHER.map((e: any) => e.canonical_name).join(', ') + '\n\n';
      }
    }
    
    // Add timeline if available
    if (context.timeline && context.timeline.length > 0) {
      formattedContext += '## HISTORICAL TIMELINE:\n\n';
      
      context.timeline.forEach((entry: any) => {
        formattedContext += `### ${entry.date || 'Unknown date'}: ${entry.title || 'Event'}\n`;
        formattedContext += `${entry.content || 'No details available'}\n\n`;
      });
    }
    
    // Add analysis guidance
    formattedContext += `## ANALYSIS INSTRUCTIONS:\n`;
    formattedContext += `Please analyze these ${context.articles?.length || 0} articles for documentary potential. `;
    formattedContext += `Focus on identifying compelling human stories, dramatic narrative arcs, and production opportunities. `;
    formattedContext += `Use the documentary scoring as a starting point, but provide your own assessment of which stories `;
    formattedContext += `would make the most engaging documentaries for modern audiences.\n\n`;
    
    return formattedContext;
  }
  
  /**
   * Clean content for better Claude analysis
   */
  private cleanContent(content: string): string {
    if (!content) return '';
    
    return content
      // Remove common OCR artifacts
      .replace(/[€£¢]/g, 'e')
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      // Remove page markers and headers
      .replace(/PAGE \w+/gi, '')
      .replace(/THE CONSTITUTION, ATLANTA, GA[.,]*/gi, '')
      .replace(/THE SOUTH'S STANDARD NEWSPAPER/gi, '')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
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