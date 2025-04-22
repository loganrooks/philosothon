import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemesPage from '@/app/themes/page';
// Import the DAL function to mock it and the Theme type
import { fetchThemes, type Theme } from '@/lib/data/themes';
// Keep ThemeCard mock
import ThemeCard from '@/components/ThemeCard';

// Mock dependencies
vi.mock('@/lib/data/themes'); // Mock the DAL module
vi.mock('@/components/ThemeCard', () => ({
  default: vi.fn(() => <div data-testid="mock-theme-card">Mock Theme Card</div>),
}));

// Define mock theme data based on the Theme type from the DAL
const mockThemes: Theme[] = [
  { id: '1', created_at: '2023-01-01T00:00:00Z', title: 'AI Ethics', description: 'Exploring the moral implications of artificial intelligence.', analytic_tradition: ['Focus on logic', 'clarity'], continental_tradition: null, description_expanded: null, image_url: null, relevant_themes: null },
  { id: '2', created_at: '2023-01-02T00:00:00Z', title: 'Consciousness', description: 'What is it like to be a bat?', analytic_tradition: null, continental_tradition: ['Phenomenology', 'Embodiment'], description_expanded: null, image_url: null, relevant_themes: null },
  { id: '3', created_at: '2023-01-03T00:00:00Z', title: 'Null Desc', description: null, analytic_tradition: null, continental_tradition: null, description_expanded: null, image_url: null, relevant_themes: null }, // Add theme with null description
];


describe('Themes Page Component', () => {
  // Remove Supabase client mocks

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ThemeCard).mockClear();
    // Clear the DAL mock
    vi.mocked(fetchThemes).mockClear();
  });

  it('should render heading and intro paragraph', async () => {
    // Arrange: Mock successful fetchThemes call
    vi.mocked(fetchThemes).mockResolvedValue({ themes: mockThemes, error: null });
    const PageComponent = await ThemesPage();
    render(PageComponent);

    // Assert
    expect(screen.getByRole('heading', { name: /Event Themes/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Explore the potential philosophical themes/i)).toBeInTheDocument();
  });

  it('should render ThemeCards when themes are fetched successfully', async () => {
     // Arrange: Mock successful fetchThemes call
    vi.mocked(fetchThemes).mockResolvedValue({ themes: mockThemes, error: null });
    const PageComponent = await ThemesPage();
    render(PageComponent);

    // Assert
    expect(screen.queryByText(/Could not fetch themes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No themes available/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('mock-theme-card')).toHaveLength(mockThemes.length);

    // Check props passed to the first card as an example
    expect(vi.mocked(ThemeCard)).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockThemes[0].id, // Added ID check
        title: mockThemes[0].title,
        description: mockThemes[0].description ?? '', // Use fallback for null
        analyticTradition: mockThemes[0].analytic_tradition ?? undefined,
        continentalTradition: undefined,
      }),
      {}
    );
     // Check props passed to the second card
    expect(vi.mocked(ThemeCard)).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockThemes[1].id,
        title: mockThemes[1].title,
        description: mockThemes[1].description ?? '', // Use fallback for null
        analyticTradition: undefined,
        continentalTradition: mockThemes[1].continental_tradition ?? undefined,
      }),
      {}
    );
     // Check props passed to the third card (with null description)
     expect(vi.mocked(ThemeCard)).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockThemes[2].id,
        title: mockThemes[2].title,
        description: '', // Expect empty string fallback
        analyticTradition: undefined,
        continentalTradition: undefined,
      }),
      {}
    );
  });

  it('should display an error message if fetching themes fails', async () => {
    // Arrange: Mock fetchThemes error
    const errorMessage = 'Database connection failed';
    vi.mocked(fetchThemes).mockResolvedValue({ themes: null, error: new Error(errorMessage) });
    const PageComponent = await ThemesPage();
    render(PageComponent);

    // Assert
    expect(screen.getByText(/Could not fetch themes. Please try again later./i)).toBeInTheDocument();
    expect(screen.queryByText(/No themes available/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-theme-card')).not.toBeInTheDocument();
  });

  it('should display a message if no themes are available', async () => {
     // Arrange: Mock successful fetchThemes call with empty array
    vi.mocked(fetchThemes).mockResolvedValue({ themes: [], error: null });
    const PageComponent = await ThemesPage();
    render(PageComponent);

    // Assert
    expect(screen.queryByText(/Could not fetch themes/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No themes available at the moment./i)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-theme-card')).not.toBeInTheDocument();
  });

  // Removed obsolete test for Supabase client calls
});