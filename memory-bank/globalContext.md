# Global Context

This file consolidates less frequently updated global project information, including product goals, architectural patterns, key decisions, and overall progress.

---

# Product Context

## Project Goal

-   Develop a web platform for the University of Toronto Philosothon event.
-   MVP (2-day implementation) focuses on public info pages and Google Forms registration.
-   Architecture designed for future extensions (team formation, submissions, etc.).

## Key Features

-   **MVP:** Public info pages (Home, About, Themes, Workshops, FAQ), Google Forms registration embed, Simple Admin UI (content management, registration data view).
-   **Future:** Team formation system, Submission portal, Feedback collection, Judge portal.

## Overall Architecture

-   **Frontend:** Next.js with Tailwind CSS.
-   **Backend:** Supabase (PostgreSQL DB, Auth).
-   **Registration (MVP):** Embedded Google Forms, manual CSV import to Supabase.
-   **Deployment:** Vercel.
*   (Based on `docs/project_specifications.md` and ADRs in `docs/adr/`)

---
*Footnotes:*
-   2025-03-30 18:56:53 - Initialized Memory Bank. Populated based on `docs/project_specifications.md` and existing ADRs.

---

# System Patterns

## Coding Patterns

-   **Framework:** Next.js (App Router) with TypeScript.
-   **Styling:** Tailwind CSS (Utility-first approach).
-   **State Management:** Primarily React Context API for global state (theme, auth), server components/props for page data, minimal client-state. SWR/React Query for client-side data fetching if needed.
-   **Component Structure:** Place reusable components in `src/components/`. Define page-specific components inline initially, refactor as needed.
-   **Imports:** Use alias `@/*` for imports relative to `src/`.

## Architectural Patterns

-   **Backend:** Backend-as-a-Service (BaaS) using Supabase.
-   **Rendering:** Hybrid Rendering (SSG/ISR for public content, SSR for admin, CSR for UI interactions).
-   **Authentication:** Supabase Auth (Email Magic Link for Admin MVP).
-   **Content Management:** Database-driven via Supabase, managed through a custom admin UI in Next.js.
-   **Data Flow (MVP):** Manual CSV import for registration, direct DB access or API routes for content.

## Testing Patterns

-   **MVP:** Manual testing (core journeys, responsive, form validation, admin security).
-   **Future:** Consider unit tests (e.g., Vitest/Jest), integration tests, end-to-end tests (e.g., Playwright/Cypress) as complexity increases.

---

*   **JSONB Handling:** Supabase JSONB columns mapped to `string[] | null` in TypeScript interfaces. Components updated to render arrays.


*   **[2025-04-03] Development Environment:** VS Code Dev Containers used to provide a consistent, isolated environment with all necessary dependencies (Node.js, Puppeteer system libs) pre-installed via Dockerfile. Resolves host-container dependency conflicts (e.g., shared library issues in WSL).

*   **[2025-04-03] Dev Container Configuration:** Updated `.devcontainer/devcontainer.json` to use the `customizations.vscode` structure for `settings` and `extensions` to conform to the latest specification and resolve schema warnings.


*   **[2025-04-03] Dev Container State Persistence:** Use the `mounts` property in `devcontainer.json` to define both workspace mounts and named volumes. A named volume (`vscode-server-state-${localWorkspaceFolderBasename}`) is used to persist VS Code server state (`/home/node/.vscode-server`) across container rebuilds, improving startup time and preserving UI state.


*   **[2025-04-03] Dev Container Persistence Clarification:** Corrected a JSON error in `.devcontainer/devcontainer.json` by removing an invalid `consistency: 'cached'` property from the workspace bind mount. Re-emphasized that persistence of VS Code state (including extension data like RooCode history) is handled correctly by the *volume mount* targeting `/home/node/.vscode-server`, not properties of the bind mount.



