'use client';

import { useState } from 'react';
// import { useRouter } from 'next/navigation'; // Removed unused import
import { useSupabase } from '@/components/SupabaseProvider';

export default function AdminLoginPage() {
  const supabase = useSupabase(); // useSupabase returns the client directly
  // const router = useRouter(); // Removed unused variable
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Ensure this matches the redirect URL configured in your Supabase project auth settings
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`, // Redirect to callback, then admin
        },
      });

      if (signInError) {
        throw signInError;
      }

      setMessage('Check your email for the magic login link!');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      // Attempt to get a more specific Supabase error message if available
      const supabaseError = err as { error_description?: string; message?: string };
      setError(supabaseError?.error_description || supabaseError?.message || message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if user is already logged in (optional, but good UX)
  // This requires checking session state, which might be better handled
  // by the middleware or the protected route itself. For simplicity,
  // we'll rely on the protected route check for now.

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Admin Login
        </h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm ${
              loading
                ? 'cursor-not-allowed bg-indigo-300'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-green-600">{message}</p>
          )}
          {error && (
            <p className="mt-4 text-center text-sm text-red-600">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}