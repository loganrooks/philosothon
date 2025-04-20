# Specification: P0 Terminal Registration UI Redesign (V3)

**Version:** 2.0 (Draft)
**Date:** 2025-04-20
**Status:** Draft

## 1. Purpose & Overview

This document outlines the functional requirements, user flows, technical specifications, and integration points for the redesigned Philosothon Terminal Registration System (V3). The system aims to provide an immersive, retro-computing terminal experience for event registration, replacing the previous basic terminal UI (`RegistrationForm.tsx`, commit `98e7303`).

This version (V3) integrates the structure and questions from the revised questionnaire outline (`docs/event_info/registration_outline.md`) and incorporates additional UX/feature requirements provided by the user, while retaining the core technical decisions from V2 (SSOT strategy, password-based authentication).

This specification incorporates the analysis and recommendations from `docs/specs/registration_sync_strategy.md` and considers the existing implementation files (`RegistrationForm.tsx`, `registrationQuestions.ts`, `useLocalStorage.ts`, `actions.ts`).

## 2. Terminal Modes & Navigation

The system operates in distinct modes, each offering specific commands and visual cues.

### 2.1 Terminal Modes

1.  **Main Terminal Mode** (Default)
    *   **Entry:** Initial state after boot sequence. Return via `back` or `exit` from other modes (where applicable).
    *   **Prompt:** `[user@philosothon]$` (if authenticated) or `[guest@philosothon]$` (if anonymous). Input area clearly delineated.
    *   **Purpose:** Provides access to top-level commands and displays status information.
    *   **Visuals:** Standard terminal appearance (black background, green text). Clear command hints visible. Status line present.
    *   **Commands (Anonymous):** `register`, `sign-in`, `help`, `about`.
    *   **Commands (Authenticated):** `register` (may behave differently, e.g., go directly to `view`/`edit`), `view`, `edit`, `delete`, `sign-out`, `help`, `about`. Conditional availability based on registration status (e.g., `view`/`edit`/`delete` require completed registration).

2.  **Registration Mode**
    *   **Entry:** Via `register new` or `register continue` commands from Main Mode, or `edit` command (post-auth).
    *   **Prompt:** `[registration]>`. Input area clearly delineated for answers.
    *   **Purpose:** Guides the user through sequential registration questions or allows editing specific answers. Questions sourced via the SSOT strategy (see Section 6.1).
    *   **Visuals:** Header indicating "Registration Mode". Progress indicator (e.g., "Question X/31") during initial registration. Mode-specific command hints. Question text clearly displayed above the prompt. Hints/examples displayed below the question text.
    *   **Commands (Answering):** `next`, `prev`, `save`, `exit`, `back`, `help`.
    *   **Commands (Completion):** `submit`, `review`, `edit [number]`, `back`, `help`.

3.  **Authentication Mode**
    *   **Entry:** Via `sign-in` command from Main Mode.
    *   **Prompt:** `[auth]>`. Input area clearly delineated.
    *   **Purpose:** Handles user sign-in using email and password, or requests a magic link. Allows password reset request.
    *   **Visuals:** Header indicating "Authentication Mode". Password input fields must mask characters (`*`). Secure handling of credentials is paramount.
    *   **Commands:** `magiclink`, `reset-password`, `exit`, `help`. (Email/Password are entered directly at prompts).

### 2.2 Command Visibility & Discovery

1.  **Command Hints:**
    *   A clearly visible list/menu of available commands shall be displayed in each mode, adapted for authenticated vs. anonymous states and conditional availability (e.g., `continue` only shown if local data exists).
    *   Brief help text explaining each command's purpose shall be available via `help [command]`.
    *   The current mode shall always be clearly indicated (e.g., via prompt, status line).
    *   *TDD Anchor:* Test command hints update correctly when switching modes and auth states.
    *   *TDD Anchor:* Test conditional command visibility (e.g., `continue`, `view`, `edit`, `delete`).
    *   *TDD Anchor:* Test `help` command displays general help relevant to the mode/auth state.
    *   *TDD Anchor:* Test `help [command]` displays specific command help.

