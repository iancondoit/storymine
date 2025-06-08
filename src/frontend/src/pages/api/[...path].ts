import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API proxy route that forwards requests to the backend
 * This avoids CORS issues in the browser
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the path from the dynamic route
    const { path } = req.query;
    
    // Construct the backend URL (use Docker service name)
    const backendUrl = `http://backend:3001/api/${Array.isArray(path) ? path.join('/') : path}`;
    
    // Forward the query parameters
    const queryString = Object.entries(req.query)
      .filter(([key]) => key !== 'path') // Remove the path parameter
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    // Add query string to URL if it exists
    const url = queryString ? `${backendUrl}?${queryString}` : backendUrl;
    
    console.log(`Proxying request to: ${url}`);
    
    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward other headers as needed
      },
    };
    
    // Only add body for non-GET/HEAD requests
    if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }
    
    // Forward the request to the backend
    const response = await fetch(url, fetchOptions);
    
    // Get the response data with safe parsing
    let data;
    try {
      const text = await response.text();
      // Try to parse as JSON, fall back to text if not valid JSON
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { text };
      }
    } catch (error) {
      data = { message: "Could not read response body" };
    }
    
    // Return the response with appropriate status
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request to backend' });
  }
} 