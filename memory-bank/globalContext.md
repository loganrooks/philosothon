# Progress
- **[2025-04-21 19:26:46] Code:** Fixed duplicate message bug in `InterestFormPlaceholder` by adding a `useRef` flag to prevent double execution of the initial message effect. Committed to `feat/architecture-v2`.


- **[2025-04-21 19:20:19] Code:** Refined `InterestFormPlaceholder.tsx` to remove explicit submit button and rely on Enter key submission. Committed (642e8e4) to `feat/architecture-v2`.

- **[2025-04-21 19:07:49] DevOps:** Prepared `feat/architecture-v2` branch for PR to `main` (verified status, committed MB files, deleted untracked file, merged `main`, pushed to origin).



- **[2025-04-21 19:00:35] Code:** Implemented modular `TerminalShell` and `InterestFormPlaceholder` components for the `/register` page based on `docs/architecture/terminal_component_v1.md`. Updated `logInterest` server action to save emails to `interest_signups` table. Replaced previous content on `/register/page.tsx` with the new terminal shell. [See MB Log 2025-04-21 18:33:41]


### [2025-04-21 19:22:44] Fix: Server Action Export Error
- **File:** `platform/src/app/register/actions.ts`
- **Change:** Removed non-async function export (`RegistrationSchema`) to comply with `'use server'` directive.
- **Status:** Committed to `feat/architecture-v2`. Resolves error reported in [MB Log 2025-04-21 07:16:45].


- **[2025-04-21 18:55:46] DevOps:** Created Supabase migration for `interest_signups` table (migration `20250421225316`), applied it via `db push`, and committed (commit `6e92ded`) to `feat/architecture-v2` branch.



- **[2025-04-21 16:46:03] Code:** Rewrote `RegistrationForm.tsx` using `useReducer` to align with V3.1 spec (commit `8062e37`), addressing state management issues and implementing early auth, existing user detection, and confirmation flows. Added `resendConfirmationEmail` action to `auth/actions.ts`.



- **[2025-04-21 16:36:00] DevOps:** Committed V3.1 registration spec update (commit 8062e37) to `feat/architecture-v2` branch.



- **[2025-04-21 16:32:00] SpecPseudo:** Updated V3.1 registration spec (`docs/specs/p0_registration_terminal_ui_spec_v2.md`) to explicitly define the `awaiting_confirmation` state after signup and the correct flow for handling existing users during the `register new` process, based on debugging feedback.



- **[2025-04-21 16:14:00] Debug:** Applied further fixes to `RegistrationForm.tsx` based on user feedback: removed prompt from input history, separated new/existing user signup logic, added explicit prompt after confirmation check.


- **[2025-04-21 16:03:00] Debug:** Applied fixes to `RegistrationForm.tsx` and `auth/actions.ts` to handle email confirmation wait state, refactor state updates, remove redundant prompts, and adjust 'register continue' logic.


- **[2025-04-21 14:53:25] Code:** Fixed `signUpUser` deadlock logic in `RegistrationForm.tsx` by correcting condition for password confirmation handling.

- **[2025-04-21 13:36:31] Code:** Fixed logic bugs in `RegistrationForm.tsx` (password flow, register command, intro text) per V3.1 spec. Committed (eb43f2c).

- **[2025-04-21 12:32:00] Code:** Fixed `generate-registration.ts` script logic to correctly map all fields from schema to frontend questions file.

---
*Existing Progress Entries Below*
---

### [2025-04-21 05:53:00] Code: Updated Registration Schema SSOT
- **File:** `platform/config/registrationSchema.ts`
- **Change:** Aligned schema definition with V3.1 spec (`docs/specs/p0_registration_terminal_ui_spec_v2.md`), including 36 questions, `firstName`/`lastName` split, mandatory `hint`/`description`, and `validationRules` structure.
- **Status:** Complete.


### [2025-04-21 05:53:00] Code: Registration Schema Update Strategy
- **Decision:** Used `insert_content` to apply changes to `platform/config/registrationSchema.ts` after initial `apply_diff` failed due to file truncation/size issues.
- **Rationale:** `insert_content` avoids issues with matching non-existent content in a broken file state.


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

### [2025-04-21 18:49:00] System Pattern: Modular Terminal UI

- **Description:** A pattern for building interactive terminal-style UIs in React. It uses a main `TerminalShell` component responsible for the overall frame, output history, input line, and core state management (mode, auth status, etc.). Specific interaction logic for different modes (e.g., registration, auth, gamification) is encapsulated within separate "Dialog" components (`AuthDialog`, `RegistrationDialog`, etc.). The `TerminalShell` dynamically renders the appropriate Dialog component based on the current state mode.
- **State Management:** Core state managed within `TerminalShell` (e.g., using `useReducer`). Dialog-specific sub-state can be stored within a dedicated `dialogState` object in the core state, keyed by mode.
- **Communication:** `TerminalShell` passes input and state down to the active Dialog via props. The Dialog uses callback props (`addOutputLine`, `changeMode`, `setDialogState`) to communicate back to the Shell.
- **Benefits:** Improved modularity, testability, and extensibility compared to a monolithic component. Easier to add new modes/dialogs.
- **Reference:** `docs/architecture/terminal_component_v1.md`

