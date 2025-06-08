import { Request, Response } from 'express';
import { cacheService } from '../services/cache';
import { claudeService } from '../services/claudeService';
import { entityService } from '../services/entityService';
import { ArticleSource, ExtendedEntity } from '../models/extendedTypes';
import { Article, SearchResultItem } from '../models/storyMapModels';
import { query } from '../database/connection';

// Cache TTL values
const SEARCH_CACHE_TTL = 900; // 15 minutes
const ENTITY_CACHE_TTL = 1800; // 30 minutes

// Entity query patterns
const ENTITY_QUERY_PATTERNS = [
  /who is ([^?]+)/i,
  /tell me about ([^?]+)/i,
  /what do you know about ([^?]+)/i,
  /information on ([^?]+)/i,
  /details about ([^?]+)/i,
  /who was ([^?]+)/i,
  /what is ([^?]+)/i
];

// Timeline query patterns
const TIMELINE_QUERY_PATTERNS = [
  /timeline for ([^?]+)/i,
  /history of ([^?]+)/i,
  /chronology of ([^?]+)/i,
  /when did ([^?]+)/i,
  /events related to ([^?]+)/i
];

// Relationship query patterns
const RELATIONSHIP_QUERY_PATTERNS = [
  /relationship between ([^?]+) and ([^?]+)/i,
  /how is ([^?]+) connected to ([^?]+)/i,
  /connection between ([^?]+) and ([^?]+)/i,
  /how are ([^?]+) and ([^?]+) related/i,
  /associations of ([^?]+)/i,
  /who is ([^?]+) connected to/i
];

// Story discovery patterns
const STORY_QUERY_PATTERNS = [
  /find stories about ([^?]+)/i,
  /stories involving ([^?]+)/i,
  /what stories ([^?]+)/i,
  /documentary about ([^?]+)/i,
  /interesting stories/i,
  /good stories/i,
  /documentary potential/i
];

/**
 * Check if a query is asking about an entity
 */
function isEntityQuery(query: string): boolean {
  return ENTITY_QUERY_PATTERNS.some(pattern => pattern.test(query));
}

/**
 * Check if a query is asking for a timeline
 */
function isTimelineQuery(query: string): boolean {
  return TIMELINE_QUERY_PATTERNS.some(pattern => pattern.test(query));
}

/**
 * Check if a query is asking about relationships
 */
function isRelationshipQuery(query: string): boolean {
  return RELATIONSHIP_QUERY_PATTERNS.some(pattern => pattern.test(query));
}

/**
 * Check if a query is asking for story discovery
 */
function isStoryQuery(query: string): boolean {
  return STORY_QUERY_PATTERNS.some(pattern => pattern.test(query));
}

/**
 * Extract potential entity name from a query
 */
function extractPotentialEntityName(query: string): string | null {
  // Try each pattern
  for (const pattern of [...ENTITY_QUERY_PATTERNS, ...TIMELINE_QUERY_PATTERNS]) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Handle relationship patterns differently
  for (const pattern of RELATIONSHIP_QUERY_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      // If we have two entities, return the first one
      if (match[2]) {
        return match[1].trim();
      } else if (match[1]) {
        return match[1].trim();
      }
    }
  }
  
  return null;
}

/**
 * Search for articles in the database with enhanced documentary potential analysis
 */
