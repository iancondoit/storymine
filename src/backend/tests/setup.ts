import dotenv from 'dotenv';

// Load environment variables from .env.test if present, otherwise from .env
dotenv.config({ path: '.env.test' });
dotenv.config();

// Set a default test timeout of 10 seconds
jest.setTimeout(10000);

// Mock the database connection
jest.mock('../src/database/connection', () => {
  return {
    query: jest.fn(),
    getClient: jest.fn(),
    setupDatabase: jest.fn(),
    closePool: jest.fn(),
  };
}); 