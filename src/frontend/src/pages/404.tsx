import Link from 'next/link';
import Head from 'next/head';
import { Home, Database, Search } from 'lucide-react';
import Logo from '@/components/Logo';
import { DNAHelix, MathFormula } from '@/components/MathDecorations';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 - Sequence Not Found | StoryMine</title>
        <meta name="description" content="The requested sequence was not found in our historical genome archive." />
      </Head>
      
      <div className="min-h-screen bg-white dark:bg-dark-900 flex flex-col">
        {/* Navigation */}
        <header className="border-b border-dark-200 dark:border-dark-700 py-4">
          <div className="container-base">
            <Logo size="sm" />
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* DNA helix decoration */}
          <div className="absolute -top-10 -right-20 transform rotate-45">
            <DNAHelix size="lg" />
          </div>
          
          <div className="max-w-md text-center z-10 relative">
            {/* Error number with mathematical styling */}
            <div className="font-mono mb-4 flex items-center justify-center">
              <div className="text-6xl font-bold text-dark-900 dark:text-white mr-4">404</div>
              <div className="h-16 w-px bg-dark-300 dark:bg-dark-600"></div>
              <div className="ml-4 text-left">
                <div className="text-sm text-dark-400 dark:text-dark-500 font-mono">ERROR CODE</div>
                <MathFormula formula="e<sup>iπ</sup> + 1 = 0" className="mt-1 text-xs" />
              </div>
            </div>
            
            <h1 className="text-2xl font-display font-bold text-dark-900 dark:text-white mb-3">
              Sequence Not Found
            </h1>
            
            <p className="text-dark-600 dark:text-dark-300 mb-8">
              The historical document or sequence you're looking for couldn't be located in our genomic archive. It may have been moved, deleted, or never existed.
            </p>
            
            {/* Genomic search style code block */}
            <div className="font-mono text-xs text-left mb-8 bg-dark-800 text-dark-200 p-4 rounded-md border border-dark-700 overflow-x-auto">
              <div className="text-accent-400"># Genome search result</div>
              <div className="text-dark-300 mt-2">$ sequence_search --query="{typeof window !== 'undefined' ? window.location.pathname.substring(1) : 'unknown'}"</div>
              <div className="text-red-400 mt-1">{'>'} Error: Invalid sequence pattern</div>
              <div className="text-dark-400 mt-1">{'>'} Base pairs incompatible with archive schema</div>
              <div className="text-dark-400 mt-1">{'>'} Try mapping to a different section</div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="btn-primary flex items-center justify-center gap-2">
                <Home size={16} />
                <span>Return to Home</span>
              </Link>
              
              <Link href="/chat" className="btn-secondary flex items-center justify-center gap-2">
                <Search size={16} />
                <span>Search Archive</span>
              </Link>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="py-4 border-t border-dark-200 dark:border-dark-700 text-center text-sm text-dark-500 dark:text-dark-400">
          <div className="container-base">
            <div className="flex items-center justify-center gap-2">
              <Database size={14} />
              <span>StoryMine Historical Genome Archive • Sequence Pattern Analysis</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
} 