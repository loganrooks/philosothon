/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import ScheduleDisplay from './ScheduleDisplay'; // This import will fail initially
import { ScheduleItem } from '@/lib/types'; // Assuming type definition exists/will exist

// Mock data with different dates for grouping test
const mockScheduleItems: ScheduleItem[] = [
  {
    id: 'uuid-day1-1',
    item_date: '2025-10-26',
    start_time: '09:00:00',
    end_time: '10:00:00',
    title: 'Day 1 - Opening',
    description: 'Welcome.',
    location: 'Hall A',
    speaker: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'uuid-day2-1',
    item_date: '2025-10-27',
    start_time: '10:00:00',
    end_time: '11:00:00',
    title: 'Day 2 - Keynote',
    description: 'Keynote speech.',
    location: 'Hall B',
    speaker: 'Dr. Keynote',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
   {
    id: 'uuid-day1-2', // Item later in day 1
    item_date: '2025-10-26',
    start_time: '11:00:00',
    end_time: '12:00:00',
    title: 'Day 1 - Session 1',
    description: 'First session.',
    location: 'Room 101',
    speaker: 'Speaker A',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data fetching function (assuming component fetches its own data)
// If data is passed as prop, this mock is not needed here.
// vi.mock('@/lib/data/schedule', () => ({ // Adjust path as needed
//   fetchScheduleItems: vi.fn(),
// }));

describe('ScheduleDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful data fetch if component fetches data
    // vi.mocked(fetchScheduleItems).mockResolvedValue(mockScheduleItems);
  });

  it('should render schedule items correctly', async () => {
    // TDD Anchor: Test rendering logic for different schedule items (Spec Line 191)
    // Assuming data is passed as a prop for simplicity in testing rendering
    render(<ScheduleDisplay items={mockScheduleItems} />); // This will fail

    // Check if key details are rendered
    expect(screen.getByText('Day 1 - Opening')).toBeInTheDocument();
    expect(screen.getByText('Day 2 - Keynote')).toBeInTheDocument();
    expect(screen.getByText('Day 1 - Session 1')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument(); // Check for start time rendering (adjust format)
    expect(screen.getByText('Dr. Keynote')).toBeInTheDocument(); // Check for speaker
  });

  it('should group items by date', async () => {
    // TDD Anchor: Test grouping by date (Spec Line 191)
    render(<ScheduleDisplay items={mockScheduleItems} />); // This will fail

    // Check for date headings (assuming H2 or similar)
    const dateHeadings = screen.getAllByRole('heading', { level: 2 }); // Adjust level as needed
    expect(dateHeadings).toHaveLength(2); // Expecting two date groups
    expect(dateHeadings[0]).toHaveTextContent('October 26, 2025'); // Adjust format as needed
    expect(dateHeadings[1]).toHaveTextContent('October 27, 2025');

    // Check that items are under the correct date heading (more complex assertion)
    // This might involve checking the structure (e.g., elements following the heading)
  });

   it('should render items ordered correctly by time within each date group', async () => {
    // TDD Anchor: Test data fetching and ordering (Spec Line 191) - Testing rendering order here
    render(<ScheduleDisplay items={mockScheduleItems} />); // This will fail

    // Get all elements representing schedule item titles (adjust selector as needed)
    const titles = screen.getAllByRole('heading', { level: 3 }); // Assuming titles are H3

    // Find the indices of the Day 1 titles
    const openingIndex = titles.findIndex(el => el.textContent === 'Day 1 - Opening');
    const session1Index = titles.findIndex(el => el.textContent === 'Day 1 - Session 1');

    // Assert that 'Opening' appears before 'Session 1'
    expect(openingIndex).toBeLessThan(session1Index);
  });


  it('should display a message if no schedule items are available', async () => {
    render(<ScheduleDisplay items={[]} />); // This will fail

    expect(screen.getByText(/Schedule coming soon/i)).toBeInTheDocument(); // Adjust message as needed
  });

  // Add tests for data fetching if the component handles it internally
  // it('should fetch schedule items on mount', async () => {
  //   render(<ScheduleDisplay />); // Assuming component fetches data
  //   await waitFor(() => {
  //     expect(fetchScheduleItems).toHaveBeenCalledTimes(1);
  //   });
  // });
});