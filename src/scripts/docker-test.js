/**
 * Docker test script for StoryMap API
 * 
 * This script is designed to be run inside the Docker container
 * and will automatically discover the StoryMap API
 */

// Load environment variables from .env file if exists
require('dotenv').config();

// Use the connection manager
const connectionManager = require('./backend/scripts/api-connection-manager');

// Override connection manager's URLs for direct testing
const originalGetApiUrl = connectionManager.getApiUrl;
connectionManager.getApiUrl = async function() {
  // Try local URLs first when running from host
  const testUrls = [
    'http://localhost:8080',
    'http://localhost:5000',
    'http://localhost:3001',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5000'
  ];
  
  console.log('Testing direct localhost API connections...');
  for (const url of testUrls) {
    try {
      console.log(`Trying connection to StoryMap API at ${url}...`);
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        console.log(`✅ Success! Found working StoryMap API at ${url}`);
        return url;
      }
    } catch (error) {
      console.log(`❌ Failed to connect to ${url}: ${error.message}`);
    }
  }
  
  // If localhost tests fail, fall back to original implementation
  console.log('Falling back to original connection strategy...');
  return originalGetApiUrl.call(connectionManager);
};

// Main test function
async function runDockerTest() {
  console.log('=== Docker StoryMap API Test ===');
  console.log('Attempting to discover StoryMap API...');
  
  try {
    // Try to get the API URL
    const url = await connectionManager.getApiUrl();
    console.log(`Discovered API URL: ${url}`);
    
    // Check if API is available
    const isAvailable = await connectionManager.isAvailable();
    console.log(`API Available: ${isAvailable ? 'Yes' : 'No'}`);
    
    if (isAvailable) {
      // Try to get some articles
      console.log('\nRetrieving articles...');
      const articles = await connectionManager.getArticles({ limit: 10 });
      
      // Handle different response formats
      const articlesList = Array.isArray(articles) ? articles : 
                          (articles && articles.articles ? articles.articles : []);
      
      console.log(`Retrieved ${articlesList.length} articles`);
      
      if (articlesList.length > 0) {
        console.log('\nFirst article:');
        console.log(`  Title: ${articlesList[0].title}`);
        console.log(`  ID: ${articlesList[0].id}`);
        console.log(`  Publication: ${articlesList[0].publication}`);
        console.log(`  Word Count: ${articlesList[0].word_count}`);
        
        // Check for enhanced features
        const hasEntities = articlesList[0].entities && articlesList[0].entities.length > 0;
        const hasRelationships = articlesList[0].relationships && articlesList[0].relationships.length > 0;
        const hasCategory = articlesList[0].category !== null;
        
        console.log('\nEnhanced Features:');
        console.log(`  Entity Recognition: ${hasEntities ? '✅ Available' : '❌ Not Available'}`);
        console.log(`  Relationship Mapping: ${hasRelationships ? '✅ Available' : '❌ Not Available'}`);
        console.log(`  Categorization: ${hasCategory ? '✅ Available' : '❌ Not Available'}`);
      }
      
      // Try to get a specific article
      console.log('\nRetrieving specific article (ID: 50)...');
      const article = await connectionManager.getArticle(50);
      
      if (article) {
        console.log(`Retrieved article: ${article.title}`);
        console.log(`Word Count: ${article.word_count}`);
      }
    }
    
    console.log('\n=== Test Complete ===');
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

// Run the test
runDockerTest(); 