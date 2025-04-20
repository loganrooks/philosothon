# Specification: P0 Terminal Registration UI Redesign (V2)

**Version:** 1.0
**Date:** 2025-04-19
**Status:** Final Draft

## 1. Purpose & Overview

This document outlines the functional requirements, user flows, technical specifications, and integration points for the redesigned Philosothon Terminal Registration System (V2). The system aims to provide an immersive, retro-computing terminal experience for event registration, replacing the previous basic terminal UI (`RegistrationForm.tsx`, commit `98e7303`) and incorporating robust question synchronization and a new password-based authentication system.

This specification incorporates the analysis and recommendations from `docs/specs/registration_sync_strategy.md` and considers the existing implementation files (`RegistrationForm.tsx`, `registrationQuestions.ts`, `useLocalStorage.ts`, `actions.ts`).

## 2. Terminal Modes & Navigation

The system operates in distinct modes, each offering specific commands and visual cues, replacing the simpler mode handling in the previous `RegistrationForm.tsx`.

### 2.1 Terminal Modes

1.  **Main Terminal Mode** (Default)
    *   **Entry:** Initial state after boot sequence. Return via `back` or `exit` from other modes (where applicable).
    *   **Prompt:** `[user@philosothon]$` (or `[guest@philosothon]$` if anonymous)
    *   **Purpose:** Provides access to top-level commands (`register`, `sign-in`, `help`, `about`, plus `view`, `edit`, `delete`, `sign-out` when authenticated) and displays initial status information based on local storage or server session.
    *   **Visuals:** Standard terminal appearance. Clear command hints visible.

2.  **Registration Mode**
    *   **Entry:** Via `register new` or `register continue` commands from Main Mode, or `edit` command (post-auth).
    *   **Prompt:** `[registration]>`
    *   **Purpose:** Guides the user through sequential registration questions (for `new`/`continue`) or allows editing specific answers (for `edit`). Questions sourced via the SSOT strategy (see Section 6.1).
    *   **Visuals:** Header indicating "Registration Mode". Progress indicator (e.g., "Question X/Y") during initial registration. Mode-specific command hints.

3.  **Authentication Mode**
    *   **Entry:** Via `sign-in` command from Main Mode.
    *   **Prompt:** `[auth]>`
    *   **Purpose:** Handles user sign-in using email and password.
    *   **Visuals:** Header indicating "Authentication Mode". Password input fields must mask characters (`*`). Secure handling of credentials is paramount.

4.  **Admin Mode** (Optional - Deferred)
    *   *Details for this mode are deferred beyond P0.*

### 2.2 Command Visibility & Discovery

1.  **Command Hints:**
    *   A clearly visible list/menu of available commands shall be displayed in each mode, adapted for authenticated vs. anonymous states.
    *   Brief help text explaining each command's purpose shall be available (e.g., via `help [command]`).
    *   The current mode shall always be clearly indicated (e.g., via prompt, status line).
    *   *TDD Anchor:* Test command hints update correctly when switching modes and auth states.
    *   *TDD Anchor:* Test `help` command displays general help relevant to the mode/auth state.
    *   *TDD Anchor:* Test `help [command]` displays specific command help.

2.  **Command Prompt Styling:**
    *   Prompts shall differ per mode as specified in 2.1. Authenticated state may also influence the prompt in Main Mode.
    *   *TDD Anchor:* Test prompt string matches the current mode and auth state.

## 3. User Flows

### 3.1 Initial Experience (Main Terminal Mode)

1.  **Boot Sequence:** A brief, skippable boot sequence animation plays.
2.  **Session Check:** System checks for an existing valid session token (e.g., via Supabase SSR helpers).
3.  **Main Menu (Anonymous):** If no valid session, the main terminal prompt (`[guest@philosothon]$`) appears with commands: `register`, `sign-in`, `help`, `about`.
4.  **Main Menu (Authenticated):** If valid session exists, the main terminal prompt (`[user@philosothon]$`) appears with commands: `register` (may behave differently, e.g., go directly to `view`/`edit`), `view`, `edit`, `delete`, `sign-out`, `help`, `about`.
5.  **Status Line:** A status line indicates relevant state:
    *   Anonymous + Local Data: "Registration in progress found. Use 'register continue' to resume."
    *   Authenticated: "Signed in as [user_email]. Registration [status: complete/incomplete/not started]."
    *   *TDD Anchor:* Test status line displays correct message based on local storage state (pre-auth).
    *   *TDD Anchor:* Test status line displays correct message based on server data/session (post-auth).

