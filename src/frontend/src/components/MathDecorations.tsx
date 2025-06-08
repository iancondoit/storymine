import React from 'react';

interface GridBackgroundProps {
  className?: string;
  density?: 'low' | 'medium' | 'high';
  animated?: boolean;
}

export function GridBackground({ 
  className = '', 
  density = 'medium',
  animated = false 
}: GridBackgroundProps) {
  const densityMap = {
    low: '8rem',
    medium: '4rem',
    high: '2rem'
  };
  
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 opacity-10 dark:opacity-5 ${className}`}>
      <div 
        className={`absolute inset-0 bg-[linear-gradient(to_right,theme(colors.dark.900/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.dark.900/10)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.white/10)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/10)_1px,transparent_1px)] ${animated ? 'animate-pulse-slow' : ''}`}
        style={{ backgroundSize: `${densityMap[density]} ${densityMap[density]}` }}
      ></div>
      <div className="absolute top-1/2 left-0 right-0 h-px bg-dark-800/20 dark:bg-white/20"></div>
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-dark-800/20 dark:bg-white/20"></div>
    </div>
  );
}

interface DNAHelixProps {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animate?: boolean;
}

export function DNAHelix({
  className = '',
  orientation = 'vertical',
  size = 'md',
  showLabels = true,
  animate = true
}: DNAHelixProps) {
  const sizeMap = {
    sm: { width: 40, height: 100, strokeWidth: 1 },
    md: { width: 100, height: 400, strokeWidth: 2 },
    lg: { width: 160, height: 600, strokeWidth: 3 }
  };
  
  const { width, height, strokeWidth } = sizeMap[size];
  
  // Generate rungs positions based on height
  const rungCount = Math.floor(height / 25);
  const rungs = Array.from({ length: rungCount }, (_, i) => i * (height / rungCount));
  
  // Generate base pair positions (halfway between rungs)
  const basePairs = rungs.slice(0, -1).map((pos, i) => pos + (height / rungCount) / 2);
  
  // DNA bases sequence
  const bases = ['A', 'T', 'G', 'C'];
  
  return (
    <div 
      className={`relative overflow-hidden opacity-20 dark:opacity-10 ${className}`}
      style={{ 
        width: orientation === 'vertical' ? width : height,
        height: orientation === 'vertical' ? height : width
      }}
    >
      <svg 
        viewBox={`0 0 ${orientation === 'vertical' ? width : height} ${orientation === 'vertical' ? height : width}`} 
        xmlns="http://www.w3.org/2000/svg"
        className={animate ? 'animate-pulse-slow' : ''}
        style={{ transform: orientation === 'horizontal' ? 'rotate(90deg)' : 'none' }}
      >
        {/* DNA strands */}
        <path 
          d={`M${width*0.3},0 ${Array.from({ length: rungCount }, (_, i) => 
            `Q${width*0.6},${height/(rungCount*2) + i*(height/rungCount)} ${width*0.3},${(i+1)*(height/rungCount)}`
          ).join(' ')}`} 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="none" 
        />
        <path 
          d={`M${width*0.7},0 ${Array.from({ length: rungCount }, (_, i) => 
            `Q${width*0.4},${height/(rungCount*2) + i*(height/rungCount)} ${width*0.7},${(i+1)*(height/rungCount)}`
          ).join(' ')}`} 
          stroke="currentColor" 
          strokeWidth={strokeWidth} 
          fill="none" 
        />
        
        {/* DNA rungs */}
        {rungs.map((y) => (
          <line 
            key={`rung-${y}`} 
            x1={width*0.3} 
            y1={y} 
            x2={width*0.7} 
            y2={y} 
            stroke="currentColor" 
            strokeWidth={strokeWidth*0.75} 
          />
        ))}
        
        {/* Base pairs (A, T, G, C) */}
        {showLabels && basePairs.map((y, i) => (
          <text 
            key={`base-${y}`} 
            x={width*0.5} 
            y={y} 
            fontSize={size === 'sm' ? 6 : size === 'md' ? 8 : 12} 
            textAnchor="middle" 
            fill="currentColor" 
            className="font-mono"
          >
            {bases[i % bases.length]}
          </text>
        ))}
      </svg>
    </div>
  );
}

interface MathFormulaProps {
  className?: string;
  formula: string;
  annotation?: string;
}

export function MathFormula({
  className = '',
  formula,
  annotation
}: MathFormulaProps) {
  return (
    <div className={`py-3 px-4 bg-dark-50 dark:bg-dark-800/50 rounded-md inline-flex items-center font-mono text-sm text-dark-900 dark:text-dark-200 border border-dark-200 dark:border-dark-700 ${className}`}>
      <span dangerouslySetInnerHTML={{ __html: formula }} />
      {annotation && (
        <span className="ml-3 text-dark-500 dark:text-dark-400">// {annotation}</span>
      )}
    </div>
  );
}

interface ScientificCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  percentage?: number;
  version?: string;
}

export function ScientificCard({
  title,
  value,
  subtitle,
  icon,
  className = '',
  percentage,
  version
}: ScientificCardProps) {
  return (
    <div className={`bg-dark-50 dark:bg-dark-700 p-4 rounded border border-dark-100 dark:border-dark-600 ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          {icon && <div className="mr-2 text-accent-700 dark:text-accent-500">{icon}</div>}
          <span className="text-xs font-medium text-dark-800 dark:text-dark-200">{title}</span>
        </div>
        {version && (
          <span className="text-xs bg-accent-100 dark:bg-dark-800 px-1 rounded text-accent-800 dark:text-accent-400 font-mono">{version}</span>
        )}
      </div>
      
      <div className="font-mono text-xl font-bold text-dark-900 dark:text-white text-center my-2">
        {value}
      </div>
      
      {subtitle && (
        <div className="mt-1 text-center">
          <span className="text-[10px] text-dark-500 dark:text-dark-400 font-mono uppercase">
            {subtitle}
          </span>
        </div>
      )}
      
      {percentage !== undefined && (
        <>
          <div className="mt-2 h-1.5 w-full bg-dark-100 dark:bg-dark-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-accent-600 rounded-full" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-dark-500 dark:text-dark-400 font-mono">
            <span>COMPLETION</span>
            <span>{percentage}%</span>
          </div>
        </>
      )}
    </div>
  );
} 