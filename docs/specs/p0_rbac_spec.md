# P0 Feature Specification: Authentication & RBAC

**Version:** 1.0
**Date:** 2025-04-19
**Status:** Draft

## 1. Overview

This document specifies the functional requirements and implementation details for the Authentication and Role-Based Access Control (RBAC) system for the Philosothon Platform V2, focusing on Priority 0 (P0) features. It builds upon Requirement 3.1 in `docs/project_specifications_v2.md` and the decisions outlined in `memory-bank/adr/2025-04-19-v2-rbac-implementation.md`.

## 2. Functional Requirements

### 2.1. Authentication Method (Req 3.1.1)

*   **FR-RBAC-001:** The primary authentication method for users (including Admins for P0) shall be Supabase Auth using the Magic Link (OTP via email) flow.
*   **FR-RBAC-002:** The system must provide a user interface for initiating the Magic Link login process (e.g., `/admin/login` page).
*   **FR-RBAC-003:** The system must handle the Supabase authentication callback (`/api/auth/callback`) to exchange the code for a user session.
*   **FR-RBAC-004:** The system must provide a mechanism for users to log out, terminating their session.
*   **FR-RBAC-005:** (Deferred from P0) Requirement 3.1.1 regarding enhancing/replacing Magic Link for admin security is deferred pending further architectural review post-P0. Magic Link is sufficient for P0 admin access.

### 2.2. User Roles (Req 3.1.2)

*   **FR-RBAC-006:** The system shall define the following user roles using a PostgreSQL `ENUM` type named `user_role`:
    *   `admin`: Full administrative privileges.
    *   `participant`: Standard user, registers for the event. (Default role).
    *   `judge`: Access to view submissions.
    *   `team_member`: Participant assigned to a team, access to team features and submission portal.
*   **FR-RBAC-007:** User roles shall be stored in a `role` column within the `profiles` table, which is linked one-to-one with the `auth.users` table via the user's ID.
    *   *Data Model Reference:* See `memory-bank/mode-specific/architect.md` for `profiles` table structure.

### 2.3. Role Assignment (Req 3.1.2)

*   **FR-RBAC-008:** For P0, user roles (specifically assigning `admin` or `judge`) will be managed manually by a system administrator directly via the Supabase Studio interface or SQL commands.
*   **FR-RBAC-009:** New users created via Supabase Auth will default to the `participant` role in the `profiles` table (handled by table default or trigger).
*   **FR-RBAC-010:** (Deferred from P0) Automated role assignment (e.g., changing `participant` to `team_member` upon team formation) is deferred.

### 2.4. Access Control Enforcement (Req 3.1.2)

*   **FR-RBAC-011:** Access to specific frontend routes/pages must be restricted based on user authentication status and role using Next.js Middleware.
    *   Example Protected Routes (P0 Focus):
        *   `/admin/**`: Requires `admin` role.
        *   (Future) `/judge/**`: Requires `judge` role.
        *   (Future) `/submit/**`: Requires `team_member` role.
        *   (Future) `/team/**`: Requires `team_member` role.
*   **FR-RBAC-012:** Unauthorized users attempting to access protected routes shall be redirected (e.g., to a login page or an "Unauthorized" page).
*   **FR-RBAC-013:** Access to data within the Supabase database must be restricted based on user role using Row Level Security (RLS) policies.
    *   RLS policies must be implemented on tables containing sensitive or role-specific data (e.g., `profiles`, `registrations`, `submissions`, `teams`).
    *   Policies should leverage `auth.uid()` and the user's role fetched from the `profiles` table.

## 3. Implementation Details & Pseudocode

### 3.1. Data Models

*   Refer to `memory-bank/mode-specific/architect.md` for the detailed SQL definitions of the `profiles` table (including the `user_role` ENUM) and example RLS policies.

### 3.2. Authentication Flow (Magic Link)

*   **Login Page (`/admin/login` or similar):**
    *   Contains a form with an email input field.
    *   On submit, invokes the `signInWithOtp` Server Action.
    *   Displays success/error messages returned from the Server Action (using `useFormState`).
*   **`signInWithOtp` Server Action (`src/app/admin/auth/actions.ts`):**
    *   Receives email from form data.
    *   Performs basic email validation.
    *   Calls `supabase.auth.signInWithOtp`, providing the email and the callback URL (`/api/auth/callback`).
    *   Returns success or error state to the form.
    *   *Pseudocode Reference:* See `memory-bank/mode-specific/spec-pseudocode.md`.
*   **Callback Handler (`/app/auth/callback/route.ts`):**
    *   Handles GET requests from Supabase after user clicks the magic link.
    *   Extracts the authorization code from the request URL.
    *   Exchanges the code for a user session using `supabase.auth.exchangeCodeForSession`.
    *   Redirects the user to the appropriate authenticated page (e.g., `/admin`).
*   **Logout Mechanism:**
    *   A button or link (e.g., `LogoutButton` component) invokes the `signOut` Server Action.
    *   **`signOut` Server Action (`src/app/admin/auth/actions.ts`):**
        *   Calls `supabase.auth.signOut`.
        *   Redirects the user to the login page.
        *   *Pseudocode Reference:* See `memory-bank/mode-specific/spec-pseudocode.md`.

### 3.3. RBAC Middleware (`src/middleware.ts`)

