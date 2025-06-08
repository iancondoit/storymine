import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Story {
  id: string;
  title: string;
  summary: string;
  year: number;
  category: string;
  documentaryPotential: number;
  narrativeScore?: number;
  themes?: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface YearRange {
  id: string;
  name: string;
  description: string;
  count?: string;
}

const JordiDashboard: React.FC = () => {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [yearRanges, setYearRanges] = useState<YearRange[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [selectedYearRange, setSelectedYearRange] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadStories();
  }, []);

  // Reload stories when filters change
  useEffect(() => {
    if (categories.length > 0) {
      loadStories();
    }
  }, [selectedCategory, selectedYearRange]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/narrative/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.data.categories);
        setYearRanges(data.data.yearRanges);
      } else {
        setError('Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
    }
  };

  const loadStories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        yearRange: selectedYearRange,
        count: '10'
      });
      
      const response = await fetch(`/api/narrative/stories?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStories(data.data);
      } else {
        setError('Failed to load stories');
        setStories([]);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      setError('Failed to load stories');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshStories = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/narrative/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: selectedCategory,
          yearRange: selectedYearRange,
          count: 10
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStories(data.data);
      } else {
        setError('Failed to refresh stories');
      }
    } catch (error) {
      console.error('Error refreshing stories:', error);
      setError('Failed to refresh stories');
    } finally {
      setLoading(false);
    }
  };

  const openStory = (storyId: string) => {
    router.push(`/jordi/story/${storyId}`);
  };

  const getCategoryIcon = (categoryId: string): string => {
    const icons: Record<string, string> = {
      general: '🎬',
      politics: '🏛️',
      crime: '⚖️',
      war: '🎖️',
      business: '💼',
      sports: '⚾',
      women: '👩',
      protests: '✊',
      education: '📚',
      entertainment: '🎭'
    };
    return icons[categoryId] || '📰';
  };

  const getDocumentaryColor = (potential: number): string => {
    if (potential >= 80) return 'bg-green-100 text-green-800';
    if (potential >= 60) return 'bg-yellow-100 text-yellow-800';
    if (potential >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Head>
        <title>Jordi - Story Discovery Dashboard | StoryMine</title>
        <meta name="description" content="Discover compelling documentary stories from 282,388 Atlanta Constitution articles (1920-1961)" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  🎬 Jordi
                  <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    v3.0.0
                  </span>
                </h1>
                <p className="mt-1 text-gray-600">
                  Documentary Story Discovery • 282,388 Atlanta Constitution articles (1920-1961)
                </p>
              </div>
              <button
                onClick={refreshStories}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>{loading ? 'Loading...' : 'Give me more'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Controls */}
          <div className="mb-8 space-y-6">
            {/* Category Filters */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Story Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{getCategoryIcon(category.id)}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Year Range Filters */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Time Periods</h3>
              <div className="flex flex-wrap gap-2">
                {yearRanges.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedYearRange(range.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedYearRange === range.id
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {range.name}
                    {range.count && (
                      <span className="ml-1 text-xs opacity-75">({range.count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== 'general' || selectedYearRange !== 'all') && (
            <div className="mb-6 flex items-center space-x-4 text-sm text-gray-600">
              <span>Active filters:</span>
              {selectedCategory !== 'general' && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedYearRange !== 'all' && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {yearRanges.find(r => r.id === selectedYearRange)?.name}
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCategory('general');
                  setSelectedYearRange('all');
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <span className="text-red-800">{error}</span>
                <button
                  onClick={loadStories}
                  className="ml-auto text-red-600 hover:text-red-800 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Discovering stories...</p>
            </div>
          )}

          {/* Stories Grid */}
          {!loading && stories.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => openStory(story.id)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                >
                  {/* Story Header */}
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {story.year}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentaryColor(story.documentaryPotential)}`}>
                      {story.documentaryPotential}% potential
                    </span>
                  </div>

                  {/* Story Content */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {story.summary}
                  </p>

                  {/* Story Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center">
                      {getCategoryIcon(selectedCategory)}
                      <span className="ml-1">{story.category}</span>
                    </span>
                    {story.narrativeScore && (
                      <span>Narrative: {story.narrativeScore}%</span>
                    )}
                  </div>

                  {/* Themes */}
                  {story.themes && story.themes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {story.themes.slice(0, 3).map((theme, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No Stories State */}
          {!loading && stories.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No stories found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or clearing them to see more results.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('general');
                  setSelectedYearRange('all');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JordiDashboard; 