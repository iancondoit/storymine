import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { entityService } from '../../services/entityService';
import { cacheService } from '../../services/cache';
import * as storyMapApi from '../../services/storyMapApi';

// Mock axios
const mockAxios = new MockAdapter(axios);

// Mock the cacheService and storyMapApi
jest.mock('../../services/cache', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn()
  }
}));

jest.mock('../../services/storyMapApi', () => ({
  pingStoryMapApi: jest.fn()
}));

describe('EntityService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockAxios.reset();
    jest.clearAllMocks();
    
    // Mock successful API connection
    (storyMapApi.pingStoryMapApi as jest.Mock).mockResolvedValue('http://localhost:8080');
  });
  
  afterEach(() => {
    mockAxios.reset();
  });
  
  describe('getEntity', () => {
    it('should fetch an entity from the API when not in cache', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockReturnValue(null);
      
      // Mock API response
      const mockEntity = {
        id: 'ent_12345',
        name: 'Test Entity',
        entity_type: 'PERSON',
        article_ids: ['article_1', 'article_2'],
        article_count: 2
      };
      
      mockAxios.onGet('http://localhost:8080/api/entities/ent_12345').reply(200, mockEntity);
      
      // Call the method
      const result = await entityService.getEntity('ent_12345');
      
      // Assertions
      expect(result).toEqual(mockEntity);
      expect(cacheService.get).toHaveBeenCalledWith('entity:ent_12345');
      expect(cacheService.set).toHaveBeenCalledWith('entity:ent_12345', mockEntity, expect.any(Number));
    });
    
    it('should return cached entity when available', async () => {
      // Mock cache hit
      const mockCachedEntity = {
        id: 'ent_12345',
        name: 'Test Entity from Cache',
        entity_type: 'PERSON'
      };
      
      (cacheService.get as jest.Mock).mockReturnValue(mockCachedEntity);
      
      // Call the method
      const result = await entityService.getEntity('ent_12345');
      
      // Assertions
      expect(result).toEqual(mockCachedEntity);
      expect(cacheService.get).toHaveBeenCalledWith('entity:ent_12345');
      expect(axios.get).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
    
    it('should return null when API is not available', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockReturnValue(null);
      
      // Mock API unavailable
      (storyMapApi.pingStoryMapApi as jest.Mock).mockResolvedValue(false);
      
      // Call the method
      const result = await entityService.getEntity('ent_12345');
      
      // Assertions
      expect(result).toBeNull();
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
  
  describe('searchEntities', () => {
    it('should search for entities matching the search term', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockReturnValue(null);
      
      // Mock API response
      const mockEntities = {
        entities: [
          {
            id: 'ent_12345',
            name: 'John Doe',
            entity_type: 'PERSON'
          },
          {
            id: 'ent_67890',
            name: 'John Smith',
            entity_type: 'PERSON'
          }
        ]
      };
      
      mockAxios.onGet('http://localhost:8080/api/entities').reply(200, mockEntities);
      
      // Call the method
      const result = await entityService.searchEntities('John');
      
      // Assertions
      expect(result).toEqual(mockEntities.entities);
      expect(cacheService.get).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
  
  describe('getEntityTimeline', () => {
    it('should fetch a timeline for an entity', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockReturnValue(null);
      
      // Mock API response
      const mockTimeline = {
        timeline: [
          {
            date: '2020-01-01',
            title: 'Event 1',
            content: 'Something happened',
            article_id: 'article_1'
          },
          {
            date: '2020-02-01',
            title: 'Event 2',
            content: 'Something else happened',
            article_id: 'article_2'
          }
        ]
      };
      
      mockAxios.onGet('http://localhost:8080/api/entities/ent_12345/timeline').reply(200, mockTimeline);
      
      // Call the method
      const result = await entityService.getEntityTimeline('ent_12345');
      
      // Assertions
      expect(result).toEqual(mockTimeline.timeline);
      expect(cacheService.get).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
  
  describe('getEntityRelationships', () => {
    it('should fetch relationships for an entity', async () => {
      // Mock cache miss
      (cacheService.get as jest.Mock).mockReturnValue(null);
      
      // Mock API response
      const mockNetwork = {
        network: {
          nodes: [
            { id: 'ent_12345', name: 'Entity 1', entity_type: 'PERSON' },
            { id: 'ent_67890', name: 'Entity 2', entity_type: 'ORGANIZATION' }
          ],
          edges: [
            { source: 'ent_12345', target: 'ent_67890', type: 'WORKS_FOR' }
          ]
        }
      };
      
      mockAxios.onGet('http://localhost:8080/api/entities/ent_12345/network').reply(200, mockNetwork);
      
      // Call the method
      const result = await entityService.getEntityRelationships('ent_12345');
      
      // Assertions
      expect(result).toEqual(mockNetwork.network);
      expect(cacheService.get).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
}); 