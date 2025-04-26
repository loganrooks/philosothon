# ADR: Ultra-Simplified Registration Flow & Implementation Plan (Recovery)

**Version:** 1.0
**Date:** 2025-04-26
**Status:** Proposed

## 1. Context

*   **Problem:** Implementation and testing of the XState `RegistrationDialog` (based on Spec V3.1) are critically blocked. Multiple attempts failed due to excessive complexity in state management (both `useReducer` and initial XState attempts), fragile testing environments (mocking issues, timing sensitivity, environment caching), and unreliable tooling (`apply_diff`, `write_to_file` on large files). User frustration is extremely high. See `memory-bank/feedback/debug-feedback.md`, `memory-bank/feedback/tdd-feedback.md`, and `memory-bank/activeContext.md` for detailed failure history.
*   **Urgent Goal:** Deploy a *working*, robust registration system rapidly to unblock user testing and event preparation.
*   **REVISED Directive (User Mandate - Simplified Flow):**
    1.  `register` command -> choice of `sign-in` or `sign-up`.
    2.  `sign-up`: Collect core details (First Name, Last Name, Email, Password) -> Call `signUpUser` backend action -> Handle confirmation -> Proceed to Q3+ (Year of Study onwards). Save progress *incrementally* to Supabase after *each* question answer.
    3.  `sign-in`: Authenticate user -> Fetch existing registration data from Supabase -> Resume at last saved point (displaying history) or start from Q3+ if no progress found.
    4.  **NO Local Storage.** Supabase persistence ONLY.
    5.  **Core Bugs MUST be fixed:** Boot sequence issues, command echo inconsistencies, UI format/colors, auth stability (Supabase client usage), existing user checks during sign-up, `edit`/`review`/`back` command logic within the simplified flow, prompt total display (should reflect 36 questions), double prompts, submission validation.
    6.  **Robustness/Debugging:** Plan requires robust command handling (`edit`, `review`, `back` adapted for Supabase) & explicit debugging guidelines for this specific flow.
*   **CRITICAL REQUIREMENT:** This plan requires the **HIGHEST POSSIBLE LEVEL OF DETAIL** to ensure rapid, successful implementation with minimal ambiguity.

## 2. Decision

Adopt an **ultra-simplified registration flow** managed by the existing XState machine (`registrationDialogMachine.ts`), heavily refactored to:

1.  **Eliminate Local Storage:** Remove all logic related to loading, saving, or clearing registration state in `localStorage`.
2.  **Implement Supabase Persistence:**
    *   Introduce states and services for fetching existing registration data on sign-in.
    *   Introduce states and services for saving answers incrementally to Supabase after *each* valid question response during the `questioning` state.
    *   Utilize the existing `submitRegistrationFromMachine` server action (or a refined version) for final submission, ensuring it handles potentially partial data updates correctly if incremental saves are robust.
3.  **Simplify Initial Flow:** Modify the machine's entry point (`idle` or `promptingCommand`) to handle the `register` command, leading to a choice between `sign-in` and `sign-up` flows.
4.  **Integrate Bug Fixes:** Incorporate specific fixes for known critical bugs directly into the implementation steps.
5.  **Defer Automated Testing:** Focus solely on manual verification for this recovery phase to ensure speed. Automated tests (unit, integration) will be addressed in a subsequent task.

## 3. Consequences

**Benefits:**

*   **Reduced Complexity:** Eliminates complex `localStorage` synchronization logic and potential race conditions.
*   **Increased Reliability:** Centralizes state persistence in Supabase, providing a single source of truth. Enables resuming registration across different sessions/devices.
*   **Faster Recovery:** Focuses effort on a minimal viable working flow, addressing the critical blocker.
*   **Clearer Path:** Provides a highly detailed, step-by-step plan to minimize ambiguity and errors during implementation.

**Drawbacks:**

*   **Potential Latency:** Saving answers incrementally to Supabase after each question introduces network latency, potentially impacting perceived responsiveness compared to local storage. UI should provide feedback during saves.
*   **Increased Backend Load:** More frequent database writes compared to a single final submission. Monitor Supabase usage.
*   **Refactoring Effort:** Requires significant modification of the existing XState machine and potentially related actions/components.
*   **Deferred Testing:** Lack of automated tests increases the risk of regressions later. Manual verification must be thorough.

## 4. Failure Analysis Summary

Analysis of `debug-feedback.md`, `tdd-feedback.md`, `activeContext.md`, and `globalContext.md` reveals consistent failure patterns:

1.  **State Management Complexity:** Both the `useReducer` (`RegistrationForm`) and XState (`RegistrationDialog`) implementations struggled with the intricate flow, conditional logic (skips, validation), and numerous states required by Spec V3.1. This led to bugs like stuck flows, incorrect state transitions, and difficulty in debugging.
2.  **Testing Fragility:**
    *   **Environment:** Vitest/JSDOM exhibited instability, including caching issues (loading outdated modules), timing problems (async operations, `useEffect`), and inconsistent behavior.
    *   **Mocking:** Mocking complex dependencies like `useMachine` and `localStorage` proved difficult and error-prone, leading to critical test failures (`TypeError: undefined is not iterable`).
    *   **Setup:** Tests often failed due to incorrect setup, lacking the necessary simulation of the machine's initial flow (auth, confirmation) to reach the desired state for assertion.
3.  **Tooling Limitations:**
    *   `apply_diff` / `write_to_file`: Repeatedly failed on large, complex files (`RegistrationDialog.test.tsx`, `registrationDialogMachine.ts`), causing partial applications, line number mismatches, file corruption, and regressions. Misuse (e.g., `write_to_file` overwriting) exacerbated problems.
    *   `read_file`: Incorrect usage (omitting `start_line: 1`) led to analysis based on truncated content, causing incorrect diffs and failed modifications.
