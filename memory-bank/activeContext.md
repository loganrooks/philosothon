# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-03-30 18:57:30 - Log of updates made.

*

## Current Focus

*   Initializing Memory Bank.
*   Implement component logic (Countdown, Accordion) and styling.
*   Paused task: Refactoring placeholder components into separate files in `platform/src/components/` and updating page imports. Currently working on the Register page components (`FormEmbed`, `InstructionBlock`).

## Recent Changes

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
*   Need to implement Supabase integration (client setup, data fetching, auth).
*   Need to build Admin UI.