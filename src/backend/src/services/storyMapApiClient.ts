import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { 
  RelationshipListResponse, 
  NetworkResponse,
  SearchResponse
} from '../models/storyMapModels';
// Import the connection manager
const connectionManager = require('../../scripts/api-connection-manager');

/**
 * Possible API environments
 */
export enum ApiEnvironment {
  MOCK = 'mock',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * Authentication methods
 */
export enum AuthMethod {
  NONE = 'none',
  API_KEY = 'api_key',
  OAUTH = 'oauth',
  JWT = 'jwt'
}

/**
 * Get API URLs from environment or use defaults
 */
const getApiUrls = (): Record<string, string[]> => {
  // Get STORYMAP_API_URLS from environment variable, fallback to Docker host if not set
  const envUrls = process.env.STORYMAP_API_URLS?.split(',') || [];
  
  // Default URLs for each environment with Docker-friendly ordering
  const defaultUrls = {
    [ApiEnvironment.MOCK]: ['http://host.docker.internal:8080', 'http://localhost:8080'],
    [ApiEnvironment.DEVELOPMENT]: ['http://host.docker.internal:8080', 'http://localhost:8080'],
    [ApiEnvironment.STAGING]: ['https://staging-api.storymap.com'],
    [ApiEnvironment.PRODUCTION]: ['https://api.storymap.com']
  };

  // Return environment URLs if specified, otherwise use defaults
  return {
    [ApiEnvironment.MOCK]: envUrls.length > 0 ? envUrls : defaultUrls[ApiEnvironment.MOCK],
    [ApiEnvironment.DEVELOPMENT]: envUrls.length > 0 ? envUrls : defaultUrls[ApiEnvironment.DEVELOPMENT],
    [ApiEnvironment.STAGING]: envUrls.length > 0 ? envUrls : defaultUrls[ApiEnvironment.STAGING],
    [ApiEnvironment.PRODUCTION]: envUrls.length > 0 ? envUrls : defaultUrls[ApiEnvironment.PRODUCTION]
  };
};

/**
 * Environment-specific API URLs
 */
const API_URLS = getApiUrls();

/**
 * Common parameters for API requests
 */
export interface ApiParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}

/**
 * Structure for API response
 */
export interface ApiResponse<T = any> {
  error: boolean;
  status?: number;
  message?: string;
  data?: T;
  meta?: any;
  retryAfter?: number;
}

/**
 * StoryMap JWT token response
 */
export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Article interface
 */
export interface Article {
  id: string;
  title: string;
  content: string;
  category?: string;
  publicationDate?: string;
  source?: string;
  isAdvertisement?: boolean;
  qualityScore?: number;
  wordCount?: number;
  language?: string;
  entities?: Entity[];
  relationships?: Relationship[];
}

/**
 * Entity interface
 */
export interface Entity {
  id: string;
  name: string;
  entityType: string;
  confidence?: number;
  article_count?: number;
  articles?: any[];
  article_ids?: string[];
  created_at?: string;
  total_mentions?: number;
  avg_relevance?: number;
  co_occurring_entities?: Entity[];
  co_occurrence_count?: number;
}

/**
 * Relationship interface
 */
export interface Relationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  confidence?: number;
}

/**
 * Ping response interface
 */
export interface PingResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Entity interface with additional metadata
 */
export interface EntityWithMetadata extends Entity {
  article_count?: number;
  articles?: any[];
  article_ids?: string[];
  created_at?: string;
  total_mentions?: number;
  avg_relevance?: number;
  co_occurring_entities?: Entity[];
}

/**
 * Entity list response with metadata
 */
export interface EntityListResponse {
  entities: EntityWithMetadata[];
  meta: {
    total_count: number;
    limit: number;
    offset: number;
    type_filter?: string;
    available_types?: string[];
  };
}

/**
 * StoryMap API Client
 */
