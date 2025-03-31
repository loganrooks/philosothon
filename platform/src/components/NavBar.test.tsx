import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NavBar from '@/components/NavBar';

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

describe('NavBar Component', () => {
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Themes', href: '/themes' },
    { name: 'Workshops', href: '/workshops' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Register', href: '/register' },
  ];

  it('should render the brand text/link', () => {
    render(<NavBar />);
    const brandLink = screen.getByRole('link', { name: /Philosothon UofT/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('should render all navigation links with correct hrefs', () => {
    render(<NavBar />);
    navItems.forEach(item => {
      const link = screen.getByRole('link', { name: item.name });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', item.href);
    });
  });
});