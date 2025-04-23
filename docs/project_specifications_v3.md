# Philosothon Event Platform - Project Specification v3.0
**Version:** 3.0
**Date:** 2025-04-23
**Status:** Draft

## 1. Introduction

This document outlines the revised specifications for the Philosothon Event Platform, building upon v2.1 (`docs/project_specifications_v2.md`). This version incorporates a significantly expanded feature set, particularly focusing on the **Terminal UI** as a central interaction hub, based on user feedback and recent planning. Features are organized by implementation priority: P0 (highest) to P4 (lowest).

**Lessons Learned Incorporated:**
*   **RLS Criticality (P0):** Robust Row-Level Security (RLS) in Supabase is paramount and must be implemented early for all relevant tables to ensure data privacy and integrity. Recent fixes highlight this need.
*   **SSOT Strategy Success (P0):** The Single Source of Truth (SSOT) approach using a central configuration file (`config/registrationSchema.ts`) and code generation (`scripts/generate-registration.ts`) for registration questions, validation (Zod), and draft migrations has proven effective and should be maintained and potentially expanded.
*   **Testing Challenges:** Frontend testing of complex, asynchronous components (like the terminal UI) within the Vitest/JSDOM environment has presented significant challenges (e.g., `REG-TEST-STALL-001`). Strategies may need adjustment, potentially favoring integration tests or alternative component designs where unit testing proves intractable.

## 2. Core Goals (Revised)

*   Provide a comprehensive and engaging online presence for the Philosothon event.
*   Streamline the registration process via an immersive **Terminal UI**.
*   Support participant engagement through roles, team formation, and communication.
*   Facilitate the submission and review process for event deliverables via the **Terminal UI** and dedicated portals.
*   Enhance user engagement through unique gamification elements integrated into the **Terminal UI**.
*   Ensure secure and manageable administration of the platform and its content.

## 3. Functional Requirements (By Priority)

### 3.1 Authentication and Security (P0)

*   **Requirement 3.1.1 (Site-Wide Password Authentication):** Implement site-wide email/password authentication using Supabase Auth, replacing the previous Magic Link system for primary login. Magic Link retained as a recovery/alternative option. (Decision Ref: MB Log 2025-04-19 20:09:00)
    *   *Implementation:* Configure Supabase Auth, implement Server Actions (`signInWithPassword`, `signUpUser`, `signOut`, `requestPasswordReset`), update relevant UIs (Admin Login, Terminal Auth Mode). Use Supabase SSR helpers for session management. Min 8-character password length.

*   **Requirement 3.1.2 (Role-Based Access Control - RBAC):** System must support distinct user roles (`admin`, `participant`, `judge`, `team_member`) stored in the `profiles` table, linked to `auth.users`. Permissions enforced via Middleware and Supabase RLS. (Decision Ref: MB Log 2025-04-19 04:37:30)
    *   *Implementation:* Define roles in `profiles` table. Implement middleware checks. Define comprehensive RLS policies for all sensitive tables (`profiles`, `registrations`, `teams`, `submissions`, `schedule_items`, `event_details`, etc.). Initial role assignment likely manual via Supabase Studio or admin script.

### 3.2 Registration System (P0 - Via Terminal UI)

*   **Requirement 3.2.1 (Terminal UI Integration):** All registration interactions (new, continue, view, edit, delete) must occur through the redesigned **Terminal UI** (see Section 3.9).
*   **Requirement 3.2.2 (V3.1 Questionnaire):** Implement the full V3.1 registration questionnaire (36 questions) as defined in `docs/specs/p0_registration_terminal_ui_spec_v2.md` and sourced via the SSOT strategy (`config/registrationSchema.ts`).
*   **Requirement 3.2.3 (Early Auth Flow):** Implement the early authentication flow during `register new`: collect First Name, Last Name, Email, then prompt for Password creation. Call `signUpUser` immediately. Handle existing user detection and email confirmation state (`awaiting_confirmation` mode). (Spec Ref: `p0_registration_terminal_ui_spec_v2.md`, Section 3.2.3)
*   **Requirement 3.2.4 (Data Storage):** Store submitted registration data in the `registrations` table (linked to `auth.users`), with schema updates reflecting V3.1 fields (generated via SSOT script). Use appropriate data types (TEXT, INTEGER, BOOLEAN, TEXT[], JSONB).
*   **Requirement 3.2.5 (Local Persistence & Obfuscation):** Use browser local storage (`philosothon-registration-v3.1` key) for in-progress registrations. Apply basic Base64 obfuscation.
*   **Requirement 3.2.6 (Input Flexibility & Validation):** Implement flexible input handling (boolean variations, numeric/text selection, multi-select-numbered, ranked-choice-numbered) and robust client-side validation (using `validationRules` from SSOT) with clear error messages and hints, as specified in `p0_registration_terminal_ui_spec_v2.md`. Server-side validation via generated Zod schema in Server Actions.

