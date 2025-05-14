import axios from 'axios';
import * as storyMapApi from '../../services/storyMapApi';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StoryMap API Service', () => {
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    
    // Mock the create method to return a mocked axios instance
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('pingStoryMapApi', () => {
    it('should return the URL if the API is available', async () => {
      // Setup successful response
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { articles: [] }
      });
      
      const result = await storyMapApi.pingStoryMapApi();
      
      expect(result).toBe('http://127.0.0.1:5001');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/articles?limit=1', expect.any(Object));
    });
    
    it('should try all URLs and return false if none are available', async () => {
      // Mock all requests to fail
      mockedAxios.get.mockRejectedValue(new Error('Connection failed'));
      
      const result = await storyMapApi.pingStoryMapApi();
      
      expect(result).toBe(false);
      // Should have tried all URLs in the STORYMAP_API_URLS array
      expect(mockedAxios.get).toHaveBeenCalledTimes(6);
    });
  });
  
  describe('searchArticles', () => {
    it('should format and send search requests correctly', async () => {
      const mockResponse = {
        data: {
          results: [
            { title: 'Test Article', content: 'Content about Roosevelt' }
          ]
        }
      };
      
      mockedAxios.post.mockResolvedValueOnce({ status: 200, data: mockResponse.data });
      
      const result = await storyMapApi.searchArticles('roosevelt', { limit: 5 });
      
      expect(result.error).toBe(false);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/search', {
        query: 'roosevelt',
        limit: 5
      });
    });
    
    it('should handle errors in search requests', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Invalid search query' }
        }
      });
      
      const result = await storyMapApi.searchArticles('invalid query', {}) as {
        error: boolean;
        status: number;
        message: string;
        data: any;
      };
      
      expect(result.error).toBe(true);
      expect(result.status).toBe(400);
      expect(result.message).toBe('Invalid search query');
    });
  });
  
  describe('getArticles', () => {
    it('should retrieve articles with correct parameters', async () => {
      const mockArticlesResponse = {
        data: {
          articles: [{ title: 'Test Article' }],
          total: 1
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockArticlesResponse.data });
      
      const result = await storyMapApi.getArticles({ limit: 10, offset: 0 });
      
      expect(result.error).toBe(false);
      expect(result.data).toEqual(mockArticlesResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/articles', { 
        params: { limit: 10, offset: 0 } 
      });
    });
  });
  
  describe('getEntities', () => {
    it('should retrieve entities with correct parameters', async () => {
      const mockEntitiesResponse = {
        data: {
          entities: [{ name: 'Roosevelt', entity_type: 'person' }],
          total: 1
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockEntitiesResponse.data });
      
      const result = await storyMapApi.getEntities({ limit: 10 });
      
      expect(result.error).toBe(false);
      expect(result.data).toEqual(mockEntitiesResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/entities', { 
        params: { limit: 10 } 
      });
    });
  });
}); 