2.  **Command Prompt Styling:**
    *   Prompts shall differ per mode as specified in 2.1.
    *   Input area styling should clearly differentiate between entering commands (Main/Auth modes) and entering answers (Registration mode).
    *   *TDD Anchor:* Test prompt string matches the current mode and auth state.

## 3. User Flows

### 3.1 Initial Experience (Main Terminal Mode)

1.  **Boot Sequence:** A brief, skippable boot sequence animation plays.
2.  **Session Check:** System checks for an existing valid session token.
3.  **Main Menu (Anonymous):** If no valid session, prompt `[guest@philosothon]$` appears with commands: `register`, `sign-in`, `help`, `about`.
4.  **Main Menu (Authenticated):** If valid session exists, prompt `[user@philosothon]$` appears with commands based on registration status: `register`, `view`, `edit`, `delete`, `sign-out`, `help`, `about`.
5.  **Status Line:** A status line indicates relevant state:
    *   Anonymous + Local Data: "Registration in progress found. Use 'register continue' to resume."
    *   Authenticated: "Signed in as [user_email]. Registration [status: complete/incomplete/not started]." (Status fetched from server).
    *   *TDD Anchor:* Test status line displays correct message based on local storage state (pre-auth).
    *   *TDD Anchor:* Test status line displays correct message based on server data/session (post-auth).

### 3.2 Registration Process (Registration Mode - New/Continue)

1.  **Entry:** User enters `register` in Main Mode.
2.  **Sub-Menu:** System presents registration sub-commands: `new`, `continue` (if local data exists), `back`.
    *   `new`: Displays the introductory message: *"Welcome to the Philosothon registration form! This questionnaire will help us understand your interests, background, and preferences to create balanced teams and select themes that resonate with participants. The event will take place on **April 26-27, 2025**. Completing this form should take approximately 10-15 minutes. Please submit your responses by **Thursday, April 24th at midnight**."* If local data exists, display warning: "Existing registration data found. Starting new will overwrite it. Proceed? (yes/no)". Requires confirmation (`yes`). Clears relevant local storage. Enters Registration Mode at Step 3 (Email/Password).
    *   `continue`: Loads state from local storage. Visually displays previously answered questions and answers leading up to the resume point. Resumes registration from the last unanswered question index. If no local data exists, display error: "No registration in progress found. Use 'register new'." Enters Registration Mode at the saved index.
    *   `back`: Returns to Main Terminal Mode.
    *   *TDD Anchor:* Test `register` command shows sub-menu (anonymous).
    *   *TDD Anchor:* Test `register new` displays intro message.
    *   *TDD Anchor:* Test `register new` prompts confirmation if local data exists.
    *   *TDD Anchor:* Test `register new` clears local data and proceeds to email/password on confirmation.
    *   *TDD Anchor:* Test `continue` command is only shown if local data exists.
    *   *TDD Anchor:* Test `register continue` resumes from correct index and loads previous answers visually if local data exists.
    *   *TDD Anchor:* Test `register continue` shows error if no local data exists.
    *   *TDD Anchor:* Test `back` command returns to Main Mode.
3.  **Email & Password Creation (Early Auth Flow):**
    *   The first step after `register new` (or `register continue` if email not stored) is collecting **Full Name** (Outline Q1).
    *   Next, collect **University Email Address** (Outline Q2). Basic client-side format validation.
    *   Immediately after a valid email is provided, prompt for "Password:" (masked) and "Confirm Password:" (masked).
    *   Client-side validation: Passwords match, minimum length 8 characters.
    *   On successful password creation, the backend `signUpUser` action is called *immediately* to create the user account. If the user already exists (based on email), this action should verify the provided password.
    *   The email and an indication of successful user creation/verification are stored locally. Name is also stored locally.
    *   If `signUpUser` fails, display error and remain at password step.
    *   *TDD Anchor:* Test Name prompt appears first.
    *   *TDD Anchor:* Test Email prompt appears after Name.
    *   *TDD Anchor:* Test email validation.
    *   *TDD Anchor:* Test password prompts appear after email.
    *   *TDD Anchor:* Test password inputs are masked.
    *   *TDD Anchor:* Test password confirmation and length validation.
    *   *TDD Anchor:* Test backend `signUpUser` action is called on success.
    *   *TDD Anchor:* Test handling of `signUpUser` failure.
    *   *TDD Anchor:* Test local storage indicates user verification and stores name/email.
