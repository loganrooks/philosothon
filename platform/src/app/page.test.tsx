import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'; // Added waitFor, beforeEach, Mock
import Home from '@/app/page';
import { fetchSchedule } from '@/lib/data/schedule'; // Import the function to mock
import '@testing-library/jest-dom'; // Import jest-dom matchers

// Mock the DAL function
vi.mock('@/lib/data/schedule', () => ({
  fetchSchedule: vi.fn(),
}));

// Mock child components
vi.mock('@/components/Hero', () => ({ default: () => <div data-testid="mock-hero">Mock Hero</div> }));
vi.mock('@/components/Countdown', () => ({ default: () => <div data-testid="mock-countdown">Mock Countdown</div> }));
vi.mock('@/components/EventHighlights', () => ({ default: () => <div data-testid="mock-event-highlights">Mock Event Highlights</div> }));
// Also mock ScheduleDisplay which is now used
vi.mock('@/components/ScheduleDisplay', () => ({ default: ({ items }: { items: any[] }) => <div data-testid="mock-schedule-display">Schedule Items: {items.length}</div> }));


describe('Home Page Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Provide a default mock implementation for fetchSchedule with new structure
    (fetchSchedule as Mock).mockResolvedValue({ scheduleItems: [], error: null });
  });

  // Await the async component resolution before rendering
  it('should render the Hero component', async () => {
    const resolvedComponent = await Home();
    render(resolvedComponent);
    expect(screen.getByTestId('mock-hero')).toBeInTheDocument();
  });

  it('should render the Countdown component', async () => {
    const resolvedComponent = await Home();
    render(resolvedComponent);
    expect(screen.getByTestId('mock-countdown')).toBeInTheDocument();
  });

  it('should render the EventHighlights component', async () => {
    const resolvedComponent = await Home();
    render(resolvedComponent);
    expect(screen.getByTestId('mock-event-highlights')).toBeInTheDocument();
  });

  // Add tests for ScheduleDisplay
  it('should render the ScheduleDisplay component and pass items', async () => {
    const mockScheduleItems = [{ id: '1', title: 'Test Event', time: '10:00', description: 'Desc' }];
    (fetchSchedule as Mock).mockResolvedValue({ scheduleItems: mockScheduleItems, error: null });
    
    const resolvedComponent = await Home();
    render(resolvedComponent);
    expect(screen.getByTestId('mock-schedule-display')).toBeInTheDocument();
    expect(screen.getByTestId('mock-schedule-display')).toHaveTextContent('Schedule Items: 1');
    expect(fetchSchedule).toHaveBeenCalledTimes(1);
  });

  it('should handle empty schedule gracefully', async () => {
    // Default mock from beforeEach handles this case (returns { scheduleItems: [], error: null })
    const resolvedComponent = await Home();
    render(resolvedComponent);
    expect(screen.getByTestId('mock-schedule-display')).toBeInTheDocument();
    expect(screen.getByTestId('mock-schedule-display')).toHaveTextContent('Schedule Items: 0');
    expect(fetchSchedule).toHaveBeenCalledTimes(1);
  });

  it('should handle error case gracefully', async () => {
    (fetchSchedule as Mock).mockResolvedValue({ 
      scheduleItems: null, 
      error: new Error('Failed to fetch schedule') 
    });
    
    const resolvedComponent = await Home();
    render(resolvedComponent);
    expect(screen.getByTestId('mock-schedule-display')).toBeInTheDocument();
    expect(screen.getByTestId('mock-schedule-display')).toHaveTextContent('Schedule Items: 0');
    expect(fetchSchedule).toHaveBeenCalledTimes(1);
  });
});