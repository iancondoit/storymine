import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// StoryMap API configuration - trying multiple possible URLs
const STORYMAP_API_URLS = [
  process.env.STORYMAP_API_URL || 'http://127.0.0.1:5001',
  'http://localhost:5001',
  'http://127.0.0.1:8000',
  'http://localhost:8000',
  'http://127.0.0.1:8080',
  'http://localhost:8080'
];

// Possible API URL to use after successful ping
let ACTIVE_API_URL = STORYMAP_API_URLS[0];

// API key (if needed)
const API_KEY = process.env.STORYMAP_API_KEY || '';

// Headers for API requests
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Add API key if available
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }
  
  return headers;
};

// Create axios instance for StoryMap API
const createApiClient = (baseURL: string) => {
  return axios.create({
    baseURL,
    timeout: 5000, // Short timeout for better responsiveness
    headers: getHeaders()
  });
};

// Use the first URL initially
let storyMapApiClient = createApiClient(ACTIVE_API_URL);

// API error handler
const handleApiError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('StoryMap API Error Response:', {
      status: error.response.status,
      data: error.response.data
    });
    return {
      error: true,
      status: error.response.status,
      message: error.response.data.message || 'Error from StoryMap API',
      data: error.response.data
    };
  } else if (error.request) {
    // The request was made but no response was received
    console.error('StoryMap API No Response:', error.request);
    return {
      error: true,
      status: 503,
      message: 'No response received from StoryMap API',
      data: null
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('StoryMap API Error:', error.message);
    return {
      error: true,
      status: 500,
      message: error.message,
      data: null
    };
  }
};

/**
 * Ping the StoryMap API to check availability
 * @returns Promise<boolean> - True if API is available, false otherwise
 */
export const pingStoryMapApi = async (): Promise<string | false> => {
  // Try each potential URL in order
  for (const apiUrl of STORYMAP_API_URLS) {
    console.log(`Trying StoryMap API at: ${apiUrl}`);
    try {
      // Create a client for this URL
      const client = createApiClient(apiUrl);
      
      // Try to call a simple endpoint
      const response = await client.get('/api/articles?limit=1', { 
        timeout: 3000 // Short timeout for ping
      });
      
      if (response.status === 200) {
        console.log(`Success! StoryMap API is available at ${apiUrl}`);
        // Set the active URL and create a new client
        ACTIVE_API_URL = apiUrl;
        storyMapApiClient = createApiClient(ACTIVE_API_URL);
        return apiUrl;
      }
    } catch (error) {
      console.error(`Failed to connect to ${apiUrl}:`, error instanceof Error ? error.message : 'Unknown error');
      // Try the next URL
    }
  }
  
  return false;
};

/**
 * Updates the active API URL
 * @param url The URL to use for the API
 */
export const setApiUrl = (url: string) => {
  ACTIVE_API_URL = url;
  storyMapApiClient = createApiClient(ACTIVE_API_URL);
  console.log(`API URL set to ${ACTIVE_API_URL}`);
};

// API methods
export const getArticles = async (params: any = {}) => {
  try {
    const response = await storyMapApiClient.get('/api/articles', { params });
    return { error: false, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getArticleById = async (id: string) => {
  try {
    const response = await storyMapApiClient.get(`/api/articles/${id}`);
    return { error: false, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const searchArticles = async (query: string, params: any = {}) => {
  try {
    const response = await storyMapApiClient.post('/api/search', {
      query,
      ...params
    });
    return { error: false, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getEntities = async (params: any = {}) => {
  try {
    const response = await storyMapApiClient.get('/api/entities', { params });
    return { error: false, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getEntitiesByType = async (entityType: string, params: any = {}) => {
  try {
    const response = await storyMapApiClient.get(`/api/entities/${entityType}`, { params });
    return { error: false, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};

export const filterArticles = async (filterCriteria: any) => {
  try {
    const response = await storyMapApiClient.post('/api/filter', filterCriteria);
    return { error: false, data: response.data };
  } catch (error) {
    return handleApiError(error);
  }
};
