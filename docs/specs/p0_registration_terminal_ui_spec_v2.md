# Specification: P0 Terminal Registration UI Redesign (V3.1)

**Version:** 3.1 (Revised based on updated outline and validation feedback)
**Date:** 2025-04-20
**Status:** Draft

## 1. Purpose & Overview

This document outlines the functional requirements, user flows, technical specifications, and integration points for the redesigned Philosothon Terminal Registration System (V3.1). The system aims to provide an immersive, retro-computing terminal experience for event registration, replacing the previous basic terminal UI (`RegistrationForm.tsx`, commit `98e7303`).

This version (V3.1) integrates the structure and questions from the **latest** revised questionnaire outline (`docs/event_info/registration_outline.md` as of 2025-04-20 17:25), incorporates additional UX/feature requirements (including enhanced SSOT definition, input flexibility, error recovery, and refined validation constraints), and retains the core technical decisions from V2/V3 (SSOT strategy, password-based authentication). The total number of questions is now 36.

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
    *   **Visuals:** Header indicating "Registration Mode". Progress indicator (e.g., "Question X/36") during initial registration. Mode-specific command hints. Question text clearly displayed above the prompt. Hints (`hint` field) displayed below the question text.
    *   **Commands (Answering):** `next`, `prev`, `save`, `exit`, `back`, `help`.
    *   **Commands (Completion):** `submit`, `review`, `edit [number]`, `back`, `help`.
    *   *TDD Anchor:* Test mode header "Registration Mode" is displayed.
    *   *TDD Anchor:* Test progress indicator "Question X/36" is displayed and updates correctly.

3.  **Authentication Mode**
    *   **Entry:** Via `sign-in` command from Main Mode.
    *   **Prompt:** `[auth]>`. Input area clearly delineated.
    *   **Purpose:** Handles user sign-in using email and password, or requests a magic link. Allows password reset request.
    *   **Visuals:** Header indicating "Authentication Mode". Password input fields must mask characters (`*`). Secure handling of credentials is paramount.
    *   **Commands:** `magiclink`, `reset-password`, `exit`, `help`. (Email/Password are entered directly at prompts).

