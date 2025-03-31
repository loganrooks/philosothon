import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RootLayout from '@/app/layout';

// Mock the CSS import to prevent PostCSS errors in test environment
vi.mock('./globals.css', () => ({}));

// Mock child components
vi.mock('@/components/NavBar', () => ({
  default: () => <nav data-testid="mock-navbar">Mock NavBar</nav>,
}));
vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="mock-footer">Mock Footer</footer>,
}));
vi.mock('@/components/SupabaseProvider', () => ({
  // Mock SupabaseProvider to just render children
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-supabase-provider">{children}</div>,
}));

// Mock next/font functions
vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'mock-inter-class', variable: 'mock-inter-variable' }),
  JetBrains_Mono: () => ({ className: 'mock-jetbrains-class', variable: 'mock-jetbrains-variable' }),
}));

describe('RootLayout Component', () => {
  const testChildText = 'Test Child Content';
  const TestChild = () => <div>{testChildText}</div>;

  it('should render basic HTML structure (html, body, main)', () => {
    render(<RootLayout><TestChild /></RootLayout>);
    // Check for body existence (html is implicit)
    expect(document.body).toBeInTheDocument();
    // Check for main element
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should apply font variables to the body', () => {
    render(<RootLayout><TestChild /></RootLayout>);
    expect(document.body).toHaveClass('mock-inter-variable');
    expect(document.body).toHaveClass('mock-jetbrains-variable');
    expect(document.body).toHaveClass('font-sans'); // Check default font class
  });

  it('should render NavBar, Footer, and SupabaseProvider mocks', () => {
    render(<RootLayout><TestChild /></RootLayout>);
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    expect(screen.getByTestId('mock-supabase-provider')).toBeInTheDocument();
  });

  it('should render children inside the main element', () => {
    render(<RootLayout><TestChild /></RootLayout>);
    const mainElement = screen.getByRole('main');
    expect(mainElement).toContainElement(screen.getByText(testChildText));
  });

  // Metadata is harder to test directly in component tests, usually tested via E2E tests.
});