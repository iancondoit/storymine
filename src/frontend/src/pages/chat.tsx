import { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Import ChatInterface with no SSR to avoid hydration issues
const ChatInterface = dynamic(() => import('@/components/ChatInterface'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-900">
      <div className="text-center">
        <h2 className="text-xl font-display font-bold mb-2 text-dark-800 dark:text-white">Loading Archival Engine...</h2>
        <p className="text-dark-600 dark:text-dark-300 mb-6">One moment while we connect to our genomic data core.</p>
        
        {/* DNA helix loading animation */}
        <div className="relative w-12 h-12 mx-auto mb-3">
          <div className="absolute w-2 h-full bg-accent-600 dark:bg-accent-700 left-5 rounded-full animate-pulse"></div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="absolute h-1 w-6 bg-accent-500 dark:bg-accent-600 rounded-full left-3" 
              style={{ 
                top: `${i * 5 + 1}px`, 
                animationDelay: `${i * 0.1}s`,
                animation: 'pulse 1.5s infinite ease-in-out'
              }}
            ></div>
          ))}
        </div>
        
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-dark-50 dark:bg-dark-800 text-dark-600 dark:text-dark-300 text-xs font-mono">
          <div className="w-2 h-2 bg-accent-600 dark:bg-accent-500 rounded-full animate-pulse mr-2"></div>
          Initializing pattern recognition
        </div>
      </div>
    </div>
  )
});

export default function ChatPage() {
  // Force client-side rendering to avoid hydration issues
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Add 'dark' class to the HTML tag for dark mode by default
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);
  
  return (
    <>
      <Head>
        <title>Research Assistant - StoryMine Historical Genome Archive</title>
        <meta name="description" content="Explore historical archives with genomic search technology" />
      </Head>
      
      <div className="min-h-screen bg-white dark:bg-dark-900">
        {isClient && <ChatInterface />}
      </div>
    </>
  );
} 