4.  **High Context Window:** Large file sizes and complex logic quickly increased context window usage, impairing the AI's ability to perform multi-step reasoning, apply changes accurately, and debug effectively. This contributed to tooling failures and unproductive loops.
5.  **Specification Adherence:** Difficulty implementing complex validation rules (e.g., ranked-choice) and ensuring correct skip logic based on the SSOT data source.

**Conclusion:** The previous approach was too complex for the available tools and testing environment stability. Simplification, robust persistence (Supabase), and a highly granular plan are necessary for recovery.

## 5. ULTRA-DETAILED Flow Design (Simplified, Supabase-Only)

This design refactors the existing XState machine (`registrationDialogMachine.ts`) for the simplified flow.

### 5.1 Core Concepts

*   **Persistence:** Supabase `registrations` table (or a dedicated `partial_registrations` table if preferred for incremental saves).
*   **Authentication:** Assumes Supabase Auth (email/password) is handled via existing actions (`signInWithPassword`, `signUpUser`, `checkUserVerificationStatus`). The machine interacts with these via invoked services.
*   **Flow:** `register` -> `promptingSignInOrUp` -> (`signInFlow` | `signUpFlow`) -> `questioning` (Q3-Q36) -> `reviewing` -> `submitting` -> `success`.

### 5.2 XState Machine Refactor (Conceptual)

```mermaid
graph TD
    subgraph Simplified Registration Machine

    Idle -->|COMMAND_RECEIVED ('register')| PromptingSignInOrUp;

    PromptingSignInOrUp -->|COMMAND_RECEIVED ('sign-up')| SignUpFlow_Start(signUpFlow.earlyAuth);
    PromptingSignInOrUp -->|COMMAND_RECEIVED ('sign-in')| SignInFlow_Start(signInFlow.promptingEmail);
    PromptingSignInOrUp -->|COMMAND_RECEIVED ('back')| Idle;

    subgraph signUpFlow
        SignUpFlow_Start -->|Input Valid| SignUpFlow_SigningUp(signingUp);
        SignUpFlow_SigningUp -->|SIGNUP_SUCCESS| SignUpFlow_AwaitingConfirmation(awaitingConfirmation);
        SignUpFlow_SigningUp -->|SIGNUP_EXISTS| PromptingSignInOrUp_WithError(PromptingSignInOrUp w/ Error);
        SignUpFlow_SigningUp -->|SIGNUP_FAILURE| SignUpFlow_Start_WithError(signUpFlow.earlyAuth w/ Error);
        SignUpFlow_AwaitingConfirmation -->|CONFIRMATION_SUCCESS| SavingInitialProgress;
        SignUpFlow_AwaitingConfirmation -->|CONFIRMATION_FAILURE| SignUpFlow_AwaitingConfirmation_WithError(awaitingConfirmation w/ Error);
    end

    subgraph signInFlow
        SignInFlow_Start -->|Input Valid| SignInFlow_Authenticating(authenticating);
        SignInFlow_Authenticating -->|AUTH_SUCCESS| FetchingRegistration;
        SignInFlow_Authenticating -->|AUTH_FAILURE| SignInFlow_Start_WithError(signInFlow.promptingEmail w/ Error);
    end

    FetchingRegistration -->|FETCH_SUCCESS (Data Found)| ResumingProgress;
    FetchingRegistration -->|FETCH_SUCCESS (No Data)| SavingInitialProgress; %% Treat as new if no data found after sign-in %%
    FetchingRegistration -->|FETCH_FAILURE| Idle_WithError(Idle w/ Error);

    ResumingProgress -->|Display History| Questioning; %% Set index based on fetched data %%

    SavingInitialProgress -->|SAVE_SUCCESS| Questioning_Start(Questioning @ Q3);
    SavingInitialProgress -->|SAVE_FAILURE| Idle_WithError(Idle w/ Error);

    Questioning -->|INPUT_RECEIVED (Valid)| SavingAnswer;
    Questioning -->|INPUT_RECEIVED (Invalid)| Questioning_WithError(Questioning w/ Error);
    Questioning -->|COMMAND_RECEIVED ('back')| SavingAnswer_Prev(SavingAnswer w/ Prev Flag);
    Questioning -->|COMMAND_RECEIVED ('review')| Reviewing;
    Questioning -->|COMMAND_RECEIVED ('save')| SavingAnswer; %% Explicit save %%
    Questioning -->|COMMAND_RECEIVED ('exit')| SavingAnswer_Exit(SavingAnswer w/ Exit Flag);
    Questioning -->|LAST_QUESTION_ANSWERED| Reviewing;

    SavingAnswer -->|SAVE_SUCCESS| Questioning_Next(Questioning @ Next Index);
    SavingAnswer_Prev -->|SAVE_SUCCESS| Questioning_Prev(Questioning @ Prev Index);
    SavingAnswer_Exit -->|SAVE_SUCCESS| Idle;
    SavingAnswer -->|SAVE_FAILURE| Questioning_WithError(Questioning w/ Error);
    SavingAnswer_Prev -->|SAVE_FAILURE| Questioning_WithError(Questioning w/ Error);
    SavingAnswer_Exit -->|SAVE_FAILURE| Idle_WithError(Idle w/ Error);

    Reviewing -->|COMMAND_RECEIVED ('edit [n]')| Editing;
    Reviewing -->|COMMAND_RECEIVED ('submit')| Submitting;
    Reviewing -->|COMMAND_RECEIVED ('back')| Questioning_Last(Questioning @ Last Index);

    Editing -->|INPUT_RECEIVED (Valid)| SavingAnswer_Edit(SavingAnswer w/ Edit Flag);
    Editing -->|INPUT_RECEIVED (Invalid)| Editing_WithError(Editing w/ Error);
    SavingAnswer_Edit -->|SAVE_SUCCESS| Reviewing;
    SavingAnswer_Edit -->|SAVE_FAILURE| Editing_WithError(Editing w/ Error);

    Submitting -->|SUBMIT_SUCCESS| Success;
    Submitting -->|SUBMIT_FAILURE| SubmissionError;

    SubmissionError -->|COMMAND_RECEIVED ('retry')| Submitting;
    SubmissionError -->|COMMAND_RECEIVED ('edit')| Reviewing;
    SubmissionError -->|COMMAND_RECEIVED ('exit')| Idle;

    Success -->|COMMAND_RECEIVED ('exit')| Idle;

    end
```

