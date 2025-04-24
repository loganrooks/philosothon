# Phase 3 Implementation Plan

**Version:** 1.0
**Date:** 2025-04-23
**Based On:** `docs/project_specifications_v3.md`, `docs/architecture/terminal_component_v2.md`

## 1. Overview

This plan outlines the high-level implementation strategy for Phase 3 of the Philosothon Event Platform, focusing on delivering the features defined in Project Specification V3.0. The central theme is the development and integration of the unified **Terminal UI** as the primary interaction hub.

The plan follows the priority levels (P0-P4) defined in the specification and considers the dependencies identified during the V3 planning analysis.

## 2. Branching Strategy

*   **Base Branch:** All feature branches should be created from the latest `main` branch.
*   **Main Branch:** Represents the stable, production-ready state. Merges to `main` should only happen via Pull Requests after code review and successful checks (build, test, lint).
*   **Feature Branches:** Use clear, descriptive names prefixed with `feature/`, `fix/`, or `chore/`. Examples:
    *   `feature/auth-password`
    *   `feature/terminal-shell-v2`
    *   `feature/registration-v3.1`
    *   `feature/content-mgmt-p0`
    *   `feature/rls-policies-p0`
    *   `feature/team-management-p1`
    *   `feature/terminal-library`
    *   `feature/terminal-chatbot`
    *   `feature/gamification-core`
    *   `feature/terminal-submission`
    *   `feature/judge-portal`
*   **Pull Requests:** Use PRs to merge feature branches into `main`. Ensure PRs are focused and address a single feature or fix. Link PRs to relevant issues or spec sections.

## 3. Implementation Phases & Order

**Phase 3.1: P0 Foundation & Core Terminal** (`feature/auth-password`, `feature/rls-policies-p0`, `feature/content-mgmt-p0`, `feature/terminal-shell-v2`)

*   **Goal:** Establish the core technical foundation required for all subsequent features.
*   **Steps:**
    1.  **Implement Auth V2 (Password-based):**
        *   Configure Supabase Auth for email/password.
        *   Implement Server Actions: `signInWithPassword`, `signUpUser`, `signOut`, `requestPasswordReset`.
        *   Integrate Supabase SSR helpers for session management (middleware, client/server utils).
        *   *TDD Anchors:* Test `signInWithPassword` success/failure, `signUpUser` success/failure/existing-user, `signOut`, `requestPasswordReset`. Test middleware redirects (no session, wrong role). Test session handling via SSR helpers.
    2.  **Implement RLS Policies (P0):**
        *   Define and apply comprehensive RLS policies via Supabase migrations for core tables (`profiles`, `registrations`, `teams`, `schedule_items`, `event_details`, `themes`, `workshops`, `faq_items`, etc.). Focus on securing P0/P1 data first.
        *   *TDD Anchors:* Test DAL functions (e.g., `fetchThemes`, `fetchProfile`) with mocked Supabase client returning data/errors based on simulated user roles ('admin', 'participant', 'anonymous') to verify RLS-like behavior.
    3.  **Implement Content Management (P0):**
        *   Create/Update Supabase tables: `event_details`, `schedule_items`. Add `description_expanded` to `themes`.
        *   Implement basic Admin CRUD interfaces for managing this content (can be simple forms initially).
        *   Implement DAL functions for fetching this data.
        *   *TDD Anchors:* Test DAL functions (`fetchEventDetails`, `fetchScheduleItems`, `fetchThemeById`). Test Server Actions (`createEventDetail`, `updateScheduleItem`, `updateThemeDescription`) for success/validation errors. Test basic rendering of fetched data on relevant pages (e.g., `/themes/[id]`, `/admin/schedule`).
    4.  **Implement Core Terminal UI V2 (`TerminalShell`):**
        *   Build `TerminalShell` component based on `docs/architecture/terminal_component_v2.md`.
        *   Implement core state management (XState recommended for mode transitions).
        *   Implement `InputLine`, `OutputHistory` components.
        *   Implement global commands (`help`, `clear`, `exit`, `about`).
        *   Implement basic `MainMenuDialog` and `AuthDialog` (integrating with Auth V2 actions).
        *   Integrate `TerminalShell` into a primary page (e.g., `/terminal` or `/register`).
        *   *TDD Anchors:* Test `TerminalShell` initial render. Test `main` -> `auth` mode transition on 'sign-in' command. Test global commands (`help`, `clear`, `exit`, `about`) output. Test `AuthDialog` calls `signInWithPassword` action on input.


    * **QA Checkpoint:** Review completed P0 foundation features (Auth, RLS, Content Mgmt DAL/Admin, Core Terminal Shell/Auth Dialog) against specs and test results before proceeding.
