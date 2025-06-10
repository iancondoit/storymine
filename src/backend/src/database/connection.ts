import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';
import { createTables } from './setup';

dotenv.config();

// Database connection configuration
const dbConfig = {
  // Production database should be specified via DATABASE_URL environment variable
  connectionString: process.env.DATABASE_URL,
  // Fallback to individual parameters for local development
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'storymine_local',
  // Handle SSL configuration
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: false } : 
    false
};

// Use connection string if available (for production AWS RDS)
const poolConfig = process.env.DATABASE_URL ? 
  { 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false },
    // Add connection timeout for Railway deployments
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10 // Limit pool size for Railway
  } :
  dbConfig;

console.log(`Connecting to database: ${process.env.DATABASE_URL ? 'AWS RDS PostgreSQL' : `${dbConfig.database} on ${dbConfig.host}`} (SSL: ${poolConfig.ssl ? 'enabled' : 'disabled'})`);

// Create pool
const pool = new Pool(poolConfig);

// Track connection status
let isConnected = false;
let connectionAttempts = 0;
const maxAttempts = 3;

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

// Database connection with timeout and retry
const connectWithTimeout = async (timeoutMs: number = 30000): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Database connection timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      clearTimeout(timeout);
      resolve(true);
    } catch (error) {
      clearTimeout(timeout);
      resolve(false);
    }
  });
};

// Database setup and verification with Railway-friendly retry logic
export const setupDatabase = async (): Promise<void> => {
  console.log('🔗 Connecting to AWS PostgreSQL database...');
  
  while (connectionAttempts < maxAttempts && !isConnected) {
    connectionAttempts++;
    const remainingTime = 30 - (connectionAttempts - 1) * 10; // 30s, 20s, 10s
    
    try {
      // Try to connect with timeout
      const connected = await connectWithTimeout(10000); // 10 second timeout per attempt
      
      if (connected) {
        isConnected = true;
        console.log('✅ Database connection established');
        
        let client: PoolClient | null = null;
        try {
          client = await pool.connect();
          
          // Only create tables in development - production AWS database should already have tables
          if (process.env.NODE_ENV !== 'production') {
            console.log('Development environment detected - creating tables if needed');
            await createTables();
          } else {
            console.log('Production environment - using existing AWS RDS database schema');
          }

          // Test access to required tables
          const tables = [
            'articles',
            'entities',
            'article_entities',
            'tags',
            'article_tags',
            'intelligence_articles',
            'intelligence_entities',
            'intelligence_relationships'
          ];
          
          for (const table of tables) {
            try {
              const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
              console.log(`✅ ${table}: ${result.rows[0].count} records`);
            } catch (error) {
              console.warn(`⚠️  Could not access ${table} table: ${(error as Error).message}`);
            }
          }
          
          return; // Success!
          
        } finally {
          if (client) client.release();
        }
      } else {
        throw new Error('Connection failed');
      }
      
    } catch (error) {
      console.log(`Attempt #${connectionAttempts} failed with service unavailable. Continuing to retry for ${remainingTime}s`);
      
      if (connectionAttempts >= maxAttempts) {
        console.warn('⚠️  Database connection failed after all retries. Server will start without database.');
        console.warn('   Database queries will fail until connection is restored.');
        console.warn('   Check AWS Security Group settings for Railway IP ranges.');
        
        // Don't throw error - let server start anyway
        return;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

// Background database reconnection for Railway deployments
export const retryDatabaseConnection = async (): Promise<void> => {
  if (isConnected) return;
  
  console.log('🔄 Attempting background database reconnection...');
  try {
    const connected = await connectWithTimeout(5000);
    if (connected) {
      isConnected = true;
      console.log('✅ Background database reconnection successful');
    }
  } catch (error) {
    console.log('⚠️  Background reconnection failed, will retry later');
  }
};

// Check if database is connected
export const isDatabaseConnected = (): boolean => {
  return isConnected;
};

// Close pool
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database pool closed');
}; 