*   **[2025-04-03] Dev Container Volume Permissions (Dockerfile Fix):** Added `RUN mkdir -p /home/node/.vscode-server && chown -R 1000:1000 /home/node/.vscode-server` to the `Dockerfile` to ensure the directory exists with correct ownership *during* the image build, resolving permission errors encountered during container startup when using a volume mount. Reverted the previous `postCreateCommand` fix in `devcontainer.json`.

## Tooling

*   **[2025-04-17] RAG Markdown Optimizer:** Python script developed to process Markdown files in a directory, simplifying inline citations and footnote links to optimize content for Retrieval-Augmented Generation (RAG) systems, while preserving the final "References" section.

*   **[2025-04-17] RAG Markdown Optimizer:** Python script (`scripts/rag_markdown_optimizer.py`) developed to process Markdown files in a directory, simplifying inline citations `(Author, [Year](URL "Citation"))` to `(Author, Year)` and footnote links `[Footnote N](#...)` to `[Footnote N]` to optimize content for Retrieval-Augmented Generation (RAG) systems, while preserving the final "References" section. Includes logging and command-line interface.

*   **[2025-04-18] Admin CRUD Pattern:** Implemented using Server Components for list/edit page shells, Client Components for forms (`useFormState`), and Server Actions (`actions.ts`) for data mutation (create, update, delete). Edit pages use query parameters (`?id=...`) instead of dynamic route segments to avoid previous build issues.

# Decision Log
## Decision
[2025-04-18 19:20:37] Use Fixed Height + Container Width Control for Google Form Embed.

## Rationale
Simplest and most reliable method for embedding a third-party iframe with a fixed, large height (`FormEmbed.tsx`). Avoids UX issues of aspect-ratio scaling (content too small) and complexity/fragility of JS height manipulation for cross-domain iframes. Standard vertical page scrolling is acceptable for long content on mobile.

## Implementation Details
Wrap iframe in a `div` with `w-full`, `max-w-2xl`, `mx-auto`. Iframe uses `w-full` and retains its fixed `height` attribute provided by Google. Remove fixed `width` attribute from iframe.

*


*

## Decision
[2025-04-18 15:28:00] Adopt GitHub Flow as the Git Workflow.

## Rationale
Provides simplicity, aligns with Vercel deployment triggers, isolates features, facilitates review via PRs, and integrates well with SPARC mode development cycles (commit after test). Suitable for small teams and iterative development.

## Implementation Details
Use `main` for production, feature branches for development (created from `main`). Commit tested code atomically with conventional messages. Use PRs for review/merging to `main`. Vercel deploys from `main`. Documented in `docs/git_workflow.md`.


## Decision
[2025-04-18 07:35:00] Use Single Edit Pages + Server Actions for Admin CRUD.

## Rationale
Avoids previous Vercel build errors associated with dynamic admin edit page routes (e.g., `/admin/themes/[id]/edit`). Server Actions simplify data mutation logic compared to separate API routes and align with modern Next.js App Router patterns. Edit pages will use query parameters (e.g., `/admin/themes/edit?id=...`) to fetch data.

## Implementation Details
Admin list pages link to `/admin/[content]/edit?id=...`. Edit pages (Server Components) fetch data based on query param. Forms (Client Components) use Server Actions defined in `actions.ts` files for create/update operations. Delete operations also use Server Actions triggered from list/edit pages.

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

---

*

## Decision
[2025-04-02] Use `NODE_EXTRA_CA_CERTS` environment variable in `dev` script to resolve local SSL errors.

## Rationale
Node.js on the development machine was unable to find the system's trusted CA certificates, causing 'unable to get local issuer certificate' errors when fetching data from Supabase via HTTPS. Setting this variable explicitly points Node.js to the correct certificate bundle.

## Implementation Details
Added `NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"` prefix to the `next dev` command in `platform/package.json`'s `scripts.dev` section.


*

## Decision
[2025-04-03] Use VS Code Dev Containers for the development environment.