**Phase 3.2: P0 Registration V3.1** (`feature/registration-v3.1`)

*   **Goal:** Implement the full V3.1 registration flow within the Terminal UI.
*   **Dependencies:** Phase 3.1 (Auth V2, Core Terminal UI V2, RLS, Content Mgmt for potential dynamic options).
*   **Steps:**
    1.  **Update SSOT Config & Run Generator:** Ensure `config/registrationSchema.ts` matches V3.1 spec (36 questions). Run `npm run generate:reg`, review and apply generated code/migrations.
    2.  **Implement `RegistrationDialog`:**
        *   Build the dialog component, receiving props from `TerminalShell`.
        *   Implement sequential question display logic based on generated `registrationQuestions.ts`.
        *   Implement early auth flow (First Name, Last Name, Email, Password, `signUpUser` call, `awaiting_confirmation` state).
        *   Implement flexible input handling and client-side validation for all question types (text, boolean, select, multi-select-numbered, ranked-choice-numbered).
        *   Implement local storage persistence (obfuscated).
        *   Implement commands: `register new`, `register continue`, `next`, `prev`, `save`, `exit`, `back`, `review`, `edit [number]`, `submit`.
    3.  **Implement Backend Actions:** Ensure `submitRegistration`, `updateRegistration`, `deleteRegistration` Server Actions correctly handle V3.1 data (36 questions) and interact with the updated `registrations` table schema.
    *   *TDD Anchors:* Test `RegistrationDialog` state updates (`useReducer`). Test input parsing/validation for all types (`text`, `boolean`, `select`, `multi-select-numbered`, `ranked-choice-numbered`). Test command logic (`back`, `edit`, `review`, `save`, `submit`, etc.). Test `localStorage` save/load (obfuscated). Test `submitRegistration` action call with correct V3.1 data structure and handling of success/error responses.


    * **QA Checkpoint:** Review completed RegistrationDialog V3.1 implementation and test suite against specs. Ensure test suite stability and coverage before proceeding.
**Phase 3.3: P1 Team Management** (`feature/team-management-p1`)

*   **Goal:** Implement core team formation assistance and communication setup.
*   **Dependencies:** Phase 3.2 (Registration V3.1 data).
*   **Steps:**
    1.  **Implement DB Schema:** Create `teams` table, add `team_id` to `profiles`. Apply RLS.
    2.  **Develop Team Formation Algorithm:** Create script/service (external or internal) to process `registrations` data and suggest teams. Define input/output format.
    3.  **Admin Interface:** Basic UI for running the algorithm, viewing suggestions, and manually assigning users to teams (updating `profiles.team_id`).
    4.  **Communication Integration:** Implement Supabase Edge Function triggered by team assignment to call Discord API (or chosen platform) for channel creation/invites.
    5.  **Implement Team Profile Pages (`/teams/[team_id]`):** Basic page displaying team name and members. Implement RLS for future private sections.
    *   *TDD Anchors:* Test team formation algorithm logic (unit tests if possible). Test Edge Function trigger and mock Discord API call. Test Admin assignment Server Action. Test Team Profile page data fetching (DAL) and basic rendering for authorized roles.


    * **QA Checkpoint:** Review team formation algorithm output, admin assignment UI, and communication integration (mocked) before proceeding.
