import React from 'react';

// Define the type based on the schema in docs/project_specifications.md
interface Registration {
  id: string;
  created_at: string;
  import_batch?: string | null;
  full_name: string;
  email: string;
  academic_year: string;
  program: string;
  philosophy_background?: string | null;
  self_rated_confidence?: number | null;
  interest_areas?: string[] | null;
  theme_preferences?: Record<string, unknown> | null; // JSONB
  workshop_preferences?: Record<string, unknown> | null; // JSONB
  is_mentor?: boolean | null;
  is_mentee?: boolean | null;
  interest_similarity_preference?: number | null;
  teammate_requests?: string[] | null;
  dietary_restrictions?: string | null;
  accessibility_needs?: string | null;
  extension_status?: string | null;
  status?: string | null;
  admin_notes?: string | null;
  team_id?: string | null;
}

interface DataTableProps {
  registrations: Registration[];
}

const DataTable: React.FC<DataTableProps> = ({ registrations }) => {
  const columns = [
    { key: 'full_name', header: 'Full Name' },
    { key: 'email', header: 'Email' },
    { key: 'academic_year', header: 'Academic Year' },
    { key: 'program', header: 'Program' },
    { key: 'status', header: 'Status' },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="align-middle inline-block min-w-full">
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations && registrations.length > 0 ? (
                registrations.map((registration) => (
                  <tr key={registration.id}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {registration[col.key as keyof Registration] !== null && registration[col.key as keyof Registration] !== undefined
                          ? String(registration[col.key as keyof Registration])
                          : 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;