### 3.2 Registration Process (Registration Mode - New/Continue)

1.  **Entry:** User enters `register` in Main Mode (if anonymous or no completed registration).
2.  **Sub-Menu:** System presents registration sub-commands: `new`, `continue`, `back`.
    *   `new`: Starts a fresh registration. If local data exists, display warning: "Existing registration data found. Starting new will overwrite it. Proceed? (yes/no)". Requires confirmation (`yes`). Clears relevant local storage (`useLocalStorage` key). Enters Registration Mode at question 1.
    *   `continue`: Resumes registration from the last saved question index stored locally. If no local data exists, display error: "No registration in progress found. Use 'register new'." Enters Registration Mode at the saved index.
    *   `back`: Returns to Main Terminal Mode.
    *   *TDD Anchor:* Test `register` command shows sub-menu (anonymous).
    *   *TDD Anchor:* Test `register new` prompts confirmation if local data exists.
    *   *TDD Anchor:* Test `register new` clears local data and starts from question 1 on confirmation.
    *   *TDD Anchor:* Test `register continue` resumes from correct index if local data exists.
    *   *TDD Anchor:* Test `register continue` shows error if no local data exists.
    *   *TDD Anchor:* Test `back` command returns to Main Mode.
3.  **Email & Password Creation:**
    *   The first step after `register new` or `register continue` (if email not already stored) is collecting the user's email address.
    *   Immediately after a valid email is provided, the system prompts for "Password:" (masked) and "Confirm Password:" (masked).
    *   Basic validation (passwords match, minimum length TBD) is performed client-side.
    *   On successful password creation, the backend `signUpUser` action is called *immediately* to create the user account. This allows the user to sign in later and resume if they exit. If the user already exists, this step confirms their identity before proceeding.
    *   The email and an indication of successful user creation/verification are stored locally.
    *   *TDD Anchor:* Test email prompt and validation.
    *   *TDD Anchor:* Test password prompts appear after email.
    *   *TDD Anchor:* Test password inputs are masked.
    *   *TDD Anchor:* Test password confirmation validation.
    *   *TDD Anchor:* Test backend `signUpUser` action is called on success.
    *   *TDD Anchor:* Test local storage indicates user verification.
4.  **Answering Remaining Questions:**
    *   After email/password/user creation, the system proceeds to the remaining registration questions sequentially, starting from the first unanswered question (index 0 for `new`, loaded index for `continue`).
    *   The system displays the current question label and prompt (`[registration]>`). Questions are sourced from the generated `registrationQuestions.ts` (see SSOT Strategy, Section 6.1), excluding email/password fields.
    *   User types their answer and presses Enter.
    *   Input is validated based on the question's definition (required field, basic type checks - more comprehensive validation happens server-side via generated Zod schema). Display error message if basic validation fails.
    *   On valid input, the answer is saved to local storage (keyed by question ID, using `useLocalStorage` or similar).
    *   The system displays the next question based on index and dependency logic (`dependsOn`, `dependsValue` from question definition).
    *   Progress indicator updates ("Question X/Y").
    *   *TDD Anchor:* Test question display matches definition from generated file.
    *   *TDD Anchor:* Test basic client-side validation (required).
    *   *TDD Anchor:* Test valid answer saves to local storage.
    *   *TDD Anchor:* Test navigation to next question respects dependency logic.
    *   *TDD Anchor:* Test progress indicator updates correctly.
5.  **Navigation Commands:**
    *   `next`: Moves to the next question (if current answer is valid). Skips if already at the last question.
    *   `prev`: Moves to the previous question.
    *   `save`: Explicitly saves current progress to local storage. Displays confirmation message.
    *   `exit`: Saves progress and returns to Main Terminal Mode.
    *   *TDD Anchor:* Test `next` command functions correctly.
    *   *TDD Anchor:* Test `prev` command functions correctly.
    *   *TDD Anchor:* Test `save` command saves and confirms.
    *   *TDD Anchor:* Test `exit` command saves and returns to Main Mode.
6.  **Completion:**
    *   After the last question is answered, the system displays a summary message: "Registration questions complete."
    *   Available commands change to `submit`, `review`, `edit [number]`, `back`.
    *   *TDD Anchor:* Test completion message is shown.
    *   *TDD Anchor:* Test available commands change upon completion.

### 3.3 Post-Registration / Authenticated State

