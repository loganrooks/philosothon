import React from 'react';

// Define the type for the filter status
type FilterStatus = 'All' | 'Pending' | 'Approved' | 'Rejected';

interface StatusFiltersProps {
  currentFilter: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

const StatusFilters: React.FC<StatusFiltersProps> = ({ currentFilter, onFilterChange }) => {
  const statuses: FilterStatus[] = ['All', 'Pending', 'Approved', 'Rejected'];

  return (
    <div className="mb-4 flex space-x-2">
      <span className="text-sm font-medium text-gray-300 mr-2 self-center">Filter by status:</span>
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={`px-3 py-1 text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            currentFilter === status
              ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' // Active state
              : 'bg-white text-gray-300 border-gray-300 hover:bg-gray-50' // Inactive state
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
};

export default StatusFilters;