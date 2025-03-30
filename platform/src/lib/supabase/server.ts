import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Note: supabase-js uses the `cookies-next` package to handle cookies
// Therefore we need to await the cookies() call
export async function createClient() {
  const cookieStore = await cookies()

  // Create a server-side client with the environment variables and cookies
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// TODO: Consider adding a separate function for Route Handlers/Server Actions
// if different cookie handling logic is needed, though the above should work
// for most cases with the App Router.

// TODO: Consider creating a service role client utility if needed for specific
// backend operations that bypass RLS (use with extreme caution).
// import { createClient as createAdminClient } from '@supabase/supabase-js'
// export function createAdminRoleClient() {
//   return createAdminClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!, // Ensure this is set in env vars
//     { auth: { autoRefreshToken: false, persistSession: false } }
//   )
// }