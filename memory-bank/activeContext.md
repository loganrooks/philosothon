# Active Context

This file tracks the project's current status, including recent changes, current goals, and open questions.
2025-03-30 18:57:30 - Log of updates made.

*

## Current Focus
### Active Context Update - 2025-04-02 07:27:00
-   **Current Focus**: Applied final refinements to Matrix background based on user feedback.
-   **Progress**: Increased vertical spacing multiplier for philosopher names in `MatrixBackground.tsx` to 2.5. Adjusted speed logic to use a very slow range (0.05-0.1) for binary rain under names, ensuring a noticeable difference.
-   **Challenges**: Iteratively adjusting animation parameters (spacing, speed) to meet user's visual requirements.
-   **Next Step**: Update remaining Memory Bank files and attempt completion.

---


### Active Context Update - 2025-04-02 07:08:00
-   **Current Focus**: Final refinements to UI theme overhaul based on user feedback.
-   **Progress**: Refined `MatrixBackground.tsx` (binary rain, distinct/slower/spaced names). Fixed `NavBar.tsx` syntax errors and structure. Increased padding in main layout (`layout.tsx`).
-   **Challenges**: Resolved persistent syntax errors in `NavBar.tsx` caused by diff application.
-   **Next Step**: Update remaining Memory Bank files and attempt completion.

---


### Active Context Update - 2025-04-02 06:58:00
-   **Current Focus**: Revised UI theme overhaul based on user feedback and reference image.
-   **Progress**: Corrected base style application in `layout.tsx` (background, text color, default font). Overhauled `NavBar` for minimalist hacker style. Created and integrated `MatrixBackground.tsx` component with falling characters and embedded philosopher names. Reviewed component spacing.
-   **Challenges**: Addressed user feedback regarding incorrect initial theme application (wrong colors, spacing, NavBar style).
-   **Next Step**: Update remaining Memory Bank files and attempt completion.

---


### Active Context Update - 2025-04-02 06:49:00
-   **Current Focus**: Completed UI theme overhaul to minimalist hacker green/black style.
-   **Progress**: Updated `tailwind.config.ts` with new colors. Updated `globals.css` base styles. Refactored components (`NavBar`, `Footer`, `Hero`, `Countdown`, `EventHighlights`, `ScheduleDisplay`, `ThemeCard`, `WorkshopCard`, `AccordionGroup`, `ContentBlock`, `InstructionBlock`, `FormEmbed`) with new theme colors and padding. Installed `@tailwindcss/typography` and applied `prose-invert`. Fixed hydration error in `Countdown`.
-   **Challenges**: Encountered and resolved React hydration error in `Countdown` component due to client/server time mismatch. Resolved syntax errors introduced during diff application.
-   **Next Step**: Update remaining Memory Bank files and attempt completion.

---


### Active Context Update - 2025-04-02 06:28:00
-   **Current Focus**: Completed functional adjustments requested by user.
-   **Progress**: Updated `Countdown.tsx` target date. Found schedule in `docs/event_info/letter_to_department.md`. Created `ScheduleDisplay.tsx` component. Integrated `ScheduleDisplay` into `app/page.tsx`. Removed Keynote highlight from `EventHighlights.tsx`.
-   **Challenges**: None.
-   **Next Step**: Task complete. Ready for review or next task.

---


### Active Context Update - 2025-04-02 06:17:00
-   **Current Focus**: Adapt frontend types and components to database schema changes (JSONB arrays) and resolve subsequent SSL data fetching errors.
-   **Progress**: Updated `Theme` and `Workshop` interfaces (`analytic_tradition`, `continental_tradition`, `relevant_themes` to `string[] | null`). Modified `ThemeCard` and `WorkshopCard` props and rendering logic to handle arrays. Resolved `unable to get local issuer certificate` error by adding `NODE_EXTRA_CA_CERTS` environment variable to the `dev` script in `package.json`.
-   **Challenges**: Encountered SSL certificate error during data fetching after type updates.
-   **Next Step**: Task complete. Verified by user.