4.  **Awaiting Confirmation Mode**
    *   **Entry:** Successful `signUpUser` call where email confirmation is required by the backend.
    *   **Prompt:** `[awaiting_confirmation]>`
    *   **Purpose:** Waits for the user to confirm their email address via a link sent by the backend.
    *   **Visuals:** Header indicating "Awaiting Confirmation". Displays message: "Account created. Please check your email ([user_email]) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link."
    *   **Commands:** `continue`, `resend`, `exit`, `help`.
    *   **`continue` Logic:** Calls backend action `checkUserVerificationStatus`.
        *   On Success: Transitions to Registration Mode, starting at the first unanswered question (Q3 - Year of Study).
        *   On Failure: Displays error message ("Email not confirmed yet. Please check your email or use 'resend'.") in orange. Remains in `awaiting_confirmation` mode.
    *   **`resend` Logic:** Calls backend action `resendConfirmationEmail`. Displays confirmation message ("Confirmation email resent to [user_email]."). Remains in `awaiting_confirmation` mode.
    *   **`exit` Logic:** Returns to Main Terminal Mode (anonymous state, as session isn't fully active yet). Progress *should* be implicitly saved by the backend user creation, but local state might be cleared or kept depending on final implementation choices.
    *   *TDD Anchor:* Test mode header "Awaiting Confirmation" is displayed.
    *   *TDD Anchor:* Test prompt `[awaiting_confirmation]>` is displayed.
    *   *TDD Anchor:* Test initial message with user email is displayed.
    *   *TDD Anchor:* Test `continue` command calls `checkUserVerificationStatus`.
    *   *TDD Anchor:* Test `continue` transitions to Q3 on success.
    *   *TDD Anchor:* Test `continue` displays error and stays in mode on failure.
    *   *TDD Anchor:* Test `resend` command calls `resendConfirmationEmail` and displays confirmation.
    *   *TDD Anchor:* Test `exit` command returns to Main Mode (anonymous).


### 2.2 Command Visibility & Discovery

1.  **Command Hints:**
    *   A clearly visible list/menu of available commands shall be displayed in each mode, adapted for authenticated vs. anonymous states and conditional availability (e.g., `continue` only shown if local data exists).
    *   Brief help text explaining each command's purpose shall be available via `help [command]`.
    *   Detailed help for a specific question shall be available via `help [question_id]` (displays the `description` field from SSOT).
    *   The current mode shall always be clearly indicated (e.g., via prompt, status line).
    *   *TDD Anchor:* Test command hints update correctly when switching modes and auth states.
    *   *TDD Anchor:* Test conditional command visibility (e.g., `continue`, `view`, `edit`, `delete`).
    *   *TDD Anchor:* Test `help` command displays general help relevant to the mode/auth state.
    *   *TDD Anchor:* Test `help [command]` displays specific command help.
    *   *TDD Anchor:* Test `help [question_id]` displays the question's `description`.

2.  **Command Prompt Styling:**
    *   Prompts shall differ per mode as specified in 2.1.
    *   Input area styling should clearly differentiate between entering commands (Main/Auth modes) and entering answers (Registration mode).
    *   *TDD Anchor:* Test prompt string matches the current mode and auth state.
    *   *TDD Anchor:* Test visual distinction between command input area and answer input area styling.

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
    *   `new`: Displays the introductory message: *"Welcome to the Philosothon registration form! This questionnaire will help us understand your interests, background, and preferences to create balanced teams and select themes that resonate with participants. The event will take place on **April 26-27, 2025**. Completing this form should take approximately 10-15 minutes. Please submit your responses by **Thursday, April 24th at midnight**."* If local data exists, display warning: "Existing registration data found. Starting new will overwrite it. Proceed? (yes/no)". Requires confirmation (`yes`). Clears relevant local storage. Enters Registration Mode at Step 3 (First Name).
    *   `continue`: Loads state from local storage. Visually displays previously answered questions and answers leading up to the resume point. Resumes registration from the last unanswered question index. If no local data exists, display error: "No registration in progress found. Use 'register new'." Enters Registration Mode at the saved index.
    *   `back`: Returns to Main Terminal Mode.
    *   *TDD Anchor:* Test `register` command shows sub-menu (anonymous).
    *   *TDD Anchor:* Test `register new` displays intro message.
    *   *TDD Anchor:* Test `register new` prompts confirmation if local data exists.
    *   *TDD Anchor:* Test `register new` clears local data and proceeds to First Name on confirmation.
    *   *TDD Anchor:* Test `continue` command is only shown if local data exists.
    *   *TDD Anchor:* Test `register continue` resumes from correct index if local data exists.
    *   *TDD Anchor:* Test `register continue` visually displays previously answered questions leading up to the resume point.
    *   *TDD Anchor:* Test `register continue` shows error if no local data exists.
    *   *TDD Anchor:* Test `back` command returns to Main Mode.
3.  **Name, Email & Password Creation (Early Auth Flow):**
    *   The first step after `register new` (or `register continue` if name/email not stored) is collecting **First Name** (Outline Q1a).
    *   Next, collect **Last Name** (Outline Q1b).
    *   Next, collect **University Email Address** (Outline Q2). Basic client-side format validation.
    *   Immediately after a valid email is provided, prompt for "Password:" (masked) and "Confirm Password:" (masked).
    *   Client-side validation: Passwords match, minimum length 8 characters.
    *   On successful password creation, the backend `signUpUser` action is called *immediately*.
        *   **Existing User Detection:** If `signUpUser` detects the email already exists (e.g., via a specific error code or return value like 'user_already_exists'):
            *   Display error message: "An account with this email already exists. Please use 'sign-in' or 'reset-password'." (in orange).
            *   Return to Main Terminal Mode (anonymous state). Do NOT proceed to `awaiting_confirmation` or further questions.
        *   **New User Creation:** If the email does not exist, the action proceeds to create the user account. If email confirmation is required by the backend, transition to **Awaiting Confirmation Mode** (Section 2.1.4). If confirmation is *not* required (or auto-confirmed), proceed directly to Step 4 (Answering Remaining Questions).
        *   *TDD Anchor:* Test existing user detection displays error and returns to Main Mode.
    *   The email and an indication of successful user creation/verification are stored locally. First and Last Name are also stored locally.
    *   If `signUpUser` fails, display error and remain at password step.
    *   *TDD Anchor:* Test First Name prompt appears first.
    *   *TDD Anchor:* Test Last Name prompt appears after First Name.
    *   *TDD Anchor:* Test Email prompt appears after Last Name.
    *   *TDD Anchor:* Test email validation.
    *   *TDD Anchor:* Test password prompts appear after email.
    *   *TDD Anchor:* Test password inputs are masked.
    *   *TDD Anchor:* Test password confirmation and length validation.
    *   *TDD Anchor:* Test backend `signUpUser` action is called on success.
    *   *TDD Anchor:* Test handling of `signUpUser` failure.
    *   *TDD Anchor:* Test local storage indicates user verification and stores first name, last name, email.
4.  **Answering Remaining Questions:**
    *   After name/email/password/user creation, the system proceeds to the remaining registration questions sequentially (Outline Q3-Q36), starting from the first unanswered question.
    *   The system displays the current question label and prompt (`[registration]>`). Question text, type, options, and hints (`hint` field) are sourced from the generated `registrationQuestions.ts` (see SSOT Strategy, Section 6.1).
    *   User types their answer and presses Enter. Input area styling clearly indicates it's for an answer.
    *   **Input Handling & Flexibility:**
        *   **Text/Paragraph/Number/Scale:** Standard text input.
        *   **Boolean (Yes/No):** Accept "yes"/"no", "y"/"n" (case-insensitive), and numeric selection (e.g., "1" for Yes, "2" for No if options are displayed).
        *   **Multiple Choice (single-select):** Accept numeric selection corresponding to the displayed option number. Implement partial text matching (case-insensitive) against option labels (e.g., "internal" matches "I tend to process ideas internally before speaking"). If multiple options match partially, prompt for clarification or require more specific input.
        *   **Checkboxes (multi-select-numbered):** Display options with numbers. User enters space-separated numbers (e.g., `1 3 5`). Hint: "Enter numbers separated by spaces."
        *   **Ranked Choice (ranked-choice-numbered, e.g., Q18, Q20):** Display options with placeholders (e.g., `___ Option Text`). User enters the rank number (1, 2, or 3) next to their chosen options directly in the input field, likely requiring a specific format like `[OptionNumber]:[RankNumber]` separated by spaces or commas (e.g., `5:1 2:2 8:3`). Hint: "Enter rank (1, 2, 3) for your top 3 choices (e.g., `5:1 2:2 8:3`)." **(Needs refinement based on implementation feasibility)**. Alternatively, prompt sequentially: "Enter number of 1st choice:", "Enter number of 2nd choice:", "Enter number of 3rd choice:". Validation ensures the correct number of ranks (`minRanked` from SSOT), uniqueness, and valid ranks/options.
        *   **Other fields:** If a question has an 'Other' option and it's selected (via number or text match, or ranked for ranking questions based on `minRanked`), prompt for text input for the 'Other' value.
        *   **Fuzzy Matching:** Lower priority, consider Levenshtein distance or similar for more advanced matching if partial matching proves insufficient.
    *   **Validation & Error Recovery:**
        *   Input is validated client-side based on the question's definition (`required`, type checks, format checks, selection validity, ranking constraints). Use `validationRules` from SSOT (Section 6.1).
        *   If validation fails:
            *   Display the specific error message (from `validationRules` message property) in orange (`#FFA500`).
            *   Simultaneously display the question's `hint` below the error message.
            *   Preserve the user's invalid input in the input field to allow correction.
            *   Remain on the current question.
        *   Server-side Zod schema provides comprehensive validation during final submission.
    *   On valid input, the answer is saved to local storage (keyed by question ID, using basic obfuscation).
    *   The system displays the next question based on index and dependency logic (`dependsOn`, `dependsValue`).
    *   Progress indicator updates ("Question X/36").
    *   *TDD Anchor:* Test question display matches definition (label, text, options, hint).
    *   *TDD Anchor:* Test input handling for each type (text, number, scale, boolean variations, single-select number/partial text, multi-select-numbered, ranked-choice-numbered).
    *   *TDD Anchor:* Test 'Other' field prompting (including conditional for ranking).
    *   *TDD Anchor:* Test client-side validation (required, number, scale range, multi-select numbers, ranking format/uniqueness/minRanked, email format, regex patterns).
    *   *TDD Anchor:* Test specific error message content matches `validationRules` from SSOT.
    *   *TDD Anchor:* Test specific error messages appear alongside hints after validation failure.
    *   *TDD Anchor:* Test invalid input is preserved in field after validation failure.
    *   *TDD Anchor:* Test valid answer saves to local storage (obfuscated).
    *   *TDD Anchor:* Test navigation to next question respects dependency logic (including new availability questions).
    *   *TDD Anchor:* Test progress indicator updates correctly (shows X/36).
5.  **Navigation Commands (During Answering):**
    *   `next`: Moves to the next question (if current answer is valid or not required). Skips if already at the last question.
    *   `prev`: Moves to the previous question.
    *   `save`: Explicitly saves current progress to local storage. Displays confirmation message.
    *   `exit`: Saves progress and returns to Main Terminal Mode.
    *   `back`: Removes the last saved answer from local storage and moves focus back to re-ask the *previous* question, considering dependencies. If at the first question (Q3), display message "Cannot go back further."
    *   `help`: Displays available commands or specific help (`help [command]`, `help [question_id]`).
    *   *TDD Anchor:* Test `next` command functions correctly.
    *   *TDD Anchor:* Test `prev` command functions correctly.
    *   *TDD Anchor:* Test `save` command saves and confirms.
    *   *TDD Anchor:* Test `exit` command saves and returns to Main Mode.
    *   *TDD Anchor:* Test `back` command removes last answer and goes to previous question (including dependency skips).
    *   *TDD Anchor:* Test `back` command at first question (Q3).
6.  **Completion:**
    *   After the last question (Q36 - Confirmation Checkbox) is answered, the system displays a summary message: "Registration questions complete."
    *   Available commands change to `submit`, `review`, `edit [number]`, `back`.
    *   *TDD Anchor:* Test completion message is shown.
    *   *TDD Anchor:* Test available commands change upon completion.

### 3.3 Post-Registration / Authenticated State

1.  **Access:** User must be signed in.
2.  **Commands (Main Mode):**
    *   `view`: (Requires completed registration) Displays the completed registration data (read-only). Fetches from server.
    *   `edit`: (Requires completed registration) Enters Registration Mode to allow modification of answers (see Section 4.1.4). Fetches from server.
    *   *TDD Anchor:* Test `view` command fetches data from server and displays it correctly.
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
    *   Behavior: Displays intro message. Clears local storage (with confirmation if data exists). Starts flow from First Name (Section 3.2.3).
2.  **Continue Registration:**
    *   Command: `register continue`
    *   Behavior: Loads state from local storage, displays previous answers visually, resumes from last unanswered question. Error if no local data.
3.  **Review Answers:**
    *   Command: `review` (Registration Mode, after completion or via `edit`)
    *   Behavior: Displays a numbered list of all questions (Q1-Q36) and their currently saved answers (local or fetched from server if editing).
    *   *TDD Anchor:* Test `review` displays correct list based on current data (36 questions).
4.  **Edit Existing Registration:**
    *   Command: `edit` (Main Mode, signed-in, registration complete)
    *   Behavior: Fetches completed registration data from the server. Enters Registration Mode. User can use `review` to see answers, then `edit [number]` (referring to the number in the `review` list, 1-36) to jump to a specific question and provide a new answer. Saving (`save` command) updates the server record via `updateRegistration` action. Requires confirmation before saving changes. `back` command works within edit flow. `exit` returns to Main Mode without saving unsaved changes (prompts confirmation).
    *   *TDD Anchor:* Test `edit` command fetches server data.
    *   *TDD Anchor:* Test `review` command works in edit mode.
    *   *TDD Anchor:* Test `edit [number]` command allows changing a specific answer (using 1-36 range).
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
    *   Behavior: Sends all locally stored registration data (Q1-Q36) to the backend `submitRegistration` action. Links registration data to the user account created earlier.
    *   *TDD Anchor:* Test `submit` sends all registration data (36 questions) to the backend.
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
    *   *TDD Anchor:* Test correct fonts are applied (e.g., `font-mono` for general, `font-philosopher` if used).
    *   *TDD Anchor:* Test correct colors are used (black background, green text, orange errors/highlights).
2.  **Status Indicators:**
    *   Current mode visible (prompt/status line).
    *   Session status visible.
    *   Last action result briefly indicated (e.g., "Saved.", "Error: Invalid input.").

### 5.2 Help System

1.  **Contextual Help:**
    *   `help` command provides general help and lists available commands for the current mode/state.
    *   `help [command]` provides specific usage details for a command.
    *   `help [question_id]` (in Registration Mode) displays the detailed `description` for the specified question.
    *   *TDD Anchor:* Test `help [question_id]` displays correct description.
2.  **Error Handling:**
    *   Clear, user-friendly error messages (in orange), sourced from `validationRules`.
    *   Suggestions for resolving issues where possible (e.g., format examples in hints).
    *   Preserve invalid user input in the input field upon validation failure.
    *   Display error message and hint simultaneously upon validation failure.
    *   *TDD Anchor:* Test error messages appear alongside hints after validation failure.
    *   *TDD Anchor:* Test invalid input is preserved in field after validation failure.

## 6. Technical Implementation Notes

### 6.1 Question Synchronization (SSOT Strategy)

*   **Central Definition:** `config/registrationSchema.ts` defines all 36 questions from the outline (`docs/event_info/registration_outline.md`). **The generation script MUST verify all outline questions exist in the schema and fail if any are missing.** Structure per question:
    ```typescript
    {
      id: string; // e.g., 'firstName', 'lastName', 'discordMember'
      section: string; // e.g., 'Personal Information', 'Communication & Community'
      order: number; // Order within the section
      label: string; // Question text (from outline)
      type: 'text' | 'email' | 'password' | 'confirmPassword' | 'number' | 'scale' | 'boolean' | 'single-select' | 'multi-select-numbered' | 'ranked-choice-numbered' | 'paragraph'; // Maps to outline types
      required: boolean;
      options?: string[]; // For select, multi-select, ranking
      hint: string; // Mandatory short hint/example text (displayed below question)
      description: string; // Mandatory longer description (for `help [question_id]`)
      validationRules?: { // Defines validation logic and specific error messages
        required?: boolean | string; // boolean=use default message, string=custom message
        minLength?: { value: number; message?: string };
        maxLength?: { value: number; message?: string };
        min?: { value: number; message?: string }; // For number/scale
        max?: { value: number; message?: string }; // For number/scale
        pattern?: { regex: string; flags?: string; message?: string }; // For regex validation
        isEmail?: boolean | string;
        isNumber?: boolean | string;
        // For multi-select
        minSelections?: { value: number; message?: string };
        maxSelections?: { value: number; message?: string };
        // For ranked-choice-numbered
        minRanked?: { value: number; message?: string }; // e.g., { value: 3, message: "Please rank at least 3 options." }
        uniqueSelections?: boolean | string; // Ensure ranked options are unique
        // Add other rules as needed
      };
      dependsOn?: string; // ID of question this depends on
      dependsValue?: any; // Value the dependent question must have (e.g., for partial availability details, or 'Other' ranking description)
      dbType: 'TEXT' | 'INTEGER' | 'BOOLEAN' | 'TEXT[]' | 'JSONB'; // Hint for SQL generation
      // Add 'otherField': true if this question has an 'Other: ___' option needing text input
    }
    ```
*   **Code Generation Script:** `scripts/generate-registration.ts` (run via `npm run generate:reg`) generates:
    *   `platform/src/app/register/data/registrationQuestions.ts`: Frontend `Question[]` array and `FormDataStore` type. Includes basic client validation functions derived from `validationRules`.
    *   Zod Schema: Updates `RegistrationSchema` in `platform/src/app/register/actions.ts` based on `validationRules`. Handles array types, custom messages, and implements logic for `minRanked` and `uniqueSelections`.
    *   Draft SQL Migration: Creates draft `ALTER TABLE registrations ADD COLUMN ...` in `supabase/migrations/`. **Requires developer review.**
    *   **Warnings/Errors:** The script MUST warn if `hint`, `description`, or `validationRules` are missing for any question. It MUST error and fail if any question from `registration_outline.md` is missing in the schema.
*   **Workflow:** Modify central definition -> run script -> review generated files (esp. SQL) and warnings/errors -> commit changes.
*   *TDD Anchor:* Test generation script fails if outline questions are missing.
*   *TDD Anchor:* Test generation script warns if metadata (`hint`, `description`, `validationRules`) is missing.
*   *TDD Anchor:* Test generation script produces correct `registrationQuestions.ts` output (36 questions, separate first/last name, new types/dependencies, `ranked-choice-numbered`).
*   *TDD Anchor:* Test generation script produces correct Zod schema (including array handling, `minRanked`/`uniqueSelections` logic, custom messages).
*   *TDD Anchor:* Test generation script produces plausible draft SQL for new columns.
*   *TDD Anchor:* Test ranking questions properly validate format (e.g., `OptionNum:RankNum`), uniqueness, and count (`minRanked`) based on generated schema/client logic.
*   *TDD Anchor:* Test specific error messages display for each validation failure type based on `validationRules`.

### 6.2 Data Storage & Backend

1.  **Local Storage:**
    *   Key: `philosothon-registration-v3.1`.
    *   Stores: `formData` (object keyed by question ID, including `firstName`, `lastName`, and new QIDs), `currentQuestionIndex`, `history` (optional).
    *   **Obfuscation:** Basic Base64 obfuscation applied before saving, reversed on load.
    *   *TDD Anchor:* Test local storage uses the key `philosothon-registration-v3.1`.
    *   *TDD Anchor:* Test local storage data is Base64 encoded/decoded correctly.
2.  **Server Storage (Supabase):**
    *   `auth.users`: Email, hashed password.
    *   `profiles`: User role, linked to `auth.users`.
    *   `registrations`: Stores submitted registration data (Q1-Q36, including separate `first_name`, `last_name`, and new fields), linked to `auth.users`. Schema updated via reviewed SSOT-generated migrations. Use appropriate types (TEXT, INTEGER, BOOLEAN, TEXT[], JSONB for ranking).
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
    *   *TDD Anchor (Placeholder):* Integration tests verify backend actions handle expected parameters and return correct states/errors.

### 6.3 Integration Requirements

1.  **Database Schema Updates:** Configure Supabase Auth (email/password). Update `profiles` (role). Update `registrations` based on SSOT/migrations (ensure separate `first_name`, `last_name`, add new columns for Q26, Q28-31).
2.  **Frontend Component:** Rewrite/refactor `RegistrationForm.tsx` for V3.1 modes, commands, state, input handling (flexible formats, multi-select, ranked-choice-numbered), early auth (first/last name), `back` command, hints, enhanced validation/error recovery, context loading. Integrate generated `registrationQuestions.ts` (36 questions).
3.  **Server Actions:** Implement/update actions (`signInWithPassword`, `signUpUser`, `signOut`, `requestPasswordReset`, `submitRegistration`, `updateRegistration`, `deleteRegistration`) using Supabase Auth/DB and enhanced generated Zod schema (reflecting 36 questions).
4.  **Admin Authentication:** Update Admin login flow separately to use `signInWithPassword`.

## 7. Development Priorities (Rough)

1.  **Phase 1: Core Terminal & SSOT Setup**
    *   Implement central definition file (`config/registrationSchema.ts`) with all 36 questions, including enhanced metadata and refined ranking validation (`minRanked`, `uniqueSelections`).
    *   Develop/update code generation script (`scripts/generate-registration.ts`) including outline checks and metadata warnings. Run script, review SQL.
    *   Implement basic terminal UI shell (modes, command parsing, hints, prompts, colors).
    *   Implement `help`, `about`, `back` (basic), `exit` commands.
2.  **Phase 2: Password Authentication & Early Auth Flow**
    *   Configure Supabase Auth. Implement auth Server Actions.
    *   Implement Auth Mode UI.
    *   Integrate early auth flow (First Name, Last Name, Email, Password, `signUpUser` call) into `register new`.
    *   Implement session management.
3.  **Phase 3: Registration Flow & Data Handling**
    *   Integrate generated questions (36) into Registration Mode UI. Implement input handling (flexible formats, text, select, multi-select, ranked-choice-numbered), hints, enhanced validation/error recovery.
    *   Implement `register continue` logic.
    *   Refine `back` command logic.
    *   Implement `submitRegistration` server action (handling 36 questions).
    *   Implement `view`, `review`, `edit`, `delete` commands and backend actions (handling 36 questions).
    *   Implement conditional command availability.

---
*End of Specification*
