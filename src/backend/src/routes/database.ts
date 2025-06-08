import { Router } from 'express';
import { query } from '../database/connection';

interface DateRange {
  earliest: string | null;
  latest: string | null;
  years: number;
}

interface DatabaseStats {
  articles: number;
  entities: number;
  relationships: number;
  dateRange: DateRange;
}

const router = Router();

// Timeout wrapper for database queries
const queryWithTimeout = async (queryString: string, timeout = 5000): Promise<any> => {
  return Promise.race([
    query(queryString),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeout)
    )
  ]);
};

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Database stats request received');
    
    // Check Intelligence tables first (preferred)
    const intelligenceStats = await getIntelligenceStats();
    
    if (intelligenceStats.articles > 0 || intelligenceStats.entities > 0) {
      console.log('✅ Returning Intelligence data:', intelligenceStats);
      return res.json(intelligenceStats);
    }
    
    // Fall back to legacy tables if Intelligence tables are empty
    console.log('📋 Intelligence tables empty, checking legacy tables');
    const legacyStats = await getLegacyStats();
    console.log('✅ Returning legacy data:', legacyStats);
    res.json(legacyStats);
    
  } catch (error) {
    console.error('❌ Error fetching database stats:', error);
    
    // Return zero stats on error
    const fallbackStats = {
      articles: 0,
      entities: 0,
      relationships: 0,
      dateRange: {
        earliest: null,
        latest: null,
        years: 0
      }
    };
    
    console.log('🔄 Returning fallback stats:', fallbackStats);
    res.json(fallbackStats);
  }
});

async function getIntelligenceStats(): Promise<DatabaseStats> {
  try {
    console.log('🔍 Checking Intelligence tables...');
    
    // Count Intelligence articles with timeout
    const articlesResult = await queryWithTimeout('SELECT COUNT(*) as count FROM intelligence_articles');
    const articlesCount = parseInt(articlesResult.rows[0]?.count || '0');
    console.log(`📰 Intelligence articles: ${articlesCount}`);

    // Count Intelligence entities with timeout
    const entitiesResult = await queryWithTimeout('SELECT COUNT(*) as count FROM intelligence_entities');
    const entitiesCount = parseInt(entitiesResult.rows[0]?.count || '0');
    console.log(`👥 Intelligence entities: ${entitiesCount}`);

    // Count Intelligence relationships with timeout
    const relationshipsResult = await queryWithTimeout('SELECT COUNT(*) as count FROM intelligence_relationships');
    const relationshipsCount = parseInt(relationshipsResult.rows[0]?.count || '0');
    console.log(`🔗 Intelligence relationships: ${relationshipsCount}`);

    // Get date range from Intelligence articles
    let dateRange: DateRange = {
      earliest: null,
      latest: null,
      years: 0
    };

    if (articlesCount > 0) {
      const dateRangeResult = await queryWithTimeout(`
        SELECT 
          MIN(publication_date) as earliest,
          MAX(publication_date) as latest
        FROM intelligence_articles 
        WHERE publication_date IS NOT NULL
      `);
      
      const row = dateRangeResult.rows[0];
      if (row.earliest && row.latest) {
        const earliest = new Date(row.earliest);
        const latest = new Date(row.latest);
        const years = latest.getFullYear() - earliest.getFullYear();
        
        dateRange = {
          earliest: earliest.getFullYear().toString(),
          latest: latest.getFullYear().toString(),
          years: years + 1
        };
      }
    }

    return {
      articles: articlesCount,
      entities: entitiesCount,
      relationships: relationshipsCount,
      dateRange
    };
  } catch (error) {
    console.warn('⚠️  Intelligence tables not available:', (error as Error).message);
    return {
      articles: 0,
      entities: 0,
      relationships: 0,
      dateRange: {
        earliest: null,
        latest: null,
        years: 0
      }
    };
  }
}

async function getLegacyStats(): Promise<DatabaseStats> {
  try {
    console.log('🔍 Checking Legacy tables...');
    
    // Count legacy articles with timeout
    const articlesResult = await queryWithTimeout('SELECT COUNT(*) as count FROM articles');
    const articlesCount = parseInt(articlesResult.rows[0]?.count || '0');
    console.log(`📰 Legacy articles: ${articlesCount}`);

    // Count legacy entities with timeout
    const entitiesResult = await queryWithTimeout('SELECT COUNT(*) as count FROM entities');
    const entitiesCount = parseInt(entitiesResult.rows[0]?.count || '0');
    console.log(`👥 Legacy entities: ${entitiesCount}`);

    // Count article-entity relationships as a proxy for relationships with timeout
    const relationshipsResult = await queryWithTimeout('SELECT COUNT(*) as count FROM article_entities');
    const relationshipsCount = parseInt(relationshipsResult.rows[0]?.count || '0');
    console.log(`🔗 Legacy relationships: ${relationshipsCount}`);

    // Get date range from legacy articles
    let dateRange: DateRange = {
      earliest: null,
      latest: null,
      years: 0
    };

    if (articlesCount > 0) {
      const dateRangeResult = await queryWithTimeout(`
        SELECT 
          MIN(publish_date) as earliest,
          MAX(publish_date) as latest
        FROM articles 
        WHERE publish_date IS NOT NULL
      `);
      
      const row = dateRangeResult.rows[0];
      if (row.earliest && row.latest) {
        const earliest = new Date(row.earliest);
        const latest = new Date(row.latest);
        const years = latest.getFullYear() - earliest.getFullYear();
        
        dateRange = {
          earliest: earliest.getFullYear().toString(),
          latest: latest.getFullYear().toString(),
          years: years + 1
        };
      }
    }

    return {
      articles: articlesCount,
      entities: entitiesCount,
      relationships: relationshipsCount,
      dateRange
    };
  } catch (error) {
    console.warn('⚠️  Legacy tables not available:', (error as Error).message);
    return {
      articles: 0,
      entities: 0,
      relationships: 0,
      dateRange: {
        earliest: null,
        latest: null,
        years: 0
      }
    };
  }
}

export default router; 