# Project Security Guidelines

This document outlines key security best practices for developers working on the Philosothon platform project. Adhering to these guidelines helps maintain the security and integrity of the application and user data.

## 1. Secrets Management

*   **NEVER** commit secrets (API keys, database credentials, private keys, etc.) directly into the Git repository.
*   Use environment variables for all secrets.
    *   Frontend (browser-accessible): Prefix with `NEXT_PUBLIC_` (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Use these sparingly and only for non-sensitive public keys/URLs.
    *   Backend (server-side only): Use standard names (e.g., `SUPABASE_SERVICE_ROLE_KEY`). These should **never** be prefixed with `NEXT_PUBLIC_`.
*   Store local development secrets in `.env.local` (which is included in `.gitignore`).
*   Configure production/preview environment variables securely via the deployment platform (Vercel).
*   Regularly audit code for accidentally committed secrets using tools or manual review.

## 2. Authentication & Authorization

*   Utilize the established Supabase client utilities (`@/lib/supabase/client`, `@/lib/supabase/server`, `@/lib/supabase/middleware`) for interacting with Supabase Auth.
*   Protect sensitive routes (especially `/admin`) using Next.js Middleware (`src/middleware.ts`). Middleware should verify authentication status and check user roles against the `profiles` table.
*   Implement authorization checks within Server Actions and API routes where necessary, verifying the user has the required permissions/role for the requested operation, even if the route itself is protected by middleware (defense-in-depth).
*   Rely on Supabase Row Level Security (RLS) policies as the primary mechanism for data access control within the database.

## 3. Input Validation

*   **Always** validate data on the server-side (Server Actions, API routes) before processing or storing it.
*   Use Zod for defining and enforcing data schemas, especially for form submissions. Leverage the central `registrationSchema.ts` and generation script for registration data.
*   Implement client-side validation for better UX, but **never** rely solely on it for security. Client-side validation can be bypassed.
*   Sanitize any user-provided input that will be rendered as HTML (though React generally handles this, be cautious if using `dangerouslySetInnerHTML`). Use libraries like `dompurify` if necessary.
*   Be mindful of data types during processing (e.g., use `parseInt` carefully, handle potential `NaN`).

## 4. Supabase & Database Security

*   **Enable and Enforce RLS:** Ensure RLS is enabled and forced on all tables containing sensitive or user-specific data.
*   **Write Secure RLS Policies:**
    *   Follow the principle of least privilege. Grant only the necessary permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
    *   Use `auth.uid()` to restrict access to the user's own data.
    *   Use helper functions (like `get_my_role()`) to check user roles stored in the `profiles` table for role-based access. Ensure these helper functions are secure.
    *   Use `USING` clauses for read/write access control and `WITH CHECK` clauses to enforce constraints on data modification/insertion.
    *   Specifically prevent users from modifying their own roles (as implemented in the `profiles` update policy).
*   **Service Role Key:** Use the `SUPABASE_SERVICE_ROLE_KEY` **only** when absolutely necessary for backend processes that *must* bypass RLS (e.g., specific admin tasks, triggers). Isolate its usage in secure backend functions/scripts and never expose it to the client-side. The current commented-out `createAdminRoleClient` in `server.ts` should only be uncommented and used with extreme caution and proper isolation.
*   **Database Migrations:** Review SQL in migration files carefully before applying, especially those defining RLS policies or security functions.

## 5. Dependency Management

*   Regularly check for known vulnerabilities in project dependencies using `npm audit` (or `yarn audit`).
*   Address high and critical severity vulnerabilities promptly by updating packages.
*   Keep dependencies reasonably up-to-date to benefit from security patches.
*   Be cautious when adding new dependencies; review their reputation and maintenance status.

## 6. Error Handling

*   Implement robust error handling in Server Actions and API routes.
*   Catch potential errors during database operations, API calls, etc.
*   Log detailed errors server-side for debugging purposes.
*   **Do not** expose sensitive error details (stack traces, database errors, internal paths) to the client. Return generic error messages.

## 7. Code Quality & Review

*   Write clear, modular code. Avoid oversized files/components (like the current `RegistrationForm.tsx`) which are harder to review for security flaws. Follow the established modular patterns (DAL, Modular Terminal UI).
*   Perform code reviews, paying specific attention to security aspects like input validation, authorization checks, and secret handling.
*   Use linters and static analysis tools to catch potential issues early.

## 8. Secure Development Workflow

*   Follow the defined Git workflow (`docs/git_workflow.md`).
*   Develop features on separate branches.
*   Review code via Pull Requests before merging to `main`.
*   Ensure automated checks (build, tests, linting) pass before merging.
*   Test security features thoroughly (authentication, authorization, RLS).

By following these guidelines, we can build a more secure and robust platform.