---
*Existing System Patterns Below*



*   **[2025-04-19 23:23:00] Vitest Mocking Strategy (`vi.spyOn`):** When mocking modules (especially server actions) that are used within React components tested with Vitest, if the mock factory needs to reference variables defined outside the factory, `vi.mock` can cause hoisting-related `ReferenceError`s. A reliable pattern is to import the actual module, define mock function variables (`const myMock = vi.fn()`), and then use `vi.spyOn(actualModule, 'functionName').mockImplementation(myMock)` within `beforeEach` to apply the mock. This avoids the hoisting issue while allowing mock control and assertion. [See Debug Issue VITEST-MOCK-HOIST-001]


*   **[2025-04-20 2:05:00] SSOT Generation Script Refinement:** Updated `platform/scripts/generate-registration.ts` to correctly handle the `'use server'` directive placement (must be first line) and import statements within the target `actions.ts` file. Also ensured the script correctly generates the `QuestionType` definition including all V3 types (`scale`, `multi-select-numbered`, `ranking-numbered`) in the output `registrationQuestions.ts` file.

*   **[2025-04-19 00:00:00] Style Guide:** Defined and refined a formal style guide (`docs/style_guide.md`) for the minimalist hacker aesthetic. Covers color palette (emphasizing `light-text` over Matrix/translucent backgrounds, restricting green text), typography, spacing, borders, common component styles (buttons, forms, cards, timeline), and specifies the `MatrixBackground` component as the default background, all using Tailwind CSS where applicable.


*   **[2025-04-19 00:00:00] Data Access Layer (DAL):** Introduced a DAL (`platform/src/lib/data/`) to abstract direct Supabase client interactions (data fetching, auth calls) from Server Components, Server Actions, and Middleware. Improves testability by allowing mocks of specific DAL functions instead of the complex Supabase client. Applied to themes, workshops, faq, profiles, auth.

## Coding Patterns

-   **Framework:** Next.js (App Router) with TypeScript.
-   **Styling:** Tailwind CSS (Utility-first approach).
-   **State Management:** Primarily React Context API for global state (theme, auth), server components/props for page data, minimal client-state. SWR/React Query for client-side data fetching if needed.
-   **Component Structure:** Place reusable components in `src/components/`. Define page-specific components inline initially, refactor as needed.
-   **Imports:** Use alias `@/*` for imports relative to `src/`.

## Architectural Patterns

-   **Authentication & RBAC (V2):** Supabase Auth (Magic Link enhanced with RBAC). Roles managed in `profiles` table, enforced via Middleware and RLS.
-   **Registration (V2):** Built-in Next.js form using Server Actions, storing extended data in Supabase.
-   **Content Management (V2):** Core event info and expanded theme descriptions stored in Supabase tables, managed via Admin UI.
-   **Team Communication (V2):** External platform (Discord/Slack) integrated via Supabase Edge Functions.
-   **Gamification (V2):** Dedicated MCP Server (AI Agent, State), Vector DB (Philosophical Texts), Supabase (User Progress), Edge Functions (Notifications).
-   **Submissions (V2):** Supabase Storage with RLS, accessed via dedicated portal UI.

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


*   **[2025-04-03 00:00:00] Development Environment:** VS Code Dev Containers used to provide a consistent, isolated environment with all necessary dependencies (Node.js, Puppeteer system libs) pre-installed via Dockerfile. Resolves host-container dependency conflicts (e.g., shared library issues in WSL).

*   **[2025-04-03 00:00:00] Dev Container Configuration:** Updated `.devcontainer/devcontainer.json` to use the `customizations.vscode` structure for `settings` and `extensions` to conform to the latest specification and resolve schema warnings.


*   **[2025-04-03 00:00:00] Dev Container State Persistence:** Use the `mounts` property in `devcontainer.json` to define both workspace mounts and named volumes. A named volume (`vscode-server-state-${localWorkspaceFolderBasename}`) is used to persist VS Code server state (`/home/node/.vscode-server`) across container rebuilds, improving startup time and preserving UI state.


*   **[2025-04-03 00:00:00] Dev Container Persistence Clarification:** Corrected a JSON error in `.devcontainer/devcontainer.json` by removing an invalid `consistency: 'cached'` property from the workspace bind mount. Re-emphasized that persistence of VS Code state (including extension data like RooCode history) is handled correctly by the *volume mount* targeting `/home/node/.vscode-server`, not properties of the bind mount.



*   **[2025-04-03 00:00:00] Dev Container Volume Permissions (Dockerfile Fix):** Added `RUN mkdir -p /home/node/.vscode-server && chown -R 1000:1000 /home/node/.vscode-server` to the `Dockerfile` to ensure the directory exists with correct ownership *during* the image build, resolving permission errors encountered during container startup when using a volume mount. Reverted the previous `postCreateCommand` fix in `devcontainer.json`.

## Tooling

*   **[2025-04-17] RAG Markdown Optimizer:** Python script developed to process Markdown files in a directory, simplifying inline citations and footnote links to optimize content for Retrieval-Augmented Generation (RAG) systems, while preserving the final "References" section.