### 3.3 Content Management (P0)

*   **Requirement 3.3.1 (Event Information Management):** Implement a centralized system using Supabase tables (`event_details`, `schedule_items`) for managing core event info (dates, schedule, deadlines). Requires Admin CRUD interface. (Decision Ref: MB Log - Req 3.3.1 Option A)
*   **Requirement 3.3.2 (Theme Information Display System):** Migrate expanded theme descriptions and suggested readings into the Supabase `themes` table (e.g., `description_expanded` field). Update dynamic theme pages (`/themes/[id]`) to fetch and render this content. Requires Admin CRUD interface update. (Decision Ref: MB Log - Req 3.3.2 Option C)
*   **Requirement 3.3.3 (FAQ Management):** Retain current Supabase-backed FAQ system with Admin CRUD.
*   **Requirement 3.3.4 (Philosophical Texts Management):** Define a strategy for managing the philosophical texts required for the Document Library and Gamification AI.
    *   *Options:* Markdown files in repo, Supabase table with text content.
    *   *Consideration:* How will texts be processed/chunked/embedded for the Vector DB?
    *   *Decision:* TBD - Requires investigation based on Vector DB choice and processing pipeline. Initial assumption: Markdown files in `docs/philosophy/` processed by an external script/MCP server.

### 3.4 Team Management (P1)

*   **Requirement 3.4.1 (Team Formation Algorithm):** Develop an algorithm (likely external script or service) to suggest team formations based on V3.1 registration data (interests, skills, working style, etc.). Output should support admin review and manual adjustments.
*   **Requirement 3.4.2 (Team Communication Platform):** Integrate with an external platform (e.g., Discord) via Supabase Edge Functions triggered on team finalization to automatically create channels/groups and invite members. (Decision Ref: MB Log - Req 3.4.2 Option B)
*   **Requirement 3.4.3 (Team Data Model):** Implement `teams` table in Supabase. Update `profiles` table with `team_id` foreign key.
*   **Requirement 3.4.4 (Team Assignment):** Admin mechanism (UI or script) to finalize teams and update `profiles.team_id`.
*   **Requirement 3.4.5 (Team Profile Pages):** Create dynamic pages (`/teams/[team_id]`) displaying team name, members, interests. Implement RLS for private notes/progress sections visible only to team members.

### 3.5 Gamification (Puzzle Element) (P2 - Via Terminal UI)

*   **Requirement 3.5.1 (Integration & Theme):** Integrate the ARG/puzzle element primarily through the **Terminal UI**. Theme: Philosophy of technology, posthumanism, AI concepts, occult undertones, "House of Leaves" meta-narrative.
*   **Requirement 3.5.2 (Gameplay & Tone):** Scavenger hunt guiding users deeper into philosophical concepts via clues in site content and required reading (potentially via Terminal Library). Tone becomes progressively eerie/uncanny.
*   **Requirement 3.5.3 (Live AI Agent Interaction):** Integrate the AI agent (via MCP Server) into the **Terminal UI** (e.g., a `chat` or `puzzle` command/mode). Agent uses registration data, philosophical texts (via Vector DB), and puzzle state for personalized, Socratic, and potentially unsettling dialogue.
*   **Requirement 3.5.4 (Core Mechanics):** Puzzle start potentially hidden, but core AI interaction triggered post-registration via **Terminal UI**. Clues involve riddles and text references. Goal is narrative/philosophical insight. Progress tracked in Supabase (`user_puzzle_progress`).
*   **Requirement 3.5.5 - 3.5.11 (Advanced Features):** Implement enhanced personalization, interface transformation (within terminal or affecting main site), multi-layered feedback, dynamic philosophical content generation (via `vectorize`), collective mystery elements, and psychological techniques as detailed in v2.1 spec, leveraging the AI Agent and **Terminal UI**.
*   **Requirement 3.5.12 (Cryptic Email Notification):** Implement staged, cryptic email notification system hinting at the puzzle, triggered post-registration (delayed) or on feature launch for existing users. Requires email service integration and tracking.
### 3.6 Terminal Document Library (P2 - New)

