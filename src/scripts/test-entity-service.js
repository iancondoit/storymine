/**
 * Test Entity Service
 * 
 * This script tests the Entity Service functionality by:
 * 1. Finding entities matching a search term
 * 2. Fetching details for the first matching entity
 * 3. Retrieving a timeline for that entity
 * 4. Getting relationship information for that entity
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:3001/api';
const SEARCH_TERM = process.argv[2] || 'Birmingham'; // Default search term

// Helper function to make API requests with error handling
async function makeRequest(endpoint, params = {}) {
  try {
    const url = `${API_URL}${endpoint}`;
    console.log(`Making request to: ${url}`);
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`API Error (${error.response.status}):`, error.response.data);
    } else {
      console.error('Error making request:', error.message);
    }
    return null;
  }
}

// Format and print entity information
function printEntity(entity) {
  console.log('\n===== ENTITY DETAILS =====');
  console.log(`ID: ${entity.id}`);
  console.log(`Name: ${entity.name}`);
  console.log(`Type: ${entity.entity_type || 'Unknown'}`);
  
  if (entity.article_count) {
    console.log(`Mentioned in: ${entity.article_count} articles`);
  }
  
  if (entity.article_ids) {
    console.log(`Article IDs: ${entity.article_ids.slice(0, 5).join(', ')}${entity.article_ids.length > 5 ? '...' : ''}`);
  }
  
  if (entity.co_occurring_entities && entity.co_occurring_entities.length > 0) {
    console.log('\nRelated Entities:');
    entity.co_occurring_entities.slice(0, 5).forEach(related => {
      console.log(`- ${related.name} (${related.entityType || 'Unknown'}): ${related.co_occurrence_count || 'Unknown'} co-occurrences`);
    });
  }
}

// Format and print timeline
function printTimeline(timeline) {
  console.log('\n===== ENTITY TIMELINE =====');
  
  if (!timeline || timeline.length === 0) {
    console.log('No timeline entries found.');
    return;
  }
  
  timeline.forEach(entry => {
    console.log(`\n${entry.date}: ${entry.title}`);
    if (entry.content) {
      // Truncate long content
      const content = entry.content.length > 100 
        ? entry.content.substring(0, 100) + '...' 
        : entry.content;
      console.log(`  ${content}`);
    }
    console.log(`  Source: ${entry.source || 'Unknown'}`);
  });
}

// Format and print network
function printNetwork(network) {
  console.log('\n===== ENTITY NETWORK =====');
  
  if (!network) {
    console.log('No network information found.');
    return;
  }
  
  console.log(`Nodes: ${network.nodes.length}`);
  console.log(`Edges: ${network.edges.length}`);
  
  if (network.nodes.length > 0) {
    console.log('\nTop related entities:');
    network.nodes.slice(0, 5).forEach(node => {
      console.log(`- ${node.name} (${node.entity_type || 'Unknown'})`);
    });
  }
}

// Main function to run the tests
async function testEntityService() {
  console.log(`\n🔍 Testing Entity Service with search term: "${SEARCH_TERM}"`);
  
  // 1. Search for entities
  const searchResults = await makeRequest('/entities/search', { query: SEARCH_TERM });
  
  if (!searchResults || !searchResults.entities || searchResults.entities.length === 0) {
    console.error('No entities found matching the search term. Try a different term.');
    return;
  }
  
  console.log(`\n✅ Found ${searchResults.entities.length} entities matching "${SEARCH_TERM}"`);
  
  // Get the first entity
  const firstEntity = searchResults.entities[0];
  console.log(`Using entity: ${firstEntity.name} (${firstEntity.id})`);
  
  // 2. Fetch entity details
  const entityDetails = await makeRequest(`/entities/${firstEntity.id}`);
  
  if (entityDetails) {
    printEntity(entityDetails);
  }
  
  // 3. Get entity timeline
  const timelineData = await makeRequest(`/entities/${firstEntity.id}/timeline`);
  
  if (timelineData && timelineData.timeline) {
    printTimeline(timelineData.timeline);
  }
  
  // 4. Get entity network
  const networkData = await makeRequest(`/entities/${firstEntity.id}/network`);
  
  if (networkData && networkData.network) {
    printNetwork(networkData.network);
  }
  
  console.log('\n✅ Entity Service test completed');
}

// Run the test
testEntityService().catch(error => {
  console.error('Error running test:', error);
  process.exit(1);
}); 