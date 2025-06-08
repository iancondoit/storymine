import { NextApiRequest, NextApiResponse } from 'next';

// In production on Railway, the backend Express server runs on localhost:3001 within the same container
// In development, use the environment variable or default to localhost:3001
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:3001/api' // Internal backend server for production
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

interface ArchiveStats {
  articles: number;
  entities: number;
  relationships: number;
  dateRange: {
    earliest: string | null;
    latest: string | null;
    years: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Default empty stats
    const defaultStats: ArchiveStats = {
      articles: 0,
      entities: 0,
      relationships: 0,
      dateRange: {
        earliest: null,
        latest: null,
        years: 0
      }
    };

    console.log(`Fetching stats from: ${API_BASE_URL}/database/stats`);

    // Try to fetch stats from the backend with improved timeout and error handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/database/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'StoryMine-Frontend-Stats',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`Backend stats API returned ${response.status}: ${response.statusText}`);
      return res.status(200).json(defaultStats);
    }

    const backendStats = await response.json();
    console.log('Successfully fetched backend stats:', backendStats);
    
    // Process and return the stats
    const stats: ArchiveStats = {
      articles: backendStats.articles || 0,
      entities: backendStats.entities || 0,
      relationships: backendStats.relationships || 0,
      dateRange: {
        earliest: backendStats.dateRange?.earliest || null,
        latest: backendStats.dateRange?.latest || null,
        years: backendStats.dateRange?.years || 0
      }
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching archive stats:', error);
    
    // Return default empty stats on error
    res.status(200).json({
      articles: 0,
      entities: 0,
      relationships: 0,
      dateRange: {
        earliest: null,
        latest: null,
        years: 0
      }
    });
  }
} 