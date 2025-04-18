import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react'; // Import act
import AdminLayout from './layout'; // Adjust path as necessary

// Mock child components or dependencies if needed
// Example: Mocking LogoutButton if it causes issues
vi.mock('./components/LogoutButton', () => ({
  LogoutButton: () => <button>Mock Logout</button>,
}));

// Mock next/navigation if Link components are used
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/admin/some-path'), // Mock pathname
  Link: ({ href, children }: { href: string, children: React.ReactNode }) => <a href={href}>{children}</a>,
}));


describe('AdminLayout Component', () => {
  it('should render the main layout structure and navigation links', async () => { // Make test async
    // Arrange
    const mockChildren = <div data-testid="mock-children">Mock Page Content</div>;

    // Act: Render the async component within act
    await act(async () => {
      render(await AdminLayout({ children: mockChildren }));
    });

    // Assert
    // Check for some key layout elements (adjust selectors based on actual component structure)
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // Assuming a nav element
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /themes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /workshops/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /faq/i })).toBeInTheDocument(); // Corrected link text

    // Check if children are rendered
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();

    // Check if mocked logout button is present
    expect(screen.getByRole('button', { name: /mock logout/i })).toBeInTheDocument();
  });
});