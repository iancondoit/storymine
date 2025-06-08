import { useState, useEffect } from 'react';
import { Activity, Database, Users, Server, Zap, AlertTriangle } from 'lucide-react';
import { getStoryMapStats, StoryMapStats } from '@/utils/api';

// Add custom animation styles
const animationStyles = `
  @keyframes fadeIn {
    0% { opacity: 0; transform: translateY(3px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes countUp {
    0% { opacity: 0; transform: scale(0.95); }
    50% { opacity: 1; }
    100% { transform: scale(1); }
  }
  @keyframes flash {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
  }
`;

export default function StoryMapStatus() {
  const [stats, setStats] = useState<StoryMapStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [dataUpdated, setDataUpdated] = useState(false);
  
  // Insert animation styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    // Set default offline stats instead of making API calls
    // This prevents Railway deployment issues from StoryMap API connection attempts
    setStats({ 
      status: 'offline', 
      message: 'StoryMap API disabled in production - using direct database connection instead',
      articleCount: 0,
      entityCount: 0
    });
    setResponseTime(null);
    
    // Note: Removed automatic API calls that were causing Railway deployment failures
    // The StoryMap API calls were trying to connect to localhost:8080 which doesn't exist
    // and was interfering with Railway's health checks
  }, []);

  // Generate status color based on state
  const getStatusColor = () => {
    if (!stats) return 'bg-dark-400';
    
    switch (stats.status) {
      case 'online': return 'bg-emerald-500';
      case 'degraded': return 'bg-amber-500';
      case 'offline': return 'bg-red-500';
      case 'error': 
      default: return 'bg-dark-400';
    }
  };

  // Format large numbers with commas
  const formatNumber = (num?: number | null) => {
    if (num === undefined || num === null) return '—';
    return num.toLocaleString();
  };

  // Generate a random genomic sequence for decoration
  const getGenomicSequence = () => {
    const bases = ['A', 'T', 'G', 'C'];
    return Array.from({ length: 24 }, () => bases[Math.floor(Math.random() * bases.length)]).join('');
  };
  
  // Calculate a random genome coverage percentage
  const genomeCoverage = Math.floor(Math.random() * 20) + 80; // 80-99%

  return (
    <div 
      className={`relative transition-all duration-300 ease-in-out overflow-hidden rounded-md 
        ${dataUpdated ? 'border border-emerald-300 dark:border-emerald-700 shadow-md' : 'border border-dark-200 dark:border-dark-700 shadow-sm'}
        ${isExpanded ? 'h-auto' : 'h-10'}`}
    >
      {/* Status bar (always visible) */}
      <div 
        className="flex items-center px-3 py-2 bg-white dark:bg-dark-800 cursor-pointer group hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Status indicator */}
        <div className="flex items-center mr-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-1.5`}>
          </div>
          <span className="flex items-center text-xs font-medium text-dark-800 dark:text-dark-200">
            Genome Core 
            <span className="ml-1 inline-flex items-center text-[10px] opacity-80 font-mono">v2.4</span>
            {stats?.status === 'offline' && (
              <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">⚠</span>
            )}
          </span>
        </div>
        
        {/* Summary counts with icons - simpler version */}
        {!isLoading && stats && (
          <div className="flex items-center ml-auto space-x-3 text-xs animate-[fadeIn_0.6s_ease-in-out]">
            <div className="flex items-center text-dark-700 dark:text-dark-300">
              <Database size={12} className="mr-1 text-accent-600 dark:text-accent-500" />
              <span title="Articles" className="font-medium animate-[countUp_0.8s_ease-out]">{formatNumber(stats.articleCount)}</span>
            </div>
            <div className="flex items-center text-dark-700 dark:text-dark-300">
              <Users size={12} className="mr-1 text-accent-600 dark:text-accent-500" />
              <span title="Entities" className="font-medium animate-[countUp_0.8s_ease-out_0.2s_both]">{formatNumber(stats.entityCount)}</span>
            </div>
            <div className="text-dark-700 dark:text-dark-300 group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors">
              {isExpanded ? '▲' : '▼'}
            </div>
          </div>
        )}
        
        {/* Loading animation */}
        {isLoading && (
          <div className="flex items-center ml-auto">
            <Activity size={12} className="text-accent-700 dark:text-accent-500 animate-spin" />
          </div>
        )}
      </div>
      
      {/* Expanded details */}
      <div className="p-3 bg-white dark:bg-dark-800 text-sm border-t border-dark-100 dark:border-dark-700">
        {stats && (
          <>
            {/* Top section with API info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-dark-700 dark:text-dark-300">
                <Server size={14} className="mr-2 text-accent-700 dark:text-accent-500" />
                <span className="text-xs">Direct Database:</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs font-mono text-dark-600 dark:text-dark-400 truncate max-w-[150px]">
                  AWS RDS PostgreSQL
                </span>
                <div className={`ml-2 w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              </div>
              <div className="flex items-center text-xs mt-2 font-mono">
                <div className="bg-dark-50 dark:bg-dark-700 px-2 py-1 rounded text-dark-600 dark:text-dark-300">
                  <span className="text-amber-600 dark:text-amber-500 mr-1">⚠</span> 
                  StoryMap API disabled → using direct database
                  {responseTime && <span className="ml-2 text-dark-400 dark:text-dark-500">({responseTime}ms)</span>}
                </div>
              </div>
            </div>
            
            {/* Middle section with stats in scientific display */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-dark-50 dark:bg-dark-700 p-3 rounded border border-dark-100 dark:border-dark-600">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <Database size={14} className="text-accent-700 dark:text-accent-500 mr-1" />
                    <span className="text-xs font-medium text-dark-800 dark:text-dark-200">Archive</span>
                  </div>
                  <span className="text-xs bg-accent-100 dark:bg-dark-800 px-1 rounded text-accent-800 dark:text-accent-400 font-mono">v2.4</span>
                </div>
                <div className="font-mono text-lg font-bold text-dark-900 dark:text-white text-center">
                  {formatNumber(stats.articleCount)}
                </div>
                <div className="mt-1 text-center">
                  <span className="text-[10px] text-dark-500 dark:text-dark-400 font-mono">
                    DOCUMENTS SEQUENCED
                  </span>
                </div>
              </div>
              
              <div className="bg-dark-50 dark:bg-dark-700 p-3 rounded border border-dark-100 dark:border-dark-600">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <Users size={14} className="text-accent-700 dark:text-accent-500 mr-1" />
                    <span className="text-xs font-medium text-dark-800 dark:text-dark-200">Network</span>
                  </div>
                  <span className="text-xs bg-accent-100 dark:bg-dark-800 px-1 rounded text-accent-800 dark:text-accent-400 font-mono">α</span>
                </div>
                <div className="font-mono text-lg font-bold text-dark-900 dark:text-white text-center">
                  {formatNumber(stats.entityCount)}
                </div>
                <div className="mt-1 text-center">
                  <span className="text-[10px] text-dark-500 dark:text-dark-400 font-mono">
                    ENTITIES MAPPED
                  </span>
                </div>
              </div>
            </div>
            
            {/* System health */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Zap size={14} className="text-amber-500 mr-1" />
                  <span className="text-xs font-medium text-dark-800 dark:text-dark-200">System Health</span>
                </div>
                <span className="text-xs text-dark-600 dark:text-dark-400">
                  {stats.status === 'online' ? 'Optimal' : 'Degraded'}
                </span>
              </div>
              
              {/* Genome coverage meter */}
              <div className="h-1.5 w-full bg-dark-100 dark:bg-dark-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-accent-600 rounded-full" 
                  style={{ width: `${genomeCoverage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-dark-500 dark:text-dark-400 font-mono">
                <span>GENOME COVERAGE</span>
                <span>{genomeCoverage}%</span>
              </div>
            </div>
            
            {/* Sequence segment visualization */}
            <div className="font-mono text-[9px] text-dark-600 dark:text-dark-500 leading-tight bg-dark-50 dark:bg-dark-700/50 p-1.5 rounded border border-dark-100 dark:border-dark-700 overflow-x-auto whitespace-nowrap">
              {getGenomicSequence()}:<span className="text-accent-700 dark:text-accent-500">{getGenomicSequence()}</span>
            </div>
            
            {/* Alert or message */}
            {stats.message && (
              <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-dark-800 text-xs text-amber-800 dark:text-amber-400 flex items-start">
                <AlertTriangle size={12} className="mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{stats.message}</span>
              </div>
            )}
            
            <div className="mt-2 text-right text-xs text-dark-500 dark:text-dark-400 font-mono">
              {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'N/A'}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 