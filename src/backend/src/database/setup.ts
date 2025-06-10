/**
 * Database setup script
 * This script creates the necessary tables if they don't exist
 */

import { query } from './connection';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Create database tables if they don't exist
 */
export async function createTables(): Promise<void> {
  try {
    console.log('Creating database tables...');
    
    // Read the SQL setup file
    const sqlFilePath = path.join(__dirname, '../../../scripts/setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await query(statement);
      } catch (error) {
        // Log the error but continue with other statements
        console.warn(`Warning: Failed to execute statement: ${statement.substring(0, 100)}...`);
        console.warn(`Error: ${(error as Error).message}`);
      }
    }
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
} 