1.  **Access:** User must be signed in (see Section 3.4).
2.  **Commands (Main Mode):**
    *   `view`: Displays the completed registration data (read-only). Fetches from server.
    *   `edit`: Enters Registration Mode to allow modification of answers (see Section 4.1.3). Fetches from server.
    *   `delete`: Initiates the registration deletion process (see Section 4.1.4).
    *   `sign-out`: Logs the user out.
    *   `help`, `about`
    *   *TDD Anchor:* Test these commands are only available when signed in.
3.  **Status Line:** Updates to reflect signed-in status and completed registration (e.g., "Signed in as user@example.com. Registration complete.").

### 3.4 Authentication Flow (Site-Wide)

This password-based flow replaces the previous Magic Link/OTP system for all users (Registrants and Admins).

1.  **Sign-In:**
    *   User enters `sign-in` in Main Mode.
    *   System switches to Authentication Mode (`[auth]>`).
    *   Prompts for Email.
    *   Prompts for Password (masked input).
    *   System calls backend authentication endpoint for password verification (see Section 6.2.3).
    *   Alternatively, the user can type `magiclink` to request a one-click sign-in link via email (triggers Supabase Auth OTP flow).
    *   On success (Password or Magic Link): Store session token securely (HttpOnly cookie managed by Supabase SSR helpers), switch to Main Mode (authenticated state), update status line.
    *   On failure: Display error message ("Invalid credentials" or "Magic link request failed"), remain in Auth Mode.
    *   *TDD Anchor:* Test successful password sign-in flow.
    *   *TDD Anchor:* Test successful magic link request flow.
    *   *TDD Anchor:* Test failed sign-in flow (error message, stays in Auth Mode).
    *   *TDD Anchor:* Test password input is masked.
2.  **Sign-Up:** (Integrated into Initial Registration Steps)
    *   Occurs immediately after email and password collection during the `register new` flow (see Section 3.2.3).
    *   The backend action (`signUpUser`) attempts user creation using the provided email and password. If the user already exists, it verifies credentials before allowing registration to proceed.
3.  **Password Reset:**
    *   Requires a dedicated command (e.g., `reset-password`) available in Auth Mode or Main Mode (anonymous).
    *   Calls a backend endpoint to trigger password reset email (using Supabase Auth functionality).
    *   User follows link in email to a separate web page (outside terminal UI) to set a new password.
    *   *TDD Anchor:* Test `reset-password` command triggers backend call.
4.  **Sign-Out:**
    *   User enters `sign-out` in Main Mode (when signed in).
    *   System calls backend sign-out endpoint (using Supabase Auth functionality).
    *   Clears session token (HttpOnly cookie).
    *   Returns to default Main Mode state (anonymous).
    *   *TDD Anchor:* Test `sign-out` clears session and returns to anonymous state.

## 4. Required Functionality

### 4.1 Registration Management

1.  **New Registration:**
    *   Command: `register new`
    *   Behavior: Clears local storage, starts questions from index 0. Requires confirmation if local data exists.
2.  **Continue Registration:**
    *   Command: `register continue`
    *   Behavior: Loads state from local storage, resumes from last unanswered question. Error if no local data.
3.  **Review Answers:**
    *   Command: `review` (Registration Mode, after completion or via `edit`)
    *   Behavior: Displays a numbered list of all questions and their currently saved answers (local or fetched from server if editing).
    *   *TDD Anchor:* Test `review` displays correct list based on current data.
4.  **Edit Existing Registration:**
    *   Command: `edit` (Main Mode, signed-in)
    *   Behavior: Fetches completed registration data from the server. Enters Registration Mode. User can use `review` to see answers, then `edit [number]` (referring to the number in the `review` list) to jump to a specific question and provide a new answer. Saving (`save` command or similar) updates the server record via a dedicated backend action/endpoint (`updateRegistration`). Requires confirmation before saving changes.
    *   *TDD Anchor:* Test `edit` command fetches server data.
    *   *TDD Anchor:* Test `review` command works in edit mode.
    *   *TDD Anchor:* Test `edit [number]` command allows changing a specific answer.
    *   *TDD Anchor:* Test saving changes calls `updateRegistration` endpoint.
5.  **Delete Registration:**
    *   Command: `delete` (Main Mode, signed-in)
    *   Behavior: Requires multiple confirmations ("Are you sure? This cannot be undone.", "Type 'DELETE' to confirm."). Calls a backend endpoint (`deleteRegistration`) to delete user registration data. (Account deletion is separate).
    *   *TDD Anchor:* Test `delete` requires multiple confirmations.
    *   *TDD Anchor:* Test `delete` calls delete endpoint on final confirmation.