export class StoryMapApiClient {
  private environment: ApiEnvironment;
  private authMethod: AuthMethod;
  private clientId: string;
  private clientSecret: string;
  private apiKey: string; // kept for backwards compatibility
  private apiSecret: string; // kept for backwards compatibility
  private activeUrl: string;
  private apiClient: AxiosInstance;
  private jwtToken: string | null = null;
  private tokenExpiry: number = 0;
  private maxBatchSize: number;
  private rateLimit: number;
  private tokenExpiryDuration: number;
  private useTestDataset: boolean;
  private maxRetries: number;
  private retryDelay: number;

  /**
   * Constructor - creates a new StoryMap API client
   */
  constructor() {
    // Get environment and authentication settings
    this.environment = (process.env.API_ENVIRONMENT as ApiEnvironment) || ApiEnvironment.MOCK;
    this.authMethod = (process.env.AUTH_METHOD as AuthMethod) || AuthMethod.NONE;
    this.clientId = process.env.STORYMAP_CLIENT_ID || '';
    this.clientSecret = process.env.STORYMAP_CLIENT_SECRET || '';
    this.apiKey = process.env.STORYMAP_API_KEY || '';
    this.apiSecret = process.env.STORYMAP_API_SECRET || '';
    
    // Additional configuration from environment
    this.maxBatchSize = parseInt(process.env.MAX_BATCH_SIZE || '500', 10);
    this.rateLimit = parseInt(process.env.RATE_LIMIT || '60', 10);
    this.tokenExpiryDuration = parseInt(process.env.TOKEN_EXPIRY || '86400', 10);
    this.useTestDataset = process.env.USE_TEST_DATASET === 'true';
    this.maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10);
    this.retryDelay = parseInt(process.env.RETRY_DELAY || '2000', 10);
    
    // Get available URLs for the current environment
    const availableUrls = API_URLS[this.environment];
    if (!availableUrls || availableUrls.length === 0) {
      throw new Error(`No API URLs configured for environment: ${this.environment}`);
    }
    
    // Set initial URL from the first available for the environment
    this.activeUrl = availableUrls[0];
    
    // Create axios instance with retry capability
    this.apiClient = this.createApiClient();
    
    // Log initialization
    console.log(`StoryMapApiClient initialized with environment: ${this.environment}`);
    console.log(`Initial API URL: ${this.activeUrl}`);
    console.log(`Auth method: ${this.authMethod}`);
    console.log(`Available URLs: ${availableUrls.join(', ')}`);
    
