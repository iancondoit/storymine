import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  animated?: boolean;
  className?: string;
  showVersion?: boolean;
}

export default function Logo({ 
  size = 'md', 
  withText = true, 
  animated = true,
  className = '',
  showVersion = false
}: LogoProps) {
  // Size mappings
  const sizeMap = {
    sm: { logoSize: 32, fontSize: 'text-lg' },
    md: { logoSize: 40, fontSize: 'text-2xl' },
    lg: { logoSize: 56, fontSize: 'text-3xl' },
  };

  const { logoSize, fontSize } = sizeMap[size];
  // Hardcode version to avoid build issues
  const version = "1.2.0";

  return (
    <Link href="/" className={`flex items-center gap-3 ${className}`}>
      <div 
        className={`relative ${animated ? 'group' : ''}`} 
        style={{ width: logoSize, height: logoSize }}
      >
        <svg 
          width={logoSize} 
          height={logoSize} 
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Clean, minimalist diamond */}
          <circle cx="50" cy="50" r="48" fill="#9d4edd" />
          
          {/* Simple diamond outline */}
          <path 
            d="M50,25 L70,50 L50,75 L30,50 Z" 
            fill="none" 
            stroke="white" 
            strokeWidth="3"
            className={`${animated ? 'group-hover:opacity-80' : ''}`}
          />
          
          {/* Simple pickaxe line */}
          <path 
            d="M30,50 L70,50" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round"
            className={`${animated ? 'group-hover:opacity-80' : ''}`}
          />
        </svg>
      </div>
      
      {withText && (
        <div className="flex flex-col">
          <h1 className={`font-display font-bold ${fontSize} text-dark-800 dark:text-white leading-tight`}>
            Story<span className="text-accent-800">Mine</span>
            {showVersion && (
              <span className="text-xs ml-2 font-mono text-dark-500 dark:text-dark-400 align-top">v{version}</span>
            )}
          </h1>
          <p className="text-xs text-dark-600 dark:text-dark-300 font-medium mt-0.5">
            Historical Genome Archive
          </p>
        </div>
      )}
    </Link>
  );
} 