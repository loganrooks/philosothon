# Decision Log

This file records architectural and implementation decisions using a list format.
2025-03-30 18:58:27 - Log of updates made.

*

## Decision
[2025-03-30] Use Next.js as the frontend framework.

## Rationale
Leverages SSR/SSG for SEO and performance, API routes for backend needs, file-based routing for efficiency, and team's React expertise. (See `docs/adr/2025-03-30-nextjs-frontend-framework.md`)

## Implementation Details
Initialize with `create-next-app`, use App Router, SSG/ISR/SSR as appropriate per page, Tailwind CSS for styling.

*

## Decision
[2025-03-30] Use Tailwind CSS as the UI framework.

## Rationale
Utility-first approach speeds development, highly customizable, optimized CSS output via JIT, good AI assistance compatibility. (See `docs/adr/2025-03-30-tailwind-css-framework.md`)

## Implementation Details
Configure via `tailwind.config.js` with project design system, apply utility classes directly in JSX, create reusable components for complex elements.

*

## Decision
[2025-03-30] Use Google Forms (embedded) for MVP registration.

## Rationale
Zero development time for form handling, supports complex questions, free, familiar user interface. Fastest path for MVP. (See `docs/adr/2025-03-30-google-forms-registration.md`)

## Implementation Details
Embed form via iframe on `/register` page. Manual weekly CSV export from Google Sheets, sanitization, and import into Supabase `registrations` table.

*

## Decision
[2025-03-30] Use Supabase as the Backend-as-a-Service (BaaS).

## Rationale
Provides PostgreSQL DB, integrated Auth, auto-generated APIs (PostgREST), real-time potential, generous free tier, minimizes backend dev time. (See `docs/adr/2025-03-30-supabase-backend.md`)

## Implementation Details
Use managed Postgres, implement RLS, use Supabase Auth, interact via `@supabase/supabase-js` and `@supabase/ssr`.

*

## Decision
[2025-03-30] Use Supabase Auth (Email Magic Link) for Admin Authentication.

## Rationale
Simplest secure implementation for admin-only MVP, passwordless, integrates with Supabase DB/RLS. (See `docs/adr/2025-03-30-admin-authentication.md`)

## Implementation Details
Configure Supabase Auth provider, use `@supabase/ssr` for session management and route protection in Next.js.

*

## Decision
[2025-03-30] Use Vercel for deployment.

## Rationale
Optimized for Next.js, automated CI/CD from Git, preview deployments, global edge network, sufficient free tier. (See `docs/adr/2025-03-30-vercel-deployment-platform.md`)

## Implementation Details
Connect GitHub repo, configure environment variables, use automatic deployments for main/previews.

*

## Decision
[2025-03-30] Use Hybrid Rendering Strategy (SSG/SSR/ISR/CSR).

## Rationale
Optimize performance/SEO (SSG/ISR for public pages), ensure data freshness/security (SSR for admin), allow UI interactivity (CSR). (See `docs/adr/2025-03-30-hybrid-rendering.md`)

## Implementation Details
Use `getStaticProps` (SSG/ISR), `getServerSideProps` (SSR), client-side fetching (SWR/React Query) as appropriate per page type.

*

## Decision
[2025-03-30] Use Database-Driven Content Management via Supabase and Custom Admin UI.

## Rationale
Flexibility for content updates by organizers, structured data storage, leverages existing tech stack. (See `docs/adr/2025-03-30-content-management-strategy.md`)

## Implementation Details
Store content in Supabase tables, build simple CRUD forms in `/admin` section, use protected API routes for updates.

*

## Decision
[2025-03-30] Use `@supabase/ssr` package for Next.js/Supabase auth integration.

## Rationale
Official recommendation from Supabase, replaces deprecated `@supabase/auth-helpers-nextjs`, better compatibility with App Router and long-term support.

## Implementation Details
Installed `@supabase/ssr`, uninstalled `@supabase/auth-helpers-nextjs`. Updated relevant ADRs. Code implementation will follow `@supabase/ssr` patterns.