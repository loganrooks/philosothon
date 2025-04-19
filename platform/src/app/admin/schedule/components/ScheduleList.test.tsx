/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen } from '@testing-library/react';
import ScheduleList from './ScheduleList'; // This import will fail initially
import { ScheduleItem } from '@/lib/data/schedule'; // Corrected import path

// Mock data
const mockScheduleItems: ScheduleItem[] = [
  {
    id: 'uuid-1',
    item_date: '2025-10-26',
    start_time: '09:00:00',
    end_time: '10:00:00',
    title: 'Opening Ceremony',
    description: 'Welcome and introductions.',
    location: 'Main Hall',
    speaker: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'uuid-2',
    item_date: '2025-10-26',
    start_time: '10:30:00',
    end_time: '12:00:00',
    title: 'Workshop Session 1',
    description: 'Parallel workshops.',
    location: 'Various Rooms',
    speaker: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('ScheduleList', () => {
  it('should render a list or table of schedule items', () => {
    // TDD Anchor: Test list rendering (Spec Line 118)
    render(<ScheduleList items={mockScheduleItems} />); // This will fail

    // Check if key data points from the mock items are rendered
    expect(screen.getByText('Opening Ceremony')).toBeInTheDocument();
    expect(screen.getByText('Workshop Session 1')).toBeInTheDocument();
    // Use getAllByText because the date appears multiple times
    expect(screen.getAllByText('2025-10-26').length).toBeGreaterThan(0);
    // Add more specific checks if using a table (e.g., check for table headers, rows)
  });

  it('should render appropriate message when no items are provided', () => {
    render(<ScheduleList items={[]} />); // This will fail

    expect(screen.getByText(/No schedule items found/i)).toBeInTheDocument();
  });

  // Add tests for links to edit/new pages if the list component includes them
  it('should contain links to add a new schedule item', () => {
     render(<ScheduleList items={mockScheduleItems} />); // This will fail
     const addLink = screen.getByRole('link', { name: /Add New Item/i }); // Adjust name as needed
     expect(addLink).toBeInTheDocument();
     expect(addLink).toHaveAttribute('href', '/admin/schedule/new');
  });

   it('should contain links to edit existing schedule items', () => {
     render(<ScheduleList items={mockScheduleItems} />); // This will fail
     // Assuming edit links are associated with each item, e.g., by title
     const editLink = screen.getAllByRole('link', { name: /Edit/i }); // Adjust selector
     expect(editLink.length).toBe(mockScheduleItems.length);
     // Check href for one of the links (adjust based on actual implementation)
     expect(editLink[0]).toHaveAttribute('href', `/admin/schedule/edit?id=${mockScheduleItems[0].id}`);
   });
});