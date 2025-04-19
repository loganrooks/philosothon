// platform/src/components/ScheduleDisplay.tsx
import React from 'react';
import { ScheduleItem } from '@/lib/data/schedule'; // Corrected import path

interface ScheduleDisplayProps {
  items: ScheduleItem[];
}

// Helper function to group items by date
const groupItemsByDate = (items: ScheduleItem[]) => {
  return items.reduce((acc, item) => {
    const date = item.item_date; // Assuming item_date is 'YYYY-MM-DD' string
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    // Sort items within the date group by start_time
    acc[date].sort((a: ScheduleItem, b: ScheduleItem) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
    return acc;
  }, {} as Record<string, ScheduleItem[]>);
};

// Helper function to format date string
const formatDateHeading = (dateString: string): string => {
  try {
    const date = new Date(`${dateString}T00:00:00`); // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC', // Specify UTC to match the input assumption
    });
  } catch (e) {
    console.error("Error formatting date heading:", dateString, e);
    return dateString; // Fallback
  }
};

// Helper function to format time string (HH:MM:SS -> HH:MM)
const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return '';
  return timeString.substring(0, 5); // Extract HH:MM
};


export default function ScheduleDisplay({ items }: ScheduleDisplayProps) {
  if (!items || items.length === 0) {
    return <p className="text-center text-gray-400">Schedule coming soon.</p>;
  }

  const groupedItems = groupItemsByDate(items);
  const sortedDates = Object.keys(groupedItems).sort();

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Apply style guide: text-light-text */}
          <h2 className="text-xl font-semibold leading-6 text-light-text mb-4">
            {formatDateHeading(date)}
          </h2>
          <ul role="list" className="divide-y divide-medium-gray border-t border-medium-gray">
            {groupedItems[date].map((item: ScheduleItem) => (
              <li key={item.id} className="flex gap-x-6 py-5">
                {/* Apply style guide: text-light-text */}
                <div className="min-w-0 flex-auto">
                  {/* Changed <p> to <div> to fix nesting warning */}
                  <div className="text-sm font-semibold leading-6 text-light-text">
                    {/* Assuming titles are H3 equivalent for testing */}
                    <h3 className="inline">{item.title}</h3>
                  </div>
                  {item.description && (
                    <p className="mt-1 truncate text-xs leading-5 text-gray-400">{item.description}</p>
                  )}
                   {item.speaker && (
                    <p className="mt-1 text-sm leading-5 text-gray-400">Speaker: {item.speaker}</p>
                  )}
                   {item.location && (
                    <p className="mt-1 text-sm leading-5 text-gray-400">Location: {item.location}</p>
                  )}
                </div>
                 {/* Apply style guide: text-light-text */}
                <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
                  <p className="text-sm leading-6 text-light-text">
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}