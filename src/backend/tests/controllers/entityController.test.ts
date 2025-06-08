import { Request, Response } from 'express';
import { StoryMapApiClient } from '../../src/services/storyMapApiClient';
import * as entityController from '../../src/controllers/entityController';

// Mock StoryMapApiClient
jest.mock('../../src/services/storyMapApiClient');

describe('Entity Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockStoryMapApiClient: jest.Mocked<StoryMapApiClient>;
  
  beforeEach(() => {
    // Reset request and response mocks
    mockRequest = {
      params: {},
      query: {}
    };
    
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    // Reset StoryMapApiClient mock
    jest.clearAllMocks();
    
    // Setup StoryMapApiClient mock implementation
    mockStoryMapApiClient = new StoryMapApiClient() as jest.Mocked<StoryMapApiClient>;
    (StoryMapApiClient as jest.Mock).mockImplementation(() => mockStoryMapApiClient);
  });
  
  describe('getEntities', () => {
    test('should return entities list', async () => {
      // Setup mock response
      const mockEntityData = {
        entities: [
          { id: 'e1', name: 'Entity 1', entity_type: 'person' },
          { id: 'e2', name: 'Entity 2', entity_type: 'organization' }
        ],
        limit: 10,
        offset: 0,
        total: 2
      };
      
      mockStoryMapApiClient.getEntities.mockResolvedValueOnce({
        error: false,
        data: mockEntityData
      });
      
      // Setup request
      mockRequest.query = { limit: '10', page: '1' };
      
      // Call controller
      await entityController.getEntities(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockStoryMapApiClient.getEntities).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        totalEntities: 2,
        totalPages: 1,
        entities: expect.arrayContaining([
          expect.objectContaining({ id: 'e1' })
        ])
      });
    });
    
    test('should handle API errors', async () => {
      // Setup mock error response
      mockStoryMapApiClient.getEntities.mockResolvedValueOnce({
        error: true,
        status: 500,
        message: 'API error'
      });
      
      // Call controller
      await entityController.getEntities(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'API error'
      });
    });
  });
  
  describe('getEntityRelationships', () => {
    test('should return relationships for an entity', async () => {
      // Setup mock response
      const mockRelationships = {
        relationships: [
          {
            id: 'r1',
            source_entity_id: 'e1',
            target_entity_id: 'e2',
            relationship_type: 'works_for',
            confidence: 0.9
          }
        ],
        limit: 20,
        offset: 0,
        total: 1
      };
      
      mockStoryMapApiClient.getEntityRelationships.mockResolvedValueOnce({
        error: false,
        data: mockRelationships
      });
      
      // Setup request
      mockRequest.params = { id: 'e1' };
      mockRequest.query = { limit: '20' };
      
      // Call controller
      await entityController.getEntityRelationships(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockStoryMapApiClient.getEntityRelationships).toHaveBeenCalledWith(
        'e1',
        expect.objectContaining({ limit: 20 })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        entity_id: 'e1',
        relationships: expect.arrayContaining([
          expect.objectContaining({
            id: 'r1',
            source: 'e1',
            target: 'e2',
            type: 'works_for'
          })
        ]),
        limit: 20,
        offset: 0,
        total: 1
      });
    });
    
    test('should handle missing entity ID', async () => {
      // Setup request without entity ID
      mockRequest.params = {};
      
      // Call controller
      await entityController.getEntityRelationships(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Entity ID is required'
      });
    });
    
    test('should handle API errors', async () => {
      // Setup mock error response
      mockStoryMapApiClient.getEntityRelationships.mockResolvedValueOnce({
        error: true,
        status: 404,
        message: 'Entity not found'
      });
      
      // Setup request
      mockRequest.params = { id: 'nonexistent' };
      
      // Call controller
      await entityController.getEntityRelationships(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Entity not found'
      });
    });
  });
  
  describe('getEntityNetwork', () => {
    test('should return network for an entity', async () => {
      // Setup mock response
      const mockNetwork = {
        entity_id: 'e1',
        depth: 1,
        network: {
          nodes: [
            { id: 'e1', name: 'Entity 1', entity_type: 'person' },
            { id: 'e2', name: 'Entity 2', entity_type: 'organization' }
          ],
          edges: [
            {
              id: 'r1',
              source_entity_id: 'e1',
              target_entity_id: 'e2',
              relationship_type: 'works_for'
            }
          ]
        },
        stats: {
          node_count: 2,
          edge_count: 1
        }
      };
      
      mockStoryMapApiClient.getEntityNetwork.mockResolvedValueOnce({
        error: false,
        data: mockNetwork
      });
      
      // Setup request
      mockRequest.params = { id: 'e1' };
      mockRequest.query = { depth: '1', limit: '20' };
      
      // Call controller
      await entityController.getEntityNetwork(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockStoryMapApiClient.getEntityNetwork).toHaveBeenCalledWith(
        'e1',
        1,
        expect.objectContaining({ limit: 20 })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        nodes: mockNetwork.network.nodes,
        edges: mockNetwork.network.edges,
        stats: mockNetwork.stats
      });
    });
    
    test('should handle missing entity ID', async () => {
      // Setup request without entity ID
      mockRequest.params = {};
      
      // Call controller
      await entityController.getEntityNetwork(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Entity ID is required'
      });
    });
    
    test('should handle API errors', async () => {
      // Setup mock error response
      mockStoryMapApiClient.getEntityNetwork.mockResolvedValueOnce({
        error: true,
        status: 500,
        message: 'Failed to fetch network'
      });
      
      // Setup request
      mockRequest.params = { id: 'e1' };
      
      // Call controller
      await entityController.getEntityNetwork(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Assertions
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to fetch network'
      });
    });
  });
}); 