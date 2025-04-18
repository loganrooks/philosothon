// platform/src/app/admin/login/page.tsx
import { LoginForm } from './components/LoginForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  // Redirect logged-in users away from the login page
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    redirect('/admin');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Admin Sign In
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter your email to receive a magic link
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}