## Rationale
Provides an isolated and consistent development environment defined by a Dockerfile. Resolves shared library conflicts encountered when running tools like Puppeteer directly within WSL/VS Code Server, ensuring dependencies match the container's OS rather than the host's.

## Implementation Details
Created `Dockerfile` based on `node:18-bullseye`, installed Node.js and required Puppeteer/Chromium system libraries. Created `.devcontainer/devcontainer.json` to configure the container build, workspace mount, port forwarding, extensions, and post-creation commands (`npm install`).


*

## Decision
[2025-04-03] Use `mounts` property and named volume for VS Code server state persistence in Dev Container.

## Rationale
Consolidates mount definitions (`workspaceMount` is deprecated in favor of `mounts`). Persisting VS Code server state (`/home/node/.vscode-server`) via a named volume significantly speeds up container rebuilds and restores UI state (open files, etc.), improving the developer experience.

## Implementation Details
Added a `mounts` array to `.devcontainer/devcontainer.json`. Moved the existing workspace bind mount definition into this array. Added a new entry for a named volume (`vscode-server-state-${localWorkspaceFolderBasename}`) targeting `/home/node/.vscode-server`. Removed the standalone `workspaceMount` property. Added `rooveterinaryinc.roo-cline` to the `customizations.vscode.extensions` array.



*

## Decision
[2025-04-03] Add directory creation and ownership commands to `Dockerfile` for `/home/node/.vscode-server` volume.

## Rationale
The previous attempt to fix permissions using `postCreateCommand` failed because VS Code Server attempted to access/create subdirectories before the command completed. Moving the directory creation (`mkdir -p`) and ownership change (`chown`) into the `Dockerfile` ensures these steps happen during the image build, guaranteeing correct permissions *before* the container starts and VS Code connects.

## Implementation Details
Added `RUN mkdir -p /home/node/.vscode-server && chown -R 1000:1000 /home/node/.vscode-server` to `Dockerfile`. Reverted `postCreateCommand` in `.devcontainer/devcontainer.json` to its original state (`cd platform && npm install`).


*

## Decision
[2025-04-03 07:22:00] Add `libnss3` package to Dev Container Dockerfile.

## Rationale
Puppeteer was failing with a missing shared library error (`libnss3.so`) within the Dev Container. Installing packages directly in a running container is ephemeral. Adding the dependency to the `Dockerfile` ensures it's consistently included in the image build.

## Implementation Details
Added `libnss3` to the `apt-get install -y` command list within the `RUN` instruction in `Dockerfile`.
[2025-04-18 17:04:00] - [DevOps Task] Merged Feature Branches (Task 26) [Completed] - Merged all completed feature/fix/chore branches from Task 25 into main.

[2025-04-18 17:40:00] - [Debug Task] Investigated Visual Rendering (Task 30) [Analysis Complete] - Font/spacing setup (Philosopher, JetBrains Mono) verified in layout, config, globals, Hero, NavBar. Code seems correct. Identified potential browser rendering or subjective spacing issues as likely cause. Proposed DevTools verification and targeted adjustments/experiments.


[2025-04-18 23:49:29] - [DevOps Task] Committed Aesthetic Overhaul (Task 64) [Completed] - Committed changes from Task 61 (minimal hacker aesthetic) to `feat/ui-overhaul` branch. Verified working tree is clean.


[2025-04-18 23:25:20] - [Code Task] Minimal Hacker Aesthetic Overhaul (Task 61) [In Progress] - Applied font, color, and border changes across layout, global styles, key components (NavBar, Footer, ContentBlock, Cards, Accordion, Timeline), and main page layouts for a consistent hacker aesthetic. Used subtle gray borders.



[2025-04-18 23:57:04] - [Code Task] Applied 'Inter' Font Fix (Task 66) [Completed] - Corrected default body font application in layout.tsx and cleaned up related CSS. Build and tests verified.


[2025-04-19 00:06:04] - [Code Task] Set Default Font to Monospace (Task 67) [Completed] - Corrected default body font to `font-mono` in layout.tsx and updated tests. Build/tests verified.