6.  **Final Submission:**
    *   Command: `submit` (Registration Mode, after completion)
    *   Behavior: Sends all locally stored registration data to the backend server action (`submitRegistration`). Assumes user account was already created/verified during initial email/password step. Links registration data to the user account. Replaces existing `createRegistration` logic in `actions.ts`.
    *   *TDD Anchor:* Test `submit` sends all registration data to the backend.
    *   *TDD Anchor:* Test backend action handles data saving and linking to existing user.

### 4.2 Authentication System (Password-Based, Site-Wide)

This replaces the current Supabase Magic Link/OTP flow **site-wide**, including for Admin authentication (Admin UI/login flow will need separate updates).

1.  **User Account Structure:**
    *   Primary identifier: Email address.
    *   Authentication: Hashed Password + Salt (stored securely, managed by Supabase Auth).
    *   Requires updates to DB schema if custom fields beyond Supabase defaults are needed.
2.  **Sign-In Process:**
    *   Command: `sign-in` (Main Mode).
    *   Mechanism: Email/password check against backend endpoint (leveraging Supabase Auth). Also supports Magic Link request via `magiclink` command.
    *   Session Management: Secure session token (HttpOnly cookie managed via Supabase SSR helpers). Session timeout TBD.
3.  **Sign-Up Process:**
    *   Mechanism: Occurs early in the registration flow after email/password collection (see 3.2.3). Backend action (`signUpUser`) uses Supabase Auth to create the user.
4.  **Account Management:**
    *   Password Reset: Via `reset-password` command triggering Supabase Auth email flow (web page for reset).
    *   Sign-Out: Via `sign-out` command clearing session (using Supabase Auth).

## 5. User Interface Requirements

### 5.1 Visual Design

1.  **Terminal Styling:**
    *   Consistent monospace font (e.g., `font-mono`).
    *   Color-coded responses: Green for success/confirmation, Red for errors, Yellow for warnings, White/Gray for standard text/prompts.
    *   Command highlighting (user input).
    *   CRT effect (scanlines, slight curvature/glow - optional).
2.  **Status Indicators:**
    *   Current mode visible (prompt/status line).
    *   Session status visible (e.g., prompt `[user@philosothon]$` vs `[guest@philosothon]$` or status line message).
    *   Last action result briefly indicated (e.g., "Saved.", "Error: Invalid input.").

### 5.2 Help System

1.  **Contextual Help:**
    *   `help` command provides general help and lists available commands for the current mode and auth state.
    *   `help [command]` provides specific usage details for a command.
2.  **Error Handling:**
    *   Clear, user-friendly error messages for invalid commands or inputs.
    *   Suggestions for resolving issues where possible (e.g., "Unknown command. Type 'help'.").

## 6. Technical Implementation Notes

### 6.1 Question Synchronization (SSOT Strategy)

*   **Central Definition:** A single file (e.g., `config/registrationSchema.ts`) will define all registration questions, including `id`, `label`, `type` (abstract type like 'text', 'number', 'boolean', 'single-select', 'multi-select', 'ranking'), `required` status, `options` (for select types), `validation` rules (representable in a way that can generate Zod), `dependsOn`/`dependsValue` logic, and hints for DB schema (`dbType: 'TEXT' | 'INTEGER' | 'BOOLEAN' | 'TEXT[]' | 'JSONB'`).
*   **Code Generation Script:** A script (`scripts/generate-registration.ts`, runnable via `npm run generate:reg`) will:
    *   Read the central definition file.
    *   Generate `platform/src/app/register/data/registrationQuestions.ts`: Translates the central definition into the `Question[]` array format needed by the frontend UI, including basic validation functions if specified. Also generates the `FormDataStore` type.
    *   Generate Zod Schema: Updates/overwrites the `RegistrationSchema` within `platform/src/app/register/actions.ts` (or a dedicated schema file), translating validation rules from the central definition.
    *   Generate Draft SQL Migration: Creates a new file in `supabase/migrations/` containing draft `ALTER TABLE registrations ADD COLUMN ...` or `CREATE TYPE ...` statements based on the central definition's `id` and `dbType`. **This migration MUST be reviewed and potentially modified by a developer before being applied.**
