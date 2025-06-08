import axios from 'axios';
import { ApiEnvironment, StoryMapApiClient, AuthMethod } from '../../src/services/storyMapApiClient';

// Mock environment variables
process.env.API_ENVIRONMENT = ApiEnvironment.MOCK;
process.env.STORYMAP_API_KEY = 'test-api-key';
process.env.STORYMAP_API_SECRET = 'test-api-secret';
process.env.AUTH_METHOD = AuthMethod.API_KEY;

// Use jest to mock API requests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StoryMap API Client', () => {
  let apiClient: StoryMapApiClient;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockedAxios);
    
    // Create new client instance for each test
    apiClient = new StoryMapApiClient();
  });
  
  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
  });
  
  describe('Configuration', () => {
    test('should use mock environment by default', () => {
      expect(apiClient.getEnvironment()).toBe(ApiEnvironment.MOCK);
    });
    
    test('should use API key authentication when configured', () => {
      expect(apiClient.getAuthMethod()).toBe(AuthMethod.API_KEY);
    });
    
    test('should switch environments', () => {
      apiClient.setEnvironment(ApiEnvironment.DEVELOPMENT);
      expect(apiClient.getEnvironment()).toBe(ApiEnvironment.DEVELOPMENT);
    });
  });
  
  describe('Connection', () => {
    test('should ping available endpoints', async () => {
      // Mock successful response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { status: 'healthy' }
      });
      
      const result = await apiClient.ping();
      expect(result.success).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith('/health', expect.any(Object));
    });
    
    test('should handle connection failure', async () => {
      // Mock connection error
      mockedAxios.get.mockRejectedValueOnce(new Error('Connection failed'));
      
      const result = await apiClient.ping();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to connect to any API endpoint');
    });
    
    test('should retry failed connections', async () => {
      // First attempt fails, second succeeds
      mockedAxios.get
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce({
          status: 200,
          data: { status: 'healthy' }
        });
      
      const result = await apiClient.ping(2); // Max 2 retries
      expect(result.success).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('Authentication', () => {
    test('should include API key in headers', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {}
      });
      
      await apiClient.getArticles({ limit: 10 });
      
      // Check that the API key was included in the headers
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/articles',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });
    
    test('should handle authentication errors', async () => {
      // Create an Axios error with response
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Invalid API key' },
          headers: {},
          config: {},
          statusText: 'Unauthorized'
        },
        config: {},
        name: 'Error',
        message: 'Request failed with status code 401',
        toJSON: () => ({})
      };
      
      mockedAxios.get.mockRejectedValueOnce(axiosError);
      
      const result = await apiClient.getArticles({ limit: 10 });
      expect(result.error).toBe(true);
      expect(result.status).toBe(401);
      expect(result.message).toContain('Invalid API key');
    });
  });
  
  describe('Article Endpoints', () => {
    test('should fetch articles with pagination', async () => {
      // Mock successful articles response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          articles: [
            { id: '1', title: 'Article 1', content: 'Content 1' },
            { id: '2', title: 'Article 2', content: 'Content 2' }
          ],
          limit: 10,
          offset: 0,
          total: 2
        }
      });
      
      const result = await apiClient.getArticles({ limit: 10, offset: 0 });
      
      expect(result.error).toBe(false);
      expect(result.data?.articles).toHaveLength(2);
      expect(result.data?.total).toBe(2);
    });
    
    test('should fetch a single article by ID', async () => {
      // Mock successful article response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          id: '1',
          title: 'Article 1',
          content: 'Content 1',
          entities: [
            { id: 'e1', name: 'Entity 1', entity_type: 'person' }
          ]
        }
      });
      
      const result = await apiClient.getArticle('1');
      
      expect(result.error).toBe(false);
      expect(result.data?.title).toBe('Article 1');
      expect(result.data?.entities).toHaveLength(1);
    });
    
    test('should handle article not found', async () => {
      // Create an Axios error with 404 response
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Article not found' },
          headers: {},
          config: {},
          statusText: 'Not Found'
        },
        config: {},
        name: 'Error',
        message: 'Request failed with status code 404',
        toJSON: () => ({})
      };
      
      mockedAxios.get.mockRejectedValueOnce(axiosError);
      
      const result = await apiClient.getArticle('999');
      
      expect(result.error).toBe(true);
      expect(result.status).toBe(404);
    });
  });
  
  describe('Entity Endpoints', () => {
    test('should fetch entities with pagination', async () => {
      // Mock successful entities response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          entities: [
            { id: 'e1', name: 'Entity 1', entity_type: 'person' },
            { id: 'e2', name: 'Entity 2', entity_type: 'organization' }
          ],
          limit: 10,
          offset: 0
        }
      });
      
      const result = await apiClient.getEntities({ limit: 10, offset: 0 });
      
      expect(result.error).toBe(false);
      expect(result.data?.entities).toHaveLength(2);
    });
    
    test('should fetch entities by type', async () => {
      // Mock successful entities by type response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          entities: [
            { id: 'e1', name: 'Entity 1', entity_type: 'person' }
          ],
          limit: 10,
          offset: 0
        }
      });
      
      const result = await apiClient.getEntitiesByType('person', { limit: 10 });
      
      expect(result.error).toBe(false);
      expect(result.data?.entities).toHaveLength(1);
      expect(result.data?.entities[0].entity_type).toBe('person');
    });

    test('should fetch entity relationships', async () => {
      // Mock successful relationships response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          relationships: [
            { 
              id: 'r1', 
              source_entity_id: 'e1',
              target_entity_id: 'e2',
              relationship_type: 'works_for',
              confidence: 0.9
            },
            { 
              id: 'r2', 
              source_entity_id: 'e1',
              target_entity_id: 'e3',
              relationship_type: 'knows',
              confidence: 0.8
            }
          ],
          limit: 10,
          offset: 0,
          total: 2
        }
      });
      
      const result = await apiClient.getEntityRelationships('e1', { limit: 10 });
      
      expect(result.error).toBe(false);
      expect(result.data?.relationships).toHaveLength(2);
      expect(result.data?.relationships[0].relationship_type).toBe('works_for');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/entities/e1/relationships',
        expect.objectContaining({
          params: { limit: 10 }
        })
      );
    });

    test('should handle invalid relationship data', async () => {
      // Mock invalid relationships response (missing array)
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          // Missing relationships array
          limit: 10,
          offset: 0
        }
      });
      
      const result = await apiClient.getEntityRelationships('e1');
      
      expect(result.error).toBe(true);
      expect(result.status).toBe(422);
      expect(result.message).toContain('Invalid relationship data');
    });

    test('should fetch entity network', async () => {
      // Mock successful network response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          entity_id: 'e1',
          depth: 1,
          network: {
            nodes: [
              { id: 'e1', name: 'Entity 1', entity_type: 'person', size: 3 },
              { id: 'e2', name: 'Entity 2', entity_type: 'organization', size: 2 }
            ],
            edges: [
              { 
                id: 'r1',
                source_entity_id: 'e1',
                target_entity_id: 'e2',
                relationship_type: 'works_for',
                weight: 0.9
              }
            ]
          },
          stats: {
            node_count: 2,
            edge_count: 1,
            density: 0.5
          }
        }
      });
      
      const result = await apiClient.getEntityNetwork('e1', 1, { limit: 10 });
      
      expect(result.error).toBe(false);
      expect(result.data?.entity_id).toBe('e1');
      expect(result.data?.network.nodes).toHaveLength(2);
      expect(result.data?.network.edges).toHaveLength(1);
      expect(result.data?.stats.node_count).toBe(2);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/entities/e1/network',
        expect.objectContaining({
          params: { depth: 1, limit: 10 }
        })
      );
    });
  });
  
  describe('Search Endpoint', () => {
    test('should perform semantic search', async () => {
      // Mock successful search response
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          query: 'test query',
          results: [
            { 
              id: '1', 
              title: 'Result 1',
              content: 'Content with test query',
              similarity: 0.95
            }
          ]
        }
      });
      
      const result = await apiClient.searchArticles('test query', { limit: 10 });
      
      expect(result.error).toBe(false);
      expect(result.data?.results).toHaveLength(1);
      expect(result.data?.results[0].similarity).toBe(0.95);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/search',
        { query: 'test query', limit: 10 },
        expect.any(Object)
      );
    });
    
    test('should handle empty search results', async () => {
      // Mock empty search response
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          query: 'no results query',
          results: []
        }
      });
      
      const result = await apiClient.searchArticles('no results query');
      
      expect(result.error).toBe(false);
      expect(result.data?.results).toHaveLength(0);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      // Create a network error without request object
      const networkError = new Error('Network Error');
      (networkError as any).isAxiosError = true;
      (networkError as any).config = {};
      // Don't set request to force the correct branch in error handling
      
      mockedAxios.get.mockRejectedValueOnce(networkError);
      
      const result = await apiClient.getArticles();
      
      expect(result.error).toBe(true);
      expect(result.status).toBe(500);
      expect(result.message).toContain('Network Error');
    });
    
    test('should handle rate limiting', async () => {
      // Create an Axios error with rate limit response
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 429,
          data: { message: 'Too many requests' },
          headers: {
            'retry-after': '30'
          },
          config: {},
          statusText: 'Too Many Requests'
        },
        config: {},
        name: 'Error',
        message: 'Request failed with status code 429',
        toJSON: () => ({})
      };
      
      mockedAxios.get.mockRejectedValueOnce(axiosError);
      
      const result = await apiClient.getArticles();
      
      expect(result.error).toBe(true);
      expect(result.status).toBe(429);
      expect(result.retryAfter).toBe(30);
    });
    
    test('should handle server errors', async () => {
      // Create an Axios error with 500 response
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal server error' },
          headers: {},
          config: {},
          statusText: 'Internal Server Error'
        },
        config: {},
        name: 'Error',
        message: 'Request failed with status code 500',
        toJSON: () => ({})
      };
      
      mockedAxios.get.mockRejectedValueOnce(axiosError);
      
      const result = await apiClient.getArticles();
      
      expect(result.error).toBe(true);
      expect(result.status).toBe(500);
    });
  });
  
  describe('Validation', () => {
    test('should validate article data', async () => {
      // Mock incomplete article data
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: {
          // Missing required fields
          id: '1',
          // No title or content
        }
      });
      
      const result = await apiClient.getArticle('1');
      
      expect(result.error).toBe(true);
      expect(result.message).toContain('missing required fields');
    });
  });
}); 