// platform/src/components/ScheduleDisplay.tsx
import React from 'react';
import { ScheduleItem } from '@/lib/data/schedule'; // Corrected import path

interface ScheduleDisplayProps {
  items: ScheduleItem[];
  timeFormat?: '12h' | '24h';
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

// Helper function to format time string based on 12h/24h format, avoiding Date object issues
const formatTime = (
  timeString: string | null | undefined,
  format: '12h' | '24h'
): string => {
  if (!timeString) return '';

  const parts = timeString.split(':');
  if (parts.length < 2) return timeString; // Invalid format, return original

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1]; // Keep as string 'MM'

  if (isNaN(hours)) return timeString; // Invalid format

  if (format === '12h') {
    const period = hours >= 12 ? ' PM' : ' AM'; // Add space before AM/PM
    hours = hours % 12;
    if (hours === 0) hours = 12; // Handle midnight (00:xx) -> 12 AM
    // Don't zero-pad 12h format hour
    const hours12 = hours.toString();
    return `${hours12}:${minutes}${period}`; // Keep space before AM/PM
  } else {
    // 24h format - just return HH:MM
    // Ensure hours are zero-padded
    const hours24 = hours.toString().padStart(2, '0');
    return `${hours24}:${minutes}`;
  }
};


export default function ScheduleDisplay({ items, timeFormat = '12h' }: ScheduleDisplayProps) {
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
                 {/* Requirement 3: Remove 'hidden', adjust responsive classes */}
                <div className="shrink-0 flex flex-col items-end sm:items-end">
                  <p className="text-sm leading-6 text-light-text">
                    {(() => {
                      // Pass only timeString and format to the updated helper
                      const startTimeFormatted = formatTime(item.start_time, timeFormat);
                      const endTimeFormatted = item.end_time ? formatTime(item.end_time, timeFormat) : null;

                      // Requirement 2: Single Time Events
                      if (!endTimeFormatted || !item.end_time) { // Added !item.end_time check for clarity
                        return startTimeFormatted;
                      }

                      // Requirement 1: 12h AM/PM logic
                      if (timeFormat === '12h') {
                        const startPeriod = startTimeFormatted.slice(-2); // AM or PM
                        const endPeriod = endTimeFormatted.slice(-2);   // AM or PM
                        if (startPeriod === endPeriod) {
                          // Remove AM/PM from start time if periods match
                          return `${startTimeFormatted.slice(0, -2).trim()} - ${endTimeFormatted}`;
                        }
                      }

                      // Default: Render both start and end time
                      return `${startTimeFormatted} - ${endTimeFormatted}`;
                    })()}
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