### 5.3 Key States & Transitions (Details)

*   **`idle`**: Initial state. Waits for `register` command.
*   **`promptingSignInOrUp`**: Displays "Sign in or Sign up? (sign-in / sign-up)". Waits for command.
    *   Entry Action: `displaySignInOrUpPrompt`
    *   Transitions:
        *   On `COMMAND_RECEIVED('sign-up')` -> `signUpFlow.earlyAuth` (Action: `resetRegistrationState`)
        *   On `COMMAND_RECEIVED('sign-in')` -> `signInFlow.promptingEmail`
        *   On `COMMAND_RECEIVED('back')` -> `idle`
*   **`signUpFlow`**: (Parallel State or Sub-Machine)
    *   **`earlyAuth`**: Collects First Name, Last Name, Email, Password, Confirm Password sequentially. Validates input.
        *   Actions: `displayEarlyAuthPrompt`, `assignAnswer`, `assignValidationError`
        *   Guards: `isEarlyAuthInputValid`
    *   **`signingUp`**: Invokes `signUpService`.
        *   Input: `{ firstName, lastName, email, password }`
        *   Output (Success): `{ status: 'confirmation_required' | 'existing_user', email: string }`
        *   Output (Error): `Error`
    *   **`awaitingConfirmation`**: Displays confirmation message. Waits for `continue` or `resend`.
        *   Entry Action: `displayConfirmationPrompt`
        *   Transitions:
            *   On `COMMAND_RECEIVED('continue')` -> `checkingAuthConfirmation`
            *   On `COMMAND_RECEIVED('resend')` -> `resendingConfirmation`
    *   **`checkingAuthConfirmation`**: Invokes `checkAuthConfirmationService`.
        *   OnDone -> `savingInitialProgress`
        *   OnError -> `awaitingConfirmation` (Action: `assignConfirmationError`)
    *   **`resendingConfirmation`**: Invokes `resendConfirmationService`.
        *   OnDone -> `awaitingConfirmation` (Action: `displayResendSuccess`)
        *   OnError -> `awaitingConfirmation` (Action: `assignResendError`)
*   **`signInFlow`**: (Parallel State or Sub-Machine)
    *   **`promptingEmail`**: Collects Email.
    *   **`promptingPassword`**: Collects Password.
    *   **`authenticating`**: Invokes `signInService` (using `signInWithPassword` action).
        *   Input: `{ email, password }`
        *   Output (Success): `{ userId: string, email: string }`
        *   Output (Error): `Error`
*   **`fetchingRegistration`**: Invokes `fetchRegistrationService`.
    *   Input: `{ userId }` (from `authenticating` success)
    *   Output (Success): `{ registrationData: Record<string, any> | null }`
    *   Output (Error): `Error`
    *   Transitions:
        *   OnDone (Data Found) -> `resumingProgress` (Action: `assignFetchedData`)
        *   OnDone (No Data) -> `savingInitialProgress` (Action: `assignUserEmail`)
        *   OnError -> `idle` (Action: `assignFetchError`)
*   **`resumingProgress`**: Displays fetched answers/history.
    *   Entry Action: `displayResumeHistory`, `assignCurrentIndexFromData`
    *   Transition: `always` -> `questioning`
*   **`savingInitialProgress`**: (Optional but recommended) Invokes `saveAnswerService` to save initial user details (email, name) linked to `userId` before starting questions. Ensures a record exists even if user drops off immediately.
    *   Input: `{ userId, questionId: 'userEmail', answer: userEmail }`, `{ userId, questionId: 'firstName', answer: firstName }`, etc.
    *   OnDone -> `questioning` (at index for Q3)
    *   OnError -> `idle` (Action: `assignSaveError`)
*   **`questioning`**: Main state for answering Q3-Q36.
    *   Entry Action: `displayCurrentQuestionAction` (handles skip logic)
    *   Transitions:
        *   On `INPUT_RECEIVED` (Guard: `isValidAnswerInput`) -> `savingAnswer` (Action: `assignAnswer`)
        *   On `INPUT_RECEIVED` (Guard: NOT `isValidAnswerInput`) -> `questioning` (Action: `assignValidationError`, `displayCurrentQuestionAction`)
        *   On `COMMAND_RECEIVED('back')` -> `savingAnswer` (with context flag `goToPrevious: true`)
        *   On `COMMAND_RECEIVED('review')` -> `reviewing`
        *   On `COMMAND_RECEIVED('save')` -> `savingAnswer` (with context flag `explicitSave: true`)
        *   On `COMMAND_RECEIVED('exit')` -> `savingAnswer` (with context flag `exitAfterSave: true`)
        *   `always` (Guard: `isLastQuestionAnswered`) -> `reviewing`