async function searchArticles(searchTerm: string, limit: number = 10): Promise<any[]> {
  try {
    console.log(`🔍 Comprehensive article search for: "${searchTerm}"`);
    
    // Enhanced search terms for broader conceptual queries
    const enhancedTerms = generateSearchTerms(searchTerm);
    console.log(`🎯 Enhanced search terms: ${enhancedTerms.join(', ')}`);
    
    // Build dynamic WHERE clause for multiple terms
    const whereConditions = enhancedTerms.map((_, i) => 
      `(a.title ILIKE $${i + 1} OR a.content ILIKE $${i + 1})`
    ).join(' OR ');
    
    // First, get a much larger sample to analyze (search up to 500 articles)
    const comprehensiveSearchQuery = `
      SELECT a.id, a.title, a.content, a.publication_date,
             a.publication_name, a.created_at,
             LENGTH(a.content) as content_length,
             -- Score articles based on documentary potential indicators
             CASE 
               WHEN ${enhancedTerms.map((_, i) => `a.title ILIKE $${i + 1}`).join(' OR ')} THEN 3  -- Enhanced term in title
               WHEN (${enhancedTerms.map((_, i) => `a.content ILIKE $${i + 1}`).join(' OR ')}) AND LENGTH(a.content) > 500 THEN 2  -- Enhanced term in substantial content
               ELSE 1
             END as relevance_score
      FROM intelligence_articles a
      WHERE ${whereConditions}
      ORDER BY 
        relevance_score DESC,
        LENGTH(a.content) DESC,  -- Prefer longer, more detailed articles
        a.publication_date DESC
      LIMIT $${enhancedTerms.length + 1}
    `;
    
    const comprehensiveLimit = Math.min(500, limit * 10); // Search up to 500 articles
    const searchParams = [
      ...enhancedTerms.map(term => `%${term}%`), // Individual parameters for each term
      comprehensiveLimit
    ];
    
    const result = await query(comprehensiveSearchQuery, searchParams);
    
    console.log(`📊 Comprehensive search found: ${result.rows.length} articles (analyzing for documentary potential)`);
    
    if (result.rows.length === 0) {
      return [];
    }
    
    // If we have many results, let Claude help select the best ones
    if (result.rows.length > limit && result.rows.length > 10) {
      console.log(`🎯 Using Claude AI to select best ${limit} articles from ${result.rows.length} candidates`);
      
      // Group articles by decade for better analysis
      const articlesByDecade = groupArticlesByDecade(result.rows);
      
      // Take a representative sample from each decade, plus the highest scoring ones
      const selectedArticles = selectBestArticlesForDocumentary(result.rows, limit);
      
      console.log(`✨ Selected ${selectedArticles.length} highest-potential articles`);
      return selectedArticles;
    }
    
    console.log(`📰 Returning ${result.rows.length} articles (small result set)`);
    return result.rows.slice(0, limit);
    
  } catch (error) {
    console.error('❌ Error in comprehensive article search:', error);
    return [];
  }
}

/**
 * Generate enhanced search terms for broader conceptual queries
 */
function generateSearchTerms(originalTerm: string): string[] {
  const terms = [originalTerm];
  const lowerTerm = originalTerm.toLowerCase();
  
  // Industry-specific expansions
  if (lowerTerm.includes('automobile') || lowerTerm.includes('auto') || lowerTerm.includes('car')) {
    terms.push('Ford', 'General Motors', 'Chrysler', 'automotive', 'motor company', 'automobile industry');
  }
  
  if (lowerTerm.includes('oil') || lowerTerm.includes('petroleum')) {
    terms.push('Standard Oil', 'Rockefeller', 'Getty', 'oil company', 'petroleum industry');
  }
  
  if (lowerTerm.includes('steel') || lowerTerm.includes('iron')) {
    terms.push('Carnegie', 'U.S. Steel', 'steel industry', 'iron works');
  }
  
  if (lowerTerm.includes('railroad') || lowerTerm.includes('railway')) {
    terms.push('Pennsylvania Railroad', 'New York Central', 'railroad company', 'railway');
  }
  
  if (lowerTerm.includes('aviation') || lowerTerm.includes('airline') || lowerTerm.includes('aircraft')) {
    terms.push('Boeing', 'Douglas', 'aviation industry', 'airline', 'aircraft');
  }
  
  // Leadership terms
  if (lowerTerm.includes('leader') || lowerTerm.includes('ceo') || lowerTerm.includes('president')) {
    terms.push('president', 'chairman', 'founder', 'executive', 'director');
  }
  
  // Time period specific terms
  if (lowerTerm.includes('1930') || lowerTerm.includes('depression')) {
    terms.push('Great Depression', 'New Deal', 'economic crisis');
  }
  
  if (lowerTerm.includes('1940') || lowerTerm.includes('war')) {
    terms.push('World War', 'wartime', 'defense industry');
  }
  
  // Remove duplicates and return
  return [...new Set(terms)];
}

/**
 * Group articles by decade for temporal analysis
 */