```typescript
// src/middleware.ts (Conceptual Pseudocode)
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/middleware'; // Utility to create Supabase client in middleware

// Define role hierarchy or specific permissions if needed (simple example)
const ADMIN_ROLE = 'admin';
// const JUDGE_ROLE = 'judge';
// const TEAM_MEMBER_ROLE = 'team_member';

// Define protected paths and required roles
const protectedPaths = {
  '/admin': [ADMIN_ROLE],
  // '/judge': [JUDGE_ROLE],
  // '/submit': [TEAM_MEMBER_ROLE],
  // '/team': [TEAM_MEMBER_ROLE],
};

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);

  // Refresh session if expired - important!
  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // --- Check protected routes ---
  let requiredRoles: string[] | undefined = undefined;
  for (const pathPrefix in protectedPaths) {
    if (pathname.startsWith(pathPrefix)) {
      requiredRoles = protectedPaths[pathPrefix as keyof typeof protectedPaths];
      break;
    }
  }

  // If route is protected
  if (requiredRoles) {
    // If no active session, redirect to login
    if (!session) {
      // TDD: Test redirection to login when accessing protected route without session.
      return NextResponse.redirect(new URL('/admin/login', request.url)); // Adjust login URL if needed
    }

    // If session exists, check user role
    // Fetch role from 'profiles' table based on session.user.id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Handle profile fetch error (log it, maybe redirect to error page)
    if (profileError || !profile) {
      console.error('Middleware: Error fetching profile or profile not found', profileError);
      // TDD: Test handling of profile fetch error (e.g., redirect to error page or login).
      // Decide on appropriate action - redirect to login might be safest
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const userRole = profile.role;

    // Check if user role is included in the required roles for the path
    if (!requiredRoles.includes(userRole)) {
      // TDD: Test redirection to unauthorized/login page when user role doesn't match required roles.
      // Redirect to an 'Unauthorized' page or back to login/dashboard
      console.warn(`Middleware: Unauthorized access attempt to ${pathname} by user ${session.user.id} with role ${userRole}`);
      return NextResponse.redirect(new URL('/admin/login', request.url)); // Or a dedicated '/unauthorized' page
    }
    // TDD: Test successful access to protected route when user has correct role.
  }

  // --- Optional: Redirect logged-in users from login page ---
  if (session && pathname === '/admin/login') {
     // TDD: Test redirection from login page if user already has a session.
     return NextResponse.redirect(new URL('/admin', request.url)); // Redirect to dashboard
  }


  // Continue request processing
  return response;
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth/callback (Supabase auth callback) - IMPORTANT to exclude
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/callback).*)',
  ],
};
```

### 3.4. RLS Policies (Examples)

*   RLS policies should be defined directly in Supabase SQL editor or via migrations.
*   **Example: `submissions` table**
    *   Allow team members to view/insert their own team's submissions.
    *   Allow judges and admins to view all submissions.
    *   Prevent unauthorized reads/writes.

```sql
-- Example RLS Policy for submissions (Conceptual - adapt based on final schema)

-- Allow team members to view/insert their team's submissions
CREATE POLICY "Allow team member access" ON submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND team_id = submissions.team_id))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND team_id = submissions.team_id));
  -- TDD: Test that a team_member can SELECT/INSERT submissions with matching team_id.
  -- TDD: Test that a team_member CANNOT SELECT/INSERT submissions with different team_id.

-- Allow judges to view all submissions
CREATE POLICY "Allow judge read access" ON submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'judge'));
  -- TDD: Test that a judge can SELECT all submissions.
  -- TDD: Test that a judge CANNOT INSERT/UPDATE/DELETE submissions.

-- Allow admins to access all submissions
CREATE POLICY "Allow admin access" ON submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  -- TDD: Test that an admin can SELECT/INSERT/UPDATE/DELETE any submission.

-- Ensure RLS is enabled on the table
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
```

*   Similar policies need to be defined for other tables like `profiles`, `teams`, `registrations`, etc., based on specific access requirements. Refer to `memory-bank/mode-specific/architect.md` for more examples.

## 4. TDD Anchors Summary

*   **Authentication Actions (`signInWithOtp`, `signOut`):**
    *   Test input validation.
    *   Test successful Supabase API calls.
    *   Test error handling from Supabase API calls.
    *   Test correct return values/redirects.
*   **Callback Handler (`/api/auth/callback`):**
    *   Test successful code exchange and session creation.
    *   Test handling of invalid/expired codes.
    *   Test correct redirection after successful exchange.
*   **Middleware (`src/middleware.ts`):**
    *   Test redirection to login when accessing protected route without session.
    *   Test handling of profile fetch errors (e.g., redirect).
    *   Test redirection when user role doesn't match required roles.
    *   Test successful access to protected route with the correct role.
    *   Test redirection from login page if user already has a session.
*   **RLS Policies:**
    *   For each policy on each table, test that users with the specified role *can* perform the allowed actions (SELECT, INSERT, UPDATE, DELETE) under the policy conditions.
    *   For each policy on each table, test that users *without* the specified role, or users who don't meet the policy conditions (e.g., wrong team_id), *cannot* perform the actions.

## 5. Open Questions / TBD

*   (Low Priority for P0) Specific UI/UX for displaying "Unauthorized" messages if not redirecting to login.
*   (Low Priority for P0) Need for a dedicated admin UI for role management beyond P0 manual assignment.