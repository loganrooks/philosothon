'use client'; // Required for useState, useEffect, form handling

import { useState } from 'react';
import { useSupabase } from '@/components/SupabaseProvider'; // Use the custom hook

export default function AdminLoginPage() {
  const supabase = useSupabase(); // Get Supabase client instance directly
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // set this to false if you do not want the user to be automatically signed up
        shouldCreateUser: false,
        // Where to redirect the user after they click the magic link
        emailRedirectTo: `${window.location.origin}/admin`, // Redirect to admin dashboard
      },
    });

    if (error) {
      console.error('Error sending magic link:', error);
      setError(`Error: ${error.message}`);
    } else {
      setMessage('Check your email for the magic login link!');
      setEmail(''); // Clear email field on success
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Login</h1>
      <p className="mb-4 text-gray-700">Enter your email to receive a magic login link.</p>

      {message && <p className="mb-4 text-green-600 bg-green-100 p-3 rounded-md">{message}</p>}
      {error && <p className="mb-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>
    </div>
  );
}