import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Assuming this is the correct path

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    try {
      const supabase = await createClient(); // Await the client creation
      await supabase.auth.exchangeCodeForSession(code);
      // Successful exchange, redirect to admin dashboard
      return NextResponse.redirect(`${origin}/admin`);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // Even on error, redirect to admin, maybe middleware handles unauth state?
      // Or redirect to login: return NextResponse.redirect(`${origin}/admin/login?error=auth_callback_failed`);
      return NextResponse.redirect(`${origin}/admin`);
    }
  }

  // If no code is present, redirect to login page with an error message
  console.error('Auth callback called without a code parameter.');
  return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
}