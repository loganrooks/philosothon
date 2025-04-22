/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import ScheduleDisplay from './ScheduleDisplay'; // This import will fail initially
import { ScheduleItem } from '@/lib/data/schedule'; // Corrected import path

// Mock data with different dates for grouping test
const mockScheduleItems: ScheduleItem[] = [
  {
    id: 1, // Changed from string 'uuid-day1-1'
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
    id: 2, // Changed from string 'uuid-day2-1'
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
    id: 3, // Changed from string 'uuid-day1-2'
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

// Add mock data for single time event
const mockScheduleItemsWithSingleEvent: ScheduleItem[] = [
  ...mockScheduleItems,
  {
    id: 4, // Changed from string 'uuid-day1-3'
    item_date: '2025-10-26',
    start_time: '14:00:00',
    end_time: null, // Single time event
    title: 'Day 1 - Break',
    description: 'Coffee break',
    location: 'Lobby',
    speaker: null,
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
    // Use regex to match start time within the time range string (non-padded 12h format)
    expect(screen.getByText(/9:00 - 10:00 AM/)).toBeInTheDocument();
    // Use regex to match speaker name within the text node
    expect(screen.getByText(/Dr\. Keynote/)).toBeInTheDocument();
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

describe('ScheduleDisplay Refinements', () => {

  it('should format time according to timeFormat prop (12h)', () => {
    // Requirement 1: 12H/24H Toggle
    // This test assumes a `timeFormat` prop is added. It will fail initially.
    const itemWithAmPm = {
      ...mockScheduleItems[0],
      start_time: '14:30:00', // 2:30 PM
      end_time: '15:00:00',   // 3:00 PM
    };
    // Removed @ts-expect-error as prop now exists
    render(<ScheduleDisplay items={[itemWithAmPm]} timeFormat="12h" />);

    // Expect AM/PM format
    // Updated expectation based on refinement: only end time needs PM if both are PM.
    expect(screen.getByText(/2:30 - 3:00 PM/)).toBeInTheDocument();
  });

  it('should format time according to timeFormat prop (24h)', () => {
    // Requirement 1: 12H/24H Toggle
    // This test assumes a `timeFormat` prop is added. It will fail initially.
    const itemWithAmPm = {
      ...mockScheduleItems[0],
      start_time: '14:30:00',
      end_time: '15:00:00',
    };
    // Removed @ts-expect-error as prop now exists
    render(<ScheduleDisplay items={[itemWithAmPm]} timeFormat="24h" />);

    // Expect HH:MM format
    expect(screen.getByText('14:30 - 15:00')).toBeInTheDocument();
  });

  it('should render only start time for single time events', () => {
    // Requirement 2: Single Time Events
    render(<ScheduleDisplay items={mockScheduleItemsWithSingleEvent} />);

    const breakItemLi = screen.getByText('Day 1 - Break').closest('li');
    expect(breakItemLi).toBeInTheDocument();

    // Check the time display within the specific list item
    // This assertion assumes the time is rendered within a specific structure.
    // It will fail because the current code always renders " - {endTime}".
    // Expect default 12h format since no timeFormat prop is passed
    const timeElement = within(breakItemLi!).getByText(/^2:00 PM$/); // Exact match for start time only in 12h format
    expect(timeElement).toBeInTheDocument();
    // Verify the paragraph's text content is *exactly* the start time, with no hyphen
    expect(timeElement.textContent).toBe('2:00 PM');
    // Keep the original check as a backup, though it seems problematic
    // expect(within(breakItemLi!).queryByText(/- /)).not.toBeInTheDocument();
  });

  it('should render time information visibly on small screens', () => {
    // Requirement 3: Mobile Responsiveness (Basic Structure Check)
    // This test checks if the time element is NOT hidden on small screens.
    // It will fail because the current implementation uses `hidden sm:flex`.
    render(<ScheduleDisplay items={mockScheduleItems} />);

    const firstItemLi = screen.getByText('Day 1 - Opening').closest('li');
    expect(firstItemLi).toBeInTheDocument();

    // Find the div containing the time paragraph (using updated format)
    const timeContainerDiv = within(firstItemLi!).getByText('9:00 - 10:00 AM').closest('div');
    expect(timeContainerDiv).toBeInTheDocument();

    // Assert that the container div does NOT have the 'hidden' class.
    // This will fail because the element currently has 'hidden'.
    expect(timeContainerDiv).not.toHaveClass('hidden');
  });

});
