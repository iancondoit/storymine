import Link from 'next/link';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Archive, MessageSquare, BookOpen, Database, Search, Sparkles } from 'lucide-react';
import StoryMapStatus from '@/components/StoryMapStatus';
import Logo from '@/components/Logo';

// Animated number counter component
function AnimatedCounter({ end, duration = 2000 }: { end: number, duration?: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration]);
  
  return <>{count.toLocaleString()}</>;
}

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

export default function Home() {
  const [stats, setStats] = useState<ArchiveStats>({
    articles: 282388,
    entities: 1061535,
    relationships: 1219127,
    dateRange: {
      earliest: "1920",
      latest: "1961",
      years: 42
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Temporarily use the real stats data directly
        const realStats = {
          articles: 282388,
          entities: 1061535,
          relationships: 1219127,
          dateRange: {
            earliest: "1920",
            latest: "1961",
            years: 42
          }
        };
        
        setStats(realStats);
        console.log('✅ Using real StoryMap Intelligence data:', realStats);
      } catch (error) {
        console.warn('Error fetching archive stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Research topics now show as placeholder until real data is available
  const researchTopics = [
    { name: "Awaiting StoryMap Intelligence Data", count: 0 },
    { name: "Historical Entity Network Analysis", count: 0 },
    { name: "Temporal Document Relationships", count: 0 },
    { name: "Documentary Story Discovery", count: 0 },
    { name: "Narrative Thread Construction", count: 0 }
  ];
  
  return (
    <>
      <Head>
        <title>StoryMine - Historical Genome Archive</title>
        <meta name="description" content="Discover lost stories from history with Jordi, your archival assistant" />
      </Head>
      
      {/* Scientific grid background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.dark.900/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.dark.900/10)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,theme(colors.white/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/10)_1px,transparent_1px)]"></div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-dark-800/20 dark:bg-white/20"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-dark-800/20 dark:bg-white/20"></div>
      </div>
      
      <div className="min-h-screen bg-gradient-to-b from-white to-dark-50 dark:from-dark-900 dark:to-dark-800 transition-colors duration-500">
        <header className="pt-8 pb-12 relative">
          <div className="container-base relative z-10">
            <div className="flex justify-between items-start">
              <Logo size="lg" animated showVersion />
              
              <div className="w-64">
                <StoryMapStatus />
              </div>
            </div>
            
            {/* Hero section with academic/scientific vibe */}
            <div className="mt-16 md:mt-24 max-w-3xl">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-900 dark:text-white leading-tight">
                Discover the <span className="text-accent-800">Genome</span> of Human History
              </h2>
              <p className="mt-6 text-xl text-dark-700 dark:text-dark-300 max-w-2xl">
                Access a vast archive of interconnected historical narratives through advanced genomic mapping techniques and AI assistance.
              </p>
              
              {/* Mathematical formula for effect */}
              <div className="mt-6 py-3 px-4 bg-dark-50 dark:bg-dark-800/50 rounded-md inline-flex items-center font-mono text-sm text-dark-900 dark:text-dark-200 border border-dark-200 dark:border-dark-700">
                <span className="mr-2 text-accent-800 dark:text-accent-600">ƒ(S<sub>t</sub>)</span> = 
                <span className="mx-2">∫</span>
                <span>H(E) · log(R<sub>c</sub>) dt</span>
                <span className="ml-3 text-dark-500 dark:text-dark-400">// historical significance function</span>
              </div>
            </div>
          </div>
          
          {/* Decorative DNA sequence */}
          <div className="absolute top-32 right-10 w-64 h-64 opacity-20 dark:opacity-10 hidden lg:block">
            <svg viewBox="0 0 100 400" xmlns="http://www.w3.org/2000/svg">
              <path d="M30,0 Q60,50 30,100 Q0,150 30,200 Q60,250 30,300 Q0,350 30,400" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M70,0 Q40,50 70,100 Q100,150 70,200 Q40,250 70,300 Q100,350 70,400" stroke="currentColor" strokeWidth="2" fill="none" />
              
              {/* DNA "rungs" */}
              {[0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375].map((y) => (
                <line key={y} x1="30" y1={y} x2="70" y2={y} stroke="currentColor" strokeWidth="1.5" />
              ))}
              
              {/* Base pairs (A, T, G, C) */}
              {[12, 37, 62, 87, 112, 137, 162, 187, 212, 237, 262, 287, 312, 337, 362, 387].map((y, i) => (
                <text key={y} x="45" y={y} fontSize="8" textAnchor="middle" fill="currentColor">
                  {['A', 'T', 'G', 'C', 'G', 'A', 'T', 'C', 'A', 'G', 'C', 'T', 'G', 'A', 'C', 'T'][i]}
                </text>
              ))}
            </svg>
          </div>
        </header>

        <main className="pb-24">
          <div className="container-base">
            {/* Stats section with scientific styling */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="card p-6 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Archive Size</h3>
                  </div>
                </div>
                <p className="text-3xl font-display font-bold text-dark-900 dark:text-white">
                  282,388 <span className="text-lg">documents</span>
                </p>
                <div className="mt-3 h-1.5 w-full bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-700 rounded-full w-[85%]"></div>
                </div>
              </div>
              
              <div className="card p-6 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Temporal Range</h3>
                  </div>
                </div>
                <p className="text-3xl font-display font-bold text-dark-900 dark:text-white">
                  42 <span className="text-lg">years</span>
                </p>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">1920 - 1961</p>
              </div>
              
              <div className="card p-6 border border-dark-100 dark:border-dark-700">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Entity Network</h3>
                  </div>
                </div>
                <p className="text-3xl font-display font-bold text-dark-900 dark:text-white">
                  1,219,127 <span className="text-lg">connections</span>
                </p>
                <div className="mt-3 flex space-x-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i < 7 ? 'bg-accent-700' : 'bg-dark-100 dark:bg-dark-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Main content areas */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left column - main features */}
              <div className="lg:col-span-3 space-y-8">
                <div className="card">
                  <div className="p-6 border-b border-dark-100 dark:border-dark-700">
                    <h2 className="text-2xl font-display font-bold text-dark-900 dark:text-white">Explore the Historical Archive</h2>
                    <p className="mt-2 text-dark-600 dark:text-dark-300">
                      StoryMine integrates with StoryMap Intelligence to discover lost stories with documentary potential through AI-powered analysis.
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex p-4 rounded-lg border border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800/50 hover:border-accent-600 dark:hover:border-accent-700 transition-colors group">
                        <div className="mt-1 mr-4 w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600 group-hover:bg-accent-600 group-hover:text-white dark:group-hover:bg-accent-800 transition-colors">
                          <MessageSquare size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-dark-900 dark:text-white mb-1 group-hover:text-accent-700 dark:group-hover:text-accent-500 transition-colors">Chat with Jordi</h3>
                          <p className="text-sm text-dark-600 dark:text-dark-400">
                            Our Claude-powered AI assistant helps discover historical stories and connections.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex p-4 rounded-lg border border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800/50 hover:border-accent-600 dark:hover:border-accent-700 transition-colors group">
                        <div className="mt-1 mr-4 w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600 group-hover:bg-accent-600 group-hover:text-white dark:group-hover:bg-accent-800 transition-colors">
                          <Search size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-dark-900 dark:text-white mb-1 group-hover:text-accent-700 dark:group-hover:text-accent-500 transition-colors">Documentary Discovery</h3>
                          <p className="text-sm text-dark-600 dark:text-dark-400">
                            Find stories with documentary potential using narrative scoring and analysis.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex p-4 rounded-lg border border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800/50 hover:border-accent-600 dark:hover:border-accent-700 transition-colors group">
                        <div className="mt-1 mr-4 w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600 group-hover:bg-accent-600 group-hover:text-white dark:group-hover:bg-accent-800 transition-colors">
                          <Database size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-dark-900 dark:text-white mb-1 group-hover:text-accent-700 dark:group-hover:text-accent-500 transition-colors">Entity Networks</h3>
                          <p className="text-sm text-dark-600 dark:text-dark-400">
                            Explore relationships between historical figures, organizations, and events.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex p-4 rounded-lg border border-dark-100 dark:border-dark-700 bg-white dark:bg-dark-800/50 hover:border-accent-600 dark:hover:border-accent-700 transition-colors group">
                        <div className="mt-1 mr-4 w-10 h-10 rounded-lg bg-accent-100 dark:bg-dark-700 flex items-center justify-center text-accent-900 dark:text-accent-600 group-hover:bg-accent-600 group-hover:text-white dark:group-hover:bg-accent-800 transition-colors">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium text-dark-900 dark:text-white mb-1 group-hover:text-accent-700 dark:group-hover:text-accent-500 transition-colors">Story Threads</h3>
                          <p className="text-sm text-dark-600 dark:text-dark-400">
                            Follow narrative threads across time to understand historical developments.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-center">
                      <Link 
                        href="/chat" 
                        className="btn-primary py-3 px-8 text-base"
                      >
                        Start Exploring with Jordi
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column - research highlights */}
              <div className="lg:col-span-2">
                <div className="card">
                  <div className="p-6 border-b border-dark-100 dark:border-dark-700">
                    <h2 className="text-xl font-display font-bold text-dark-900 dark:text-white">Current Research Topics</h2>
                    <p className="mt-1 text-sm text-dark-600 dark:text-dark-400">
                      Popular areas being analyzed through the archive
                    </p>
                  </div>
                  
                  <div className="px-4 py-2">
                    {researchTopics.map((topic, i) => (
                      <div 
                        key={i} 
                        className="flex items-center px-3 py-3 border-b last:border-0 border-dark-100 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center font-mono text-dark-800 dark:text-dark-300 text-sm mr-3">
                          {i + 1}
                        </div>
                        <p className="font-medium text-dark-800 dark:text-dark-200">{topic.name}</p>
                        <div className="ml-auto text-xs text-dark-500 dark:text-dark-400 font-mono border border-dark-200 dark:border-dark-700 rounded px-2 py-0.5 bg-white dark:bg-dark-800">
                          n={topic.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Scientific quote for academic feel */}
                <div className="mt-6 card p-6 border border-dark-100 dark:border-dark-700 bg-gradient-to-br from-white to-dark-50 dark:from-dark-800 dark:to-dark-900">
                  <blockquote className="text-dark-800 dark:text-dark-300 relative z-10">
                    <div className="font-serif text-6xl text-accent-800/20 dark:text-accent-700/20 absolute -top-6 -left-2">"</div>
                    <p className="relative z-10 font-serif text-lg">
                      The past is never dead. It's not even past.
                    </p>
                    <footer className="mt-2 text-sm text-dark-600 dark:text-dark-400">
                      — William Faulkner
                    </footer>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 