*   **Requirement 3.6.1 (Access):** Provide access to philosophical texts via commands within the **Terminal UI**.
*   **Requirement 3.6.2 (Content Source):** Access processed/chunked markdown versions of texts stored locally or fetched from Supabase/other source (See 3.3.4).
*   **Requirement 3.6.3 (Interface):** Implement commands like `library list`, `library search [keyword]`, `library read [text_id]`.
*   **Requirement 3.6.4 (Reading Experience):** Display text within the terminal interface, potentially paginated or scrollable. Basic navigation commands (`next`, `prev`, `goto [page/section]`).
*   **Requirement 3.6.5 (Integration):** Link texts to Gamification clues and Chatbot knowledge base.

### 3.7 Terminal Chatbot (P2 - New)

*   **Requirement 3.7.1 (Access):** Provide access to an AI chatbot via commands within the **Terminal UI** (e.g., `chat [message]`).
*   **Requirement 3.7.2 (Knowledge Base):** Chatbot should be knowledgeable about the philosophical texts available in the Terminal Library (powered by the same AI Agent MCP / Vector DB as Gamification).
*   **Requirement 3.7.3 (Functionality):** Allow users to ask questions about the texts, discuss concepts, or potentially interact in character (if linked to Gamification persona).
*   **Requirement 3.7.4 (Interface):** Conversational interaction within the terminal, displaying user input and AI responses.

### 3.8 Submission Portal (P3 - Via Terminal UI & Judge Portal)

*   **Requirement 3.8.1 (Participant Submission via Terminal):** Implement submission functionality within the **Terminal UI**.
    *   Commands like `submit list`, `submit upload [file_path]`, `submit status`.
    *   Requires integration with file system access (if uploading local files) or a mechanism to specify file source. *Needs further definition - how does a terminal UI handle file uploads securely? Perhaps initiates a standard browser upload dialog?*
    *   Alternatively, the terminal could link to a standard web form for upload, but display status.
*   **Requirement 3.8.2 (Storage & Metadata):** Use Supabase Storage for files, `submissions` table for metadata (team_id, user_id, file_path, timestamp). Enforce RLS.
*   **Requirement 3.8.3 (Permissions):** Any team member can submit. RLS restricts access.
*   **Requirement 3.8.4 (Receipt):** Trigger email receipt via Edge Function to all team members on successful upload and metadata record creation.

### 3.9 Judge Portal (P3)

*   **Requirement 3.9.1 (Access Control):** Web portal accessible only to "Judge" role.
*   **Requirement 3.9.2 (Submission Review):** Interface to list, view, and download team submissions from Supabase Storage.
*   **Requirement 3.9.3 (Feedback Mechanism):** (Optional P4) Allow judges to provide feedback (TBD format).
*   **Requirement 3.9.4 (Analytics Dashboard):** (Optional P4) Basic dashboard for submission status.

### 3.10 Analytics and Reporting (P2/P4)

*   **Requirement 3.10.1 (Event Participation Metrics - P2):** Implement analytics tracking (Supabase Analytics/Plausible) for registration, theme popularity, gamification engagement, page interactions.
*   **Requirement 3.10.2 (Post-Event Survey System - P4):** Integrated feedback system post-event.
*   **Requirement 3.10.3 (Reporting Dashboard - P3):** Admin dashboard for viewing key metrics.

### 3.11 Core Terminal UI (P0 Foundation)

