import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Hero from '@/components/Hero';

// Mock next/link as it's used for the Register button
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

describe('Hero Component', () => {
  it('should render the main heading', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1, name: /Philosothon: Where Philosophy Meets Hackathon Culture/i })).toBeInTheDocument();
  });

  it('should render the subheading', () => {
    render(<Hero />);
    expect(screen.getByText(/An Experimental Event at the University of Toronto/i)).toBeInTheDocument();
  });

  it('should render the description paragraph', () => {
    render(<Hero />);
    expect(screen.getByText(/While traditional hackathons gather programmers/i)).toBeInTheDocument();
  });

   it('should render the event date', () => {
    render(<Hero />);
    expect(screen.getByText(/April 7-8, 2025/i)).toBeInTheDocument();
  });

  it('should render the "Register Now" link with the correct href', () => {
    render(<Hero />);
    const registerLink = screen.getByRole('link', { name: /Register Now/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});