*   **`savingAnswer`**: Invokes `saveAnswerService`.
    *   Input: `{ userId, questionId, answer }` (from context)
    *   Output (Success): `{}`
    *   Output (Error): `Error`
    *   Transitions:
        *   OnDone (Guard: NOT `goToPrevious`, NOT `exitAfterSave`, NOT `explicitSave`) -> `questioning` (Action: `incrementQuestionIndex`)
        *   OnDone (Guard: `goToPrevious`) -> `questioning` (Action: `decrementQuestionIndex`, `clearGoToPreviousFlag`)
        *   OnDone (Guard: `exitAfterSave`) -> `idle`
        *   OnDone (Guard: `explicitSave`) -> `questioning` (Action: `displaySaveConfirmation`, `clearExplicitSaveFlag`)
        *   OnError -> `questioning` (Action: `assignSaveError`, `displayCurrentQuestionAction`)
*   **`reviewing`**: Displays all answers. Waits for `edit [n]` or `submit` or `back`.
    *   Entry Action: `displayReviewAction`
    *   Transitions:
        *   On `COMMAND_RECEIVED('edit [n]')` -> `editing` (Action: `assignEditIndex`)
        *   On `COMMAND_RECEIVED('submit')` -> `submitting`
        *   On `COMMAND_RECEIVED('back')` -> `questioning` (Action: `assignCurrentIndexToLast`)
*   **`editing`**: Displays specific question for editing.
    *   Entry Action: `displayEditingQuestionAction`
    *   Transitions:
        *   On `INPUT_RECEIVED` (Guard: `isValidAnswerInput`) -> `savingAnswer` (Action: `assignAnswer`, with context flag `returnToReview: true`)
        *   On `INPUT_RECEIVED` (Guard: NOT `isValidAnswerInput`) -> `editing` (Action: `assignValidationError`, `displayEditingQuestionAction`)
*   **`submitting`**: Invokes `submitFinalRegistrationService` (can reuse `submitRegistrationFromMachine` action).
    *   Input: `{ userId, answers }`
    *   Output (Success): `{}`
    *   Output (Error): `Error`
    *   Transitions:
        *   OnDone -> `success`
        *   OnError -> `submissionError` (Action: `assignSubmitError`)
*   **`success`**: Displays success message. Waits for `exit`.
*   **`submissionError`**: Displays error. Waits for `retry`, `edit`, `exit`.

### 5.4 Supabase Persistence Logic

*   **Table Strategy:** Modify the **existing `registrations` table**. A separate `partial_registrations` table is not necessary for this recovery phase.
*   **Justification vs. SSOT (`registrationSchema.ts`):** This database schema defines *how* answers are stored, optimized for incremental saves and resuming progress, replacing `localStorage`. It does **not** replace `registrationSchema.ts`, which remains the SSOT defining *what* the questions are, their validation, hints, etc., for the application logic and code generation. The `answers JSONB` column provides flexibility to store data defined by the SSOT without requiring individual database columns for each question, simplifying migrations when questions change. The `last_completed_index` column directly supports resuming the flow based on the SSOT's question order.
*   **Required Columns:**
    *   `user_id UUID`: Primary Key, Foreign Key to `auth.users`. Must exist.
    *   `answers JSONB`: Stores all question answers (Q3-Q36) as a single JSON object keyed by question ID (e.g., `{ "academicYear": "Second year", ... }`). Add if not present, ensure `DEFAULT '{}'::jsonb NOT NULL`.
    *   `last_completed_index INTEGER`: Stores the 0-based index of the last successfully answered question from the `questions` array. Used to determine resume point. Add if not present, ensure `DEFAULT -1 NOT NULL` (-1 indicates pre-Q3 state).
    *   `updated_at TIMESTAMPTZ`: Tracks last update time. Add if not present, ensure `DEFAULT now() NOT NULL` and add update trigger.
*   **`fetchRegistrationService` (DAL Function: `fetchRegistrationByUserId`):**
    *   Input: `userId`.
    *   Logic: `supabase.from('registrations').select('answers, last_completed_index').eq('user_id', userId).maybeSingle()`.
    *   Output: `{ registration: { answers: Json, last_completed_index: number } | null, error }`. Returns the `answers` JSONB and the last completed index.
*   **`saveAnswerService` (DAL Function: `upsertRegistrationAnswer`):**
    *   Input: `{ userId: uuid, questionId: string, answer: any, currentQuestionIndex: number }`.
    *   Logic: Use `upsert` on the `registrations` table for the given `user_id`. The core operation involves merging the new `answer` into the existing `answers` JSONB field and updating `last_completed_index` only if the `currentQuestionIndex` is greater than the stored value. This can be done via a dedicated SQL function (recommended for atomicity) or direct Supabase client `upsert` call.
        ```sql
        -- Conceptual Upsert Logic
        INSERT INTO registrations (user_id, answers, last_completed_index, updated_at)
        VALUES (userId, jsonb_build_object(questionId, answer), currentQuestionIndex, now())
        ON CONFLICT (user_id) DO UPDATE
        SET
          answers = registrations.answers || jsonb_build_object(questionId, answer), -- Merge new answer
          last_completed_index = GREATEST(registrations.last_completed_index, currentQuestionIndex), -- Update index only if higher
          updated_at = now();
        ```
    *   Output: Success/Failure.
*   **Displaying History (`resumingProgress`):**
    *   Fetch data using `fetchRegistrationService`.
    *   Iterate through `questions` array up to `last_completed_index`.
    *   For each question `q` with an answer in `fetchedData.answers[q.id]`:
        *   Call `context.shellInteractions.addOutputLine(q.label)`.
        *   Call `context.shellInteractions.addOutputLine("> " + formatAnswer(fetchedData.answers[q.id], q.type), { type: 'input' })`.
    *   Set machine `context.currentQuestionIndex = fetchedData.last_completed_index + 1` (or handle skip logic).

