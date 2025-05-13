import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import { createTables, seedSampleData } from './setup';

dotenv.config();

// Database connection configuration
const dbConfig = {
  // For StoryMap production database
  user: process.env.DB_USER || 'storymine_app',
  password: process.env.DB_PASSWORD || 'access_needed', // This should be provided securely
  host: process.env.DB_HOST || 'storymap-db.internal.domain', 
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'storymap',
  // Handle SSL configuration
  ssl: process.env.DB_SSL_MODE === 'require' ? 
    { rejectUnauthorized: false } : 
    process.env.NODE_ENV === 'production' ? 
      { rejectUnauthorized: false } : 
      false
};

console.log(`Connecting to database: ${dbConfig.database} on ${dbConfig.host} (SSL: ${dbConfig.ssl ? 'enabled' : 'disabled'})`);

// Create pool
const pool = new Pool(dbConfig);

// Wrapper function for database queries with error handling
export const query = async (text: string, params: any[] = []) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log(`Executed query: ${text}`);
      console.log(`Duration: ${duration}ms, Rows: ${result.rowCount}`);
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

// Database setup and verification
export const setupDatabase = async (): Promise<void> => {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database');
    
    // Only create tables and seed data if we're using a development database
    const isLocalDevelopment = dbConfig.host === 'localhost';
    if (isLocalDevelopment) {
      // Create tables if they don't exist
      await createTables();
      
      // Seed sample data if needed
      await seedSampleData();
    } else {
      console.log('Connected to production database - skipping table creation and sample data seeding');
    }

    // Test access to required tables
    const tables = [
      'articles',
      'entities',
      'article_entities',
      'tags',
      'article_tags'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`Verified access to ${table} table`);
      } catch (error) {
        console.warn(`Could not access ${table} table: ${error}`);
      }
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database');
  } finally {
    if (client) client.release();
  }
};

// Close pool
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database pool closed');
}; 