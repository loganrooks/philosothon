import { render, screen } from '@testing-library/react'; // Remove React, Suspense, act
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import WorkshopsPage from './page';
// Import the type, but not the function itself yet
import type { Workshop } from '@/lib/data/workshops';

// Mock the data fetching module
vi.mock('@/lib/data/workshops');

// Import the mocked function AFTER vi.mock
import { fetchWorkshops } from '@/lib/data/workshops';

// Cast the imported function to MockedFunction for type safety
const mockedFetchWorkshops = fetchWorkshops as MockedFunction<typeof fetchWorkshops>;

// Define mock data
const mockWorkshopsData: Workshop[] = [
  { id: '1', title: 'Workshop Alpha', description: 'Desc A', facilitator: 'Fac A', created_at: new Date().toISOString(), relevant_themes: null, max_capacity: 20 },
  { id: '2', title: 'Workshop Beta', description: 'Desc B', facilitator: 'Fac B', created_at: new Date().toISOString(), relevant_themes: null, max_capacity: null },
];

describe('WorkshopsPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedFetchWorkshops.mockClear();
  });

  it('should render the main heading and workshop cards when data is fetched successfully', async () => {
    // Setup mock for success case
    mockedFetchWorkshops.mockResolvedValue(mockWorkshopsData);

    render(<WorkshopsPage />); // Render normally
    await mockedFetchWorkshops(); // Explicitly await the mocked promise resolution

    // Now use findBy*
    const heading = await screen.findByRole('heading', { name: /event workshops/i, level: 1 });
    expect(heading).toBeInTheDocument();

    expect(await screen.findByText('Workshop Alpha')).toBeInTheDocument();
    expect(await screen.findByText('Workshop Beta')).toBeInTheDocument();
    // Check that error/empty messages are NOT present
    expect(screen.queryByText(/Could not load workshop information/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No workshops available/i)).not.toBeInTheDocument();

    // Verify the mocked fetch function was called
    expect(mockedFetchWorkshops).toHaveBeenCalledTimes(1);
  });

  it('should render an error message if data fetching fails', async () => {
    // Setup mock for error case
    const errorMessage = 'Failed to fetch';
    mockedFetchWorkshops.mockRejectedValue(new Error(errorMessage));

    render(<WorkshopsPage />);
    // Explicitly await the rejected promise (use catch to prevent unhandled rejection error)
    try {
      await mockedFetchWorkshops();
    } catch {
      // Expected rejection, do nothing
    }

    // Now use findBy*
    const heading = await screen.findByRole('heading', { name: /event workshops/i, level: 1 });
    expect(heading).toBeInTheDocument();

    // Check for the specific error message rendered by the component
    // The component catches the error and sets its own message
    expect(await screen.findByText(/Could not load workshop information at this time/i)).toBeInTheDocument();
    // Check that workshop cards/empty message are NOT present
    expect(screen.queryByText('Workshop Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText(/No workshops available/i)).not.toBeInTheDocument();

    expect(mockedFetchWorkshops).toHaveBeenCalledTimes(1);
  });

  it('should render a message if no workshops are available', async () => {
    // Setup mock for empty data case
    mockedFetchWorkshops.mockResolvedValue([]);

    render(<WorkshopsPage />);
    await mockedFetchWorkshops(); // Explicitly await the mocked promise resolution

    // Now use findBy*
    const heading = await screen.findByRole('heading', { name: /event workshops/i, level: 1 });
    expect(heading).toBeInTheDocument();

    // Check for the empty message
    expect(await screen.findByText(/No workshops available/i)).toBeInTheDocument();
    // Check that workshop cards/error message are NOT present
    expect(screen.queryByText('Workshop Alpha')).not.toBeInTheDocument();
    expect(screen.queryByText(/Could not load workshop information/i)).not.toBeInTheDocument();

    expect(mockedFetchWorkshops).toHaveBeenCalledTimes(1);
  });
});