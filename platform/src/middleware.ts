import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { fetchUserProfile } from '@/lib/data/profiles'; // Import the DAL function

export async function middleware(request: NextRequest) {
  // updateSession handles refreshing the session cookie and returns user object from auth session
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      // No user, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // User exists, now check their role from the profile
    const { profile, error: profileError } = await fetchUserProfile(user.id);

    if (profileError || !profile) {
      console.error(`Middleware: Error fetching profile or profile not found for user ${user.id}`, profileError);
      // Redirect to login as a safe default if profile is missing or fetch failed
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Check if the user has the required 'admin' role
    if (profile.role !== 'admin') {
      console.warn(`Middleware: Unauthorized access attempt to ${pathname} by user ${user.id} with role ${profile.role}`);
      // Redirect non-admins away from /admin routes
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login'; // Or a dedicated '/unauthorized' page
      return NextResponse.redirect(url);
    }
    // If role is 'admin', allow access (do nothing here, let it fall through)
  }

  // If user is logged in and tries to access /admin/login, redirect to /admin
  if (user && pathname === '/admin/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  // Continue with the response from updateSession (which handles cookie updates)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};