4.  **Answering Remaining Questions:**
    *   After email/password/user creation, the system proceeds to the remaining registration questions sequentially (Outline Q3-Q31), starting from the first unanswered question.
    *   The system displays the current question label and prompt (`[registration]>`). Question text, type, options, and hints are sourced from the generated `registrationQuestions.ts` (see SSOT Strategy, Section 6.1).
    *   User types their answer and presses Enter. Input area styling clearly indicates it's for an answer.
    *   **Input Handling:**
        *   **Text/Paragraph/Number/Scale:** Standard text input.
        *   **Multiple Choice/Boolean:** Display options with numbers. User enters the corresponding number.
        *   **Checkboxes (multi-select-numbered):** Display options with numbers. User enters space-separated numbers (e.g., `1 3 5`). Hint: "Enter numbers separated by spaces."
        *   **Ranking (ranking-numbered):** Display options with numbers. User enters comma-separated numbers for their top ranks (e.g., `3,1,4`). Hint: "Enter comma-separated numbers for your top ranks (e.g., `3,1,4`). Rank at least 3."
        *   **Other fields:** If a question has an 'Other' option and it's selected (via number), prompt for text input for the 'Other' value.
    *   **Validation:** Input is validated client-side based on the question's definition (`required`, type checks like number for scale, valid numbers for selections/ranking, minimum 3 ranks for ranking). Display error message in orange (`#FFA500`) if basic validation fails. Server-side Zod schema provides comprehensive validation.
    *   On valid input, the answer is saved to local storage (keyed by question ID, using basic obfuscation).
    *   The system displays the next question based on index and dependency logic (`dependsOn`, `dependsValue`).
    *   Progress indicator updates ("Question X/31").
    *   *TDD Anchor:* Test question display matches definition (label, text, options, hint).
    *   *TDD Anchor:* Test input handling for each type (text, number, scale, single-select, multi-select-numbered, ranking-numbered).
    *   *TDD Anchor:* Test 'Other' field prompting.
    *   *TDD Anchor:* Test client-side validation (required, number, scale range, multi-select numbers, ranking numbers/min 3 ranks/uniqueness).
    *   *TDD Anchor:* Test valid answer saves to local storage (obfuscated).
    *   *TDD Anchor:* Test navigation to next question respects dependency logic.
    *   *TDD Anchor:* Test progress indicator updates correctly.
5.  **Navigation Commands (During Answering):**
    *   `next`: Moves to the next question (if current answer is valid or not required). Skips if already at the last question.
    *   `prev`: Moves to the previous question.
    *   `save`: Explicitly saves current progress to local storage. Displays confirmation message.
    *   `exit`: Saves progress and returns to Main Terminal Mode.
    *   `back`: Removes the last saved answer from local storage and moves focus back to re-ask the *previous* question. If at the first question, display message "Cannot go back further."
    *   `help`: Displays available commands.
    *   *TDD Anchor:* Test `next` command functions correctly.
    *   *TDD Anchor:* Test `prev` command functions correctly.
    *   *TDD Anchor:* Test `save` command saves and confirms.
    *   *TDD Anchor:* Test `exit` command saves and returns to Main Mode.
    *   *TDD Anchor:* Test `back` command removes last answer and goes to previous question.
    *   *TDD Anchor:* Test `back` command at first question.
6.  **Completion:**
    *   After the last question (Q31 - Confirmation Checkbox) is answered, the system displays a summary message: "Registration questions complete."
    *   Available commands change to `submit`, `review`, `edit [number]`, `back`.
    *   *TDD Anchor:* Test completion message is shown.
    *   *TDD Anchor:* Test available commands change upon completion.

### 3.3 Post-Registration / Authenticated State