### 5.5 Key Context Properties

*   `userId`: string | null - Set after successful authentication.
*   `answers`: Record<string, any> - Holds answers keyed by question ID.
*   `currentQuestionIndex`: number - Tracks the *conceptual* index (0-35 for Q3-Q36, potentially negative for early auth).
*   `lastSavedIndex`: number - Index successfully saved to Supabase.
*   `error`: string | null - For displaying errors.
*   `shellInteractions`: For UI updates.

## 6. Granular Refactoring Plan

### 6.1 `registrationDialogMachine.ts` Changes

1.  **Remove LocalStorage:**
    *   Delete `loadStateService`, `saveStateService`, `clearStateService` definitions.
    *   Remove `loadingSavedState` state and related transitions/actions.
    *   Remove `savedStateExists` from context.
    *   Remove actions `clearSavedStateAction`, `saveStateAction`.
2.  **Add Supabase Persistence:**
    *   Define `signInService`, `fetchRegistrationService`, `saveAnswerService`. (Use existing `signUpService`, `checkAuthConfirmationService`, `resendConfirmationService`, `submitRegistrationFromMachine` action for final submit).
    *   Add `userId: string | null` to context.
    *   Add `lastSavedIndex: number` to context.
3.  **Implement Simplified Flow:**
    *   **Leverage Existing SSOT:** Assumes `config/registrationSchema.ts` is accurate per V3.1 spec (36 questions) and `platform/scripts/generate-registration.ts` correctly generates `platform/src/app/register/data/registrationQuestions.ts` (used by machine) and the Zod schema in `platform/src/app/register/actions.ts` (used for final submission validation).
    *   Change initial state to `idle`.
    *   Add `idle` state: Waits for `register` command.
    *   Add `promptingSignInOrUp` state: Displays choice, transitions on `sign-in` or `sign-up`.
    *   Add `signInFlow` states: `promptingEmail`, `promptingPassword`, `authenticating` (invokes `signInService`).
    *   Add `fetchingRegistration` state: Invokes `fetchRegistrationService` after successful sign-in.
    *   Add `resumingProgress` state: Displays fetched history, sets index, transitions to `questioning`.
    *   Add `savingInitialProgress` state: Saves initial user details after sign-up/sign-in(no data), transitions to `questioning` @ Q3.
    *   Modify `signUpFlow`: After `awaitingConfirmation` success, transition to `savingInitialProgress`. Handle `SIGNUP_EXISTS` by transitioning to `promptingSignInOrUp` with an error message.
    *   Modify `questioning` state:
        *   On valid `INPUT_RECEIVED`, transition to `savingAnswer`.
        *   Add transitions for `back`, `save`, `exit` commands, potentially setting context flags before going to `savingAnswer`.
    *   Add `savingAnswer` state: Invokes `saveAnswerService`. OnDone, transitions back to `questioning` (updating index based on context flags: next, previous, or stay for explicit save) or `idle` (if exiting). OnError, transitions to `questioning` with error.
    *   Modify `reviewing` state: Fetch data from context (should be up-to-date due to incremental saves). `edit [n]` transitions to `editing`. `submit` transitions to `submitting`. `back` transitions to `questioning` (last index).
    *   Add `editing` state: Displays question `n`. On valid input, transitions to `savingAnswer` (with flag to return to `reviewing`).
    *   Modify `submitting` state: Invoke `submitRegistrationFromMachine` action.
4.  **Update Actions/Guards:**
    *   **Implement Full Validation:** Implement the complete validation logic within `registrationMachineUtils.ts` (`validateAnswer`) or directly in machine guards/actions, ensuring it correctly interprets and applies all rules defined in `validationRules` within the SSOT (`registrationSchema.ts`) for all relevant question types (text, select, multi-select, ranked-choice, etc.).
    *   Update validation guards/actions (`isValidAnswerInput`, `assignValidationError`, etc.) to use the implemented validation logic and handle 36 questions.
    *   Update display actions (`displayCurrentQuestionAction`, `displayReviewAction`, etc.) for 36 questions and Supabase context.
    *   Ensure `userId` is passed to Supabase services.

### 6.2 `RegistrationDialog.tsx` Changes

1.  **Authentication:** Ensure `userSession` prop provides necessary info (isAuthenticated, email, userId). Pass `userId` to the machine context if needed (or machine gets it via auth actions).
2.  **Initial Command:** Modify `handleSubmit` to handle the initial `register` command and send appropriate events (`COMMAND_RECEIVED('register')`) to the machine. The machine will then handle the `sign-in`/`sign-up` prompt.
3.  **Prompt Display:** Update `generatePrompt` to reflect the new state structure (e.g., show `[auth]>`, `[sign-in]>`, `[sign-up]>` prompts) and the correct total question count (36).
4.  **UI Feedback:** Add visual indicators (e.g., spinner, message) when the machine is in saving/fetching states (`savingAnswer`, `fetchingRegistration`, `submitting`). This could involve checking `state.matches('savingAnswer')`.
5.  **Error Display:** Ensure errors from the machine context (`state.context.error`) are displayed clearly (using orange color).
6.  **Shell Interaction:** Adjust `TerminalShell.tsx` command processing logic to correctly delegate commands/input to the `RegistrationDialog`'s XState machine when in `registration` mode (e.g., via a prop function or context).

## 7. Explicit Bug Fix Integration

Integrate fixes into the implementation steps below:

