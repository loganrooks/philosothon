// platform/src/app/admin/schedule/components/ScheduleList.tsx
import React from 'react';
import Link from 'next/link';
import { ScheduleItem } from '@/lib/data/schedule'; // Import type from DAL

interface ScheduleListProps {
  items: ScheduleItem[];
}

export default function ScheduleList({ items }: ScheduleListProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          {/* Apply style guide: text-light-text */}
          <h1 className="text-base font-semibold leading-6 text-light-text">Schedule Items</h1>
          {/* Apply style guide: text-light-text (or slightly dimmer if needed) */}
          <p className="mt-2 text-sm text-light-text/80">
            A list of all the schedule items for the event.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {/* Apply style guide: primary button */}
          <Link
            href="/admin/schedule/new"
            className="block rounded-none bg-hacker-green px-3 py-2 text-center text-sm font-semibold text-black shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-hacker-green focus:ring-offset-2 focus:ring-offset-dark-base"
          >
            Add New Item
          </Link>
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {items.length === 0 ? (
              // Apply style guide: text-light-text
              <p className="text-center text-light-text/80">No schedule items found.</p>
            ) : (
              // Apply style guide: border-medium-gray
              <table className="min-w-full divide-y divide-medium-gray">
                <thead>
                  <tr>
                    {/* Apply style guide: text-light-text */}
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light-text sm:pl-0">Date</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-light-text">Start Time</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-light-text">End Time</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-light-text">Title</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                 {/* Apply style guide: border-medium-gray */}
                <tbody className="divide-y divide-medium-gray">
                  {items.map((item) => (
                    <tr key={item.id}>
                      {/* Apply style guide: text-light-text */}
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-light-text sm:pl-0">{item.item_date}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-light-text/80">{item.start_time}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-light-text/80">{item.end_time}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-light-text/80">{item.title}</td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                         {/* Apply style guide: standard link */}
                        <Link href={`/admin/schedule/edit?id=${item.id}`} className="text-light-text hover:underline">
                          Edit<span className="sr-only">, {item.title}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}