1.  **Access:** User must be signed in.
2.  **Commands (Main Mode):**
    *   `view`: (Requires completed registration) Displays the completed registration data (read-only). Fetches from server.
    *   `edit`: (Requires completed registration) Enters Registration Mode to allow modification of answers (see Section 4.1.4). Fetches from server.
    *   `delete`: (Requires completed registration) Initiates the registration deletion process (see Section 4.1.5).
    *   `sign-out`: Logs the user out.
    *   `help`, `about`
    *   *TDD Anchor:* Test these commands are only available when signed in and registration is complete (as applicable).
3.  **Status Line:** Updates to reflect signed-in status and completed registration (e.g., "Signed in as user@example.com. Registration complete.").

### 3.4 Authentication Flow (Site-Wide)

This password-based flow replaces the previous Magic Link/OTP system for all users.

1.  **Sign-In:**
    *   User enters `sign-in` in Main Mode.
    *   System switches to Authentication Mode (`[auth]>`).
    *   Prompts for Email.
    *   Prompts for Password (masked input).
    *   System calls backend `signInWithPassword` action.
    *   Alternatively, user can type `magiclink` to request a one-click sign-in link via email (triggers Supabase Auth OTP flow).
    *   On success: Store session token securely (HttpOnly cookie), switch to Main Mode (authenticated state), update status line.
    *   On failure: Display error message ("Invalid credentials" or "Magic link request failed") in orange, remain in Auth Mode.
    *   *TDD Anchor:* Test successful password sign-in flow.
    *   *TDD Anchor:* Test successful magic link request flow.
    *   *TDD Anchor:* Test failed sign-in flow (error message, stays in Auth Mode).
    *   *TDD Anchor:* Test password input is masked.
2.  **Sign-Up:** (Integrated into Initial Registration Steps, see Section 3.2.3).
3.  **Password Reset:**
    *   Command: `reset-password` (Available in Auth Mode or Main Mode anonymous).
    *   Prompts for Email.
    *   Calls backend `requestPasswordReset` action to trigger Supabase Auth email flow.
    *   User follows link in email to a separate web page (outside terminal UI) to set a new password.
    *   *TDD Anchor:* Test `reset-password` command prompts for email and triggers backend call.
4.  **Sign-Out:**
    *   Command: `sign-out` (Main Mode, signed-in).
    *   Calls backend `signOut` action.
    *   Clears session token (HttpOnly cookie).
    *   Returns to default Main Mode state (anonymous).
    *   *TDD Anchor:* Test `sign-out` clears session and returns to anonymous state.

## 4. Required Functionality

### 4.1 Registration Management

1.  **New Registration:**
    *   Command: `register new`
    *   Behavior: Displays intro message. Clears local storage (with confirmation if data exists). Starts flow from Name/Email/Password (Section 3.2.3).
2.  **Continue Registration:**
    *   Command: `register continue`
    *   Behavior: Loads state from local storage, displays previous answers visually, resumes from last unanswered question. Error if no local data.
3.  **Review Answers:**
    *   Command: `review` (Registration Mode, after completion or via `edit`)
    *   Behavior: Displays a numbered list of all questions (Q1-Q31) and their currently saved answers (local or fetched from server if editing).
    *   *TDD Anchor:* Test `review` displays correct list based on current data.
4.  **Edit Existing Registration:**
    *   Command: `edit` (Main Mode, signed-in, registration complete)
    *   Behavior: Fetches completed registration data from the server. Enters Registration Mode. User can use `review` to see answers, then `edit [number]` (referring to the number in the `review` list, 1-31) to jump to a specific question and provide a new answer. Saving (`save` command) updates the server record via `updateRegistration` action. Requires confirmation before saving changes. `back` command works within edit flow. `exit` returns to Main Mode without saving unsaved changes (prompts confirmation).
    *   *TDD Anchor:* Test `edit` command fetches server data.
    *   *TDD Anchor:* Test `review` command works in edit mode.
    *   *TDD Anchor:* Test `edit [number]` command allows changing a specific answer.
    *   *TDD Anchor:* Test saving changes calls `updateRegistration` action.
    *   *TDD Anchor:* Test `back` command works during edit.
    *   *TDD Anchor:* Test `exit` command prompts confirmation for unsaved changes.