1.  **Boot Sequence:** Simplify/remove complex boot sequence logic in the component; rely on machine's initial state transitions. (Step: Refactor Component UI)
2.  **Command Echo:** Ensure `addOutputLine` is called consistently *after* input processing/validation within machine actions or component `handleSubmit` to prevent double echo or echo of invalid commands. (Step: Refine Machine Actions, Refactor Component UI)
3.  **UI Format/Colors:** Apply specified colors (`#39FF14` text, `#FFA500` error/highlight, `#000000` background) via Tailwind/CSS. Ensure monospace font. (Step: Refactor Component UI)
4.  **Auth Stability:** Use Supabase server client (`createClient`) correctly in server actions. Handle errors robustly in invoked services. (Step: Implement Supabase Services)
5.  **Existing User Checks:** Implement explicit check in `signUpService` and transition back to `promptingSignInOrUp` with error message if user exists. (Step: Refactor `signUpFlow`)
6.  **`edit`/`review`/`back` Commands:** Implement logic within the machine based on Supabase data (fetch for `review`/`edit`, save incrementally for `back`). (Step: Implement `reviewing`, `editing`, `savingAnswer` states)
7.  **Prompt Total:** Update `generatePrompt` in component and any internal machine logic to use the correct total (36). (Step: Refactor Component UI, Refine Machine Actions)
8.  **Double Prompts:** Ensure prompts are displayed *only* via machine entry actions (`displayCurrentQuestionAction`, etc.) and not duplicated in the component or other actions. (Step: Refine Machine Actions, Refactor Component UI)
9.  **Submission Validation:** Rely on Zod schema validation within `submitRegistrationFromMachine` action. Ensure client-side validation in machine guards aligns. (Step: Implement `submitting` state, Refine Machine Guards)

## 8. Detailed Debugging Guidelines (Simplified Flow)

*   **Machine State/Context:**
    *   `console.log('[XState] Transition:', state.value, state.context);` in component `useEffect` watching `state`.
    *   Log key context values before/after transitions: `userId`, `currentQuestionIndex`, `lastSavedIndex`, `answers`, `error`.
*   **Supabase Services:**
    *   Log input and output/error for each invoked service (`fetchRegistrationService`, `saveAnswerService`, `signInService`, `signUpService`, `submitRegistrationFromMachine`).
    *   Example: `console.log('[Service] saveAnswer Input:', { userId, questionId, answer });` ... `console.log('[Service] saveAnswer Success/Error:', result);`
*   **Server Actions:**
    *   Add detailed `console.log` statements inside `actions.ts` functions (`submitRegistrationFromMachine`, auth actions) tracing execution flow, validation results, Supabase calls, and return values.
*   **Supabase Dashboard:**
    *   Monitor Network console in browser DevTools for calls to Supabase.
    *   Check `registrations` table directly in Supabase Studio to verify incremental saves (`answers` JSONB, `last_completed_index`).
    *   Check `auth.users` table for user creation/confirmation status.
    *   Check Supabase Function logs if Edge Functions are involved (less likely in simplified flow).
*   **Component UI:**
    *   Log props received by `RegistrationDialog`.
    *   Log events sent to the machine from `handleSubmit`.
    *   Use React DevTools to inspect component state and props.

## 9. ULTRA-DETAILED Implementation Plan

**Branch:** `feature/registration-simplified-recovery` (from latest `main` or relevant base branch)

**Priority:** Backend/DB -> Machine Logic -> Component UI -> Bug Fixes Integration

**Note:** Each step assumes starting from the current codebase state after analysis. Commits should be made after each verifiable step.

**Phase 1: Backend & Core Machine Setup**

1.  **Step 1.1: Define Supabase Table Structure**
    *   **Goal:** Modify the **existing `registrations` table** schema to support incremental saves via JSONB and index tracking.
    *   **Files:** `supabase/migrations/YYYYMMDDHHMMSS_update_registrations_for_incremental.sql` (New File)
    *   **Logic:**
        *   Add/Ensure `answers JSONB DEFAULT '{}'::jsonb NOT NULL` (to store `{ questionId: answer, ... }`).
        *   Add/Ensure `last_completed_index INTEGER DEFAULT -1 NOT NULL` (to track resume point, -1 = pre-Q3).
        *   Ensure `user_id UUID` exists (PK, FK to `auth.users`).
        *   Add/Ensure `updated_at TIMESTAMPTZ DEFAULT now() NOT NULL` and trigger.
        *   Define/Verify RLS policies (user can upsert own row, admin can read all).
    *   **Verification:** Apply migration (`supabase db push`). Inspect table structure in Supabase Studio.

2.  **Step 1.2: Implement `fetchRegistrationService` Logic**
    *   **Goal:** Create DAL function and machine service wrapper to fetch partial/full registration.
    *   **Files:** `platform/src/lib/data/registrations.ts`, `platform/src/app/register/machines/registrationDialogMachine.ts`
    *   **Logic (DAL):** Implement `fetchRegistrationByUserId(userId)` in `lib/data/registrations.ts` returning `{ registration: { answers: Json, last_completed_index: number } | null, error }`. Use `supabase.from('registrations').select('answers, last_completed_index').eq('user_id', userId).maybeSingle()`.
    *   **Logic (Machine):** Define `fetchRegistrationService = fromPromise(async ({ input }) => { /* call DAL */ })`.
    *   **Verification:** Manually test DAL function (e.g., in a test script or temporary route handler). Verify machine service definition syntax.