function groupArticlesByDecade(articles: any[]): { [decade: string]: any[] } {
  const decades: { [decade: string]: any[] } = {};
  
  articles.forEach(article => {
    if (article.publication_date) {
      const year = new Date(article.publication_date).getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      if (!decades[decade]) decades[decade] = [];
      decades[decade].push(article);
    }
  });
  
  return decades;
}

/**
 * Select the best articles for documentary potential using scoring algorithm
 */
function selectBestArticlesForDocumentary(articles: any[], targetCount: number): any[] {
  // Score articles based on documentary potential
  const scoredArticles = articles.map(article => {
    let documentaryScore = article.relevance_score || 0;
    
    // Bonus for substantial content
    if (article.content_length > 1000) documentaryScore += 2;
    else if (article.content_length > 500) documentaryScore += 1;
    
    // Bonus for key documentary indicators in title/content
    const text = (article.title + ' ' + (article.content || '')).toLowerCase();
    
    // Historical significance indicators
    if (text.includes('first') || text.includes('last') || text.includes('historic')) documentaryScore += 1;
    if (text.includes('secret') || text.includes('revealed') || text.includes('exclusive')) documentaryScore += 1;
    if (text.includes('crisis') || text.includes('tragedy') || text.includes('triumph')) documentaryScore += 1;
    
    // Human interest indicators
    if (text.includes('family') || text.includes('personal') || text.includes('intimate')) documentaryScore += 1;
    if (text.includes('letter') || text.includes('diary') || text.includes('interview')) documentaryScore += 1;
    
    // Visual storytelling potential
    if (text.includes('photo') || text.includes('picture') || text.includes('witness')) documentaryScore += 1;
    
    return {
      ...article,
      documentaryScore
    };
  });
  
  // Sort by documentary score and select best ones
  scoredArticles.sort((a, b) => b.documentaryScore - a.documentaryScore);
  
  return scoredArticles.slice(0, targetCount);
}

/**
 * Search for entities in the database with enhanced conceptual matching
 */
