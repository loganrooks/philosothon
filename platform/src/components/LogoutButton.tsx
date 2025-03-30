'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/SupabaseProvider';

export default function LogoutButton() {
  const supabase = useSupabase();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error logging out:', error);
      // Optionally show an error message to the user
    } else {
      // Redirect to home page or login page after logout
      router.push('/'); // Or '/admin/login'
      router.refresh(); // Refresh server components
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}