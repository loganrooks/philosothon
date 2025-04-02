# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-03-30 18:57:30 - Log of updates made.

*

## Current Focus
*   Implement Admin CRUD operations for FAQ (Add/Edit/Delete).
*   Implement remaining Admin CRUD operations (Edit/Delete Workshop, Add/Edit/Delete FAQ).
*   Implement actual content population for public pages.
## Recent Changes
*   [2025-04-01 15:16] Implemented Delete FAQ functionality: Added `deleteFaqItem` Server Action (`platform/src/app/admin/faq/actions.ts`) handling Supabase delete, error handling, and revalidation. Created `FaqActions.tsx` client component (`platform/src/components/FaqActions.tsx`) with Edit link and Delete form (using bound action and `window.confirm`). Updated Admin FAQ page (`platform/src/app/admin/faq/page.tsx`) to use `FaqActions`. Resolved TypeScript error related to Server Action return type.


*   [2025-04-01 15:10] Implemented Update FAQ functionality: Created `updateFaqItem` Server Action (`platform/src/app/admin/faq/actions.ts`) handling form data parsing, Supabase update, error handling, revalidation, and redirect. Updated Edit FAQ page (`platform/src/app/admin/faq/[id]/edit/page.tsx`) to import, bind `id`, and pass the `updateFaqItem` action to `FaqForm`. Verified `FaqForm` already had required `action` prop and hidden `id` input. Verified Add FAQ page (`platform/src/app/admin/faq/new/page.tsx`) correctly passes `addFaqItem`.

*   [2025-04-01 15:02] Added Edit/Delete actions to Admin FAQ table (`platform/src/app/admin/faq/page.tsx`): Updated 'Add New' button to Link, added 'Actions' header, corrected Edit link path (`/admin/faq/[id]/edit`), kept Delete as placeholder button. Created placeholder Edit FAQ page (`platform/src/app/admin/faq/[id]/edit/page.tsx`).
*   [2025-04-01 14:57] Implemented Add FAQ form submission: Created `addFaqItem` Server Action (`platform/src/app/admin/faq/actions.ts`) handling form data parsing (incl. optional `display_order`), Supabase insert, error handling, revalidation, and redirect. Updated `FaqForm` (`platform/src/components/FaqForm.tsx`) to accept and use the `action` prop. Updated "Add New FAQ" page (`platform/src/app/admin/faq/new/page.tsx`) to import and pass the action. Fixed related TypeScript errors.
*   [2025-04-01 14:52] Created Add New FAQ page (`platform/src/app/admin/faq/new/page.tsx`) and `FaqForm` component (`platform/src/components/FaqForm.tsx`) with basic structure and fields (question, answer, category, display_order).
*   [2025-04-01 14:48] Implemented Delete Workshop functionality: Added `deleteWorkshop` Server Action (`platform/src/app/admin/workshops/actions.ts`) handling Supabase delete, error handling, and revalidation. Created `WorkshopActions.tsx` client component (`platform/src/components/WorkshopActions.tsx`) with Edit link and Delete form (using bound action and `window.confirm`). Updated Admin Workshops page (`platform/src/app/admin/workshops/page.tsx`) to use `WorkshopActions`.

*   [2025-04-01 14:42] Implemented Update Workshop functionality: Added `updateWorkshop` Server Action (`platform/src/app/admin/workshops/actions.ts`) handling form data parsing, Supabase update, error handling, revalidation, and redirect. Made `action` prop required in `WorkshopForm` (`platform/src/components/WorkshopForm.tsx`). Updated Edit Workshop page (`platform/src/app/admin/workshops/[id]/edit/page.tsx`) to import, bind, and pass the `updateWorkshop` action. Resolved related TypeScript errors (including using `unknown` and type assertion for fetched data).

*   [2025-04-01 14:36] Implemented Edit Workshop data fetching and form population: Modified `platform/src/app/admin/workshops/[id]/edit/page.tsx` to fetch workshop data by ID using Supabase server client, handle errors (404), and pass data to `WorkshopForm`. Modified `platform/src/components/WorkshopForm.tsx` to correctly use `initialData` for `defaultValue` on all fields (including JSON stringify for `relevant_themes`) and made the `action` prop optional to resolve TS errors pending update action implementation. Fixed Supabase client usage and temporary `any` type for missing DB types.

*   [2025-04-01 14:31] Created placeholder Edit Workshop page (`platform/src/app/admin/workshops/[id]/edit/page.tsx`).
*   [2025-04-01 14:28] Implemented Add Workshop functionality: Created `addWorkshop` Server Action (`platform/src/app/admin/workshops/actions.ts`) handling form data parsing (including JSON for `relevant_themes`), Supabase insertion, error handling, revalidation, and redirect. Updated `WorkshopForm` (`platform/src/components/WorkshopForm.tsx`) to accept and use the action prop. Updated "Add New Workshop" page (`platform/src/app/admin/workshops/new/page.tsx`) to import and pass the action. Resolved TypeScript/ESLint issues related to missing `database.types.ts` and `any` usage.
*   [2025-04-01 14:20] Created Add New Workshop page (`platform/src/app/admin/workshops/new/page.tsx`) and `WorkshopForm` component (`platform/src/components/WorkshopForm.tsx`) with basic structure and fields.

