/**
 * Application configuration
 */

// Load environment variables
require('dotenv').config();

export const config = {
  // Server configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // API configuration
  API_ENVIRONMENT: process.env.API_ENVIRONMENT || 'development',
  
  // StoryMap API configuration - using real API
  STORYMAP_API_URLS: process.env.STORYMAP_API_URLS || 'http://localhost:8080',
  
  // Cache configuration
  CACHE_ENABLED: process.env.CACHE_ENABLED === 'true',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Claude API configuration
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY || '',
  
  // Performance settings
  API_TIMEOUT: parseInt(process.env.API_TIMEOUT || '15000', 10),
  MAX_CONNECTIONS: parseInt(process.env.MAX_CONNECTIONS || '100', 10),
  
  // Additional configurations
  RATE_LIMIT: parseInt(process.env.RATE_LIMIT || '120', 10),
  TOKEN_EXPIRY: parseInt(process.env.TOKEN_EXPIRY || '86400', 10),
}; 