*   **Workflow:** Developers modify the central definition file, run the generation script, review the generated files (especially the SQL draft), and commit all changes.
*   *TDD Anchor:* Test the generation script produces correct output for `registrationQuestions.ts` based on sample central definitions.
*   *TDD Anchor:* Test the generation script produces correct Zod schema based on sample central definitions.
*   *TDD Anchor:* Test the generation script produces plausible draft SQL based on sample central definitions.

### 6.2 Data Storage & Backend

1.  **Local Storage:**
    *   Use `useLocalStorage` hook (or similar) to store in-progress registration data (`formData`, `currentQuestionIndex`, potentially `history`).
    *   Key: `philosothon-registration-v2`.
    *   **Encryption:** Basic Obfuscation required for P0 (e.g., simple Base64 or XOR). Data stored locally should be considered potentially sensitive. Avoid storing plain text passwords locally after user creation step.
2.  **Server Storage (Supabase):**
    *   `auth.users`: Stores user email, hashed password (managed by Supabase Auth).
    *   `profiles`: Stores user role, linked to `auth.users`.
    *   `registrations`: Stores submitted registration data, linked to `auth.users`. Schema needs updates based on SSOT definition.
3.  **Backend API / Server Actions:**
    *   **Authentication (Leveraging Supabase Auth):**
        *   Server Action `signInWithPassword`: Handles email/password verification, session creation.
        *   Server Action `signUpUser`: Handles user creation with password (called early in registration).
        *   Server Action `signOut`: Invalidates session.
        *   Server Action `requestPasswordReset`: Initiates password reset email flow.
    *   **Registration:**
        *   Server Action `submitRegistration` (replaces `createRegistration`): Handles validation (using generated Zod schema), links registration data to the existing user (created via `signUpUser`), saves registration data to `registrations` table.
        *   Server Action `updateRegistration`: Handles fetching existing data and saving edited data (requires user ID).
        *   Server Action `deleteRegistration`: Handles deleting registration data (requires user ID).
    *   **Data Fetching:** Server Components or Route Handlers to fetch registration data for `view` or `edit` modes.

### 6.3 Integration Requirements

1.  **Database Schema Updates:**
    *   `auth.users`: Ensure Supabase Auth is configured for email/password.
    *   `profiles`: Add `role` column if not present. Ensure trigger links `auth.users` on signup.
    *   `registrations`: Add/modify columns based on V2 questions (informed by SSOT definition). Apply generated (and reviewed) migrations.
2.  **Frontend Component:**
    *   The existing `RegistrationForm.tsx` will require a complete rewrite or heavy refactoring to support the new modes, command processing, state management, password handling, and edit flow.
    *   Integrate generated `registrationQuestions.ts`.
    *   Implement new UI elements for modes, hints, prompts, status, review list.
3.  **Server Actions (`actions.ts` / new files):**
    *   Implement `signInWithPassword`, `signOut`, `requestPasswordReset` actions leveraging Supabase Auth.
    *   Implement `signUpUser` action (called early).
    *   Replace `createRegistration` with `submitRegistration` incorporating user linking logic and using the generated Zod schema.
    *   Implement `updateRegistration` and `deleteRegistration` actions.
4.  **Admin Authentication:** The existing Admin login flow (`platform/src/app/admin/login/page.tsx`, etc.) needs to be updated separately to use the new password-based `signInWithPassword` action instead of OTP.

## 7. Development Priorities (Rough)

1.  **Phase 1: Core Terminal & SSOT Setup**
    *   Implement central definition file structure (`config/registrationSchema.ts`).
    *   Develop code generation script (`scripts/generate-registration.ts`).
    *   Implement basic terminal UI shell with mode switching, command parsing, hints, prompts.
    *   Implement `help`, `about`, `back`, `exit` commands.
2.  **Phase 2: Password Authentication (Site-Wide)**
    *   Configure Supabase Auth for email/password.
    *   Implement backend actions for sign-in, sign-out, password reset request.
    *   Implement Auth Mode UI and sign-in flow in the terminal.
    *   Implement session management (Supabase SSR helpers).
    *   *Update Admin login flow (separate task/branch recommended).*
3.  **Phase 3: Registration Flow & Data Handling**
    *   Integrate generated questions into Registration Mode UI.
    *   Implement `register new`, `register continue` logic using local storage.
    *   Implement early email/password collection and `signUpUser` call.
    *   Implement remaining question answering, validation, local saving, `next`/`prev`/`save`.
    *   Implement `submitRegistration` server action (linking data).
    *   Implement `view`, `review`, `edit`, `delete` commands and corresponding backend actions/data fetching (post-auth).

---
*End of Specification*