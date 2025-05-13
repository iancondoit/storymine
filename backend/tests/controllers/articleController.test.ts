import { Request, Response } from 'express';
import { getArticles } from '../../src/controllers/articleController';
import { query } from '../../src/database/connection';

// Mock the database connection
jest.mock('../../src/database/connection');

describe('Article Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock request with query parameters
    mockRequest = {
      query: {}
    };
    
    // Create mock response with json and status methods
    mockJson = jest.fn().mockReturnValue({});
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
    
    // Mock the query function to return sample data
    (query as jest.Mock).mockImplementation((queryString, params) => {
      if (queryString.includes('COUNT(*)')) {
        // For the count query
        return Promise.resolve({
          rows: [{ total: '10' }]
        });
      } else {
        // For the articles query
        return Promise.resolve({
          rows: [
            {
              id: 1,
              title: 'Test Article 1',
              publish_date: '2020-01-01',
              publication: 'Test Publication',
              section: 'news',
              word_count: 100
            },
            {
              id: 2,
              title: 'Test Article 2',
              publish_date: '2020-01-02',
              publication: 'Test Publication',
              section: 'sports',
              word_count: 200
            }
          ]
        });
      }
    });
  });

  test('should get articles with default pagination', async () => {
    // Act
    await getArticles(mockRequest as Request, mockResponse as Response);
    
    // Assert
    expect(query).toHaveBeenCalledTimes(2);
    expect(mockJson).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      totalArticles: 10,
      totalPages: 1,
      articles: expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          title: 'Test Article 1'
        }),
        expect.objectContaining({
          id: 2,
          title: 'Test Article 2'
        })
      ])
    });
  });

  test('should get articles with custom pagination', async () => {
    // Arrange
    mockRequest.query = { page: '2', limit: '5' };
    
    // Act
    await getArticles(mockRequest as Request, mockResponse as Response);
    
    // Assert
    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([5, 5]) // Expects limit and offset
    );
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      limit: 5
    }));
  });

  test('should handle database error', async () => {
    // Arrange
    (query as jest.Mock).mockRejectedValue(new Error('Database error'));
    
    // Act
    await getArticles(mockRequest as Request, mockResponse as Response);
    
    // Assert
    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Failed to fetch articles'
      })
    );
  });
}); 