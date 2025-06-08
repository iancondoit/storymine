import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo from '../../components/Logo';

// Mock the package.json import
jest.mock('../../../../package.json', () => ({
  version: '1.0.0'
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="mock-link">
      {children}
    </a>
  );
});

describe('Logo Component', () => {
  test('renders logo with text by default', () => {
    render(<Logo />);
    
    // Logo should have SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Text should be visible
    expect(screen.getByText('Story')).toBeInTheDocument();
    expect(screen.getByText('Mine')).toBeInTheDocument();
    expect(screen.getByText('Historical Genome Archive')).toBeInTheDocument();
  });

  test('renders logo without text when withText is false', () => {
    render(<Logo withText={false} />);
    
    // Logo should have SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Text should not be visible
    expect(screen.queryByText('Story')).not.toBeInTheDocument();
    expect(screen.queryByText('Mine')).not.toBeInTheDocument();
  });

  test('applies correct size classes', () => {
    const { rerender } = render(<Logo size="sm" />);
    
    // Small size
    let svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
    expect(screen.getByText('Story').parentElement).toHaveClass('text-lg');
    
    // Medium size (default)
    rerender(<Logo size="md" />);
    svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '40');
    expect(screen.getByText('Story').parentElement).toHaveClass('text-2xl');
    
    // Large size
    rerender(<Logo size="lg" />);
    svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('width', '56');
    expect(svg).toHaveAttribute('height', '56');
    expect(screen.getByText('Story').parentElement).toHaveClass('text-3xl');
  });

  test('applies animation classes when animated is true', () => {
    render(<Logo animated={true} />);
    
    const container = document.querySelector('.group');
    expect(container).toBeInTheDocument();
  });

  test('does not apply animation classes when animated is false', () => {
    render(<Logo animated={false} />);
    
    const container = document.querySelector('.group');
    expect(container).not.toBeInTheDocument();
  });

  test('renders a link to the homepage', () => {
    render(<Logo />);
    
    const link = screen.getByTestId('mock-link');
    expect(link).toHaveAttribute('href', '/');
  });

  test('applies custom className when provided', () => {
    render(<Logo className="custom-class" />);
    
    // The root element should have the custom class
    const linkElement = screen.getByTestId('mock-link');
    expect(linkElement).toHaveClass('custom-class');
  });

  test('displays version number when showVersion is true', () => {
    render(<Logo showVersion={true} />);
    
    // Version should be visible
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  test('does not display version number when showVersion is false', () => {
    render(<Logo showVersion={false} />);
    
    // Version should not be visible
    expect(screen.queryByText('v1.0.0')).not.toBeInTheDocument();
  });
}); 