3.  **Step 1.3: Implement `saveAnswerService` Logic**
    *   **Goal:** Create DAL function and machine service wrapper for incremental saves.
    *   **Files:** `platform/src/lib/data/registrations.ts`, `platform/src/app/register/machines/registrationDialogMachine.ts`
    *   **Logic (DAL):** Implement `upsertRegistrationAnswer(userId: uuid, questionId: string, answer: any, index: number)` in `lib/data/registrations.ts`. Use Supabase client `rpc` call to the `upsert_registration_answer` SQL function (defined in Step 1.1 migration) for atomic JSONB merge and index update.
        ```sql
        -- Example SQL Function (in a migration)
        CREATE OR REPLACE FUNCTION upsert_registration_answer(p_user_id uuid, p_question_id text, p_answer jsonb, p_index integer)
        RETURNS void AS $$
        BEGIN
          INSERT INTO registrations (user_id, answers, last_completed_index, updated_at)
          VALUES (p_user_id, jsonb_build_object(p_question_id, p_answer), p_index, now())
          ON CONFLICT (user_id) DO UPDATE
          SET
            answers = registrations.answers || jsonb_build_object(p_question_id, p_answer),
            last_completed_index = GREATEST(registrations.last_completed_index, p_index),
            updated_at = now();
        END;
        $$ LANGUAGE plpgsql;
        ```
    *   **Logic (Machine):** Define `saveAnswerService = fromPromise(async ({ input }) => { /* call DAL */ })`.
    *   **Verification:** Manually test DAL function/SQL function. Verify machine service definition.

4.  **Step 1.4: Refactor Machine - Remove LocalStorage**
    *   **Goal:** Remove all localStorage related states, services, actions, context.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`
    *   **Logic:** Delete `loadStateService`, `saveStateService`, `clearStateService`, `loadingSavedState` state, `savedStateExists` context, related actions/transitions. Change initial state to `idle`.
    *   **Verification:** Manually review machine code for any remaining localStorage references. Ensure `initial` state is `idle`.

**Phase 2: Implement Simplified Flow Logic in Machine**

5.  **Step 2.1: Implement `idle` & `promptingSignInOrUp` States**
    *   **Goal:** Handle initial `register` command and prompt for sign-in/up.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`, `platform/src/config/registrationMessages.ts`
    *   **Logic:** Add `idle` state. Add `promptingSignInOrUp` state with entry action `displaySignInOrUpPrompt`. Add transitions from `idle` on `COMMAND_RECEIVED('register')` and from `promptingSignInOrUp` on `sign-in`, `sign-up`, `back`. Add relevant messages to `registrationMessages.ts`.
    *   **Verification:** Review state machine definition. Manually trace flow.

6.  **Step 2.2: Implement `signInFlow` States**
    *   **Goal:** Handle email/password collection and authentication.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`, `platform/src/app/auth/actions.ts`
    *   **Logic:** Add `signInFlow` parent state with `promptingEmail`, `promptingPassword`, `authenticating`. `authenticating` invokes `signInService` (using `signInWithPassword` action). OnDone, transition to `fetchingRegistration`, passing `userId`. OnError, return to `promptingEmail` with error. Ensure `signInWithPassword` action exists and returns `{ success, userId, message }`.
    *   **Verification:** Review state machine definition. Verify `signInWithPassword` action signature.

7.  **Step 2.3: Implement `fetchingRegistration` State**
    *   **Goal:** Fetch existing data after sign-in.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`
    *   **Logic:** Add `fetchingRegistration` state invoking `fetchRegistrationService`. OnDone (Data Found), transition to `resumingProgress`, assign data to context. OnDone (No Data), transition to `savingInitialProgress`, assign `userId`/`email`. OnError, transition to `idle` with error.
    *   **Verification:** Review state machine definition and transitions.

8.  **Step 2.4: Implement `resumingProgress` State**
    *   **Goal:** Display fetched history before starting questions.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`
    *   **Logic:** Add `resumingProgress` state. Entry action `displayResumeHistory` iterates fetched answers, calls `addOutputLine`. Assign `currentQuestionIndex` based on `last_completed_index`. Transition `always` to `questioning`.
    *   **Verification:** Review state machine definition and entry action logic.

9.  **Step 2.5: Refactor `signUpFlow` & Add `savingInitialProgress`**
    *   **Goal:** Integrate sign-up with Supabase persistence and handle existing users.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`, `platform/src/app/auth/actions.ts`
    *   **Logic:**
        *   Modify `signUpService` wrapper to check for specific "user exists" error from `signUpUser` action and return `{ status: 'existing_user' }`.
        *   Modify `signingUp.onDone` transition for `existing_user` to target `promptingSignInOrUp` with an error message.
        *   Modify `checkingAuthConfirmation.onDone` transition to target `savingInitialProgress`.
        *   Add `savingInitialProgress` state invoking `saveAnswerService` to save email/name. OnDone, transition to `questioning` (index for Q3). OnError, transition to `idle` with error.
    *   **Verification:** Review state machine definition, transitions, and service logic.

