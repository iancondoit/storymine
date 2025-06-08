/**
 * API client for communicating with the StoryMine backend
 */

// In browser environment, use a relative URL to avoid CORS issues
const isBrowser = typeof window !== 'undefined';
const API_BASE_URL = isBrowser 
  ? '/api' 
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

console.log('API_BASE_URL:', API_BASE_URL);

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Generic fetch function with error handling
 */
async function fetchFromApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Fetching from ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Add credentials to support cookies if needed
      credentials: 'include',
    });

    // Try to parse the JSON response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error('Invalid response format');
    }

    if (!response.ok) {
      // Check for error details in the response
      const errorMessage = data?.error || `API error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}

/**
 * Get articles with pagination and optional filtering
 */
export async function getArticles(params: {
  page?: number;
  limit?: number;
  publication?: string;
  from?: string;
  to?: string;
  section?: string;
} = {}) {
  const queryParams = new URLSearchParams();
  
  // Add all params that are defined
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromApi(`/articles${query}`);
}

/**
 * Search articles using different search methods
 */
export async function searchArticles(params: {
  query: string;
  searchType?: 'semantic' | 'keyword' | 'hybrid';
  page?: number;
  limit?: number;
}) {
  const { query, searchType = 'hybrid', page, limit } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('query', query);
  
  if (page !== undefined) queryParams.append('page', page.toString());
  if (limit !== undefined) queryParams.append('limit', limit.toString());
  
  return fetchFromApi(`/search/${searchType}?${queryParams.toString()}`);
}

/**
 * Get entities with optional type filtering
 */
export async function getEntities(params: {
  type?: string;
  page?: number;
  limit?: number;
} = {}) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromApi(`/entities${query}`);
}

/**
 * Get relationships between an entity and other entities
 */
export async function getEntityRelationships(entityName: string, limit?: number) {
  const queryParams = new URLSearchParams();
  if (limit !== undefined) queryParams.append('limit', limit.toString());
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromApi(`/entities/${encodeURIComponent(entityName)}/relationships${query}`);
}

/**
 * Send a message to the chat API and get a response
 */
export async function sendChatMessage(message: string) {
  return fetchFromApi('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * StoryMap API stats response type
 */
export interface StoryMapStats {
  status: 'online' | 'offline' | 'degraded' | 'error';
  apiUrl?: string;
  articleCount?: number;
  entityCount?: number;
  lastUpdated?: string;
  message?: string;
}

/**
 * Get StoryMap API stats
 */
export async function getStoryMapStats(): Promise<StoryMapStats> {
  return fetchFromApi<StoryMapStats>('/storymap-stats');
}

/**
 * Other API functions can be added here
 */ 