    // Test connectivity to the API
    this.ping().then(pingResponse => {
      if (pingResponse.success && pingResponse.url) {
        console.log(`Successfully connected to StoryMap API at ${pingResponse.url}`);
      } else {
        console.error(`Failed to connect to StoryMap API: ${pingResponse.error || 'Unknown error'}`);
        // Try alternative URLs in the background
        this.tryNextUrl();
      }
    }).catch(error => {
      console.error('Error during initial ping:', error);
    });
  }

  /**
   * Try alternative URLs if the current one fails
   */
  private async tryNextUrl(): Promise<boolean> {
    const availableUrls = API_URLS[this.environment];
    
    // Filter out the current URL
    const alternativeUrls = availableUrls.filter(url => url !== this.activeUrl);
    
    if (alternativeUrls.length === 0) {
      console.error('No alternative URLs available');
      return false;
    }
    
    for (const url of alternativeUrls) {
      try {
        console.log(`Trying alternative URL: ${url}`);
        
        // Create a temporary client
        const tempClient = axios.create({
          baseURL: url,
          timeout: 5000,
          headers: this.getAuthHeaders()
        });
        
        // Try a simple request
        const response = await tempClient.get('/api/articles?limit=1');
        
        if (response.status === 200) {
          console.log(`Alternative URL ${url} is working, switching`);
          this.activeUrl = url;
          this.apiClient = this.createApiClient();
          return true;
        }
      } catch (error) {
        console.error(`Failed to connect to alternative URL ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    console.error('All alternative URLs failed');
    return false;
  }

  /**
   * Get current environment
   */
  public getEnvironment(): ApiEnvironment {
    return this.environment;
  }

  /**
   * Set environment
   */
  public setEnvironment(env: ApiEnvironment): void {
    this.environment = env;
    this.activeUrl = API_URLS[this.environment][0];
    this.apiClient = this.createApiClient();
  }

  /**
   * Get current authentication method
   */
  public getAuthMethod(): AuthMethod {
    return this.authMethod;
  }

  /**
   * Set authentication method
   */
  public setAuthMethod(method: AuthMethod): void {
    this.authMethod = method;
    this.apiClient = this.createApiClient();
  }

  /**
   * Ping the API to check availability
   */
  public async ping(maxRetries = 1): Promise<PingResponse> {
    const availableUrls = API_URLS[this.environment];
    
    // Try each URL with retries
    for (const url of availableUrls) {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`Pinging StoryMap API at ${url} (attempt ${attempt + 1}/${maxRetries})`);
          
          // Create a temporary axios instance for this URL
          const tempClient = axios.create({
            baseURL: url,
            timeout: 5000, // Short timeout for ping
            headers: this.getAuthHeaders()
          });
          
          // Make a simple request to check if API is available
          const response = await tempClient.get('/articles?limit=1');
          
          if (response && response.status === 200) {
            // API is available, update active URL and client
            this.activeUrl = url;
            this.apiClient = this.createApiClient();
            return { success: true, url };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Ping failed to ${url} (attempt ${attempt + 1}/${maxRetries}): ${errorMessage}`);
          
          // Wait before retrying
          if (attempt < maxRetries - 1) {
            await this.delay(this.retryDelay);
          }
        }
      }
    }
    
    // All URLs failed
    return { 
      success: false, 
      error: `Failed to connect to any StoryMap API URL after ${maxRetries} attempts per URL`
    };
  }

  /**
   * Get JWT token for API authentication
   */
  public async getJwtToken(): Promise<string | null> {
    // Check if we have a valid token
    if (this.jwtToken && this.tokenExpiry > Date.now()) {
      return this.jwtToken;
    }

    try {
      // Create a temporary client without auth headers
      const tempClient = axios.create({
        baseURL: this.activeUrl,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      // Request new token
      const response = await tempClient.post('/auth/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      if (response.status === 200 && response.data) {
        this.jwtToken = response.data.access_token;
        // Set expiry time using the configured token expiry (minus 5 minutes for safety)
        const expirySeconds = response.data.expires_in || this.tokenExpiryDuration;
        this.tokenExpiry = Date.now() + ((expirySeconds - 300) * 1000);
        return this.jwtToken;
      } else {
        console.error('Failed to obtain JWT token:', response.data);
        return null;
      }
    } catch (error) {
      console.error('Error obtaining JWT token:', error);
      return null;
    }
  }

  /**
   * Get the correct endpoint path based on environment
   * - Use /api prefix for all environments based on actual API structure
   */
  private getEndpointPath(path: string): string {
    // FastAPI endpoints don't use /api prefix - return path as-is
    return path;
  }

  /**
   * Add test dataset parameter if configured
   */
  private addTestDatasetParam(params: ApiParams = {}): ApiParams {
    if (this.useTestDataset && this.environment === ApiEnvironment.PRODUCTION) {
      return { ...params, env: 'test_dataset' };
    }
    return params;
  }

  /**
   * Get articles with pagination
   */
  public async getArticles(params: ApiParams = {}): Promise<ApiResponse<{ articles: any[], limit: number, page: number, total: number }>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath('/articles');
      const updatedParams = this.addTestDatasetParam(params);
      
      const response = await this.apiClient.get(endpoint, {
        params: updatedParams,
        headers
      });
      
      // Handle the new response format with data wrapper
      if (response.data && response.data.data) {
        return { 
          error: false, 
          data: response.data.data,
          meta: response.data.meta
        };
      }
      
      // StoryMap API returns articles array directly, so wrap it in expected format
      const articles = Array.isArray(response.data) ? response.data : [];
      return { 
        error: false, 
        data: {
          articles,
          total: articles.length,
          limit: params.limit || 20,
          page: Math.floor((params.offset || 0) / (params.limit || 20)) + 1
        }
      };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Get single article by ID
   */
  public async getArticle(id: string): Promise<ApiResponse<Article>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath(`/articles/${id}`);
      const params = this.addTestDatasetParam();
      
      const response = await this.apiClient.get(endpoint, {
        params,
        headers
      });
      
      // Handle the new response format with data wrapper
      if (response.data && response.data.data) {
        try {
          const articleData = this.validateArticleResponse(response.data.data);
          return { 
            error: false, 
            data: articleData,
            meta: response.data.meta
          };
        } catch (validationError) {
          return {
            error: true,
            status: 422,
            message: (validationError as Error).message
          };
        }
      }
      
      // Handle legacy format for backward compatibility
      try {
        const articleData = this.validateArticleResponse(response.data);
        return { error: false, data: articleData };
      } catch (validationError) {
        return {
          error: true,
          status: 422,
          message: (validationError as Error).message
        };
      }
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Get all entities with optional filtering
   */
  public async getEntities(params: ApiParams = {}): Promise<ApiResponse<EntityListResponse>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath('/entities');
      const updatedParams = this.addTestDatasetParam(params);
      
      const response = await this.apiClient.get(endpoint, {
        params: updatedParams,
        headers
      });
      
      return { 
        error: false, 
        data: response.data,
        meta: response.data.meta
      };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Get entity by ID
   */
  public async getEntityById(entityId: string): Promise<ApiResponse<EntityWithMetadata>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath(`/entities/id/${entityId}`);
      
      const response = await this.apiClient.get(endpoint, {
        headers
      });
      
      return { 
        error: false, 
        data: response.data
      };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Get entities by type
   */
  public async getEntitiesByType(entityType: string, params: ApiParams = {}): Promise<ApiResponse<EntityListResponse>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath(`/entities/type/${entityType}`);
      const updatedParams = this.addTestDatasetParam(params);
      
      const response = await this.apiClient.get(endpoint, {
        params: updatedParams,
        headers
      });
      
      return { 
        error: false, 
        data: response.data,
        meta: response.data.meta
      };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Search articles
   */
  public async searchArticles(query: string, params: ApiParams = {}): Promise<ApiResponse<SearchResponse>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath('/search');
      
      const response = await this.apiClient.post(endpoint, {
        query,
        ...params
      }, {
        headers
      });
      
      // Handle the new response format with data wrapper
      if (response.data && response.data.data) {
        return { 
          error: false, 
          data: response.data.data,
          meta: response.data.meta
        };
      }
      
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Create a batch processing job
   */
  public async createBatchJob(articleIds: string[], operations: string[]): Promise<ApiResponse<{ batch_id: string, status: string, items_count: number }>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath('/batch');
      
      const response = await this.apiClient.post(endpoint, {
        article_ids: articleIds,
        operations
      }, {
        headers
      });
      
      // Handle the new response format with data wrapper
      if (response.data && response.data.data) {
        return { 
          error: false, 
          data: response.data.data,
          meta: response.data.meta
        };
      }
      
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Get batch job status
   */
  public async getBatchJobStatus(batchId: string): Promise<ApiResponse<{ batch_id: string, status: string, items_processed: number, items_count: number }>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath(`/batch/${batchId}`);
      
      const response = await this.apiClient.get(endpoint, {
        headers
      });
      
      // Handle the new response format with data wrapper
      if (response.data && response.data.data) {
        return { 
          error: false, 
          data: response.data.data,
          meta: response.data.meta
        };
      }
      
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Get relationships for an entity
   */
  public async getEntityRelationships(entityId: string, params: ApiParams = {}): Promise<ApiResponse<RelationshipListResponse>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath(`/entities/${entityId}/relationships`);
      
      const response = await this.apiClient.get(endpoint, {
        params,
        headers
      });
      
      // Validate response data
      if (response.data && response.data.data) {
        return { 
          error: false, 
          data: response.data.data,
          meta: response.data.meta
        };
      }
      
      // Handle legacy format
      if (!response.data || !Array.isArray(response.data.relationships)) {
        return {
          error: true,
          status: 422,
          message: 'Invalid relationship data received from API'
        };
      }
      
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Get entity network (related entities with common connections)
   */
  public async getEntityNetwork(entityId: string, depth: number = 1, params: ApiParams = {}): Promise<ApiResponse<NetworkResponse>> {
    try {
      // Get JWT token if needed
      let headers = this.getAuthHeaders();
      if (this.authMethod === AuthMethod.JWT) {
        const token = await this.getJwtToken();
        if (token) {
          headers = { ...headers, 'Authorization': `Bearer ${token}` };
        }
      }
      
      const endpoint = this.getEndpointPath(`/entities/${entityId}/network`);
      
      const response = await this.apiClient.get(endpoint, {
        params: {
          ...params,
          depth
        },
        headers
      });
      
      // Handle the new response format with data wrapper
      if (response.data && response.data.data) {
        return { 
          error: false, 
          data: response.data.data,
          meta: response.data.meta
        };
      }
      
      return { error: false, data: response.data };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }

  /**
   * Create an axios client with retry logic for the API
   * @param baseURL Base URL for the API
   * @returns Configured axios instance
   */
  private createApiClient(baseURL: string = this.activeUrl): AxiosInstance {
    // Create axios instance
    const client = axios.create({
      baseURL,
      timeout: parseInt(process.env.API_TIMEOUT || '15000', 10),
      headers: this.getAuthHeaders()
    });
    
    // Configure axios-retry
    axiosRetry(client, {
      retries: this.maxRetries,
      retryDelay: (retryCount) => {
        // Exponential backoff with jitter
        const delay = Math.pow(2, retryCount) * this.retryDelay;
        const jitter = delay * 0.2 * Math.random();
        return delay + jitter;
      },
      retryCondition: (error) => {
        // Retry on network errors and 5xx responses
        return !!(
          axiosRetry.isNetworkError(error) || 
          (error.response && error.response.status >= 500) ||
          // Also retry on connection refused errors common in Docker networking
          (error.code === 'ECONNREFUSED') ||
          // Rate limiting (429) with retry-after header
          (error.response && error.response.status === 429)
        );
      },
      onRetry: (retryCount, error, requestConfig) => {
        // Log retry attempts
        console.log(`Retrying request to ${requestConfig.url} (attempt ${retryCount}/${this.maxRetries})`);
        
        // If rate limited, use the retry-after header if available
        if (error.response && error.response.status === 429 && error.response.headers['retry-after']) {
          const retryAfter = parseInt(error.response.headers['retry-after'], 10) * 1000;
          console.log(`Rate limited, waiting ${retryAfter}ms before retry`);
        }
      }
    });
    
    return client;
  }

  /**
   * Get authentication headers (synchronous version)
   */
  private getAuthHeaders(): Record<string, string> {
    switch (this.authMethod) {
      case AuthMethod.API_KEY:
        return { 'Authorization': `Bearer ${this.apiKey}` };
      case AuthMethod.JWT:
        // Base headers only - JWT token will be added separately
        return {};
      case AuthMethod.OAUTH:
        // Legacy OAuth support
        return { 'Authorization': `Bearer ${this.getOAuthToken()}` };
      default:
        return {};
    }
  }

  /**
   * Get OAuth token (placeholder)
   */
  private getOAuthToken(): string {
    // TODO: Implement proper OAuth token retrieval
    return 'oauth-token';
  }

  /**
   * Handle API errors with improved error reporting for Docker networking issues
   * @param error The error to handle
   * @returns Standardized API response with error information
   */
  private handleApiError(error: any): ApiResponse {
    // Check for Docker networking specific errors
    if (error.code === 'ECONNREFUSED' || error.code === 'EHOSTUNREACH' || error.code === 'ENOTFOUND') {
      console.error(`Docker networking error: ${error.code} - ${error.message}`);
      
      // Provide Docker-specific troubleshooting information
      let troubleshooting = [
        "1. Check that the StoryMap API container is running",
        "2. Verify host.docker.internal is properly configured",
        "3. On Linux, make sure you added 'host.docker.internal:host-gateway' to extra_hosts",
        "4. Try restarting the Docker containers",
        "5. Check Docker network settings"
      ].join('\n');
      
      return {
        error: true,
        status: 503,
        message: `Docker networking error: ${error.message}. The StoryMap API appears to be unreachable.`,
        data: {
          code: error.code,
          troubleshooting
        }
      };
    }

    // Regular error handling logic
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('StoryMap API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      // Check for rate limiting
      if (error.response.status === 429) {
        // Extract retry-after header if available
        const retryAfter = error.response.headers['retry-after'] ? 
          parseInt(error.response.headers['retry-after'], 10) * 1000 : 
          this.retryDelay;
        
        return {
          error: true,
          status: 429,
          message: 'Rate limit exceeded',
          retryAfter,
          data: error.response.data
        };
      }
      
      return {
        error: true,
        status: error.response.status,
        message: error.response.data?.message || 'Error from StoryMap API',
        data: error.response.data
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('StoryMap API No Response:', error.request);
      
      // Try alternative URL in background
      this.tryNextUrl().catch(e => console.error('Failed to try next URL:', e));
      
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
  }

  /**
   * Validate article response data
   */
  private validateArticleResponse(data: any): Article {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid article data: not an object');
    }
    
    // Make id validation more flexible - accept number or string
    if (data.id === undefined || data.id === null) {
      throw new Error('Invalid article data: missing ID');
    }
    
    // Make validation more permissive - only require id, allow missing title/content
    const title = data.title || 'Untitled Article';
    const content = data.content || '';
    
    // Process entity data if present
    let entities = [];
    if (data.entities && Array.isArray(data.entities)) {
      entities = data.entities.map((entity: any) => {
        return {
          id: entity.id || `gen_${Math.random().toString(36).substring(2, 10)}`,
          name: entity.name || 'Unknown Entity',
          entityType: entity.type || entity.entityType || 'UNKNOWN',
          confidence: entity.confidence || 0.5,
          // Keep mentions if available
          ...(entity.mentions && { mentions: entity.mentions })
        };
      });
    }
    
    // Process relationship data if present
    let relationships = [];
    if (data.relationships && Array.isArray(data.relationships)) {
      relationships = data.relationships;
    }
    
    // Return validated data with defaults for optional fields
    return {
      id: data.id.toString(), // Convert to string for consistency
      title,
      content,
      category: data.category || 'uncategorized',
      publicationDate: data.publication_date || data.publicationDate || null,
      source: data.source || data.publication || 'Unknown',
      isAdvertisement: data.is_advertisement || data.isAdvertisement || false,
      qualityScore: data.quality_score || data.qualityScore || 0,
      wordCount: data.word_count || data.wordCount || 0,
      language: data.language || 'en',
      entities,
      relationships
    };
  }

  /**
   * Utility method to delay execution
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get articles related to a specific entity
   */
  public async getArticlesByEntity(entityId: string, options: { limit?: number; offset?: number; sort?: string } = {}): Promise<ApiResponse> {
    try {
      const { limit = 10, offset = 0, sort = 'relevance' } = options;
      
      const url = `${this.activeUrl}/entities/${entityId}/articles`;
      const queryParams = new URLSearchParams();
      
      if (limit) queryParams.append('limit', limit.toString());
      if (offset) queryParams.append('offset', offset.toString());
      if (sort) queryParams.append('sort', sort);
      
      const response = await this.apiClient.get(url, {
        params: queryParams
      });
      
      return {
        data: response.data,
        error: false
      };
    } catch (error) {
      return this.handleApiError(error as Error | AxiosError);
    }
  }
} 