import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import WorkshopsPage from './page';
import type { Workshop } from '@/lib/data/workshops';
import WorkshopCard from '@/components/WorkshopCard'; // Import component to mock

// Mock the data fetching module
vi.mock('@/lib/data/workshops');
// Mock the child component
vi.mock('@/components/WorkshopCard', () => ({
  default: vi.fn(({ title }) => <div data-testid="mock-workshop-card">{title}</div>),
}));

// Import the mocked function AFTER vi.mock
import { fetchWorkshops } from '@/lib/data/workshops';

// Cast the imported function to MockedFunction for type safety
const mockedFetchWorkshops = fetchWorkshops as MockedFunction<typeof fetchWorkshops>;
const MockedWorkshopCard = WorkshopCard as MockedFunction<typeof WorkshopCard>;

// Define mock data
const mockWorkshopsData: Workshop[] = [
  { id: '1', title: 'Workshop Alpha', description: 'Desc A', facilitator: 'Fac A', created_at: new Date().toISOString(), relevant_themes: null, max_capacity: 20 },
  { id: '2', title: 'Workshop Beta', description: 'Desc B', facilitator: 'Fac B', created_at: new Date().toISOString(), relevant_themes: null, max_capacity: null },
];

describe('WorkshopsPage (Server Component Test)', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockedFetchWorkshops.mockClear();
    MockedWorkshopCard.mockClear();
  });

  it('should render the main heading and workshop cards when data is fetched successfully', async () => {
    // Setup mock for success case
    mockedFetchWorkshops.mockResolvedValue(mockWorkshopsData);

    // Await the Server Component function call
    const PageComponent = await WorkshopsPage();
    // Render the resulting JSX
    render(PageComponent);

    // Use findBy* which waits for async updates
    const heading = await screen.findByRole('heading', { name: /event workshops/i, level: 1 });
    expect(heading).toBeInTheDocument();

    // Check if the mocked cards are rendered (using testid or text)
    const cards = await screen.findAllByTestId('mock-workshop-card');
    expect(cards).toHaveLength(mockWorkshopsData.length);
    expect(cards[0]).toHaveTextContent('Workshop Alpha');
    expect(cards[1]).toHaveTextContent('Workshop Beta');

    // Check that error/empty messages are NOT present
    expect(screen.queryByText(/Could not load workshop information/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No workshops available/i)).not.toBeInTheDocument();

    // Verify the mocked fetch function was called
    expect(mockedFetchWorkshops).toHaveBeenCalledTimes(1);
    // Verify WorkshopCard mock was called correctly
    expect(MockedWorkshopCard).toHaveBeenCalledTimes(mockWorkshopsData.length);
    expect(MockedWorkshopCard).toHaveBeenCalledWith(expect.objectContaining({
      title: mockWorkshopsData[0].title,
      description: mockWorkshopsData[0].description,
      facilitator: mockWorkshopsData[0].facilitator,
      relevantThemes: undefined, // Because mockWorkshopsData[0].relevant_themes is null
    }), {}); // Check for empty object as second argument (React 18 behavior)
    expect(MockedWorkshopCard).toHaveBeenCalledWith(expect.objectContaining({
      title: mockWorkshopsData[1].title,
      description: mockWorkshopsData[1].description,
      facilitator: mockWorkshopsData[1].facilitator,
      relevantThemes: undefined, // Because mockWorkshopsData[1].relevant_themes is null
    }), {}); // Check for empty object as second argument (React 18 behavior)
  });

  it('should render an error message if data fetching fails', async () => {
    // Setup mock for error case
    const errorMessage = 'Failed to fetch';
    mockedFetchWorkshops.mockRejectedValue(new Error(errorMessage));

    // Await the Server Component function call
    const PageComponent = await WorkshopsPage();
    // Render the resulting JSX
    render(PageComponent);

    // Use findBy*
    const heading = await screen.findByRole('heading', { name: /event workshops/i, level: 1 });
    expect(heading).toBeInTheDocument();

    // Check for the specific error message rendered by the component
    expect(await screen.findByText(/Could not load workshop information at this time/i)).toBeInTheDocument();

    // Check that workshop cards/empty message are NOT present
    expect(screen.queryByTestId('mock-workshop-card')).not.toBeInTheDocument();
    expect(screen.queryByText(/No workshops available/i)).not.toBeInTheDocument();

    expect(mockedFetchWorkshops).toHaveBeenCalledTimes(1);
    expect(MockedWorkshopCard).not.toHaveBeenCalled();
  });

  it('should render a message if no workshops are available', async () => {
    // Setup mock for empty data case
    mockedFetchWorkshops.mockResolvedValue([]);

    // Await the Server Component function call
    const PageComponent = await WorkshopsPage();
    // Render the resulting JSX
    render(PageComponent);

    // Use findBy*
    const heading = await screen.findByRole('heading', { name: /event workshops/i, level: 1 });
    expect(heading).toBeInTheDocument();

    // Check for the empty message
    expect(await screen.findByText(/No workshops available/i)).toBeInTheDocument();

    // Check that workshop cards/error message are NOT present
    expect(screen.queryByTestId('mock-workshop-card')).not.toBeInTheDocument();
    expect(screen.queryByText(/Could not load workshop information/i)).not.toBeInTheDocument();

    expect(mockedFetchWorkshops).toHaveBeenCalledTimes(1);
    expect(MockedWorkshopCard).not.toHaveBeenCalled();
  });
});