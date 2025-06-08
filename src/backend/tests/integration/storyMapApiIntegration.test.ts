import dotenv from 'dotenv';
import { StoryMapApiClient, ApiEnvironment, AuthMethod } from '../../src/services/storyMapApiClient';

// Load environment variables
dotenv.config();

/**
 * Integration tests for StoryMap API client.
 * These tests can be run against both the mock and real APIs.
 * 
 * To run against the mock API:
 * API_ENVIRONMENT=mock npm test -- storyMapApiIntegration.test.ts
 * 
 * To run against the development API:
 * API_ENVIRONMENT=development STORYMAP_API_KEY=your-key AUTH_METHOD=api_key npm test -- storyMapApiIntegration.test.ts
 */
describe('StoryMap API Integration', () => {
  let apiClient: StoryMapApiClient;
  
  beforeAll(async () => {
    // Create API client
    apiClient = new StoryMapApiClient();
    
    // Ping API to ensure it's available
    const pingResult = await apiClient.ping();
    if (!pingResult.success) {
      console.error('API is not available - tests may fail');
    }
  });
  
  /**
   * Test health check endpoint
   */
  describe('Health Check', () => {
    it('should ping the API successfully', async () => {
      const result = await apiClient.ping();
      expect(result.success).toBe(true);
    });
  });
  
  /**
   * Test article endpoints
   */
  describe('Article Endpoints', () => {
    it('should fetch articles with pagination', async () => {
      const result = await apiClient.getArticles({ limit: 2 });
      
      expect(result.error).toBe(false);
      expect(result.data?.articles).toBeDefined();
      expect(Array.isArray(result.data?.articles)).toBe(true);
    });
    
    it('should fetch a single article by ID', async () => {
      // First get an article ID from the list
      const listResult = await apiClient.getArticles({ limit: 1 });
      
      if (listResult.error || !listResult.data?.articles?.length) {
        console.warn('No articles available to test getArticle');
        return;
      }
      
      const articleId = listResult.data.articles[0].id;
      const result = await apiClient.getArticle(articleId);
      
      expect(result.error).toBe(false);
      expect(result.data?.id).toBe(articleId);
      expect(result.data?.title).toBeDefined();
      expect(result.data?.content).toBeDefined();
    });
  });
  
  /**
   * Test entity endpoints
   */
  describe('Entity Endpoints', () => {
    it('should fetch entities with pagination', async () => {
      const result = await apiClient.getEntities({ limit: 2 });
      
      expect(result.error).toBe(false);
      expect(result.data?.entities).toBeDefined();
      expect(Array.isArray(result.data?.entities)).toBe(true);
    });
    
    it('should fetch entities by type', async () => {
      // This assumes 'person' is a valid entity type in the API
      const result = await apiClient.getEntitiesByType('person', { limit: 2 });
      
      expect(result.error).toBe(false);
      expect(result.data?.entities).toBeDefined();
      expect(Array.isArray(result.data?.entities)).toBe(true);
      
      // If we got results, verify they're all of type 'person'
      if (result.data?.entities?.length) {
        result.data.entities.forEach(entity => {
          expect(entity.entity_type).toBe('person');
        });
      }
    });
  });
  
  /**
   * Test search endpoint
   */
  describe('Search Endpoint', () => {
    it('should perform a simple search', async () => {
      // Use a search term likely to return results
      const result = await apiClient.searchArticles('roosevelt', { limit: 2 });
      
      expect(result.error).toBe(false);
      expect(result.data?.query).toBe('roosevelt');
      expect(result.data?.results).toBeDefined();
      expect(Array.isArray(result.data?.results)).toBe(true);
    });
    
    it('should handle searches with no results', async () => {
      // Use a search term unlikely to return results
      const result = await apiClient.searchArticles('xyzzzyunlikely', { limit: 2 });
      
      expect(result.error).toBe(false);
      expect(result.data?.results).toBeDefined();
      expect(Array.isArray(result.data?.results)).toBe(true);
      expect(result.data?.results.length).toBe(0);
    });
  });
}); 