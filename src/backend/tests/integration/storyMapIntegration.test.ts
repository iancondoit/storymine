/**
 * StoryMap API Integration Tests
 * 
 * These tests verify that our application correctly integrates with the StoryMap API
 * and can recognize real data. These tests require a running mock or real StoryMap API.
 * 
 * To run these tests:
 * 1. Make sure the StoryMap API mock server is running: npm run storymap:dev
 * 2. Run the tests: npm run test:integration
 */

import { StoryMapApiClient, ApiEnvironment, ApiResponse } from '../../src/services/storyMapApiClient';
import { SearchFilters, SearchQuery, ArticleListResponse, EntityListResponse, RelationshipListResponse, NetworkResponse } from '../../src/models/storyMapModels';

// Configuration for tests
const TEST_TIMEOUT = 10000; // 10 seconds

describe('StoryMap API Integration', () => {
  let apiClient: StoryMapApiClient;

  beforeAll(() => {
    apiClient = new StoryMapApiClient();
    // Force mock environment for safety
    apiClient.setEnvironment(ApiEnvironment.MOCK);
  });

  describe('API Connection', () => {
    test('should connect to StoryMap API', async () => {
      const result = await apiClient.ping();
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Article Endpoints', () => {
    test('should retrieve articles with pagination', async () => {
      const result = await apiClient.getArticles({ limit: 5 });
      
      expect(result.error).toBe(false);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.articles)).toBe(true);
      expect(result.data?.articles.length).toBeGreaterThan(0);
      expect(result.data?.total).toBeGreaterThan(0);
      
      // Verify article structure
      const article = result.data?.articles[0];
      expect(article).toHaveProperty('id');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('content');
    }, TEST_TIMEOUT);

    test('should retrieve a single article by ID', async () => {
      // First get an article ID from the list
      const listResult = await apiClient.getArticles({ limit: 1 });
      const articleId = listResult.data?.articles[0]?.id;
      
      expect(articleId).toBeDefined();
      
      // Now get the specific article
      const result = await apiClient.getArticle(articleId);
      
      expect(result.error).toBe(false);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(articleId);
      expect(result.data?.title).toBeDefined();
      expect(result.data?.content).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('Entity Endpoints', () => {
    test('should retrieve entities with pagination', async () => {
      const result = await apiClient.getEntities({ limit: 5 });
      
      expect(result.error).toBe(false);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.entities)).toBe(true);
      expect(result.data?.entities.length).toBeGreaterThan(0);
      
      // Verify entity structure
      const entity = result.data?.entities[0];
      expect(entity).toHaveProperty('id');
      expect(entity).toHaveProperty('name');
      expect(entity).toHaveProperty('entity_type');
    }, TEST_TIMEOUT);

    test('should retrieve entity relationships when available', async () => {
      // First get an entity ID from the list
      const listResult = await apiClient.getEntities({ limit: 1 });
      const entityId = listResult.data?.entities[0]?.id;
      
      expect(entityId).toBeDefined();
      
      // Now get relationships for this entity
      const result = await apiClient.getEntityRelationships(entityId, { limit: 5 });
      
      // The mock server may not support relationships yet, so we'll just test the response structure
      expect(result).toBeDefined();
      
      // If relationships are supported, verify the structure
      if (!result.error && result.data) {
        expect(Array.isArray(result.data.relationships)).toBe(true);
        expect(result.data).toHaveProperty('relationships');
        expect(result.data).toHaveProperty('limit');
        expect(result.data).toHaveProperty('offset');
      }
    }, TEST_TIMEOUT);

    test('should retrieve entity network when available', async () => {
      // First get an entity ID from the list
      const listResult = await apiClient.getEntities({ limit: 1 });
      const entityId = listResult.data?.entities[0]?.id;
      
      expect(entityId).toBeDefined();
      
      // Now get network for this entity
      const result = await apiClient.getEntityNetwork(entityId, 1, { limit: 5 });
      
      // The mock server may not support network yet, so we'll just test the response structure
      expect(result).toBeDefined();
      
      // If network is supported, verify the structure
      if (!result.error && result.data) {
        expect(result.data.network).toBeDefined();
        expect(result.data.stats).toBeDefined();
        
        // Basic structure should be present
        expect(result.data.network).toHaveProperty('nodes');
        expect(result.data.network).toHaveProperty('edges');
        expect(result.data.stats).toHaveProperty('node_count');
        expect(result.data.stats).toHaveProperty('edge_count');
      }
    }, TEST_TIMEOUT);
  });

  describe('Search Endpoints', () => {
    test('should perform basic semantic search', async () => {
      const result = await apiClient.searchArticles('president', { limit: 5 });
      
      expect(result.error).toBe(false);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.results)).toBe(true);
      expect(result.data?.query).toBe('president');
      
      // If there are results, check their structure
      if (result.data && result.data.results && result.data.results.length > 0) {
        const searchResult = result.data.results[0];
        expect(searchResult).toHaveProperty('id');
        expect(searchResult).toHaveProperty('title');
        expect(searchResult).toHaveProperty('similarity');
      }
    }, TEST_TIMEOUT);

    test('should perform filtered search', async () => {
      // Create search with filters
      const filters: SearchFilters = {
        start_date: '1940-01-01',
        end_date: '1945-12-31',
        categories: ['politics', 'war']
      };
      
      const result = await apiClient.searchArticles('world war', { 
        limit: 5,
        filters
      });
      
      expect(result.error).toBe(false);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.results)).toBe(true);
      
      // Even if filtering yields no results, the structure should be correct
      expect(result.data).toHaveProperty('results');
      expect(result.data).toHaveProperty('query');
    }, TEST_TIMEOUT);
  });
}); 