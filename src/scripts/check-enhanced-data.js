/**
 * Check for enhanced data features in StoryMap API
 * This script examines if entity recognition, relationship mapping,
 * and other enhancements have been implemented
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Simple HTTP GET request function
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          reject(`Error parsing response: ${e.message}`);
        }
      });
    }).on('error', (err) => {
      reject(`Request failed: ${err.message}`);
    });
  });
}

// Main function to test enhanced data features
async function checkEnhancedData() {
  console.log('Checking for Enhanced StoryMap Data Features');
  console.log(`Base URL: ${BASE_URL}`);
  
  try {
    // Sample a few different articles to find potential enhancements
    const sampleIds = [5, 10, 20, 50, 100, 150, 200];
    
    for (const id of sampleIds) {
      console.log(`\n--------------------------------------`);
      console.log(`Examining article ID: ${id}`);
      
      try {
        const result = await httpGet(`${BASE_URL}/api/articles/${id}`);
        
        if (result.status === 200 && result.data) {
          // Check for entity recognition
          const hasEntities = result.data.entities && result.data.entities.length > 0;
          console.log(`Entity Recognition: ${hasEntities ? '✅ IMPLEMENTED' : '❌ NOT YET AVAILABLE'}`);
          
          if (hasEntities) {
            console.log(`  Found ${result.data.entities.length} entities`);
            console.log('  Sample entities:');
            result.data.entities.slice(0, 3).forEach(entity => {
              console.log(`    - ${entity.name} (${entity.type})`);
            });
          }
          
          // Check for relationship mapping
          const hasRelationships = result.data.relationships && result.data.relationships.length > 0;
          console.log(`Relationship Mapping: ${hasRelationships ? '✅ IMPLEMENTED' : '❌ NOT YET AVAILABLE'}`);
          
          if (hasRelationships) {
            console.log(`  Found ${result.data.relationships.length} relationships`);
            console.log('  Sample relationships:');
            result.data.relationships.slice(0, 3).forEach(rel => {
              console.log(`    - ${rel.source_entity_id} -> ${rel.target_entity_id} (${rel.type})`);
            });
          }
          
          // Check for content categorization
          const hasCategory = result.data.category !== null;
          console.log(`Content Categorization: ${hasCategory ? '✅ IMPLEMENTED' : '❌ NOT YET AVAILABLE'}`);
          
          if (hasCategory) {
            console.log(`  Category: ${result.data.category}`);
          }
          
          // Check for sentiment analysis
          const hasSentiment = result.data.sentiment !== undefined;
          console.log(`Sentiment Analysis: ${hasSentiment ? '✅ IMPLEMENTED' : '❌ NOT YET AVAILABLE'}`);
          
          if (hasSentiment) {
            console.log(`  Sentiment: ${JSON.stringify(result.data.sentiment)}`);
          }
          
          // Check for content quality scoring
          const hasQualityScore = result.data.quality_score !== undefined && result.data.quality_score !== 1;
          console.log(`Quality Scoring: ${hasQualityScore ? '✅ IMPLEMENTED' : '❌ BASIC IMPLEMENTATION'}`);
          
          if (hasQualityScore) {
            console.log(`  Quality Score: ${result.data.quality_score}`);
          }
          
          // Check for additional metadata
          console.log('\nAdditional metadata:');
          console.log(`  Word Count: ${result.data.word_count || 'N/A'}`);
          console.log(`  Publication Date: ${result.data.publication_date || 'N/A'}`);
          console.log(`  Source: ${result.data.source || 'N/A'}`);
          console.log(`  Is Advertisement: ${result.data.is_advertisement !== undefined ? result.data.is_advertisement : 'N/A'}`);
          
          // If this article has good enhancement data, show more details
          if (hasEntities || hasRelationships || hasCategory || hasSentiment) {
            console.log('\n✨ This article has enhanced data! Full details:');
            console.log(JSON.stringify(result.data, null, 2).substring(0, 500) + '...');
            break; // Found an enhanced article, no need to continue
          }
        } else {
          console.log(`  Failed to fetch article: ${result.status}`);
        }
      } catch (error) {
        console.error(`  Error examining article ${id}: ${error}`);
      }
    }
    
    // Check if entity endpoint is available
    console.log(`\n--------------------------------------`);
    console.log('Checking for dedicated entity endpoints');
    
    try {
      const entityResult = await httpGet(`${BASE_URL}/api/entities`);
      console.log(`Entities Endpoint: ${entityResult.status === 200 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      
      if (entityResult.status === 200) {
        const entities = Array.isArray(entityResult.data) ? entityResult.data : 
                       (entityResult.data && entityResult.data.entities) || [];
        console.log(`  Found ${entities.length} entities via API endpoint`);
        if (entities.length > 0) {
          console.log('  Sample entities:');
          entities.slice(0, 3).forEach(entity => {
            console.log(`    - ${JSON.stringify(entity)}`);
          });
        }
      }
    } catch (error) {
      console.error(`  Error checking entities endpoint: ${error}`);
    }
    
    // Check if search capabilities have been enhanced
    console.log(`\n--------------------------------------`);
    console.log('Checking for enhanced search capabilities');
    
    try {
      const searchResult = await httpGet(`${BASE_URL}/api/articles?search=Decatur`);
      console.log(`Basic Search: ${searchResult.status === 200 ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
      
      if (searchResult.status === 200) {
        const articles = Array.isArray(searchResult.data) ? searchResult.data : 
                       (searchResult.data && searchResult.data.articles) || [];
        console.log(`  Found ${articles.length} articles containing "Decatur"`);
      }
      
      // Check for entity-based search
      const entitySearchResult = await httpGet(`${BASE_URL}/api/articles?entity_type=PERSON&entity_name=Roosevelt`);
      const hasEntitySearch = entitySearchResult.status === 200 && 
                             ((Array.isArray(entitySearchResult.data) && entitySearchResult.data.length > 0) || 
                             (entitySearchResult.data && entitySearchResult.data.articles && entitySearchResult.data.articles.length > 0));
      
      console.log(`Entity-based Search: ${hasEntitySearch ? '✅ IMPLEMENTED' : '❌ NOT YET AVAILABLE'}`);
      
      if (hasEntitySearch) {
        const articles = Array.isArray(entitySearchResult.data) ? entitySearchResult.data : 
                       (entitySearchResult.data && entitySearchResult.data.articles) || [];
        console.log(`  Found ${articles.length} articles mentioning "Roosevelt"`);
      }
    } catch (error) {
      console.error(`  Error checking search capabilities: ${error}`);
    }
    
    console.log(`\n--------------------------------------`);
    console.log('Enhanced data assessment complete');
    
  } catch (error) {
    console.error(`Overall Error: ${error}`);
  }
}

// Run the script
checkEnhancedData(); 