**Phase 3.4: P2 Terminal Features & Analytics** (`feature/terminal-library`, `feature/terminal-chatbot`, `feature/gamification-core`, `feature/analytics-tracking`)

*   **Goal:** Integrate the Document Library, Chatbot, core Gamification, and basic Analytics.
*   **Dependencies:** Phase 3.1 (Core Terminal), Phase 3.2 (Reg V3.1 for Gamification personalization), potentially Phase 3.3 (Team context for Gamification?). Note: `GamificationDialog` and `ChatDialog` depend on AI Backend setup (Step 1). `LibraryDialog` depends on Text Strategy definition (Spec 3.3.4).
*   **Steps (Can be parallelized to some extent):**
    1.  **Setup AI Backend:**
        *   Choose and set up Vector DB (e.g., Supabase `pgvector`).
        *   Develop processing pipeline for philosophical texts (chunking, embedding).
        *   Implement AI Agent MCP Server (basic structure, connection handling).
    2.  **Implement Terminal Library (`LibraryDialog`):**
        *   Define text storage/access strategy (See Spec 3.3.4).
        *   Implement `library list/search/read` commands and text display within the terminal.
        *   *TDD Anchors:* Test `library list/search/read` commands. Test text fetching/display logic based on chosen storage strategy.
    3.  **Implement Terminal Chatbot (`ChatDialog`):**
        *   Integrate `ChatDialog` with AI Agent MCP Server (WebSocket recommended).
        *   Connect AI Agent to Vector DB for knowledge retrieval.
        *   Implement conversational flow within the terminal.
        *   *TDD Anchors:* Test `ChatDialog` connection to mocked MCP server. Test message sending/receiving format. Test handling of basic AI responses from mock.
    4.  **Implement Gamification Core (`GamificationDialog`, `user_puzzle_progress` table):**
        *   Implement `user_puzzle_progress` table and RLS.
        *   Build `GamificationDialog`.
        *   Integrate with AI Agent MCP for puzzle logic, state management, and personalization (using registration data).
        *   Implement basic puzzle start trigger (post-registration) and interaction flow via terminal commands.
        *   *TDD Anchors:* Test `GamificationDialog` interaction with mocked MCP server for puzzle logic/state. Test Server Action for updating `user_puzzle_progress` table.
    5.  **Implement Analytics Tracking:**
        *   Integrate chosen analytics provider (Supabase/Plausible).
        *   Add tracking for key events (page views, registration steps, terminal command usage, gamification progress).
        *   *TDD Anchors:* Test analytics events (e.g., `trackEvent('registration_complete')`) are fired correctly by mocking the analytics provider client.
    6.  **Implement Cryptic Email Notification:**
        *   Integrate email service (e.g., Resend).
        *   Implement logic (e.g., Edge Function) for sending staged cryptic emails post-registration.
        *   *TDD Anchors:* Test Edge Function logic for triggering email sends (mocking email service API call).


    * **QA Checkpoint:** Review integrated Library, Chatbot, Gamification core, Analytics tracking, and Email notifications within the terminal context before proceeding.
**Phase 3.5: P3 Submissions & Admin** (`feature/terminal-submission`, `feature/judge-portal`, `feature/admin-analytics`)

*   **Goal:** Implement submission flow and basic judge/admin views.
*   **Dependencies:** Phase 3.1 (Core Terminal, Auth), Phase 3.3 (Team Mgmt).
*   **Steps:**
    1.  **Implement Terminal Submission (`SubmissionDialog`):**
        *   Define file upload mechanism (e.g., triggering standard input).
        *   Implement `submit list/upload/status` commands.
        *   Implement Supabase Storage integration and `submissions` table updates via Server Action.
        *   Implement RLS for storage/table.
        *   Implement email receipt Edge Function.
        *   *TDD Anchors:* Test `submit list/upload/status` commands. Test file handling callback (if applicable). Test `submitFile` Server Action logic (validation, storage call, DB update). Test RLS via mocked roles in Server Action. Test email receipt Edge Function trigger (mocking email service).
    2.  **Implement Judge Portal:**
        *   Create basic web UI (`/judge`) protected by "Judge" role.
        *   Implement listing and downloading of submissions.
        *   *TDD Anchors:* Test middleware role protection for `/judge`. Test submission data fetching (DAL) and display logic.
    3.  **Implement Admin Analytics Dashboard:**
        *   Create basic web UI (`/admin/analytics`) protected by "Admin" role.
        *   Display key metrics fetched from analytics source or aggregated from DB.
        *   *TDD Anchors:* Test middleware role protection for `/admin/analytics`. Test data fetching (DAL/analytics provider) and display logic.


    * **QA Checkpoint:** Review submission flow, Judge Portal access/display, and Admin Analytics display before proceeding.
