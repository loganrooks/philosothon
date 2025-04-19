// platform/src/app/admin/layout.tsx
import Link from 'next/link';
import { LogoutButton } from './components/LogoutButton';
// import { createClient } from '@/lib/supabase/server'; // Removed unused import
// import { redirect } from 'next/navigation'; // Removed unused import

// Note: Middleware already handles redirecting unauthenticated users away from /admin/*
// This layout assumes the user is authenticated.

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Optional: Fetch user data again if needed for display (e.g., user email)
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // Removed unused code block

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-700 bg-gray-800 p-4 flex flex-col"> {/* Added flex flex-col */}
        <div> {/* Wrapper for top content */}
          <h2 className="mb-6 text-xl font-semibold text-white font-philosopher">Admin Menu</h2>
          <nav className="space-y-2">
            <Link href="/admin" className="block px-3 py-2 hover:bg-gray-700">
              Dashboard
            </Link>
            <Link href="/admin/themes" className="block px-3 py-2 hover:bg-gray-700">
              Themes
            </Link>
            <Link href="/admin/workshops" className="block px-3 py-2 hover:bg-gray-700">
              Workshops
            </Link>
            <Link href="/admin/faq" className="block px-3 py-2 hover:bg-gray-700">
              FAQ
            </Link>
            {/* Add other admin links here */}
          </nav>
        </div>
        <div className="mt-auto pt-4"> {/* Pushes logout to bottom */}
           <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}