import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoryMapStatus from '../../components/StoryMapStatus';
import * as api from '../../utils/api';

// Mock the API module
jest.mock('../../utils/api');

describe('StoryMapStatus Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading state initially', () => {
    render(<StoryMapStatus />);
    
    expect(screen.getByText(/connecting.../i)).toBeInTheDocument();
  });

  test('displays online status when API is available', async () => {
    // Mock successful API response
    const mockStats = {
      status: 'online',
      apiUrl: 'http://localhost:5001',
      articleCount: 5,
      entityCount: 8,
      lastUpdated: new Date().toISOString()
    };
    
    (api.getStoryMapStats as jest.Mock).mockResolvedValue(mockStats);
    
    render(<StoryMapStatus />);
    
    // Wait for the component to update with the API response
    await waitFor(() => {
      expect(screen.getByText(/storymap online/i)).toBeInTheDocument();
    });
    
    // Check that counts are displayed
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  test('displays error state when API is unavailable', async () => {
    // Mock API error
    (api.getStoryMapStats as jest.Mock).mockRejectedValue(new Error('API not available'));
    
    render(<StoryMapStatus />);
    
    // Wait for the component to show error state
    await waitFor(() => {
      expect(screen.getByText(/storymap error/i)).toBeInTheDocument();
    });
  });

  test('displays degraded status when API is partially functional', async () => {
    // Mock degraded API response
    const mockStats = {
      status: 'degraded',
      apiUrl: 'http://localhost:5001',
      articleCount: 5,
      entityCount: null,
      lastUpdated: new Date().toISOString(),
      message: 'Entity service unavailable'
    };
    
    (api.getStoryMapStats as jest.Mock).mockResolvedValue(mockStats);
    
    render(<StoryMapStatus />);
    
    // Wait for degraded status
    await waitFor(() => {
      expect(screen.getByText(/storymap degraded/i)).toBeInTheDocument();
    });
  });

  test('expands to show details when clicked', async () => {
    // Mock successful API response
    const mockStats = {
      status: 'online',
      apiUrl: 'http://localhost:5001',
      articleCount: 5,
      entityCount: 8,
      lastUpdated: new Date().toISOString()
    };
    
    (api.getStoryMapStats as jest.Mock).mockResolvedValue(mockStats);
    
    render(<StoryMapStatus />);
    
    // Wait for the component to update
    await waitFor(() => {
      expect(screen.getByText(/storymap online/i)).toBeInTheDocument();
    });
    
    // Initially, expanded content should not be visible
    expect(screen.queryByText(/api url/i)).not.toBeVisible();
    
    // Click to expand
    act(() => {
      userEvent.click(screen.getByText(/storymap online/i));
    });
    
    // Now expanded content should be visible
    await waitFor(() => {
      expect(screen.getByText(/api url/i)).toBeVisible();
    });
  });
}); 