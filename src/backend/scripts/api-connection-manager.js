/**
 * StoryMap API Connection Manager
 * 
 * This script handles finding and connecting to the StoryMap API
 * by trying multiple potential URLs and monitoring the connection.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ApiConnectionManager {
  constructor() {
    // Parse the comma-separated list of potential URLs, prioritizing localhost:8080 (real API)
    const urlString = process.env.STORYMAP_API_URLS || 'http://localhost:8080,http://host.docker.internal:8080';
    this.potentialUrls = urlString.split(',').map(url => url.trim());
    
    this.activeUrl = null;
    this.lastChecked = 0;
    this.checkInterval = 60000; // 1 minute
    this.connectionFile = path.join(__dirname, '../.storymap-connection');
    
    // Try to load previous working connection
    this.loadSavedConnection();
  }
  
  /**
   * Load previously saved connection if available
   */
  loadSavedConnection() {
    try {
      if (fs.existsSync(this.connectionFile)) {
        const savedUrl = fs.readFileSync(this.connectionFile, 'utf8').trim();
        if (savedUrl) {
          console.log(`Found previously working connection: ${savedUrl}`);
          this.activeUrl = savedUrl;
        }
      }
    } catch (error) {
      console.error('Error loading saved connection:', error.message);
    }
  }
  
  /**
   * Save working connection for future use
   */
  saveConnection(url) {
    try {
      fs.writeFileSync(this.connectionFile, url);
      console.log(`Saved working connection: ${url}`);
    } catch (error) {
      console.error('Error saving connection:', error.message);
    }
  }
  
  /**
   * Get the active StoryMap API URL
   * Will probe for a working connection if needed
   */
  async getApiUrl() {
    // If we have a recent active URL, return it
    const now = Date.now();
    if (this.activeUrl && (now - this.lastChecked < this.checkInterval)) {
      return this.activeUrl;
    }
    
    // Time to check connections
    this.lastChecked = now;
    
    // If we have an active URL, verify it still works
    if (this.activeUrl) {
      try {
        const response = await axios.get(`${this.activeUrl}/health`, { timeout: 3000 });
        if (response.status === 200) {
          console.log(`Confirmed existing connection to ${this.activeUrl} is still working`);
          return this.activeUrl;
        }
      } catch (error) {
        console.warn(`Previously working connection ${this.activeUrl} is no longer responding. Trying alternatives...`);
      }
    }
    
    // Try each potential URL
    for (const url of this.potentialUrls) {
      try {
        console.log(`Trying connection to StoryMap API at ${url}...`);
        const response = await axios.get(`${url}/health`, { timeout: 3000 });
        
        if (response.status === 200) {
          console.log(`✅ Success! Found working StoryMap API at ${url}`);
          this.activeUrl = url;
          this.saveConnection(url);
          return url;
        }
      } catch (error) {
        console.log(`❌ Failed to connect to ${url}: ${error.message}`);
      }
    }
    
    // No working connection found
    console.error('⚠️ Could not connect to any StoryMap API URL');
    
    // Return the last known working URL, or the first one if none worked before
    return this.activeUrl || this.potentialUrls[0];
  }
  
  /**
   * Check if StoryMap API is available
   */
  async isAvailable() {
    try {
      const url = await this.getApiUrl();
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get articles from StoryMap API
   */
  async getArticles(params = {}) {
    try {
      const url = await this.getApiUrl();
      const response = await axios.get(`${url}/api/articles`, { 
        params,
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching articles:', error.message);
      throw error;
    }
  }
  
  /**
   * Get article by ID from StoryMap API
   */
  async getArticle(id) {
    try {
      const url = await this.getApiUrl();
      const response = await axios.get(`${url}/api/articles/${id}`, { 
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching article ${id}:`, error.message);
      throw error;
    }
  }
}

// Create and export a singleton instance
const connectionManager = new ApiConnectionManager();
module.exports = connectionManager;

// If running as a script, check connection
if (require.main === module) {
  (async () => {
    try {
      const url = await connectionManager.getApiUrl();
      console.log(`Active StoryMap API URL: ${url}`);
      
      const isAvailable = await connectionManager.isAvailable();
      console.log(`API Available: ${isAvailable ? 'Yes' : 'No'}`);
      
      if (isAvailable) {
        // Try to get the first few articles
        const articles = await connectionManager.getArticles({ limit: 5 });
        console.log(`Retrieved ${Array.isArray(articles) ? articles.length : 'unknown'} articles`);
      }
    } catch (error) {
      console.error('Error in connection test:', error.message);
    }
  })();
} 