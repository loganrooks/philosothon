import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemesPage from '@/app/themes/page';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js'; // Import type for casting
// import ThemeCard from '@/components/ThemeCard'; // No longer needed as component is mocked

// Mock dependencies
vi.mock('@/lib/supabase/server');
const mockThemeCard = vi.fn(() => <div data-testid="mock-theme-card">Mock Theme Card</div>);
vi.mock('@/components/ThemeCard', () => ({
  default: mockThemeCard,
}));

// Define mock theme data based on the interface in the component
const mockThemes = [
  { id: '1', created_at: '2023-01-01T00:00:00Z', title: 'AI Ethics', description: 'Exploring the moral implications of artificial intelligence.', analytic_tradition: 'Focus on logic and clarity.', continental_tradition: null, is_selected: false },
  { id: '2', created_at: '2023-01-02T00:00:00Z', title: 'Consciousness', description: 'What is it like to be a bat?', analytic_tradition: null, continental_tradition: 'Phenomenological approaches.', is_selected: true },
];

describe('Themes Page Component', () => {
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockThemeCard.mockClear(); // Clear calls to the component mock

    // Setup mock for the Supabase query chain
    mockOrder = vi.fn();
    mockSelect = vi.fn(() => ({ order: mockOrder }));
    mockFrom = vi.fn(() => ({ select: mockSelect }));

    const mockSupabaseClient = {
      from: mockFrom,
    };

    // Configure the mocked createClient
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as unknown as SupabaseClient); // Cast via unknown
  });

  it('should render heading and intro paragraph', async () => {
    // Arrange: Mock successful fetch with data
    mockOrder.mockResolvedValue({ data: mockThemes, error: null });
    const PageComponent = await ThemesPage();
    render(PageComponent);

    // Assert
    expect(screen.getByRole('heading', { name: /Event Themes/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Explore the potential philosophical themes/i)).toBeInTheDocument();
  });

  it('should render ThemeCards when themes are fetched successfully', async () => {
     // Arrange: Mock successful fetch with data
    mockOrder.mockResolvedValue({ data: mockThemes, error: null });
    const PageComponent = await ThemesPage();
    render(PageComponent);

    // Assert
    expect(screen.queryByText(/Could not fetch themes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No themes available/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('mock-theme-card')).toHaveLength(mockThemes.length);

    // Check props passed to the first card as an example
    expect(mockThemeCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockThemes[0].title,
        description: mockThemes[0].description,
        analyticTradition: mockThemes[0].analytic_tradition,
        continentalTradition: undefined, // Because it was null in mock data
      }),
      expect.anything()
    );
     // Check props passed to the second card
    expect(mockThemeCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockThemes[1].title,
        description: mockThemes[1].description,
        analyticTradition: undefined, // Because it was null
        continentalTradition: mockThemes[1].continental_tradition,
      }),
      expect.anything()
    );
  });

  it('should display an error message if fetching themes fails', async () => {
    // Arrange: Mock fetch error
    const errorMessage = 'Database connection failed';
    mockOrder.mockResolvedValue({ data: null, error: { message: errorMessage, code: '500', hint: '', details: '' } });
    const PageComponent = await ThemesPage();
    render(PageComponent);

    // Assert
    expect(screen.getByText(/Could not fetch themes. Please try again later./i)).toBeInTheDocument();
    expect(screen.queryByText(/No themes available/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-theme-card')).not.toBeInTheDocument();
  });

  it('should display a message if no themes are available', async () => {
     // Arrange: Mock successful fetch with empty array
    mockOrder.mockResolvedValue({ data: [], error: null });
    const PageComponent = await ThemesPage();
    render(PageComponent);

    // Assert
    expect(screen.queryByText(/Could not fetch themes/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No themes available at the moment./i)).toBeInTheDocument();
    expect(screen.queryByTestId('mock-theme-card')).not.toBeInTheDocument();
  });

  it('should call supabase client correctly', async () => {
    // Arrange: Mock successful fetch
    mockOrder.mockResolvedValue({ data: mockThemes, error: null });
    await ThemesPage(); // Call the async function

    // Assert
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('themes');
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledTimes(1);
    expect(mockOrder).toHaveBeenCalledWith('title', { ascending: true });
  });
});