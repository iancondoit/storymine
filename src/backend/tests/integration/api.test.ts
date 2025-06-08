import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { router as apiRouter } from '../../src/routes/api';
import { query } from '../../src/database/connection';

// Mock database functions
jest.mock('../../src/database/connection');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRouter);
  return app;
};

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  describe('Health Check', () => {
    test('should return 404 for root path', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(404);
    });
  });

  describe('Chat API', () => {
    test('should handle chat message', async () => {
      // Mock query to return empty results for test
      (query as jest.Mock).mockResolvedValue({
        rows: [],
        rowCount: 0
      });

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Tell me about the civil rights movement' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('sources');
    });

    test('should return 400 for missing message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Articles API', () => {
    test('should return articles with pagination', async () => {
      // Mock database query responses
      (query as jest.Mock).mockImplementation((queryString) => {
        if (queryString.includes('COUNT(*)')) {
          return Promise.resolve({
            rows: [{ total: '10' }]
          });
        } else {
          return Promise.resolve({
            rows: [
              {
                id: 1,
                title: 'Test Article',
                publish_date: '2023-01-01',
                publication: 'Test Publication',
                section: 'news',
                word_count: 500
              }
            ]
          });
        }
      });

      const response = await request(app)
        .get('/api/articles')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('articles');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.articles).toHaveLength(1);
    });
  });

  describe('Search API', () => {
    test('should search articles with query', async () => {
      // Mock database query response
      (query as jest.Mock).mockResolvedValue({
        rows: [
          {
            id: 1,
            title: 'Test Search Result',
            content: 'This is a test search result content',
            publish_date: '2023-01-01',
            publication: 'Test Publication',
            section: 'news'
          }
        ]
      });

      const response = await request(app)
        .get('/api/search/keyword')
        .query({ query: 'test search' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].title).toBe('Test Search Result');
    });

    test('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/search/semantic');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 