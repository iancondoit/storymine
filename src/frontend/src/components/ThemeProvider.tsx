import React, { createContext, useContext, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark theme
  
  // Update the theme class on the HTML element
  useEffect(() => {
    // We're setting the class in _document.tsx now for SSR
    // This is just for client-side theme switching
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('storymine-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      
      {/* Theme toggle button */}
      <button 
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-dark-800 dark:bg-dark-700 text-white shadow-md hover:shadow-lg transition-all z-50 group"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
        ) : (
          <Moon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
        )}
        
        {/* Decorative elements */}
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-700 rounded-full opacity-70"></span>
        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary-400 rounded-full opacity-70"></span>
      </button>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 