*   [2025-04-01 14:15] Implemented Delete Theme functionality: Created `deleteTheme` Server Action (`actions.ts`), created `ThemeActions.tsx` client component with form, confirmation dialog (`window.confirm`), and action binding, updated `admin/themes/page.tsx` to use `ThemeActions`.


*   [2025-04-01 14:10] Implemented Update Theme functionality: Created `updateTheme` Server Action (`actions.ts`), modified `ThemeForm` to accept `action` prop and hidden `id`, updated `new/page.tsx` and `[id]/edit/page.tsx` to pass correct actions (`addTheme`, `updateTheme.bind(id)`). Fixed related TypeScript errors.
*   [2025-04-01 14:00] Added Edit/Delete action placeholders to Admin Themes table (`platform/src/app/admin/themes/page.tsx`) and created the dynamic Edit Theme page structure and placeholder (`platform/src/app/admin/themes/[id]/edit/page.tsx`).

*   [2025-04-01 13:55] Implemented Server Action (`platform/src/app/admin/themes/actions.ts`) for adding themes via form submission, including Supabase insert, error handling, revalidation, and redirect. Updated `ThemeForm` component (`platform/src/components/ThemeForm.tsx`) to use the action.

*   [2025-04-01 13:49] Created Admin Manage FAQ page (`platform/src/app/admin/faq/page.tsx`) with server-side data fetching, basic table display, and fixed Supabase client usage.

*   [2025-04-01 13:45] Created Admin Manage Workshops page (`platform/src/app/admin/workshops/page.tsx`) with server-side data fetching and basic table display.
*   [2025-04-01 13:41] Created Admin Manage Themes page (`platform/src/app/admin/themes/page.tsx`) with server-side data fetching and basic table display.
*   [2025-04-01 13:36] Added content management navigation links (Themes, Workshops, FAQ) to Admin Dashboard (`AdminDashboardClient.tsx`).
*   [2025-04-01 13:32] Implemented client-side filtering for Admin registrations: Created `AdminDashboardClient.tsx` to manage state/filtering, updated `StatusFilters.tsx` to be interactive, and modified `admin/page.tsx` to use the client component.

*   [2025-04-01 13:18] Created `StatusFilters` component (`platform/src/components/StatusFilters.tsx`) and integrated it into Admin page (`platform/src/app/admin/page.tsx`).

*   [2025-04-01 13:07] Implemented server-side fetching of registration data in Admin page (`platform/src/app/admin/page.tsx`).
*   [2025-04-01 13:03] Updated Admin page (`platform/src/app/admin/page.tsx`) with basic UI structure placeholders (Content Links, DataTable, StatusFilters).
*   [2025-03-31 11:06] Skipped `platform/src/components/FormEmbed.tsx` implementation (awaiting Google Form embed code).
*   [2025-03-31 10:19] Implemented `platform/src/components/InstructionBlock.tsx`.
*   [2025-03-31 10:15] Set up Supabase client utilities (`client.ts`, `server.ts`, `middleware.ts`) and environment variables (`.env.local`).
*   [2025-03-31 10:10] Completed TDD review and created test overview (`memory-bank/testOverview.md`).
*   [2025-03-30 19:10] Completed refactoring of all placeholder components into separate files and updated page imports.
*   Initialized Next.js project in `platform/`.
*   Installed Supabase libraries (`@supabase/supabase-js`, `@supabase/ssr`).
*   Uninstalled deprecated `@supabase/auth-helpers-nextjs`.
*   Updated relevant ADRs (`admin-authentication.md`) to reflect use of `@supabase/ssr`.
*   Created basic layout (`layout.tsx`, `NavBar.tsx`, `Footer.tsx`).
*   Created placeholder pages (`/`, `/about`, `/themes`, `/workshops`, `/faq`, `/register`).
*   Created component files for Home page (`Hero.tsx`, `Countdown.tsx`, `EventHighlights.tsx`) and updated `page.tsx`.
*   Created component files for About page (`ContentBlock.tsx`, `Timeline.tsx`) and updated `about/page.tsx`.
*   Created component file for Themes page (`ThemeCard.tsx`) and updated `themes/page.tsx`.
*   Created component file for Workshops page (`WorkshopCard.tsx`) and updated `workshops/page.tsx`.
*   Created component file for FAQ page (`AccordionGroup.tsx`) and updated `faq/page.tsx`.
*   Created component file `FormEmbed.tsx` for Register page.

## Open Questions/Issues

*   Need to find/configure the "Philosopher" font for headings (serif).
*   Need to implement actual content population for pages (from docs or Supabase).
*   Need to implement actual component logic (Countdown timer, Accordion interaction if needed beyond native `details`, etc.).
*   Need to get Google Form embed code for Register page.
*   Need to implement Supabase data fetching (SSG/ISR) and auth flows.
*   Need to build Admin UI components (DataTable, StatusFilters, Content Forms).