**Phase 3.6: P4 Post-Event** (`feature/post-event-survey`)

*   **Goal:** Implement post-event feedback collection.
*   **Dependencies:** Phase 3.1 (Auth).
*   **Steps:**
    1.  Implement survey form/component.
    2.  Implement Server Action to save survey responses.
    3.  Implement mechanism to trigger/display survey to participants post-event.

## 4. Key Considerations

*   **Terminal UI Complexity:** The terminal is becoming a feature-rich mini-application. Careful component design, robust state management (XState), and thorough testing are crucial.
*   **AI/MCP Backend:** Setting up the Vector DB, text processing pipeline, and AI Agent MCP server is a significant sub-project requiring dedicated effort and potentially specialized skills.
### Enhanced Testing Strategy

Given the complexity of the Terminal UI and known issues like `REG-TEST-TIMING-001` affecting asynchronous operations in JSDOM, the following strategies are recommended:

*   **Unit Tests (Vitest/JSDOM):** Focus on pure logic (reducers, validation functions, DAL mocks). For components, prioritize testing state transitions based on direct state assertions where possible, rather than relying solely on output/prompt assertions which can be timing-sensitive. Use `act` wrapper consistently.
*   **Integration/E2E Tests (Playwright/Cypress):** Crucial for validating full user flows, especially those involving asynchronous operations, multiple state transitions (e.g., `awaiting_confirmation`), and command sequences within the Terminal UI. Prioritize flows like the full registration process, auth flows, and submission process.
*   **Targeted Debugging:** When unit tests fail due to timing or environment issues, use targeted debugging (logging, browser inspection) rather than overly broad workarounds like removing assertions.

*   **Scope Management:** The P2/P3 features are substantial. Monitor progress closely and be prepared to adjust scope or timelines if necessary.

This plan provides a structured approach to tackling the V3 requirements. Regular review and adaptation will be necessary as implementation progresses.

### Risk Mitigation

*   **Test Suite Instability (e.g., `REG-TEST-TIMING-001`):**
    *   *Mitigation:* Prioritize test suite refactoring (as recommended by Holistic Review). Employ robust assertion strategies and consider Playwright for complex flows. Allocate specific debugging time if issues persist.
*   **Terminal UI Complexity:**
    *   *Mitigation:* Adhere strictly to modular architecture (Arch V2). Use XState for shell state management as recommended. Conduct regular code reviews focusing on `handleSubmit` logic and state interactions.
*   **Context Window Limits:**
    *   *Mitigation:* Modes should proactively monitor context size. If performance degrades or errors increase, use `new_task` for clear handover (Delegate Clause). Prioritize batch operations (e.g., `apply_diff` with multiple edits).
*   **Tool Limitations/Errors (e.g., `apply_diff` failures):**
    *   *Mitigation:* Follow structured error handling protocol (Log, Analyze, Consult MB, Propose Solution). Use alternative tools (`insert_content`, `write_to_file` if permitted) or request user intervention if tools consistently fail.
*   **AI Backend Setup Complexity (Phase 3.4):**
    *   *Mitigation:* Allocate dedicated time for research and setup. Start with simpler vector DB options (e.g., `pgvector`) if feasible. Clearly define MCP server interface early.