*   **[2025-04-17] RAG Markdown Optimizer:** Python script (`scripts/rag_markdown_optimizer.py`) developed to process Markdown files in a directory, simplifying inline citations `(Author, [Year](URL "Citation"))` to `(Author, Year)` and footnote links `[Footnote N](#...)` to `[Footnote N]` to optimize content for Retrieval-Augmented Generation (RAG) systems, while preserving the final "References" section. Includes logging and command-line interface.

*   **[2025-04-18] Admin CRUD Pattern:** Implemented using Server Components for list/edit page shells, Client Components for forms (`useFormState`), and Server Actions (`actions.ts`) for data mutation (create, update, delete). Edit pages use query parameters (`?id=...`) instead of dynamic route segments to avoid previous build issues.

# Decision Log

### [2025-04-21 18:49:00] Decision: Adopt Modular Terminal Architecture with Reducer/Context State Management

- **Context:** Need to replace the complex and buggy monolithic `RegistrationForm.tsx` with a more maintainable and extensible solution for terminal-style interactions (registration, auth, interest capture, future gamification).
- **Decision:** Implement a modular architecture consisting of a `TerminalShell` component and dynamic "Dialog" components for each mode. Use React's `useReducer` hook combined with Context for initial state management within the `TerminalShell`.
- **Rationale:** Decouples UI concerns, simplifies state management compared to the previous implementation, promotes reusability, and provides a clear path for adding new features/modes. `useReducer`/Context provides sufficient structure for current needs, with the option to migrate to XState if complexity significantly increases (e.g., gamification).
- **Alternatives Considered:**
    - Fixing existing `RegistrationForm.tsx`: Rejected due to high complexity and repeated debugging failures.
    - Using a dedicated terminal UI library: Rejected to maintain control over styling and integration with project state/auth.
    - State Machine Library (XState) initially: Deferred as potentially overkill for the immediate requirement, but remains an option for future evolution.
- **Reference:** `docs/architecture/terminal_component_v1.md`

---
*Existing Decision Log Entries Below*


## Decision
[2025-04-20 17:33:00] Use `minRanked` Constraint for Ranked-Choice Validation in SSOT.

## Rationale
Provides a more flexible way to specify ranked-choice validation constraints compared to a hardcoded flag (`isTop3Ranking`). Allows defining the minimum number of required ranks (e.g., 3 for current outline) or potentially requiring all options to be ranked in the future. Keeps the SSOT definition focused on constraints, leaving implementation details (Zod logic) to the code generator.

## Implementation Details
Use `ranked-choice-numbered` as the SSOT `type`. Within `validationRules`, use `minRanked: { value: number; message?: string }` and `uniqueSelections: boolean | string`. The code generation script will interpret these constraints to produce appropriate validation logic (e.g., Zod `.refine`).



## Decision
[2025-04-20] Adopt Space-Separated Numbers for Terminal "Check All That Apply" Input.

## Rationale
Provides a clear and relatively simple input method for selecting multiple options in a text-based terminal interface. Easier to parse than free-form text.

## Implementation Details
Display options with numbers. User enters space-separated numbers (e.g., `1 3 5`). Client-side validation checks for valid numbers within the option range. SSOT type: `multi-select-numbered`.

## Decision
[2025-04-20] Adopt Comma-Separated Numbers (Top Ranks) for Terminal "Ranking" Input.

## Rationale
Allows users to specify their preferred order for a subset of options within the terminal. Explicitly ranking only the top choices is often sufficient and simpler than full drag-and-drop emulation.

## Implementation Details
Display options with numbers. User enters comma-separated numbers representing their ranked choices in order (e.g., `3,1,4`). Hint clarifies to rank at least 3. Client-side validation checks for valid numbers, uniqueness, and minimum count (3). SSOT type: `ranking-numbered`.

## Decision
[2025-04-20] Use Registration Outline Intro Text for Terminal UI.

## Rationale
Directly uses the user-approved introductory text from the source document (`docs/event_info/registration_outline.md`).

## Implementation Details
Display the specified multi-line text upon initiating the `register new` command flow.

## Decision
[2025-04-20] Set Minimum Password Length to 8 Characters (No Other Complexity).

## Rationale
Provides a basic level of security without imposing overly strict rules for this context. Aligns with common practices.

## Implementation Details
Implement client-side and server-side (Zod schema generated via SSOT) validation enforcing a minimum length of 8 characters for the password field.

