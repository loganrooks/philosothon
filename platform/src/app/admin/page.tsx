import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import Link from 'next/link';
// Client component will handle DataTable and StatusFilters
import AdminDashboardClient from '@/components/AdminDashboardClient';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user is logged in, redirect to the login page
    redirect('/admin/login');
  }

  // Fetch registrations data
  const { data: registrations, error: fetchError } = await supabase
    .from('registrations')
    .select('*'); // Select all columns for now

  if (fetchError) {
    console.error('Error fetching registrations:', fetchError.message);
    // Handle error appropriately, maybe show an error message to the user
    // For now, we'll proceed with an empty array
  }

  const registrationData = registrations || []; // Ensure we have an array

  // If user is logged in, render the dashboard
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p>Welcome to the admin area.</p>
      {/* Placeholder for dashboard content */}
      <div className="mt-8 space-y-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Manage Content</h2>
          <p className="text-sm text-gray-600 mb-4">Edit content displayed on the public pages.</p>
          <div className="space-y-2">
            {/* TODO: Create actual admin pages for content management */}
            <p><Link href="#" className="text-blue-600 hover:underline">Manage Themes</Link> (Placeholder)</p>
            <p><Link href="#" className="text-blue-600 hover:underline">Manage Workshops</Link> (Placeholder)</p>
            <p><Link href="#" className="text-blue-600 hover:underline">Manage FAQ</Link> (Placeholder)</p>
            <p><Link href="#" className="text-blue-600 hover:underline">Manage General Info</Link> (Placeholder)</p>
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">View Registrations</h2>
          <p className="text-sm text-gray-600 mb-4">View and manage participant registration data imported from Google Forms.</p>
          {/* TODO: Implement DataTable and Filters components */}
          {/* Render the client component responsible for filtering and display */}
          <AdminDashboardClient initialRegistrations={registrationData} />
          {/* Error message for initial fetch */}
          {fetchError && <p className="text-red-500 text-center mt-2">Error loading initial registration data.</p>}
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Admin Actions</h2>
          <p className="text-sm text-gray-600 mb-2">Logged in as: {user.email}</p>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}