---


### Active Context Update - 2025-04-02 02:07:00
-   **Current Focus**: Resolved Next.js development server connection issues.
-   **Progress**: Investigated server startup failures. Identified and fixed issues related to Turbopack incompatibility, incorrect PostCSS configuration (`postcss.config.js`), incorrect Tailwind CSS import (`globals.css`), and a CSS syntax error.
-   **Challenges**: Debugging involved multiple chained configuration errors.
-   **Next Step**: Development server is now running correctly. Task complete.

---


### Active Context Update - 2025-04-01 23:21:00
-   **Current Focus**: Completed implementation of public page content fetching (SSG/ISR) and font configuration.
-   **Progress**: Verified/Implemented SSG for `/themes` (Supabase), ISR (21600s) for `/workshops` (Supabase), SSG for `/faq` (Supabase), static content for `/about`, SSG for `/` (no dynamic data needed for MVP). Verified `Countdown.tsx` logic. Configured 'Philosopher' font in `tailwind.config.ts`, imported in `globals.css`, and applied to heading elements.
-   **Challenges**: Corrected Supabase query syntax in `/faq`. Resolved issues finding and configuring Tailwind (`tailwind.config.ts` creation/rename, import syntax, default font access).
-   **Next Step**: Task complete. Ready for review or next task.

---


### Active Context Update - 2025-04-01 23:11:00
-   **Current Focus**: Implemented Admin Authentication Flow using Supabase Auth (Magic Link).
-   **Progress**: Verified `@supabase/ssr` setup in middleware and client/server utilities. Created the Admin Login page (`/admin/login`) with OTP sign-in logic. Verified route protection in the main Admin page (`/admin`). Verified the Logout button functionality.
-   **Challenges**: Minor linting/type errors in the Login page, resolved with `apply_diff`.
-   **Next Step**: Testing the authentication flow manually or with integration tests.

---


### Active Context Update - 2025-04-01 23:05:00
-   **Current Focus**: Completed implementation of remaining Admin CRUD logic (Workshop Edit/Delete, FAQ Delete).
-   **Progress**: Created `FaqActions.tsx` component to handle FAQ delete button with confirmation, integrated it into the admin FAQ list page, and fixed related import errors. Verified Workshop Edit/Delete was already complete based on previous logs.
-   **Challenges**: Minor TypeScript import errors due to named vs. default exports, resolved with `apply_diff`.
-   **Next Step**: Proceed with implementing actual content population for public pages or address other open issues.

---


### Active Context Update - 2025-04-01 22:00:00
-   **Current Focus**: Completed unit tests for Admin CRUD Server Actions (Themes, Workshops, FAQ).
-   **Progress**: Fixed failing `deleteTheme` tests. Verified existing tests for Workshop and FAQ actions. All relevant tests in `themes/actions.test.ts`, `workshops/actions.test.ts`, and `faq/actions.test.ts` are passing.
-   **Challenges**: Resolved mock assertion issue in `deleteTheme` test by removing incorrect `.resolves` usage.
-   **Next Step**: Proceed with implementing actual content population for public pages or address other open issues.

---

-   Implement Admin CRUD operations for FAQ (Add/Edit/Delete).
-   Implement remaining Admin CRUD operations (Edit/Delete Workshop, Add/Edit/Delete FAQ).
-   Implement actual content population for public pages.

## Open Questions/Issues

-   Need to find/configure the "Philosopher" font for headings (serif).
-   Need to implement actual content population for pages (from docs or Supabase).
-   Need to implement actual component logic (Countdown timer, Accordion interaction if needed beyond native `details`, etc.).
-   Need to get Google Form embed code for Register page.
-   Need to implement Supabase data fetching (SSG/ISR) and auth flows.
-   Need to build Admin UI components (DataTable, StatusFilters, Content Forms).