## Decision
[2025-04-20] Use Green (#39FF14) Text and Orange (#FFA500) Highlights/Errors for Terminal UI.

## Rationale
Matches the requested "hacker green" aesthetic and provides clear visual distinction for important information like errors or highlights.

## Implementation Details
Apply Tailwind CSS classes or global styles to set the default text color to `#39FF14` and use `#FFA500` for error messages, command highlights, or other designated elements on a black background.

## Decision
[2025-04-20] Adopt Space-Separated Numbers for Terminal "Check All That Apply" Input.

## Rationale
Provides a clear and relatively simple input method for selecting multiple options in a text-based terminal interface. Easier to parse than free-form text.

## Implementation Details
Display options with numbers. User enters space-separated numbers (e.g., `1 3 5`). Client-side validation checks for valid numbers within the option range. SSOT type: `multi-select-numbered`.

## Decision
[2025-04-20] Adopt Comma-Separated Numbers (Top Ranks) for Terminal "Ranking" Input.

## Rationale
Allows users to specify their preferred order for a subset of options within the terminal. Explicitly ranking only the top choices is often sufficient and simpler than full drag-and-drop emulation.

## Implementation Details
Display options with numbers. User enters comma-separated numbers representing their ranked choices in order (e.g., `3,1,4`). Hint clarifies to rank at least 3. Client-side validation checks for valid numbers, uniqueness, and minimum count (3). SSOT type: `ranking-numbered`.

## Decision
[2025-04-20] Use Registration Outline Intro Text for Terminal UI.

## Rationale
Directly uses the user-approved introductory text from the source document (`docs/event_info/registration_outline.md`).

## Implementation Details
Display the specified multi-line text upon initiating the `register new` command flow.

## Decision
[2025-04-20] Set Minimum Password Length to 8 Characters (No Other Complexity).

## Rationale
Provides a basic level of security without imposing overly strict rules for this context. Aligns with common practices.

## Implementation Details
Implement client-side and server-side (Zod schema generated via SSOT) validation enforcing a minimum length of 8 characters for the password field.

## Decision
[2025-04-20] Use Green (#39FF14) Text and Orange (#FFA500) Highlights/Errors for Terminal UI.

## Rationale
Matches the requested "hacker green" aesthetic and provides clear visual distinction for important information like errors or highlights.

## Implementation Details
Apply Tailwind CSS classes or global styles to set the default text color to `#39FF14` and use `#FFA500` for error messages, command highlights, or other designated elements on a black background.

## Decision
[2025-04-19 20:09:00] Adopt Site-Wide Password Authentication (Replacing Magic Link/OTP).

## Rationale
Consolidates authentication mechanism across the platform (including Admin) for consistency. Addresses user requirement for password-based flow during registration.

## Implementation Details
Configure Supabase Auth for email/password. Implement Server Actions for sign-in, sign-up, sign-out, password reset. Update terminal UI (Auth Mode, Registration Mode) and Admin login UI accordingly. Leverage Supabase SSR helpers for session management via HttpOnly cookies.


## Decision
[2025-04-19 20:09:00] Implement Registration Sign-Up Flow with Early Password Creation.

## Rationale
Collect email and create password immediately after starting registration (`register new`). This creates the user account early, allowing users to sign in and resume (`register continue`) even if they abandon the registration partway through. Magic Link retained as a recovery/alternative sign-in method.

## Implementation Details
Modify Registration Mode flow: Prompt for email, then password/confirm password. Call `signUpUser` backend action immediately. Store user verification status locally. Proceed to remaining questions. `submitRegistration` action links data to the pre-existing user.



## Decision
[2025-04-19 19:49:00] Adopt SSOT + Code Generation for Registration Question Synchronization.

## Rationale
Ensures consistency across frontend definitions (`registrationQuestions.ts`), backend validation (`actions.ts` Zod schema), and DB schema (`registrations` table migration drafts) by deriving them from a single central configuration file. Reduces manual errors and simplifies modifications compared to manual synchronization or DB-driven definitions (which don't solve DB schema sync).

## Implementation Details
Define questions in a central config (e.g., `config/registrationSchema.ts`). Create a script (`scripts/generate-registration.ts`) to read the config and generate/overwrite `registrationQuestions.ts`, the Zod schema in `actions.ts`, and draft SQL migration files for review.



[2025-04-19 04:37:30] Adopt Supabase Profiles Table + Middleware/RLS for RBAC.

## Rationale
Leverages existing Supabase Auth/DB, centralizes role management (`profiles` table linked to `auth.users`), enables fine-grained control via RLS and route protection via middleware. Initial role assignment manual, future automation possible.

## Implementation Details
Add `role` enum column to `profiles` table. Implement middleware checks for protected routes. Define RLS policies on relevant tables (submissions, teams, profiles) based on user role.


## Decision
[2025-04-19 04:37:30] Implement Built-in Registration Form with Extended Supabase Schema.

## Rationale
Replaces Google Forms, keeps data within the platform, enables direct use for team formation/personalization. Aligns with Supabase backend strategy.

## Implementation Details
Extend `registrations` table or create `registration_details` with new fields (JSONB/arrays/enums as appropriate). Build multi-step form in Next.js using Server Actions.


## Decision
[2025-04-19 04:37:30] Use Supabase Tables for Core Event Info & Expanded Theme Content.

## Rationale
Confirms spec recommendations (3.3.1 Option A, 3.3.2 Option C). Provides dynamic updates, single source of truth, leverages existing stack.

## Implementation Details
Create `event_details`, `schedule_items` tables. Add `description_expanded` column to `themes` table. Update admin CRUD and frontend pages accordingly.


## Decision
[2025-04-19 04:37:30] Use External Platform (Discord/Slack) via Edge Functions for V2 Team Communication.

## Rationale
Fastest implementation, leverages robust existing platforms, aligns with spec recommendation (3.4.2 Option B). Platform-integrated messaging is complex for V2.

## Implementation Details
Supabase Edge Function triggered on team finalization calls Discord/Slack API (via webhook/bot token) to create channels/groups and invite members.


## Decision
[2025-04-19 04:37:30] Implement Gamification via Dedicated MCP Server + Vector DB + Supabase State.

## Rationale
Isolates complex logic (AI agent, personalization, state management). Allows specialized tools (LLM, vector DB). Enables independent scaling/development.

## Implementation Details
Create MCP server (Node/Python) for AI interaction/state. Use Supabase `pgvector` or dedicated vector DB (Pinecone/Weaviate) for philosophical texts. Store user progress in Supabase (`user_puzzle_progress`). Use Edge Functions for notifications. Track user activity via middleware/client events.


## Decision
[2025-04-19 04:37:30] Use Supabase Storage + RLS for Submission Portal.

## Rationale
Leverages integrated Supabase features for storage and fine-grained access control. Aligns with existing stack.

## Implementation Details
Create Supabase Storage bucket (`submissions`). Implement RLS policies on bucket/metadata table (`submissions`) based on user roles (Team Member, Judge, Admin). Build UI in `/submit` and `/judge` sections. Use Edge Function for email receipts.



[2025-04-18 19:20:37] Use Fixed Height + Container Width Control for Google Form Embed.

## Rationale
Simplest and most reliable method for embedding a third-party iframe with a fixed, large height (`FormEmbed.tsx`). Avoids UX issues of aspect-ratio scaling (content too small) and complexity/fragility of JS height manipulation for cross-domain iframes. Standard vertical page scrolling is acceptable for long content on mobile.

## Implementation Details
Wrap iframe in a `div` with `w-full`, `max-w-2xl`, `mx-auto`. Iframe uses `w-full` and retains its fixed `height` attribute provided by Google. Remove fixed `width` attribute from iframe.




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



## Decision
[2025-03-30] Use Next.js as the frontend framework.

## Rationale
Leverages SSR/SSG for SEO and performance, API routes for backend needs, file-based routing for efficiency, and team's React expertise. (See `docs/adr/2025-03-30-nextjs-frontend-framework.md`)

## Implementation Details
Initialize with `create-next-app`, use App Router, SSG/ISR/SSR as appropriate per page, Tailwind CSS for styling.


## Decision
[2025-03-30] Use Tailwind CSS as the UI framework.

## Rationale
Utility-first approach speeds development, highly customizable, optimized CSS output via JIT, good AI assistance compatibility. (See `docs/adr/2025-03-30-tailwind-css-framework.md`)

## Implementation Details
Configure via `tailwind.config.js` with project design system, apply utility classes directly in JSX, create reusable components for complex elements.


## Decision
[2025-03-30] Use Google Forms (embedded) for MVP registration.

## Rationale
Zero development time for form handling, supports complex questions, free, familiar user interface. Fastest path for MVP. (See `docs/adr/2025-03-30-google-forms-registration.md`)

## Implementation Details
Embed form via iframe on `/register` page. Manual weekly CSV export from Google Sheets, sanitization, and import into Supabase `registrations` table.


## Decision
[2025-03-30] Use Supabase as the Backend-as-a-Service (BaaS).

## Rationale
Provides PostgreSQL DB, integrated Auth, auto-generated APIs (PostgREST), real-time potential, generous free tier, minimizes backend dev time. (See `docs/adr/2025-03-30-supabase-backend.md`)

## Implementation Details
Use managed Postgres, implement RLS, use Supabase Auth, interact via `@supabase/supabase-js` and `@supabase/ssr`.


## Decision
[2025-03-30] Use Supabase Auth (Email Magic Link) for Admin Authentication.

## Rationale
Simplest secure implementation for admin-only MVP, passwordless, integrates with Supabase DB/RLS. (See `docs/adr/2025-03-30-admin-authentication.md`)

## Implementation Details
Configure Supabase Auth provider, use `@supabase/ssr` for session management and route protection in Next.js.


## Decision
[2025-03-30] Use Vercel for deployment.

## Rationale
Optimized for Next.js, automated CI/CD from Git, preview deployments, global edge network, sufficient free tier. (See `docs/adr/2025-03-30-vercel-deployment-platform.md`)

## Implementation Details
Connect GitHub repo, configure environment variables, use automatic deployments for main/previews.


## Decision
[2025-03-30] Use Hybrid Rendering Strategy (SSG/SSR/ISR/CSR).

## Rationale
Optimize performance/SEO (SSG/ISR for public pages), ensure data freshness/security (SSR for admin), allow UI interactivity (CSR). (See `docs/adr/2025-03-30-hybrid-rendering.md`)

## Implementation Details
Use `getStaticProps` (SSG/ISR), `getServerSideProps` (SSR), client-side fetching (SWR/React Query) as appropriate per page type.


## Decision
[2025-03-30] Use Database-Driven Content Management via Supabase and Custom Admin UI.

## Rationale
Flexibility for content updates by organizers, structured data storage, leverages existing tech stack. (See `docs/adr/2025-03-30-content-management-strategy.md`)

## Implementation Details
Store content in Supabase tables, build simple CRUD forms in `/admin` section, use protected API routes for updates.


## Decision
[2025-03-30] Use `@supabase/ssr` package for Next.js/Supabase auth integration.

## Rationale
Official recommendation from Supabase, replaces deprecated `@supabase/auth-helpers-nextjs`, better compatibility with App Router and long-term support.

## Implementation Details
Installed `@supabase/ssr`, uninstalled `@supabase/auth-helpers-nextjs`. Updated relevant ADRs. Code implementation will follow `@supabase/ssr` patterns.

---


## Decision
[2025-04-02] Use `NODE_EXTRA_CA_CERTS` environment variable in `dev` script to resolve local SSL errors.

## Rationale
Node.js on the development machine was unable to find the system's trusted CA certificates, causing 'unable to get local issuer certificate' errors when fetching data from Supabase via HTTPS. Setting this variable explicitly points Node.js to the correct certificate bundle.

## Implementation Details
Added `NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"` prefix to the `next dev` command in `platform/package.json`'s `scripts.dev` section.



## Decision
[2025-04-03] Use VS Code Dev Containers for the development environment.

## Rationale
Provides an isolated and consistent development environment defined by a Dockerfile. Resolves shared library conflicts encountered when running tools like Puppeteer directly within WSL/VS Code Server, ensuring dependencies match the container's OS rather than the host's.

## Implementation Details
Created `Dockerfile` based on `node:18-bullseye`, installed Node.js and required Puppeteer/Chromium system libraries. Created `.devcontainer/devcontainer.json` to configure the container build, workspace mount, port forwarding, extensions, and post-creation commands (`npm install`).



## Decision
[2025-04-03] Use `mounts` property and named volume for VS Code server state persistence in Dev Container.

## Rationale
Consolidates mount definitions (`workspaceMount` is deprecated in favor of `mounts`). Persisting VS Code server state (`/home/node/.vscode-server`) via a named volume significantly speeds up container rebuilds and restores UI state (open files, etc.), improving the developer experience.

## Implementation Details
Added a `mounts` array to `.devcontainer/devcontainer.json`. Moved the existing workspace bind mount definition into this array. Added a new entry for a named volume (`vscode-server-state-${localWorkspaceFolderBasename}`) targeting `/home/node/.vscode-server`. Removed the standalone `workspaceMount` property. Added `rooveterinaryinc.roo-cline` to the `customizations.vscode.extensions` array.




## Decision
[2025-04-03] Add directory creation and ownership commands to `Dockerfile` for `/home/node/.vscode-server` volume.

## Rationale
The previous attempt to fix permissions using `postCreateCommand` failed because VS Code Server attempted to access/create subdirectories before the command completed. Moving the directory creation (`mkdir -p`) and ownership change (`chown`) into the `Dockerfile` ensures these steps happen during the image build, guaranteeing correct permissions *before* the container starts and VS Code connects.

## Implementation Details
Added `RUN mkdir -p /home/node/.vscode-server && chown -R 1000:1000 /home/node/.vscode-server` to `Dockerfile`. Reverted `postCreateCommand` in `.devcontainer/devcontainer.json` to its original state (`cd platform && npm install`).

[2025-04-19 19:51:00] - [Architect Task - Future] Define & Implement General Supabase Schema Synchronization Strategy - Investigate and propose a strategy for maintaining a Single Source of Truth (SSOT) for *all* Supabase database schemas (tables, types, RLS policies). The SSoT should ideally be local (e.g., TypeScript/JSON files in the repo) and easily editable. This strategy should facilitate generating Supabase migrations and potentially TypeScript types (`supabase gen types local`) to ensure consistency between the local definition and the remote database, minimizing manual synchronization efforts across the project.




## Decision
[2025-04-03 07:22:00] Add `libnss3` package to Dev Container Dockerfile.

## Rationale
Puppeteer was failing with a missing shared library error (`libnss3.so`) within the Dev Container. Installing packages directly in a running container is ephemeral. Adding the dependency to the `Dockerfile` ensures it's consistently included in the image build.

## Implementation Details
Added `libnss3` to the `apt-get install -y` command list within the `RUN` instruction in `Dockerfile`.
# Progress

[2025-04-21 12:17:17] - [DevOps Task] Re-run SSOT Code Generation Script & Verify Output (Attempt 2) [Blocked] - Ran `npm run generate:reg` successfully. Verification failed: `registrationQuestions.ts` generated 45 questions but the `Question` interface is incomplete (missing `hint`, `description`, `validationRules`). Generation script is faulty. Invoking Early Return Clause.


[2025-04-21 12:09:00] - [Debug Task] Debug Failing Tests in `RegistrationForm.test.tsx` (Attempt 4 - Final Corrected) [Blocked] - User confirmed schema (`registrationSchema.ts`) correctly defines 45 questions. Test environment correctly loads 45-question data. Generated file (`registrationQuestions.ts`) is INCORRECT (36 questions). Tests fail due to assertions based on incorrect 36-question generated file. Previous environment cache diagnosis was WRONG. **Next Steps:** Fix generation script, run script, fix tests. Invoking Early Return Clause per user instruction.


[2025-04-21 11:56:00] - [Debug Task] Debug Failing Tests in `RegistrationForm.test.tsx` (Attempt 4 - Re-investigate Mocks) [Blocked] - Re-investigated mocking strategy per user feedback. Confirmed source files correct (V3.1, 36 questions). Console log confirmed test runtime loads outdated module (45 questions). `vi.resetModules()` ineffective. Diagnosis confirmed as persistent environment/module resolution issue (`REG-TEST-CACHE-001`). Invoking Early Return Clause. [See Debug Issue REG-TEST-CACHE-001 Update]


[2025-04-21 06:39:00] - [Debug Task] Debug Failing Tests in `RegistrationForm.test.tsx` (Attempt 3 - Focus on Mocks) [Blocked] - Investigated mocking strategy per user feedback. Verified SSOT/generated files correct (V3.1, 36 questions). Test environment persistently loads outdated module (`registrationQuestions.ts` with 45 questions), causing 13 test failures. Explicit mocking and cache clearing (`vitest --no-cache`) ineffective. Confirmed as environment/module resolution issue. Invoking Early Return Clause. [See Debug Issue REG-TEST-CACHE-001 Update]


[2025-04-21 05:59:00] - [DevOps Task] Run SSOT Code Generation Script (V3.1) [Completed] - Generated frontend questions, backend schema, and DB migration from updated SSOT config. Committed changes (7a28f30).

[2025-04-20 1:49:00] - [SpecPseudo Task] Update Terminal Registration UI Specification (V3) [Completed] - Updated `docs/specs/p0_registration_terminal_ui_spec_v2.md` to integrate `registration_outline.md` structure/questions and new UX requirements (intro, validation, hints, `back` command, conditional commands, formatting, check-all/ranking input, context loading) while retaining V2 technical decisions (SSOT, password auth). Clarified details via `ask_followup_question`.

[2025-04-20 1:49:00] - [SpecPseudo Task] Update Terminal Registration UI Specification (V3) [Completed] - Updated `docs/specs/p0_registration_terminal_ui_spec_v2.md` to integrate `registration_outline.md` structure/questions and new UX requirements (intro, validation, hints, `back` command, conditional commands, formatting, check-all/ranking input, context loading) while retaining V2 technical decisions (SSOT, password auth). Clarified details via `ask_followup_question`.
[2025-04-20 2:05:00] - [Code Task] Update SSOT Config & Generation Script for V3 Registration [Completed] - Updated `platform/config/registrationSchema.ts` to match V3 spec (31 questions, new types like multi-select-numbered, ranking-numbered). Refined `platform/scripts/generate-registration.ts` to correctly handle imports, 'use server' directive placement in `actions.ts`, and type definitions in generated `registrationQuestions.ts`. Ran script, verified generated files (frontend questions, Zod schema, draft SQL migration). Fixed build errors caused by script execution. Build compilation passed, though static generation failed due to unrelated dynamic route issues. Committed (f115aa5) and pushed changes.

${globalContextUpdate}

[2025-04-20 13:38:00] - [Code Task] Update Dynamic Theme Page to Use Markdown [Completed] - Refactored `platform/src/app/themes/[id]/page.tsx` to fetch detailed content from `docs/event_info/themes/*.md` instead of Supabase `description_expanded`. Includes parsing for 'Suggested Readings' and fallback logic. Tests updated and passing. Build successful. Changes committed (5eb3646) and pushed to `feat/architecture-v2`.

[2025-04-20 13:19:39] - [DevOps Task] Commit Upgraded Theme Descriptions [Completed] - Staged and committed changes to 7 theme description files (`docs/event_info/themes/*.md`) with commit `e3514e4` on branch `feature/architecture-v2`.
[2025-04-20 13:17:45] - [DocsWriter Task] Upgrade Theme Descriptions & Add Readings [Completed] - Enhanced all 8 theme descriptions in `docs/event_info/themes/` using corresponding research reports and added suggested readings sections.
[2025-04-20 09:44:08] - [DevOps Task] Archive original consolidated theme descriptions file [Completed] - Renamed and committed file archive (4567b43).

[2025-04-20 06:08:00] - [Code Task] Refactor Theme Descriptions [Completed] - Split consolidated `theme_descriptions_expanded.md` into individual files in `docs/event_info/themes/` directory. Committed changes (7bca2b5).

[2025-04-20 05:30:00] - [DevOps Task] Run Registration SSOT Generation Script (Attempt 2) [Completed] - Ran script, verified file creation, fixed resulting build errors in actions.ts, verified build, committed changes (f5d241e).

[2025-04-20 03:10:00] - [Optimizer Task] Refactor RegistrationForm Boot Sequence for Testability [Blocked] - Implemented conditional synchronous boot logic for test env. Fixed initial render tests (3/17 pass). Remaining 14 tests fail due to state update timing issues post-input. Invoking Early Return Clause. Recommend debug mode or integration tests.

[2025-04-20 02:49:00] - [Debug Task] Investigate Vitest/JSDOM Test Stalling Issue (REG-TEST-STALL-001) [Blocked] - Diagnosed issue as component async initialization failure in test environment, not stalling. Cache clear, config review, mock removal ineffective. Invoking Early Return Clause. Recommend component refactor or alternative testing.

[2025-04-19 19:34:00] - [Debug Task] Debug Terminal UI (RegistrationForm) [Completed] - Applied fixes for double boot messages (StrictMode/useEffect) and initial unresponsiveness (focus/scroll effect dependencies, form onClick). User confirmed fixes resolved original issues. Committed fixes (98e7303). New feature requests (menus, sign-in, edit/delete/continue) identified, requiring redesign.


[2025-04-19 15:18:20] - [Optimizer Task] Refactor P0 Content Mgmt & Update Registration Spec [Completed] - Applied Supabase types to relevant files. Updated registration form/action/DAL based on spec v1.1. Fixed form tests. Committed changes. Note: 7 action tests failing due to outdated mocks.

[2025-04-19 15:01:17] - [Optimizer Task] Refactor P0 Content Management - Apply Supabase Types [Completed] - Generated types after DB tables created. Applied types to relevant DAL/Action files. Verified tests pass. Committed changes.

[2025-04-19 14:54:46] - [DevOps Task] Create `event_details`, `profiles`, `registrations` Tables & Migrations [Completed] - Created, applied, and committed migrations for essential P0 tables.

[2025-04-19 14:04:14] - [DevOps Task] Create `schedule_items` Table & Migration [Completed] - Created and applied migration `20250419175905_create_schedule_items_table.sql` after removing RLS/trigger dependencies. Committed file.


[2025-04-19 12:03:15] - [TDD Task] P0 Content Management - Green Phase [Completed] - Implemented minimal code for Event Settings, Schedule Mgmt, Theme Desc (Expanded), Frontend Rendering. Applied style guide. Tests passing (263 passed, 3 skipped).

[2025-04-19 08:56:16] - [DevOps Task] Apply Supabase Profile Trigger Migration [Completed] - Successfully applied and committed the database migration for automatic profile creation.


[2025-04-19 05:43:47] - [Debug Task] Debug RLS Test Timeouts (`rls.test.ts`) [Blocked] - Investigated persistent Vitest timeouts for tests involving implicit `.then()` calls after Supabase client method chains. Multiple mock refinement attempts failed. Root cause likely complex async mock resolution issue. Invoking Early Return Clause. [See Debug Issue RLS-TEST-TIMEOUT-001]


[2025-04-19 06:26:00] - [Optimizer Task] Refactor for RLS Testability [Completed] - Introduced DAL, refactored Supabase calls, updated tests. RLS test timeouts resolved.


[2025-04-19 01:50:05] - [Code Task] Apply Fixes for Admin 404s (Task 75) [Blocked] - Created `admin/page.tsx`, refined middleware matcher. Clean build/restart command (`rm -rf .next && npm run dev`) was terminated before completion. Early Return Clause invoked. [Related to Task 74 Analysis - 2025-04-19 01:27:22]


[2025-04-19 01:27:22] - [Debug Task] Re-debugged Admin 404s (Task 74) [Analysis Complete] - Identified missing `platform/src/app/admin/page.tsx` as cause for `/admin` 404s. Cause for `/admin/login` 404s still hypothesized (middleware/cache). Recommended creating page, refining matcher, clean build. [Related to Issue AUTH-MIDDLEWARE-001]


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

[2025-04-18 17:04:00] - [DevOps Task] Merged Feature Branches (Task 26) [Completed] - Merged all completed feature/fix/chore branches from Task 25 into main.

[2025-04-18 17:40:00] - [Debug Task] Investigated Visual Rendering (Task 30) [Analysis Complete] - Font/spacing setup (Philosopher, JetBrains Mono) verified in layout, config, globals, Hero, NavBar. Code seems correct. Identified potential browser rendering or subjective spacing issues as likely cause. Proposed DevTools verification and targeted adjustments/experiments.


[2025-04-18 23:49:29] - [DevOps Task] Committed Aesthetic Overhaul (Task 64) [Completed] - Committed changes from Task 61 (minimal hacker aesthetic) to `feat/ui-overhaul` branch. Verified working tree is clean.


[2025-04-18 23:25:20] - [Code Task] Minimal Hacker Aesthetic Overhaul (Task 61) [In Progress] - Applied font, color, and border changes across layout, global styles, key components (NavBar, Footer, ContentBlock, Cards, Accordion, Timeline), and main page layouts for a consistent hacker aesthetic. Used subtle gray borders.



[2025-04-18 23:57:04] - [Code Task] Applied 'Inter' Font Fix (Task 66) [Completed] - Corrected default body font application in layout.tsx and cleaned up related CSS. Build and tests verified.


[2025-04-19 00:06:04] - [Code Task] Set Default Font to Monospace (Task 67) [Completed] - Corrected default body font to `font-mono` in layout.tsx and updated tests. Build/tests verified.


[2025-04-19 00:16:08] - [Code Task] Refactored NavBar (Task 23) [Completed] - Implemented responsive horizontal layout, hanging mobile dropdown, and hacker aesthetic (monospace links, philosopher logo) in `NavBar.tsx`. Build/tests verified.


[2025-03-31 11:07:01] - Reviewed initial structure of `platform/src/app/admin/page.tsx`.
[2025-04-02 07:27:00] - Completed UI theme overhaul (hacker style, fixed base styles, refined Matrix background spacing/speed, fixed NavBar, increased padding).
[2025-04-02 11:58:00] - Added specific global CSS rules to fix FAQ padding and bold answers.
[2025-04-03 16:28:00] - [DevOps Task] Vercel Deployment Setup [In Progress - Keys Obtained]