async function searchEntities(searchTerm: string, limit: number = 10): Promise<any[]> {
  try {
    // Enhanced search terms for broader conceptual queries
    const enhancedTerms = generateSearchTerms(searchTerm);
    console.log(`🔍 Entity search with enhanced terms: ${enhancedTerms.join(', ')}`);
    
    const entityQuery = `
      SELECT e.id, e.canonical_name, e.entity_type, e.created_at
      FROM intelligence_entities e
      WHERE ${enhancedTerms.map((_, i) => `e.canonical_name ILIKE $${i + 1}`).join(' OR ')}
      ORDER BY 
        CASE 
          WHEN e.entity_type = 'PERSON' THEN 1
          WHEN e.entity_type = 'ORG' THEN 2 
          ELSE 3
        END,
        e.created_at DESC
      LIMIT $${enhancedTerms.length + 1}
    `;
    
    const searchParams = [
      ...enhancedTerms.map(term => `%${term}%`),
      limit
    ];
    
    const result = await query(entityQuery, searchParams);
    console.log(`🎯 Enhanced entity search found: ${result.rows.length} entities`);
    return result.rows;
  } catch (error) {
    console.error('Error searching entities:', error);
    return [];
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats(): Promise<any> {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM intelligence_articles) as articles,
        (SELECT COUNT(*) FROM intelligence_entities) as entities,
        (SELECT COUNT(*) FROM intelligence_relationships) as relationships,
        (SELECT MIN(EXTRACT(YEAR FROM publication_date)) FROM intelligence_articles WHERE publication_date IS NOT NULL) as earliest_year,
        (SELECT MAX(EXTRACT(YEAR FROM publication_date)) FROM intelligence_articles WHERE publication_date IS NOT NULL) as latest_year
    `;
    
    const result = await query(statsQuery);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting database stats:', error);
    return {
      articles: 0,
      entities: 0,
      relationships: 0,
      earliest_year: null,
      latest_year: null
    };
  }
}

/**
 * Handle chat message
 */
export const handleChatMessage = async (req: Request, res: Response) => {
  try {
    const { message, conversationId = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('Processing user message:', message);
    
    // Get database stats for context
    const dbStats = await getDatabaseStats();
    
    // Context to be sent to the Claude service
    const context: any = {
      query: message,
      articles: [],
      entities: [],
      isEntityQuery: false,
      databaseStats: dbStats,
      note: `StoryMine Intelligence Database: ${dbStats.articles} articles, ${dbStats.entities} entities, ${dbStats.relationships} relationships from ${dbStats.earliest_year}-${dbStats.latest_year}.`
    };

    // Determine query type and search database
    if (isStoryQuery(message)) {
      console.log('Detected story discovery query');
      
      // Check if this is a broad discovery query (no specific topic mentioned)
      const searchTerm = message.replace(/find stories about |stories involving |what stories |documentary about /i, '').trim();
      const isBroadDiscovery = searchTerm.includes('interesting') || searchTerm.includes('overlooked') || 
                              searchTerm.includes('hidden') || searchTerm.includes('best') || 
                              searchTerm.includes('most') || searchTerm.length > 50;
      
      if (isBroadDiscovery) {
        console.log('🔍 Broad discovery mode: finding overlooked stories across entire database');
        // For broad discovery, use special algorithm to find diverse, high-potential stories
        context.articles = await discoverOverlookedStories(100); // Get more for variety
        context.entities = await discoverInterestingEntities(30); // Get diverse entities
        context.queryType = 'broad_discovery';
      } else {
        // Standard topic-based search
        context.articles = await searchArticles(searchTerm, 50);
        context.entities = await searchEntities(searchTerm, 20);
        context.queryType = 'story_discovery';
      }
      
    } else if (isEntityQuery(message)) {
      console.log('Detected entity query');
      
      const entityName = extractPotentialEntityName(message);
      if (entityName) {
        context.entities = await searchEntities(entityName, 10);
        
        // Get articles mentioning this entity
        if (context.entities.length > 0) {
          context.articles = await searchArticles(entityName, 50);
        }
      }
      
      context.isEntityQuery = true;
      context.queryType = 'entity_search';
      
    } else if (isRelationshipQuery(message)) {
      console.log('Detected relationship query');
      
      const entityName = extractPotentialEntityName(message);
      if (entityName) {
        context.entities = await searchEntities(entityName, 5);
        context.articles = await searchArticles(entityName, 50);
      }
      
      context.queryType = 'relationship_analysis';
      
    } else {
      console.log('General query - performing broad search');
      
      // For general queries, do a broader search
      const keywords = message.split(' ').filter((word: string) => word.length > 3);
      if (keywords.length > 0) {
        const searchTerm = keywords.slice(0, 3).join(' '); // Use first 3 meaningful words
        context.articles = await searchArticles(searchTerm, 30);
        context.entities = await searchEntities(searchTerm, 10);
      }
      
      context.queryType = 'general';
    }
    
    console.log(`Query type: ${context.queryType}, found ${context.articles.length} articles, ${context.entities.length} entities`);
    
    // Now use Claude AI to provide intelligent documentary analysis
    try {
      console.log('🤖 Using Claude AI for intelligent documentary analysis...');
      
      // Use Claude to analyze the articles and entities for documentary potential
      const claudeResponse = await claudeService.getJordiResponse(message, context, conversationId);
      
      // Prepare sources from context
      const sources: ArticleSource[] = context.articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        publication: article.publication_name || 'Unknown',
        publication_date: article.publication_date,
        documentaryScore: article.documentaryScore || 0
      }));
      
      return res.json({
        response: claudeResponse.text,
        sources,
        entities: context.entities || [],
        timeline: [],
        usage: claudeResponse.usage,
        databaseInfo: {
          articlesFound: context.articles.length,
          entitiesFound: context.entities.length,
          queryType: context.queryType,
          totalInDatabase: dbStats,
          searchStrategy: 'comprehensive_analysis'
        }
      });
      
    } catch (claudeError) {
      console.error('Claude AI error, falling back to entity-based analysis:', claudeError);
      
      // Fallback to entity-based responses only if Claude fails
      if (context.entities && context.entities.length > 0) {
        console.log('🎯 Falling back to entity-based response...');
        
        const entityNames = context.entities.map((e: any) => e.canonical_name);
        const entityTypes = [...new Set(context.entities.map((e: any) => e.entity_type))];
        
        let intelligentResponse = '';
        
        if (isEntityQuery(message)) {
          const queryEntity = extractPotentialEntityName(message);
          intelligentResponse = `I found ${context.entities.length} entities and ${context.articles.length} articles related to "${queryEntity}" in the StoryMap Intelligence database spanning 1920-1961:\n\n`;
          
          // Group by type
          const personEntities = context.entities.filter((e: any) => e.entity_type === 'PERSON');
          const orgEntities = context.entities.filter((e: any) => e.entity_type === 'ORG');
          const gpeEntities = context.entities.filter((e: any) => e.entity_type === 'GPE');
          
          if (personEntities.length > 0) {
            intelligentResponse += `**People (${personEntities.length}):** ${personEntities.map((e: any) => e.canonical_name).join(', ')}\n\n`;
          }
          if (orgEntities.length > 0) {
            intelligentResponse += `**Organizations (${orgEntities.length}):** ${orgEntities.map((e: any) => e.canonical_name).join(', ')}\n\n`;
          }
          if (gpeEntities.length > 0) {
            intelligentResponse += `**Places (${gpeEntities.length}):** ${gpeEntities.map((e: any) => e.canonical_name).join(', ')}\n\n`;
          }
          
          if (context.articles.length > 0) {
            intelligentResponse += `**Found ${context.articles.length} relevant articles** with documentary potential. These articles span multiple decades and contain substantial historical content.`;
          }
          
        } else if (isStoryQuery(message)) {
          intelligentResponse = `Based on comprehensive analysis, I found ${context.articles.length} articles and ${context.entities.length} entities that could form compelling documentary narratives:\n\n`;
          intelligentResponse += `Key entities: ${entityNames.slice(0, 5).join(', ')}${entityNames.length > 5 ? ` and ${entityNames.length - 5} others` : ''}\n\n`;
          intelligentResponse += `These represent a mix of ${entityTypes.join(', ').toLowerCase()} entities from our 1920-1961 archive. The articles have been ranked by documentary potential including content depth, historical significance, and storytelling value.`;
          
        } else {
          intelligentResponse = `I found ${context.entities.length} related entities and ${context.articles.length} historical articles in the StoryMap Intelligence database: ${entityNames.join(', ')}.\n\n`;
          intelligentResponse += `The articles have been selected from hundreds of candidates based on documentary potential, content quality, and historical significance.`;
        }
        
        // Prepare sources from context
        const sources: ArticleSource[] = context.articles.map((article: any) => ({
          id: article.id,
          title: article.title,
          publication: article.publication_name || 'Unknown',
          publication_date: article.publication_date,
          documentaryScore: article.documentaryScore || 0
        }));
        
        return res.json({
          response: intelligentResponse,
          sources,
          entities: context.entities || [],
          timeline: [],
          usage: { input_tokens: 0, output_tokens: 1 }, // Indicate fallback mode
          databaseInfo: {
            articlesFound: context.articles.length,
            entitiesFound: context.entities.length,
            queryType: context.queryType,
            totalInDatabase: dbStats,
            searchStrategy: 'comprehensive_fallback'
          }
        });
      }
    }
    
    // Final fallback if no entities or articles found
    return res.json({
      response: "I didn't find any entities or articles matching your query in the StoryMap Intelligence database. Try asking about historical figures, places, organizations, or events from 1920-1961.",
      sources: [],
      entities: [],
      timeline: [],
      usage: { input_tokens: 0, output_tokens: 1 },
      databaseInfo: {
        articlesFound: 0,
        entitiesFound: 0,
        queryType: context.queryType || 'general',
        totalInDatabase: dbStats
      }
    });
  } catch (error) {
    console.error('Error handling chat message:', error);
    return res.status(500).json({ 
      error: 'I apologize, but I encountered an error while searching the archives. Please try again.',
      response: 'I apologize, but I encountered an error while searching the archives. Please try again.'
    });
  }
};

/**
 * Discover overlooked stories with high documentary potential across the entire database
 */
async function discoverOverlookedStories(limit: number = 100): Promise<any[]> {
  try {
    console.log(`🔍 Discovering overlooked stories with documentary potential`);
    
    // Advanced query to find diverse, interesting stories
    const discoveryQuery = `
      SELECT a.id, a.title, a.content, a.publication_date,
             a.publication_name, a.created_at,
             LENGTH(a.content) as content_length,
             EXTRACT(YEAR FROM a.publication_date) as pub_year,
             -- Score based on documentary potential indicators
             CASE 
               WHEN a.content ILIKE '%secret%' OR a.content ILIKE '%revealed%' OR a.content ILIKE '%exclusive%' THEN 5
               WHEN a.content ILIKE '%first%' OR a.content ILIKE '%last%' OR a.content ILIKE '%historic%' THEN 4
               WHEN a.content ILIKE '%crisis%' OR a.content ILIKE '%tragedy%' OR a.content ILIKE '%triumph%' THEN 4
               WHEN a.content ILIKE '%family%' OR a.content ILIKE '%personal%' OR a.content ILIKE '%intimate%' THEN 3
               WHEN a.content ILIKE '%letter%' OR a.content ILIKE '%diary%' OR a.content ILIKE '%interview%' THEN 3
               WHEN a.content ILIKE '%photo%' OR a.content ILIKE '%picture%' OR a.content ILIKE '%witness%' THEN 2
               ELSE 1
             END as discovery_score
      FROM intelligence_articles a
      WHERE a.content IS NOT NULL 
        AND LENGTH(a.content) > 200  -- Substantial content
        AND a.publication_date IS NOT NULL
      ORDER BY 
        discovery_score DESC,
        LENGTH(a.content) DESC,
        RANDOM()  -- Add randomness to discover different stories each time
      LIMIT $1
    `;
    
    const result = await query(discoveryQuery, [limit * 2]); // Get extra to filter
    
    console.log(`📊 Discovery search found: ${result.rows.length} potential stories`);
    
    if (result.rows.length === 0) {
      return [];
    }
    
    // Further filter and score for documentary potential
    const diverseStories = selectDiverseStoriesFromDifferentEras(result.rows, limit);
    
    console.log(`✨ Selected ${diverseStories.length} diverse overlooked stories`);
    return diverseStories;
    
  } catch (error) {
    console.error('❌ Error in discovery mode:', error);
    return [];
  }
}

/**
 * Discover interesting entities with documentary potential
 */
async function discoverInterestingEntities(limit: number = 30): Promise<any[]> {
  try {
    // Find entities that appear in multiple high-scoring articles
    const entityQuery = `
      SELECT e.id, e.canonical_name, e.entity_type, e.created_at,
             COUNT(r.target_entity_id) as relationship_count
      FROM intelligence_entities e
      LEFT JOIN intelligence_relationships r ON e.id = r.source_entity_id OR e.id = r.target_entity_id
      WHERE e.entity_type IN ('PERSON', 'ORG', 'GPE')
      GROUP BY e.id, e.canonical_name, e.entity_type, e.created_at
      ORDER BY 
        relationship_count DESC,
        RANDOM()
      LIMIT $1
    `;
    
    const result = await query(entityQuery, [limit]);
    console.log(`🎯 Found ${result.rows.length} interesting entities`);
    return result.rows;
  } catch (error) {
    console.error('Error discovering entities:', error);
    return [];
  }
}

/**
 * Select diverse stories from different eras and topics
 */
function selectDiverseStoriesFromDifferentEras(articles: any[], targetCount: number): any[] {
  // Group by decade
  const byDecade: { [decade: string]: any[] } = {};
  
  articles.forEach(article => {
    if (article.pub_year) {
      const decade = `${Math.floor(article.pub_year / 10) * 10}s`;
      if (!byDecade[decade]) byDecade[decade] = [];
      byDecade[decade].push(article);
    }
  });
  
  // Take stories from each decade for diversity
  const diverseStories: any[] = [];
  const decades = Object.keys(byDecade).sort();
  const storiesPerDecade = Math.ceil(targetCount / decades.length);
  
  decades.forEach(decade => {
    const decadeStories = byDecade[decade]
      .sort((a, b) => (b.discovery_score || 0) - (a.discovery_score || 0))
      .slice(0, storiesPerDecade);
    diverseStories.push(...decadeStories);
  });
  
  return diverseStories.slice(0, targetCount);
} 