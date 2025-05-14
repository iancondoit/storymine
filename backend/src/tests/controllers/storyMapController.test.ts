import { Request, Response } from 'express';
import { getStoryMapStats } from '../../controllers/storyMapController';
import * as storyMapApi from '../../services/storyMapApi';

// Mock the storyMapApi module
jest.mock('../../services/storyMapApi');

describe('StoryMap Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {};
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return offline status when StoryMap API is unavailable', async () => {
    // Mock API unavailable
    (storyMapApi.pingStoryMapApi as jest.Mock).mockResolvedValue(false);
    
    await getStoryMapStats(mockRequest as Request, mockResponse as Response);
    
    expect(mockStatus).toHaveBeenCalledWith(503);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'offline',
      message: 'StoryMap API is currently unavailable'
    });
  });

  it('should return online status with stats when API is available', async () => {
    // Mock successful API connection
    (storyMapApi.pingStoryMapApi as jest.Mock).mockResolvedValue('http://localhost:5001');
    
    // Mock successful API responses
    (storyMapApi.getArticles as jest.Mock).mockResolvedValue({
      error: false,
      data: {
        total: 5,
        articles: []
      }
    });
    
    (storyMapApi.getEntities as jest.Mock).mockResolvedValue({
      error: false,
      data: {
        total: 8,
        entities: []
      }
    });
    
    await getStoryMapStats(mockRequest as Request, mockResponse as Response);
    
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'online',
      apiUrl: 'http://localhost:5001',
      articleCount: 5,
      entityCount: 8,
      lastUpdated: expect.any(String)
    });
  });

  it('should return degraded status if some API requests fail', async () => {
    // Mock available API but failed entities request
    (storyMapApi.pingStoryMapApi as jest.Mock).mockResolvedValue('http://localhost:5001');
    
    (storyMapApi.getArticles as jest.Mock).mockResolvedValue({
      error: false,
      data: {
        total: 5,
        articles: []
      }
    });
    
    (storyMapApi.getEntities as jest.Mock).mockResolvedValue({
      error: true,
      message: 'Failed to fetch entities'
    });
    
    await getStoryMapStats(mockRequest as Request, mockResponse as Response);
    
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'degraded',
      apiUrl: 'http://localhost:5001',
      articleCount: 5,
      entityCount: null,
      lastUpdated: expect.any(String)
    });
  });

  it('should handle unexpected errors', async () => {
    // Mock an error being thrown
    (storyMapApi.pingStoryMapApi as jest.Mock).mockRejectedValue(new Error('Unexpected error'));
    
    await getStoryMapStats(mockRequest as Request, mockResponse as Response);
    
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      status: 'error',
      message: 'Failed to fetch StoryMap statistics'
    });
  });
}); 