*   **Requirement 3.11.1 (Modular Architecture):** Implement the `TerminalShell` / `ActiveDialog` architecture as defined in `docs/architecture/terminal_component_v2.md` (pending review/update).
*   **Requirement 3.11.2 (State Management):** Use `useReducer` + Context initially, but design with potential migration to XState in mind, especially for Gamification/Chat modes.
*   **Requirement 3.11.3 (Styling):** Implement the minimalist hacker aesthetic (monospace font, black/green/orange colors) consistently.
*   **Requirement 3.11.4 (Core Commands):** Implement global commands (`help`, `clear`, `exit`, `about`) and mode switching logic.
*   **Requirement 3.11.5 (Dialogs):** Implement necessary dialog components (`MainMenuDialog`, `AuthDialog`, `RegistrationDialog`, `InterestFormPlaceholder` (if still needed?), `SubmissionDialog`, `LibraryDialog`, `ChatDialog`, `GamificationDialog`).

## 4. Implementation Timeline (Revised)

*   **Phase 1 (P0 Foundation):**
    *   Security/Auth V2 (Password-based) Implementation
    *   Core Terminal UI Shell V2 (Modular Arch, State Mgmt Base)
    *   Update SSOT Config & Generation Script for V3.1
    *   Implement RLS Policies for Core Tables
    *   Content Management Setup (Supabase Tables for Event Info, Themes) + Admin CRUD
*   **Phase 2 (P0 Registration & P1 Teams):**
    *   Implement Registration V3.1 Flow within Terminal UI
    *   Implement Team Management Features (Algorithm Assist, Communication Integration, Profiles Table)
*   **Phase 3 (P2 Gamification/Library/Chat):**
    *   Setup AI Agent MCP Server & Vector DB
    *   Implement Terminal Document Library
    *   Implement Terminal Chatbot
    *   Implement Core Gamification Mechanics & AI Interaction within Terminal
    *   Implement Cryptic Email Notification
    *   Implement Basic Analytics Tracking
*   **Phase 4 (P3 Submissions & P4+):**
    *   Implement Terminal Submission Flow & Judge Portal Access
    *   Implement Admin Analytics Dashboard
    *   (P4) Post-Event Survey, Advanced Judge Features

## 5. Technical Considerations (Updated)

*   **Terminal Architecture V2:** The modular terminal architecture needs careful implementation, especially state management and communication for real-time features (Chat/Gamification). See `docs/architecture/terminal_component_v2.md`.
*   **State Management:** Evaluate if `useReducer` is sufficient long-term for the terminal; XState might be necessary.
*   **SSOT Expansion:** Consider expanding SSOT strategy beyond registration (e.g., for content types, gamification stages).
*   **Vector DB & AI Agent:** Requires significant setup and integration effort (MCP Server, DB choice, embedding pipeline, prompt engineering).
*   **Testing:** Adapt testing strategies to handle complex terminal UI state and potential JSDOM limitations. Prioritize integration testing for key flows.
*   **Terminal File Upload:** Define a secure and user-friendly mechanism for handling file uploads initiated from the terminal UI.

## 6. Appendices

*   Appendix A: Reference to v2.1 specification (`docs/project_specifications_v2.md`)
*   Appendix B: V3.1 Registration Spec (`docs/specs/p0_registration_terminal_ui_spec_v2.md`)
*   Appendix C: Terminal Architecture V1 (`docs/architecture/terminal_component_v1.md`)
*   Appendix D: Registration Sync Strategy (`docs/specs/registration_sync_strategy.md`)
*   Appendix E: Style Guide (`docs/style_guide.md`)
## 6. Appendices

*   Appendix A: Reference to v2.1 specification (`docs/project_specifications_v2.md`)
*   Appendix B: V3.1 Registration Spec (`docs/specs/p0_registration_terminal_ui_spec_v2.md`)
*   Appendix C: Terminal Architecture V1 (`docs/architecture/terminal_component_v1.md`)
*   Appendix D: Registration Sync Strategy (`docs/specs/registration_sync_strategy.md`)
*   Appendix E: Style Guide (`docs/style_guide.md`)