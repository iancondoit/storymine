import axios from 'axios';
import { pingStoryMapApi } from './storyMapApi';
import { 
  Entity, 
  TimelineEntry,
  NetworkGraph 
} from '../models/storyMapModels';
import { cacheService } from './cache';

// Cache TTL values
const ENTITY_CACHE_TTL = 1800; // 30 minutes
const ENTITY_LIST_CACHE_TTL = 900; // 15 minutes
const TIMELINE_CACHE_TTL = 1200; // 20 minutes
const NETWORK_CACHE_TTL = 1800; // 30 minutes

/**
 * Entity Service
 * Handles operations related to entities from StoryMap API
 */
class EntityService {
  /**
   * Get an entity by ID with caching
   * @param entityId - The entity ID to fetch
   * @returns The entity or null if not found
   */
  async getEntity(entityId: string): Promise<Entity | null> {
    // Try to get from cache first
    const cacheKey = `entity:${entityId}`;
    const cachedEntity = cacheService.get(cacheKey);
    
    if (cachedEntity) {
      return cachedEntity;
    }
    
    try {
      // Get the active API URL
      const apiUrl = await pingStoryMapApi();
      if (!apiUrl) {
        console.error('StoryMap API not available');
        return null;
      }
      
      // Fetch the entity from the API
      const response = await axios.get(`${apiUrl}/api/entities/${entityId}`, { 
        timeout: 5000 
      });
      
      if (response.data) {
        // Cache the entity
        cacheService.set(cacheKey, response.data, ENTITY_CACHE_TTL);
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching entity ${entityId}:`, error);
      return null;
    }
  }
  
  /**
   * Get entities matching a search term
   * @param searchTerm - The search term to match against entity names
   * @param entityType - Optional type filter (e.g., 'PERSON', 'ORGANIZATION')
   * @param limit - Maximum number of entities to return
   * @returns Array of matching entities
   */
  async searchEntities(
    searchTerm: string, 
    entityType?: string, 
    limit: number = 10
  ): Promise<Entity[]> {
    try {
      // Create cache key based on parameters
      const cacheKey = `entity:search:${searchTerm}:${entityType || 'all'}:${limit}`;
      const cachedResults = cacheService.get(cacheKey);
      
      if (cachedResults) {
        return cachedResults;
      }
      
      // Get the active API URL
      const apiUrl = await pingStoryMapApi();
      if (!apiUrl) {
        console.error('StoryMap API not available');
        return [];
      }
      
      // Build query parameters
      const params: any = {
        search: searchTerm,
        limit
      };
      
      if (entityType) {
        params.type = entityType;
      }
      
      // Fetch matching entities from the API
      const response = await axios.get(`${apiUrl}/api/entities`, { 
        params,
        timeout: 5000 
      });
      
      if (response.data && response.data.entities) {
        // Cache the results
        cacheService.set(cacheKey, response.data.entities, ENTITY_LIST_CACHE_TTL);
        return response.data.entities;
      }
      
      return [];
    } catch (error) {
      console.error(`Error searching entities for "${searchTerm}":`, error);
      return [];
    }
  }
  
  /**
   * Get a timeline for an entity
   * @param entityId - The entity ID to get timeline for
   * @param startDate - Optional start date filter (ISO format)
   * @param endDate - Optional end date filter (ISO format)
   * @returns Array of timeline entries
   */
  async getEntityTimeline(
    entityId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<TimelineEntry[]> {
    try {
      // Create cache key based on parameters
      const cacheKey = `entity:timeline:${entityId}:${startDate || 'start'}:${endDate || 'end'}`;
      const cachedTimeline = cacheService.get(cacheKey);
      
      if (cachedTimeline) {
        return cachedTimeline;
      }
      
      // Get the active API URL
      const apiUrl = await pingStoryMapApi();
      if (!apiUrl) {
        console.error('StoryMap API not available');
        return [];
      }
      
      // Build query parameters
      const params: any = {};
      
      if (startDate) {
        params.start_date = startDate;
      }
      
      if (endDate) {
        params.end_date = endDate;
      }
      
      // Fetch entity timeline from the API
      const response = await axios.get(`${apiUrl}/api/entities/${entityId}/timeline`, { 
        params,
        timeout: 8000 // Longer timeout for timeline generation
      });
      
      if (response.data && response.data.timeline) {
        // Cache the timeline
        cacheService.set(cacheKey, response.data.timeline, TIMELINE_CACHE_TTL);
        return response.data.timeline;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching timeline for entity ${entityId}:`, error);
      return [];
    }
  }
  
  /**
   * Get relationships for an entity
   * @param entityId - The entity ID
   * @param depth - Relationship network depth (default: 1)
   * @returns Network graph or null if error
   */
  async getEntityRelationships(
    entityId: string, 
    depth: number = 1
  ): Promise<NetworkGraph | null> {
    try {
      // Create cache key based on parameters
      const cacheKey = `entity:network:${entityId}:${depth}`;
      const cachedNetwork = cacheService.get(cacheKey);
      
      if (cachedNetwork) {
        return cachedNetwork;
      }
      
      // Get the active API URL
      const apiUrl = await pingStoryMapApi();
      if (!apiUrl) {
        console.error('StoryMap API not available');
        return null;
      }
      
      // Fetch entity network from the API
      const response = await axios.get(`${apiUrl}/api/entities/${entityId}/network`, { 
        params: { depth },
        timeout: 10000 // Longer timeout for network generation
      });
      
      if (response.data && response.data.network) {
        // Cache the network
        cacheService.set(cacheKey, response.data.network, NETWORK_CACHE_TTL);
        return response.data.network;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching relationships for entity ${entityId}:`, error);
      return null;
    }
  }
}

/**
 * Create and export an instance of the entity service
 */
export const entityService = new EntityService(); 