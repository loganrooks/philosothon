'use client';

import { useState } from 'react';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import StatusFilters from '@/components/StatusFilters';

// Define the Registration type (matching DataTable)
// Consider moving this to a shared types file later if used elsewhere
interface Registration {
  id: string; // Assuming UUID from Supabase
  created_at: string; // Assuming timestampz
  full_name: string;
  email: string;
  academic_year: string;
  program: string;
  school: string;
  student_number: string;
  workshop_preference: Record<string, unknown>; // JSONB
  theme_preference: Record<string, unknown>; // JSONB
  other_requests?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected'; // Assuming enum/text
}

interface AdminDashboardClientProps {
  initialRegistrations: Registration[];
}

export default function AdminDashboardClient({ initialRegistrations }: AdminDashboardClientProps) {
  const [currentFilter, setCurrentFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const handleFilterChange = (status: 'All' | 'Pending' | 'Approved' | 'Rejected') => {
    setCurrentFilter(status);
  };

  const filteredRegistrations = currentFilter === 'All'
    ? initialRegistrations
    : initialRegistrations.filter(reg => reg.status === currentFilter);

  return (
    <>
      {/* START: Content Management Navigation */}
      <div className="mb-4 flex items-center space-x-4">
        <h3 className="text-lg font-semibold mr-4">Manage Content:</h3>
        <Link href="/admin/themes" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow">
          Themes
        </Link>
        <Link href="/admin/workshops" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow">
          Workshops
        </Link>
        <Link href="/admin/faq" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow">
          FAQ
        </Link>
      </div>
      {/* END: Content Management Navigation */}

      {/* Pass state and handler to StatusFilters */}
      <StatusFilters
        currentFilter={currentFilter}
        onFilterChange={handleFilterChange}
      />
      <div className="p-4 border rounded bg-gray-50 mt-4">
        {/* Pass filtered data to DataTable */}
        <DataTable registrations={filteredRegistrations} />
        {initialRegistrations.length === 0 && <p className="text-center text-gray-500 mt-2">No registrations found.</p>}
        {/* Note: Error handling for initial fetch is done in the parent Server Component */}
      </div>
    </>
  );
}