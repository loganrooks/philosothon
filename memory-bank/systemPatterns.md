# System Patterns *Optional*

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
2025-03-30 18:58:54 - Log of updates made.

*

## Coding Patterns

*   **Framework:** Next.js (App Router) with TypeScript.
*   **Styling:** Tailwind CSS (Utility-first approach).
*   **State Management:** Primarily React Context API for global state (theme, auth), server components/props for page data, minimal client-state. SWR/React Query for client-side data fetching if needed.
*   **Component Structure:** Place reusable components in `src/components/`. Define page-specific components inline initially, refactor as needed.
*   **Imports:** Use alias `@/*` for imports relative to `src/`.

## Architectural Patterns

*   **Backend:** Backend-as-a-Service (BaaS) using Supabase.
*   **Rendering:** Hybrid Rendering (SSG/ISR for public content, SSR for admin, CSR for UI interactions).
*   **Authentication:** Supabase Auth (Email Magic Link for Admin MVP).
*   **Content Management:** Database-driven via Supabase, managed through a custom admin UI in Next.js.
*   **Data Flow (MVP):** Manual CSV import for registration, direct DB access or API routes for content.

## Testing Patterns

*   **MVP:** Manual testing (core journeys, responsive, form validation, admin security).
*   **Future:** Consider unit tests (e.g., Vitest/Jest), integration tests, end-to-end tests (e.g., Playwright/Cypress) as complexity increases.