10. **Step 2.6: Implement `questioning` & `savingAnswer` States**
    *   **Goal:** Handle question answering and incremental saves.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`
    *   **Logic:**
        *   Refactor `questioning` entry action `displayCurrentQuestionAction` to use correct question set (Q3-Q36) and handle skip logic based on `context.answers`.
        *   **Implement Full Validation:** Ensure the complete validation logic is implemented within `registrationMachineUtils.ts` (`validateAnswer`) or machine guards/actions, correctly interpreting and applying all rules from `validationRules` in the SSOT (`registrationSchema.ts`) for relevant question types.
        *   Implement `questioning.on.INPUT_RECEIVED` transitions using `isValidAnswerInput` guard. Valid -> `savingAnswer`. Invalid -> `questioning` (self-transition) with error.
        *   Add `savingAnswer` state invoking `saveAnswerService`. Pass `userId`, `questionId`, `answer`, `currentQuestionIndex`.
        *   Implement `savingAnswer.onDone` transition back to `questioning`, action `incrementQuestionIndex` (or handle skip logic).
        *   Implement `savingAnswer.onError` transition back to `questioning` with error.
    *   **Verification:** Review state machine definition, actions, guards.

11. **Step 2.7: Implement `reviewing`, `editing`, `submitting` States**
    *   **Goal:** Handle review, edit, and final submission.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`
    *   **Logic:**
        *   Refactor `reviewing` entry action `displayReviewAction` to show answers from `context.answers`. Add transitions for `edit [n]`, `submit`, `back`.
        *   Add `editing` state. Entry action `displayEditingQuestionAction`. Transition on valid input to `savingAnswer` (with flag `returnToReview: true`).
        *   Modify `savingAnswer.onDone` to check `returnToReview` flag and transition to `reviewing` if set.
        *   Refactor `submitting` state to invoke `submitRegistrationFromMachine` action. Transition to `success` or `submissionError`.
    *   **Verification:** Review state machine definition and actions.

**Phase 3: Component UI & Bug Fix Integration**

12. **Step 3.1: Refactor Component UI (`RegistrationDialog.tsx`)**
    *   **Goal:** Align component with the refactored machine, implement UI feedback, fix UI bugs.
    *   **Files:** `platform/src/app/register/components/RegistrationDialog.tsx`, `platform/src/app/globals.css` (or Tailwind config)
    *   **Logic:**
        *   Update `handleSubmit` for initial `register` command.
        *   Update `generatePrompt` for new states and question count (36).
        *   Add rendering logic for loading/saving indicators based on `state.matches(...)`.
        *   Ensure errors from `state.context.error` are displayed in orange.
        *   Apply correct CSS for colors (green text, orange error, black bg) and monospace font. Fix `font-mono` override if still present.
        *   Simplify/remove component `useEffect` hooks related to old boot sequence/state management.
        *   Ensure command echo is handled consistently (likely within machine actions calling `addOutputLine`).
    *   **Verification:** Run app (`npm run dev`). Manually test:
        *   Initial `register` command shows `sign-in`/`sign-up` prompt.
        *   Sign-up flow proceeds through early auth, confirmation (if applicable), saves initial progress, starts Q3.
        *   Sign-in flow authenticates, fetches data (test with/without existing data), resumes or starts Q3.
        *   Questioning flow displays questions Q3-Q36 correctly.
        *   Answers are saved incrementally (check Supabase table).
        *   Review/Edit/Submit flow works.
        *   UI colors, fonts, prompts match spec. Loading/saving indicators appear. Errors displayed correctly. No double prompts/echoes.

13. **Step 3.2: Implement Remaining Command Logic (`back`, `save`, `exit`, `help`)**
    *   **Goal:** Ensure navigation and utility commands work correctly with Supabase persistence.
    *   **Files:** `platform/src/app/register/machines/registrationDialogMachine.ts`
    *   **Logic:**
        *   Implement `questioning.on.COMMAND_RECEIVED('back')` transition to `savingAnswer` (with `goToPrevious: true`). `savingAnswer.onDone` transitions back to `questioning` (action: `decrementQuestionIndex`). Handle edge case (Q3).
        *   Implement `questioning.on.COMMAND_RECEIVED('save')` transition to `savingAnswer` (with `explicitSave: true`). `savingAnswer.onDone` transitions back to `questioning` (action: `displaySaveConfirmation`).
        *   Implement `questioning.on.COMMAND_RECEIVED('exit')` transition to `savingAnswer` (with `exitAfterSave: true`). `savingAnswer.onDone` transitions to `idle`.
        *   Implement `help` command handling in relevant states (display contextual messages from `registrationMessages.ts`).
    *   **Verification:** Manually test `back`, `save`, `exit`, `help` commands during questioning flow. Verify state saves and transitions occur correctly. Check Supabase data.

**Phase 4: Final Verification & Completion**

14. **Step 4.1: Comprehensive Manual Testing**
    *   **Goal:** Verify all flows, commands, edge cases, and bug fixes.
    *   **Files:** N/A (Testing Application)
    *   **Logic:** Execute test plan covering:
        *   New user sign-up flow (including email confirmation if enabled).
        *   Existing user sign-in flow (with and without partial registration data).
        *   Answering all question types (text, select, multi-select, ranked-choice, boolean).
        *   Input validation and error handling for all types.
        *   Dependency/skip logic.
        *   Navigation commands (`back`, `save`, `exit`).
        *   Review/Edit flow (`review`, `edit [n]`).
        *   Final submission (`submit`).
        *   Error states (auth failure, save failure, submit failure) and recovery (`retry`).
        *   UI appearance (colors, fonts, prompts).
        *   Check Supabase `registrations` table for correct data persistence at each stage.
    *   **Verification:** Application behaves exactly as specified in the simplified flow. All known bugs addressed. Data persists correctly in Supabase.

15. **Step 4.2: Update Memory Bank & Attempt Completion**
    *   **Goal:** Document completion and report results.
    *   **Files:** `memory-bank/activeContext.md`, `memory-bank/mode-specific/architect.md`
    *   **Logic:** Add entries detailing the ADR creation and the successful (or otherwise) completion of the recovery plan design. Use `attempt_completion` tool.
    *   **Verification:** Memory Bank updated. `attempt_completion` called referencing the created ADR.

This detailed plan provides a structured approach to recovering the registration feature by simplifying the flow, switching to robust Supabase persistence, and integrating known bug fixes.