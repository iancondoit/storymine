/**
 * API client for the chat functionality
 */

import { ChatMessage } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Send a chat message to the backend and get a response
 */
export async function sendChatMessage(
  message: string, 
  conversationId?: string
): Promise<{
  response: string;
  sources: any[];
  entities?: any[];
  timeline?: any[];
  conversation_id?: string;
  token_usage?: { input: number; output: number };
  error?: string;
}> {
  try {
    const url = `${API_BASE_URL}/chat`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message,
        conversationId: conversationId || 'default'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        response: '', 
        sources: [],
        error: data.error || `Error ${response.status}: ${response.statusText}` 
      };
    }

    return { 
      response: data.response || '',
      sources: data.sources || [],
      entities: data.entities || [],
      timeline: data.timeline || [],
      conversation_id: data.conversation_id,
      token_usage: data.token_usage
    };
  } catch (error) {
    console.error('API request failed:', error);
    return { 
      response: '',
      sources: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(conversationId: string): Promise<{
  messages: ChatMessage[];
  error?: string;
}> {
  try {
    const url = `${API_BASE_URL}/conversations/${conversationId}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return { 
        messages: [],
        error: data.error || `Error ${response.status}: ${response.statusText}` 
      };
    }

    return { 
      messages: data.messages || []
    };
  } catch (error) {
    console.error('API request failed:', error);
    return { 
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Clear conversation history
 */
export async function clearConversationHistory(conversationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const url = `${API_BASE_URL}/conversations/${conversationId}`;
    
    const response = await fetch(url, {
      method: 'DELETE'
    });
    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false,
        error: data.error || `Error ${response.status}: ${response.statusText}` 
      };
    }

    return { 
      success: true
    };
  } catch (error) {
    console.error('API request failed:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get suggested stories from the backend
 */
export async function getSuggestedStories(): Promise<{
  stories: any[];
  error?: string;
}> {
  try {
    const url = `${API_BASE_URL}/articles?limit=3`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return { 
        stories: [],
        error: data.error || `Error ${response.status}: ${response.statusText}` 
      };
    }

    // Format the articles into story suggestions
    const stories = data.articles.map((article: any) => ({
      id: article.id,
      title: article.title,
      description: article.snippet || `${article.publication}, ${new Date(article.publish_date).toLocaleDateString()}`,
      date: article.publish_date
    }));

    return { stories };
  } catch (error) {
    console.error('API request failed:', error);
    return { 
      stories: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
} 