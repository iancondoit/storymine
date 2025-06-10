import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Archive, Clock, Sparkles, Film, RotateCcw } from 'lucide-react';

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
  const [newStoriesCount, setNewStoriesCount] = useState<number>(0);

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
        setNewStoriesCount(0); // Reset when loading fresh stories
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
      const response = await fetch(`/api/narrative/refresh?t=${Date.now()}`, {
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
        // Add new stories to the top of the existing list
        setStories(prevStories => [...data.data, ...prevStories]);
        setNewStoriesCount(data.data.length);
        // Clear the new stories indicator after a short delay
        setTimeout(() => setNewStoriesCount(0), 3000);
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
    if (potential >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (potential >= 80) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (potential >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (potential >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <>
      <Head>
        <title>Jordi - Documentary Story Discovery | StoryMine</title>
        <meta name="description" content="Discover compelling documentary stories from 282,388 Atlanta Constitution articles (1920-1961)" />
      </Head>

      {/* Scientific grid background - matching home page */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.dark.900/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.dark.900/10)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,theme(colors.white/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/10)_1px,transparent_1px)]"></div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-dark-800/20 dark:bg-white/20"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-dark-800/20 dark:bg-white/20"></div>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-white to-dark-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-500">
        {/* Header */}
        <header className="pt-8 pb-12 relative">
          <div className="container-base relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-display font-bold text-dark-900 dark:text-white flex items-center">
                  🎬 Jordi
                  <span className="ml-3 text-sm font-normal text-dark-500 dark:text-dark-400 bg-dark-100 dark:bg-dark-700 px-3 py-1 rounded-md">
                    v3.1.0
                  </span>
                </h1>
                <p className="mt-2 text-xl text-dark-600 dark:text-dark-300">
                  Documentary Story Discovery • 282,388 Atlanta Constitution articles (1920-1961)
                </p>
                
                {/* Mathematical formula for effect */}
                <div className="mt-4 py-2 px-3 bg-dark-50 dark:bg-dark-800/50 rounded-md inline-flex items-center font-mono text-sm text-dark-900 dark:text-dark-200 border border-dark-200 dark:border-dark-700">
                  <span className="mr-2 text-accent-800 dark:text-accent-600">ƒ(D<sub>p</sub>)</span> = 
                  <span className="mx-2">∑</span>
                  <span>N(t) · C(r) · V(s)</span>
                  <span className="ml-3 text-dark-500 dark:text-dark-400">// documentary potential function</span>
                </div>
              </div>
              <button
                onClick={refreshStories}
                disabled={loading}
                className="btn-primary flex items-center space-x-2 py-3 px-6"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Discovering stories...' : stories.length > 0 ? 'Discover more' : 'Give me more'}</span>
              </button>
            </div>
            
            {/* Decorative DNA sequence - matching home page */}
            <div className="absolute top-32 right-10 w-64 h-64 opacity-20 dark:opacity-10 hidden lg:block">
              <svg viewBox="0 0 100 400" xmlns="http://www.w3.org/2000/svg" className="text-accent-800 dark:text-accent-600">
                <path d="M30,0 Q60,50 30,100 Q0,150 30,200 Q60,250 30,300 Q0,350 30,400" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M70,0 Q40,50 70,100 Q100,150 70,200 Q40,250 70,300 Q100,350 70,400" stroke="currentColor" strokeWidth="2" fill="none" />
                
                {/* DNA "rungs" */}
                {[0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375].map((y) => (
                  <line key={y} x1="30" y1={y} x2="70" y2={y} stroke="currentColor" strokeWidth="1.5" />
                ))}
                
                {/* Story symbols instead of base pairs */}
                {[12, 37, 62, 87, 112, 137, 162, 187, 212, 237, 262, 287, 312, 337, 362, 387].map((y, i) => (
                  <text key={y} x="45" y={y} fontSize="8" textAnchor="middle" fill="currentColor">
                    {['S', 'T', 'O', 'R', 'Y', 'M', 'I', 'N', 'E', 'J', 'O', 'R', 'D', 'I', 'A', 'I'][i]}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </header>

        <main className="pb-24">
          <div className="container-base">
            {/* Filter Controls */}
            <div className="mb-8 space-y-6">
              {/* Category Filters */}
              <div className="card p-6 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600 mr-3">
                    <Archive className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-dark-900 dark:text-white">Story Categories</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'bg-accent-600 border-accent-600 text-white dark:bg-accent-700 dark:border-accent-700'
                          : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:border-accent-300 dark:hover:border-accent-600'
                      }`}
                    >
                      <span className="mr-2">{getCategoryIcon(category.id)}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Periods */}
              <div className="card p-6 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600 mr-3">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-dark-900 dark:text-white">Time Periods</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {yearRanges.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedYearRange(range.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                        selectedYearRange === range.id
                          ? 'bg-accent-600 border-accent-600 text-white dark:bg-accent-700 dark:border-accent-700'
                          : 'bg-white dark:bg-dark-800 border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-300 hover:border-accent-300 dark:hover:border-accent-600'
                      }`}
                    >
                      {range.name}
                      {range.count && (
                        <span className="ml-2 text-xs bg-dark-100 dark:bg-dark-600 px-2 py-0.5 rounded">
                          {range.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stories Section */}
            <div className="card border border-dark-100 dark:border-dark-700">
              <div className="p-6 border-b border-dark-100 dark:border-dark-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600 mr-3">
                      <Film className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white">Documentary Stories</h2>
                      <p className="text-dark-600 dark:text-dark-300">
                        {loading ? 'Discovering stories...' : `${stories.length} stories discovered with documentary potential`}
                        {newStoriesCount > 0 && (
                          <span className="ml-3 inline-flex items-center px-2 py-1 rounded-md text-xs bg-accent-100 dark:bg-accent-900/30 text-accent-800 dark:text-accent-400 animate-bounce">
                            +{newStoriesCount} new
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
                      <span className="text-dark-600 dark:text-dark-300">Discovering stories...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                {!loading && !error && stories.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-dark-500 dark:text-dark-400">No stories found for the selected criteria.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {stories.map((story, index) => (
                    <div
                      key={story.id}
                      onClick={() => openStory(story.id)}
                      className={`bg-white dark:bg-dark-800 border rounded-lg p-6 cursor-pointer hover:border-accent-300 dark:hover:border-accent-600 transition-all duration-200 hover:shadow-lg dark:hover:shadow-dark-900/50 ${
                        index < newStoriesCount 
                          ? 'border-accent-400 dark:border-accent-500 shadow-md animate-pulse bg-accent-50/20 dark:bg-accent-900/10' 
                          : 'border-dark-200 dark:border-dark-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDocumentaryColor(story.documentaryPotential)}`}>
                            {story.documentaryPotential}% potential
                          </span>
                          <span className="text-sm text-dark-500 dark:text-dark-400 font-mono">{story.year}</span>
                          <span className="text-sm text-dark-500 dark:text-dark-400 capitalize">
                            {getCategoryIcon(story.category)} {story.category}
                          </span>
                        </div>
                        {story.narrativeScore && (
                          <span className="text-sm text-accent-600 dark:text-accent-400 font-medium">
                            {story.narrativeScore}% narrative
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-display font-bold text-dark-900 dark:text-white mb-3 leading-tight">
                        {story.title}
                      </h3>
                      
                      <p className="text-dark-600 dark:text-dark-300 text-base leading-relaxed mb-4">
                        {story.summary}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {story.themes?.slice(0, 4).map((theme, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-dark-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 border border-dark-200 dark:border-dark-600"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default JordiDashboard; 