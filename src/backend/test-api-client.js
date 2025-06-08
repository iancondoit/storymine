/**
 * StoryMap API Connection Test Script
 * 
 * This script tests the connection to the StoryMap API with detailed logging.
 * It can be used to validate connectivity from different environments.
 */

require('dotenv').config();
const { StoryMapApiClient, ApiEnvironment, AuthMethod } = require('./dist/services/storyMapApiClient');

// Create logger
const logger = {
  log: (message) => console.log(`[INFO] ${message}`),
  error: (message, error) => console.error(`[ERROR] ${message}`, error),
  warn: (message) => console.warn(`[WARN] ${message}`),
  info: (message) => console.info(`[INFO] ${message}`),
};

// Print environment information
logger.info(`StoryMap API Test - ${new Date().toISOString()}`);
logger.info(`Node version: ${process.version}`);
logger.info(`OS: ${process.platform} ${process.arch}`);
logger.info('Environment variables:');
logger.info(`- API_ENVIRONMENT: ${process.env.API_ENVIRONMENT || 'not set'}`);
logger.info(`- AUTH_METHOD: ${process.env.AUTH_METHOD || 'not set'}`);
logger.info(`- STORYMAP_API_URL: ${process.env.STORYMAP_API_URL || 'not set'}`);
logger.info(`- STORYMAP_CLIENT_ID: ${process.env.STORYMAP_CLIENT_ID ? 'set' : 'not set'}`);
logger.info(`- STORYMAP_CLIENT_SECRET: ${process.env.STORYMAP_CLIENT_SECRET ? 'set' : 'not set'}`);
logger.info(`- STORYMAP_API_KEY: ${process.env.STORYMAP_API_KEY ? 'set' : 'not set'}`);

// Create client
logger.info('Creating StoryMapApiClient...');
const apiClient = new StoryMapApiClient();

// Verify environment
const environment = apiClient.getEnvironment();
logger.info(`API Environment: ${environment}`);

// Verify auth method
const authMethod = apiClient.getAuthMethod();
logger.info(`Auth Method: ${authMethod}`);

// Test connection sequence
async function testConnection() {
  try {
    // Test 1: Ping the API
    logger.info('Test 1: Pinging StoryMap API...');
    const pingResult = await apiClient.ping(3);
    if (pingResult.success) {
      logger.info(`✅ Ping successful! Connected to: ${pingResult.url}`);
    } else {
      logger.error(`❌ Ping failed: ${pingResult.error}`);
      process.exit(1);
    }

    // Test 2: Get JWT token (if using JWT auth)
    if (authMethod === AuthMethod.JWT) {
      logger.info('Test 2: Retrieving JWT token...');
      const token = await apiClient.getJwtToken();
      if (token) {
        logger.info('✅ JWT token retrieved successfully!');
      } else {
        logger.error('❌ Failed to retrieve JWT token');
        process.exit(1);
      }
    } else {
      logger.info('Test 2: Skipping JWT token test (not using JWT auth)');
    }

    // Test 3: Get articles (basic operation)
    logger.info('Test 3: Retrieving articles...');
    const articlesResult = await apiClient.getArticles({ limit: 1 });
    if (!articlesResult.error) {
      logger.info(`✅ Articles retrieved successfully! Count: ${articlesResult.data?.articles?.length || 0}`);
    } else {
      logger.error(`❌ Failed to retrieve articles: ${articlesResult.message}`);
      process.exit(1);
    }

    // Test 4: Get entities (another basic operation)
    logger.info('Test 4: Retrieving entities...');
    const entitiesResult = await apiClient.getEntities({ limit: 1 });
    if (!entitiesResult.error) {
      logger.info(`✅ Entities retrieved successfully! Count: ${entitiesResult.data?.entities?.length || 0}`);
    } else {
      logger.error(`❌ Failed to retrieve entities: ${entitiesResult.message}`);
      process.exit(1);
    }

    // Test 5: Search articles (more complex operation)
    logger.info('Test 5: Searching articles...');
    const searchResult = await apiClient.searchArticles('test', { limit: 1 });
    if (!searchResult.error) {
      logger.info(`✅ Search completed successfully! Results: ${searchResult.data?.results?.length || 0}`);
    } else {
      logger.error(`❌ Failed to search articles: ${searchResult.message}`);
      process.exit(1);
    }

    // All tests passed
    logger.info('✅ All tests passed! StoryMap API connection is working properly.');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Unhandled error during tests:', error);
    process.exit(1);
  }
}

// Run tests
testConnection();
