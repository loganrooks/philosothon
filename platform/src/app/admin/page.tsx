import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// import { cookies } from 'next/headers'; // No longer needed
import LogoutButton from '@/components/LogoutButton'; // Import the new component

export default async function AdminDashboardPage() {
  // const cookieStore = cookies(); // No longer needed here
  const supabase = await createClient(); // Call without arguments

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If no user is logged in, redirect to the login page
    redirect('/admin/login');
  }

  // If user is logged in, render the dashboard
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p>Welcome to the admin area.</p>
      {/* Placeholder for dashboard content (e.g., links to content management, registration view) */}
      <div className="mt-8 space-y-4">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Manage Content</h2>
          <p>Links to manage Themes, Workshops, FAQ...</p>
          {/* Add links like <Link href="/admin/content/themes">Manage Themes</Link> */}
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">View Registrations</h2>
          <p>Link to view imported registration data...</p>
          {/* TODO: Add link like <Link href="/admin/registrations">View Registrations</Link> */}
        </div>
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Admin Actions</h2>
          <p className="text-sm text-gray-600 mb-2">Logged in as: {user.email}</p>
          {/* TODO: Implement Logout Button */}
          <LogoutButton />
          {/* Add logout button */}
        </div>
      </div>
    </div>
  );
}