[2025-04-19 00:16:08] - [Code Task] Refactored NavBar (Task 23) [Completed] - Implemented responsive horizontal layout, hanging mobile dropdown, and hacker aesthetic (monospace links, philosopher logo) in `NavBar.tsx`. Build/tests verified.


# Progress
[2025-04-19 00:50:56] - [Code Task] Removed Rounded Corners (Task 70) [Completed - Pending Visual Verification] - Removed Tailwind rounded-* classes from platform/src/*.tsx using find/sed. Build and tests verified.


[2025-04-18 21:31:58] - [TDD Task] Regression Test Run After Typography Fix (Task 57) [Completed] - Ran full test suite. Result: 206 passed, 3 skipped. Confirmed no new regressions from Task 56.


[2025-04-18 20:45:11] - [Code Task] Corrected Typography Plugin Registration (Task 56) [In Progress - Build Running] - Modified `tailwind.config.ts` (removed plugin) and `globals.css` (added `@plugin`) to align with Tailwind v4 docs. Executed clean build (`rm -rf .next && npm install && npm run dev`). Awaiting user verification. [Related to Issue VISUAL-PROSE-001 - 2025-04-18 20:26:37]


[2025-04-18 20:41:59] - [Debug Task] Verify Typography Plugin Config & Research (Task 55) [Completed] - Verified configs, checked deps, researched compatibility. Found plugin README suggests CSS `@plugin` registration, not config file. Updated hypothesis for VISUAL-PROSE-001. [Related to Issue VISUAL-PROSE-001 - 2025-04-18 20:26:37]


[2025-04-18 20:37:56] - [Debug Task] Isolate `prose` Styling (Task 54) [Completed] - Static HTML test on `/about` page confirmed `prose` styles are not generated/applied at all, isolating the issue to the Tailwind build process/typography plugin, not `react-markdown`. [Related to Issue VISUAL-PROSE-001 - 2025-04-18 20:26:37]


[2025-04-18 20:26:37] - [Debug Task] Debug Proposal Page `prose` Styling (Task 52) [Blocked] - Investigation confirmed correct plugin config and class application, but `prose` styles are missing from compiled CSS. Clean build ineffective. Build process failure suspected. Early Return Clause invoked. [See Debug Issue VISUAL-PROSE-001 2025-04-18 20:26:37]


[2025-04-18 19:43:57] - [Code Task] Implement Responsive Form Embed (Task 48) [Blocked] - Applied `max-w-4xl` class to container in `FormEmbed.tsx`. Tests failed due to `toHaveStyle` limitations with JSDOM/Tailwind. Early Return Clause invoked.


[2025-04-18 19:18:08] - [DevOps Task] Cleaned `main` Branch (Task 41) [Completed] - Isolated failed Task 39/40 changes onto `fix/failed-form-embed-attempt` branch. `main` is clean.


[2025-04-18 18:57:59] - [DevOps Task] Merged Tailwind Fix Branch [Completed] - Merged `fix/tailwind-integration` (containing fixes from Tasks 30-37) into `main` after stashing an unrelated modification.

[2025-04-18 18:38:41] - [Code Task] Applied Tailwind v4 Fixes (Task 36) [Completed] - Updated `postcss.config.js` (removed autoprefixer) and `globals.css` (used `@import "tailwindcss";`) based on v4 requirements. Performed clean build and restarted dev server.

[2025-04-18 17:30:26] - [DevOps Task] Cleaned main Branch (Task 29) [Completed] - Isolated Task 27 changes onto 'fix/direct-font-application', created PR #1, and user merged it into 'main'.

[2025-04-18 17:17:00] - [Code Task] Completed Font Application (Task 27) [Completed] - Applied `font-philosopher` utility class directly to heading elements in relevant components/pages, resolving the build error from Task 26. Build and tests verified.

[2025-04-18 16:00:00] - [Code Task] Completed Dependency Downgrade (Task 17) [Completed] - Downgraded Next.js, React, TS to resolve build error BUILD-TS-001. Fixed related config/path issues. Build successful.

[2025-04-18 15:28:00] - [DevOps Task] Defined Git Workflow (Task 11) [Completed] - Documented GitHub Flow in `docs/git_workflow.md`.

[2025-04-18 15:10:00] - Completed Dynamic Theme Pages (Task 9): Added dynamic route `/themes/[id]` for individual theme details. Updated theme list page cards to link to these dynamic pages.

[2025-04-18 07:51:00] - Completed Admin Section Rebuild (Task 7): Implemented authentication (Magic Link), layout, and CRUD operations (Themes, Workshops, FAQs) using Server Actions and query parameters for edit routes, following `docs/admin_rebuild_spec.md`.
[2025-04-18 07:26:14] - Applied 'Philosopher' font globally to headings (h1-h6) via globals.css.

[2025-04-18 06:54:01] - Integrated Google Form embed into `FormEmbed.tsx` component.
[2025-04-18 05:53:00] - Added 'Proposal to Students' page (`/proposal`) displaying Markdown content.
[2025-04-18 01:03:00] - Holistic Review completed. Verified codebase against specs and logs. Confirmed admin section removal, public page implementations (SSG/ISR, Countdown), UI theme changes, RAG script, SSL fix, and Dev Container setup align with logs. Noted discrepancies: missing admin section vs. MVP spec, incomplete public page features (filters/search, form embed), and inaccurate 'Completed Tasks' list in this file (now corrected).
[2025-04-17 23:29:00] - Debugged and updated `scripts/rag_markdown_optimizer.py` to handle newlines in citation titles and recognize '## Notes' as a reference section marker.



[2025-04-17 23:24:00] - Fetched content for 5 philosophy articles from Philosophy & Technology journal.

[2025-04-17 23:01:00] - Implemented Python script `scripts/rag_markdown_optimizer.py` for optimizing Markdown files for RAG.

[2025-04-03 18:26:00] - Temporarily removed entire admin section (`platform/src/app/admin`) and related components/links (`ThemeActions`, `FaqActions` edit link) to resolve persistent Vercel build errors related to dynamic routes and TypeScript `PageProps` constraints. Admin functionality needs to be revisited/re-implemented later.
## Completed Tasks
## Completed Tasks (Summary - Details in mode-specific/code.md)
- Memory Bank Restructuring
- Initial Project Setup (Next.js, Supabase, Vercel)
- Basic Layout & Public Page Placeholders
- Admin Section Removed (Due to build errors, deviates from MVP spec)

- DB Schema Adaptation (JSONB arrays) & SSL Fix


## Current Tasks
-   UI Theme Overhaul (Hacker Style) - Completed (Core + Matrix Background)
## Next Steps
-   Refine UI Theme (Spacing, Component details) if needed based on review.
-   Write/Fix Unit Tests for Admin CRUD Actions (Workshops, FAQ, Theme Delete)
-   Implement remaining Admin CRUD operations (Edit/Delete Workshop, Add/Edit/Delete FAQ).
-   Implement actual content population for public pages.
-   Implement Supabase data fetching (SSG/ISR) for public pages.
-   Embed Google Form on Register page.

[2025-03-31 10:18:42] - Implemented `platform/src/components/InstructionBlock.tsx`.

[2025-03-31 11:07:01] - Reviewed initial structure of `platform/src/app/admin/page.tsx`.
[2025-04-02 07:27:00] - Completed UI theme overhaul (hacker style, fixed base styles, refined Matrix background spacing/speed, fixed NavBar, increased padding).
[2025-04-02 11:58:00] - Added specific global CSS rules to fix FAQ padding and bold answers.
[2025-04-03 16:28:00] - [DevOps Task] Vercel Deployment Setup [In Progress - Keys Obtained]