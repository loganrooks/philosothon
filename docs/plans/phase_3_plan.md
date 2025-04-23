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
        *   *TDD Anchors:* Test Server Actions, middleware protection, session handling.
    2.  **Implement RLS Policies (P0):**
        *   Define and apply comprehensive RLS policies via Supabase migrations for core tables (`profiles`, `registrations`, `teams`, `schedule_items`, `event_details`, `themes`, `workshops`, `faq_items`, etc.). Focus on securing P0/P1 data first.
        *   *TDD Anchors:* While direct RLS testing is hard, test data access functions under different mock user roles to ensure expected data is returned/denied.
    3.  **Implement Content Management (P0):**
        *   Create/Update Supabase tables: `event_details`, `schedule_items`. Add `description_expanded` to `themes`.
        *   Implement basic Admin CRUD interfaces for managing this content (can be simple forms initially).
        *   Implement DAL functions for fetching this data.
        *   *TDD Anchors:* Test DAL functions, Server Actions for CRUD, basic rendering of fetched data on relevant pages (e.g., `/themes/[id]`).
    4.  **Implement Core Terminal UI V2 (`TerminalShell`):**
        *   Build `TerminalShell` component based on `docs/architecture/terminal_component_v2.md`.
        *   Implement core state management (XState recommended for mode transitions).
        *   Implement `InputLine`, `OutputHistory` components.
        *   Implement global commands (`help`, `clear`, `exit`, `about`).
        *   Implement basic `MainMenuDialog` and `AuthDialog` (integrating with Auth V2 actions).
        *   Integrate `TerminalShell` into a primary page (e.g., `/terminal` or `/register`).
        *   *TDD Anchors:* Test `TerminalShell` rendering, state transitions between `main` and `auth` modes, global command handling, `AuthDialog` interaction with auth actions.

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
    *   *TDD Anchors:* Test `RegistrationDialog` state management, input handling for all types, validation logic, command execution, interaction with Server Actions, local storage persistence. Test Server Actions with mock data reflecting V3.1 schema.

**Phase 3.3: P1 Team Management** (`feature/team-management-p1`)

*   **Goal:** Implement core team formation assistance and communication setup.
*   **Dependencies:** Phase 3.2 (Registration V3.1 data).
*   **Steps:**
    1.  **Implement DB Schema:** Create `teams` table, add `team_id` to `profiles`. Apply RLS.
    2.  **Develop Team Formation Algorithm:** Create script/service (external or internal) to process `registrations` data and suggest teams. Define input/output format.
    3.  **Admin Interface:** Basic UI for running the algorithm, viewing suggestions, and manually assigning users to teams (updating `profiles.team_id`).
    4.  **Communication Integration:** Implement Supabase Edge Function triggered by team assignment to call Discord API (or chosen platform) for channel creation/invites.
    5.  **Implement Team Profile Pages (`/teams/[team_id]`):** Basic page displaying team name and members. Implement RLS for future private sections.
    *   *TDD Anchors:* Test team formation algorithm logic (unit tests if possible), Edge Function trigger and API call mocking, Admin assignment action, Team Profile page data fetching and basic rendering.

**Phase 3.4: P2 Terminal Features & Analytics** (`feature/terminal-library`, `feature/terminal-chatbot`, `feature/gamification-core`, `feature/analytics-tracking`)

*   **Goal:** Integrate the Document Library, Chatbot, core Gamification, and basic Analytics.
*   **Dependencies:** Phase 3.1 (Core Terminal), Phase 3.2 (Reg V3.1 for Gamification personalization), potentially Phase 3.3 (Team context for Gamification?).
*   **Steps (Can be parallelized to some extent):**
    1.  **Setup AI Backend:**
        *   Choose and set up Vector DB (e.g., Supabase `pgvector`).
        *   Develop processing pipeline for philosophical texts (chunking, embedding).
        *   Implement AI Agent MCP Server (basic structure, connection handling).
    2.  **Implement Terminal Library (`LibraryDialog`):**
        *   Define text storage/access strategy (See Spec 3.3.4).
        *   Implement `library list/search/read` commands and text display within the terminal.
        *   *TDD Anchors:* Test library commands, text fetching/display.
    3.  **Implement Terminal Chatbot (`ChatDialog`):**
        *   Integrate `ChatDialog` with AI Agent MCP Server (WebSocket recommended).
        *   Connect AI Agent to Vector DB for knowledge retrieval.
        *   Implement conversational flow within the terminal.
        *   *TDD Anchors:* Test `ChatDialog` connection, message sending/receiving, basic AI responses (mocked MCP).
    4.  **Implement Gamification Core (`GamificationDialog`, `user_puzzle_progress` table):**
        *   Implement `user_puzzle_progress` table and RLS.
        *   Build `GamificationDialog`.
        *   Integrate with AI Agent MCP for puzzle logic, state management, and personalization (using registration data).
        *   Implement basic puzzle start trigger (post-registration) and interaction flow via terminal commands.
        *   *TDD Anchors:* Test `GamificationDialog` interaction with mocked MCP, puzzle state updates in DB (via mocked actions).
    5.  **Implement Analytics Tracking:**
        *   Integrate chosen analytics provider (Supabase/Plausible).
        *   Add tracking for key events (page views, registration steps, terminal command usage, gamification progress).
        *   *TDD Anchors:* Test analytics events are fired correctly (mocking the analytics provider).
    6.  **Implement Cryptic Email Notification:**
        *   Integrate email service (e.g., Resend).
        *   Implement logic (e.g., Edge Function) for sending staged cryptic emails post-registration.
        *   *TDD Anchors:* Test email sending logic (mocking email service).

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
        *   *TDD Anchors:* Test submission commands, file handling callback, Server Action logic, RLS (mocked roles), email trigger.
    2.  **Implement Judge Portal:**
        *   Create basic web UI (`/judge`) protected by "Judge" role.
        *   Implement listing and downloading of submissions.
        *   *TDD Anchors:* Test role protection, submission data fetching and display.
    3.  **Implement Admin Analytics Dashboard:**
        *   Create basic web UI (`/admin/analytics`) protected by "Admin" role.
        *   Display key metrics fetched from analytics source or aggregated from DB.
        *   *TDD Anchors:* Test role protection, data fetching and display.

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
*   **Testing Strategy:** Given the issues with JSDOM/async testing, prioritize integration tests for key user flows (registration, auth, submission, core gamification loop) using tools like Playwright or Cypress if unit testing proves insufficient for terminal components.
*   **Scope Management:** The P2/P3 features are substantial. Monitor progress closely and be prepared to adjust scope or timelines if necessary.

This plan provides a structured approach to tackling the V3 requirements. Regular review and adaptation will be necessary as implementation progresses.