5.  **Delete Registration:**
    *   Command: `delete` (Main Mode, signed-in, registration complete)
    *   Behavior: Requires multiple confirmations ("Are you sure? This cannot be undone.", "Type 'DELETE' to confirm."). Calls backend `deleteRegistration` action.
    *   *TDD Anchor:* Test `delete` requires multiple confirmations.
    *   *TDD Anchor:* Test `delete` calls delete action on final confirmation.
6.  **Final Submission:**
    *   Command: `submit` (Registration Mode, after completion)
    *   Behavior: Sends all locally stored registration data (Q1-Q31) to the backend `submitRegistration` action. Links registration data to the user account created earlier.
    *   *TDD Anchor:* Test `submit` sends all registration data to the backend.
    *   *TDD Anchor:* Test backend action handles data saving and linking to existing user.

### 4.2 Authentication System (Password-Based, Site-Wide)

1.  **User Account Structure:** Email + Hashed Password (managed by Supabase Auth). Min 8 characters password length.
2.  **Sign-In Process:** Via `sign-in` command (email/password) or `magiclink` command. Uses Supabase Auth. Session via HttpOnly cookie.
3.  **Sign-Up Process:** Occurs early in registration via `signUpUser` action.
4.  **Account Management:** Password Reset via `reset-password` command (triggers Supabase email flow). Sign-Out via `sign-out` command.

## 5. User Interface Requirements

### 5.1 Visual Design

1.  **Terminal Styling:**
    *   Consistent monospace font (e.g., `font-mono`).
    *   Background: Black (`#000000`).
    *   Standard Text/Prompts: Hacker Green (`#39FF14`).
    *   Errors/Warnings/Highlights: Complementary Orange (`#FFA500`).
    *   User Input: Clearly highlighted (e.g., different shade of green or distinct background).
    *   Command vs. Answer Input: Differentiate via prompt style and potentially input area styling/border.
    *   CRT effect (optional).
2.  **Status Indicators:**
    *   Current mode visible (prompt/status line).
    *   Session status visible.
    *   Last action result briefly indicated (e.g., "Saved.", "Error: Invalid input.").

### 5.2 Help System

1.  **Contextual Help:**
    *   `help` command provides general help and lists available commands for the current mode/state.
    *   `help [command]` provides specific usage details.
2.  **Error Handling:**
    *   Clear, user-friendly error messages (in orange).
    *   Suggestions for resolving issues where possible.

## 6. Technical Implementation Notes

### 6.1 Question Synchronization (SSOT Strategy)

*   **Central Definition:** `config/registrationSchema.ts` defines all 31 questions from the outline. Structure per question:
    ```typescript
    {
      id: string; // e.g., 'fullName', 'philosophyCourses'
      section: string; // e.g., 'Personal Information', 'Philosophy Background'
      order: number; // Order within the section
      label: string; // Question text
      type: 'text' | 'email' | 'password' | 'confirmPassword' | 'number' | 'scale' | 'boolean' | 'single-select' | 'multi-select-numbered' | 'ranking-numbered' | 'paragraph';
      required: boolean;
      options?: string[]; // For select, multi-select, ranking
      hint?: string; // Optional hint/example text
      validation?: { // For generating Zod schema and basic client checks
        minLength?: number;
        maxLength?: number;
        min?: number; // For scale/number
        max?: number; // For scale/number
        minSelections?: number; // For multi-select/ranking
        // Add other relevant validation hints
      };
      dependsOn?: string; // ID of question this depends on
      dependsValue?: any; // Value the dependent question must have
      dbType: 'TEXT' | 'INTEGER' | 'BOOLEAN' | 'TEXT[]' | 'JSONB'; // Hint for SQL generation
      // Add 'otherField': true if this question has an 'Other: ___' option needing text input
    }
    ```
*   **Code Generation Script:** `scripts/generate-registration.ts` (run via `npm run generate:reg`) generates:
    *   `platform/src/app/register/data/registrationQuestions.ts`: Frontend `Question[]` array and `FormDataStore` type. Includes basic client validation functions derived from `validation` hints.
    *   Zod Schema: Updates `RegistrationSchema` in `platform/src/app/register/actions.ts` based on `validation` hints. Handles array types for multi-select/ranking.
    *   Draft SQL Migration: Creates draft `ALTER TABLE registrations ADD COLUMN ...` in `supabase/migrations/`. **Requires developer review.**
