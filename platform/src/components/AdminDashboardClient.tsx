'use client';

import { useState } from 'react';
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

interface DashboardClientProps {
  initialRegistrations: Registration[];
}

export default function DashboardClient({ initialRegistrations }: DashboardClientProps) {
  const [currentFilter, setCurrentFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  const handleFilterChange = (status: 'All' | 'Pending' | 'Approved' | 'Rejected') => {
    setCurrentFilter(status);
  };

  const filteredRegistrations = currentFilter === 'All'
    ? initialRegistrations
    : initialRegistrations.filter(reg => reg.status === currentFilter);

  return (
    <>
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