*   **Workflow:** Modify central definition -> run script -> review generated files (esp. SQL) -> commit changes.
*   *TDD Anchor:* Test generation script produces correct `registrationQuestions.ts` output.
*   *TDD Anchor:* Test generation script produces correct Zod schema (including array handling, min ranks).
*   *TDD Anchor:* Test generation script produces plausible draft SQL.

### 6.2 Data Storage & Backend

1.  **Local Storage:**
    *   Key: `philosothon-registration-v3`.
    *   Stores: `formData` (object keyed by question ID), `currentQuestionIndex`, `history` (optional, for `back` command state).
    *   **Obfuscation:** Basic Base64 obfuscation applied before saving, reversed on load.
2.  **Server Storage (Supabase):**
    *   `auth.users`: Email, hashed password.
    *   `profiles`: User role, linked to `auth.users`.
    *   `registrations`: Stores submitted registration data (Q1-Q31), linked to `auth.users`. Schema updated via reviewed SSOT-generated migrations. Use appropriate types (TEXT, INTEGER, TEXT[], JSONB for ranking).
3.  **Backend API / Server Actions:**
    *   **Authentication:**
        *   `signInWithPassword` (Server Action): Email/password check, session creation.
        *   `signUpUser` (Server Action): User creation/verification with password.
        *   `signOut` (Server Action): Invalidates session.
        *   `requestPasswordReset` (Server Action): Triggers Supabase reset email.
    *   **Registration:**
        *   `submitRegistration` (Server Action): Validates (Zod), links data to user, saves to `registrations`.
        *   `updateRegistration` (Server Action): Fetches existing, validates, saves edited data.
        *   `deleteRegistration` (Server Action): Deletes registration data.
    *   **Data Fetching:** Server Components/Route Handlers for `view`/`edit`.

### 6.3 Integration Requirements

1.  **Database Schema Updates:** Configure Supabase Auth (email/password). Update `profiles` (role). Update `registrations` based on SSOT/migrations.
2.  **Frontend Component:** Rewrite/refactor `RegistrationForm.tsx` for V3 modes, commands, state, input handling (multi-select, ranking), early auth, `back` command, hints, validation, context loading. Integrate generated `registrationQuestions.ts`.
3.  **Server Actions:** Implement/update actions (`signInWithPassword`, `signUpUser`, `signOut`, `requestPasswordReset`, `submitRegistration`, `updateRegistration`, `deleteRegistration`) using Supabase Auth/DB and generated Zod schema.
4.  **Admin Authentication:** Update Admin login flow separately to use `signInWithPassword`.

## 7. Development Priorities (Rough)

1.  **Phase 1: Core Terminal & SSOT Setup**
    *   Implement central definition file (`config/registrationSchema.ts`) with all 31 questions.
    *   Develop/update code generation script (`scripts/generate-registration.ts`). Run script, review SQL.
    *   Implement basic terminal UI shell (modes, command parsing, hints, prompts, colors).
    *   Implement `help`, `about`, `back` (basic), `exit` commands.
2.  **Phase 2: Password Authentication & Early Auth Flow**
    *   Configure Supabase Auth. Implement auth Server Actions (`signInWithPassword`, `signUpUser`, `signOut`, `requestPasswordReset`).
    *   Implement Auth Mode UI.
    *   Integrate early auth flow (Name, Email, Password, `signUpUser` call) into `register new`.
    *   Implement session management.
3.  **Phase 3: Registration Flow & Data Handling**
    *   Integrate generated questions into Registration Mode UI. Implement input handling (text, select, multi-select, ranking), hints, validation.
    *   Implement `register continue` logic (local storage load, visual context).
    *   Refine `back` command logic.
    *   Implement `submitRegistration` server action.
    *   Implement `view`, `review`, `edit`, `delete` commands and backend actions (post-auth).
    *   Implement conditional command availability.

---
*End of Specification*