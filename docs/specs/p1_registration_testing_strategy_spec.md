# Specification: P1 RegistrationDialog Testing Strategy Implementation
**Version:** 1.0
**Date:** 2025-04-25
**Status:** Draft
**Author:** SpecPseudo Mode
**Based On:**
*   `docs/adr/2025-04-25-registration-testing-strategy.md`
*   `docs/architecture/terminal_component_v2.md`
*   `docs/specs/p0_registration_terminal_ui_spec_v2.md`

## 1. Overview

This document details the implementation plan for the new layered testing strategy for the XState-based `RegistrationDialog` component, as defined in ADR `2025-04-25-registration-testing-strategy.md`. This strategy aims to replace the existing fragile and unmaintainable test suite (`RegistrationDialog.test.tsx`) with a robust, layered approach involving machine unit tests, component integration tests, and refactoring for testability.

## 2. Goals

*   Implement a reliable and maintainable test suite for `RegistrationDialog` and its associated XState machine.
*   Separate testing of machine logic from component integration testing.
*   Refactor the machine and component for improved testability and clarity.
*   Establish a Single Source of Truth (SSOT) for UI messages.

## 3. Implementation Steps & Pseudocode

### 3.1 SSOT for UI Messages

**Objective:** Centralize all user-facing strings used by the registration machine and component into a single, typed configuration file.

**Specification:**

1.  **Create File:** Create a new file at `platform/src/config/registrationMessages.ts`.
2.  **Define Structure:** Define and export a constant object named `registrationMessages`. Structure this object logically, nesting messages by category or component state (e.g., `intro`, `earlyAuth`, `questioning`, `errors`, `commands`).
    ```typescript
    // platform/src/config/registrationMessages.ts
    export const registrationMessages = {
      dialogHeader: "Registration Mode",
      awaitingConfirmationHeader: "Awaiting Confirmation",
      prompts: {
        registration: "[registration]>",
        auth: "[auth]>",
        awaitingConfirmation: "[awaiting_confirmation]>",
      },
      intro: {
        welcome: "Welcome to the Philosothon registration form! ...", // Full text from spec V3.1
        overwriteWarning: "Existing registration data found. Starting new will overwrite it. Proceed? (yes/no)",
        noContinueData: "No registration in progress found. Use 'register new'.",
      },
      earlyAuth: {
        promptFirstName: "Enter your First Name:",
        promptLastName: "Enter your Last Name:",
        promptEmail: "Enter your University Email Address:",
        promptPassword: "Password:",
        promptConfirmPassword: "Confirm Password:",
        existingUserError: "An account with this email already exists. Please use 'sign-in' or 'reset-password'.",
        signUpError: "Failed to create account. Please try again.",
        confirmationRequired: "Account created. Please check your email ({email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.",
        accountVerified: "Account verified/created.",
      },
      awaitingConfirmation: {
        checkFailed: "Email not confirmed yet. Please check your email or use 'resend'.",
        checkError: "Failed to check status. Please try again later.",
        resendSuccess: "Confirmation email resent to {email}.",
        resendError: "Failed to resend email. Please try again later.",
      },
      questioning: {
        progressIndicator: "Question {current}/{total}",
        completionMessage: "Registration questions complete.",
        // Add specific question labels/hints if not directly from schema? (TBD - prefer schema)
      },
      commands: {
        help: { /* ... */ },
        back: { /* ... */ },
        // ... other commands
      },
      validationErrors: {
        required: "This field is required.",
        invalidEmail: "Please enter a valid email address.",
        passwordMismatch: "Passwords do not match.",
        passwordTooShort: "Password must be at least 8 characters long.",
        invalidNumber: "Please enter a valid number.",
        outOfRange: "Please enter a number between {min} and {max}.",
        invalidSelection: "Invalid selection. Please choose from the available options.",
        invalidMultiSelectFormat: "Please enter numbers separated by spaces.",
        invalidRankingFormat: "Invalid format. Use '[OptionNumber]:[RankNumber]' separated by spaces/commas (e.g., 5:1 2:2 8:3).",
        rankingUniqueError: "Each option can only be ranked once.",
        rankingMinError: "Please rank at least {minRanked} options.",
        rankingStrictCountError: "Please rank exactly {minRanked} options.",
        // ... other specific validation messages from schema
      },
      // ... other categories as needed
    } as const; // Use 'as const' for stricter typing

    // Optional: Define a type for message keys for better intellisense/safety
    // type RegistrationMessageKey = keyof typeof registrationMessages | ... (recursive keyof)
    ```
3.  **Populate Messages:** Extract all hardcoded user-facing strings from `platform/src/app/register/machines/registrationDialogMachine.ts` and `platform/src/app/register/components/RegistrationDialog.tsx` and add them to the `registrationMessages` object under appropriate keys. Use placeholders like `{variableName}` for dynamic values.
4.  **Verification:** Ensure all relevant strings are captured and logically organized. Type checking should pass.

**TDD Anchors:**

*   Test that `registrationMessages` can be imported.
*   Test that specific message keys return the expected string value.
*   Test that functions using messages can correctly interpolate dynamic values (e.g., `formatMessage(registrationMessages.earlyAuth.confirmationRequired, { email: 'test@example.com' })`).

### 3.2 Machine Refactoring (`registrationDialogMachine.ts`)

**Objective:** Improve the testability and clarity of the XState machine by extracting logic, using SSOT messages, and adopting standard XState patterns for async operations.

**Specification:**

1.  **Use SSOT Messages:** Replace all hardcoded strings within the machine definition (state names, action/service parameters, context values used for display) with imports from `registrationMessages.ts`.
    ```typescript
    // Example within machine actions
    actions: {
      displayIntro: assign({
        outputLines: (ctx) => [...ctx.outputLines, { type: 'info', text: registrationMessages.intro.welcome }]
      }),
      displayExistingUserError: assign({
        outputLines: (ctx) => [...ctx.outputLines, { type: 'error', text: registrationMessages.earlyAuth.existingUserError }]
      }),
      // ...
    }
    ```
2.  **Extract Synchronous Logic:** Identify complex synchronous logic within actions or guards (e.g., input validation rules, skip logic based on `dependsOn`/`dependsValue`). Extract this logic into pure, testable functions defined outside the `createMachine` call. Update the machine's actions/guards to call these external functions.
    ```typescript
    // Outside createMachine
    function validateRankedChoiceInput(input: string, question: Question): { isValid: boolean; errorKey?: keyof typeof registrationMessages.validationErrors; context?: Record<string, any> } {
      // ... complex validation logic ...
      if (/* invalid format */) {
        return { isValid: false, errorKey: 'invalidRankingFormat' };
      }
      if (/* not unique */) {
         return { isValid: false, errorKey: 'rankingUniqueError' };
      }
      // ... etc ...
      return { isValid: true };
    }

    function shouldSkipQuestion(question: Question, formData: Record<string, any>): boolean {
      if (!question.dependsOn || !question.dependsValue) return false;
      const dependencyValue = formData[question.dependsOn];
      // ... logic to compare dependencyValue with question.dependsValue ...
      return /* skip condition met */;
    }

    // Inside createMachine
    // ...
    validateAnswer: assign((ctx, event) => {
      if (event.type !== 'INPUT_RECEIVED') return {};
      const currentQuestion = ctx.questions[ctx.currentQuestionIndex];
      let validationResult;
      if (currentQuestion.type === 'ranked-choice-numbered') {
        validationResult = validateRankedChoiceInput(event.value, currentQuestion);
      } else {
        // ... other validation calls ...
      }
      return {
        isValidAnswer: validationResult.isValid,
        validationErrorKey: validationResult.errorKey,
        validationErrorContext: validationResult.context,
      };
    }),

    isNextQuestionSkippable: (ctx) => {
       const nextQuestionIndex = ctx.currentQuestionIndex + 1; // Simplified - needs proper index calculation
       if (nextQuestionIndex >= ctx.questions.length) return false;
       const nextQuestion = ctx.questions[nextQuestionIndex];
       return shouldSkipQuestion(nextQuestion, ctx.formData);
    },
    // ...
    ```
3.  **Refactor Async Operations (`invoke`):** Rewrite asynchronous operations (e.g., `loadSavedState`, `signUpUser`, `checkConfirmationStatus`, `resendConfirmationEmail`, `submitRegistration`) to use the `invoke` pattern with `fromPromise`. Pass necessary context/event data to the invoked promise function. Handle results via `onDone` (for success) and `onError` (for failure) transitions or actions.
    ```typescript
    // Outside createMachine
    import { signUpUser as signUpUserAction } from '@/app/auth/actions'; // Assuming server action

    async function signUpService(context, event) {
      // Assuming email/password/name are collected in context or event
      const { email, password, firstName, lastName } = context; // Or extract from event payload
      try {
        const result = await signUpUserAction({ email, password, firstName, lastName });
        // Check result structure from server action
        if (result.error === 'user_already_exists') {
          return { status: 'existing_user' };
        }
        if (result.error) {
          throw new Error(result.error); // Let onError handle other errors
        }
        return { status: result.requiresConfirmation ? 'confirmation_required' : 'success', user: result.user };
      } catch (error) {
        throw error; // Propagate error to onError
      }
    }

    // Inside createMachine states
    // ...
    signingUp: {
      invoke: {
        id: 'signUpUserInvoke',
        src: signUpService, // Use the async function defined outside
        onDone: [
           { target: 'awaitingConfirmation', cond: (_, event) => event.data.status === 'confirmation_required', actions: ['storeUserEmail', /* ... */] },
           { target: 'questioning', cond: (_, event) => event.data.status === 'success', actions: ['storeUserSession', 'moveToFirstQuestion', /* ... */] },
           { target: 'promptingEmail', cond: (_, event) => event.data.status === 'existing_user', actions: ['displayExistingUserError'] } // Example: Go back or show error
        ],
        onError: {
          target: 'promptingPassword', // Example: Retry password on failure
          actions: ['displaySignUpError']
        }
      }
    },
    // ...
    ```
4.  **Strengthen Typing:** Ensure `context`, `events`, and service/action payloads/return types are strongly typed using TypeScript interfaces or types. Define the `Question` type accurately based on `config/registrationSchema.ts`.

**TDD Anchors:**

*   Test extracted validation functions (`validateRankedChoiceInput`, etc.) with various valid/invalid inputs.
*   Test extracted skip logic function (`shouldSkipQuestion`) with different `formData` states.
*   *(Machine unit tests will cover the integration of these functions)*

### 3.3 Machine Unit Tests (`@xstate/test`)

**Objective:** Verify the core logic of the `registrationDialogMachine` in isolation, including transitions, context updates, guards, and mocked actions/services.

**Specification:**

1.  **Create Test File:** Create `platform/src/app/register/machines/registrationDialogMachine.test.ts`.
2.  **Setup:**
    *   Import `createTestMachine` from `@xstate/test`.
    *   Import the refactored `registrationDialogMachine`.
    *   Import and mock external dependencies:
        *   Extracted validation/skip functions (using `vi.fn()`).
        *   Invoked services (e.g., `signUpService`, `checkConfirmationService`) using `vi.fn().mockResolvedValue(...)` or `mockRejectedValue(...)`.
        *   `registrationMessages` (can use actual import).
    *   Instantiate the test machine: `const testMachine = createTestMachine(registrationDialogMachine.withConfig({ services: { /* mocked services */ }, guards: { /* mocked guards if needed */ }, actions: { /* mocked actions if needed */ } }))`.
3.  **Write Tests (Red-Green-Refactor):**
    *   **Transitions:** Test specific event transitions from known states.
        ```typescript
        it('should transition from "intro" to "earlyAuth.promptingFirstName" on REGISTER_NEW event', () => {
          const nextState = testMachine.transition('intro', { type: 'REGISTER_NEW' });
          expect(nextState.matches('earlyAuth.promptingFirstName')).toBe(true);
        });
        ```
    *   **Context Updates:** Assert changes to `testMachine.context` after transitions.
        ```typescript
        it('should store first name in context on INPUT_RECEIVED in promptingFirstName state', () => {
          const name = 'Test';
          const state = testMachine.transition('earlyAuth.promptingFirstName', { type: 'INPUT_RECEIVED', value: name });
          // Assuming an action updates context.firstName
          expect(state.context.formData.firstName).toBe(name);
        });
        ```
    *   **Guards:** Test conditional transitions based on context.
        ```typescript
        it('should NOT transition from awaitingConfirmation on CONTINUE if check returns false', () => {
          // Mock checkConfirmationService to resolve { confirmed: false }
          // Setup machine context appropriately
          const state = testMachine.transition('awaitingConfirmation', { type: 'CONTINUE' });
          // Assert state remains 'awaitingConfirmation' or goes to an error substate
          expect(state.matches('awaitingConfirmation')).toBe(true); // Or appropriate target
        });

        it('should transition from awaitingConfirmation on CONTINUE if check returns true', () => {
           // Mock checkConfirmationService to resolve { confirmed: true }
           // Setup machine context appropriately
           const state = testMachine.transition('awaitingConfirmation', { type: 'CONTINUE' });
           expect(state.matches('questioning')).toBe(true);
        });
        ```
    *   **Actions/Services:** Mock actions/services and assert they are called.
        ```typescript
        it('should invoke signUpService on INPUT_RECEIVED in promptingConfirmPassword state', () => {
          const mockSignUpService = vi.fn().mockResolvedValue({ status: 'success' });
          const machineWithMock = registrationDialogMachine.withConfig({
            services: { signUpService: mockSignUpService }
          });
          const testMachineWithMock = createTestMachine(machineWithMock);

          // Transition to the state right before the service invocation
          const stateBeforeInvoke = /* ... transition to promptingConfirmPassword ... */;
          testMachineWithMock.transition(stateBeforeInvoke, { type: 'INPUT_RECEIVED', value: 'password123' });

          // Assert the mock service was called
          expect(mockSignUpService).toHaveBeenCalled();
          // Optionally check arguments: expect(mockSignUpService).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ type: 'INPUT_RECEIVED' }));
        });
        ```
    *   **Path Coverage:** Use `testModel.getShortestPathPlans()` or `testModel.getSimplePathPlans()` to generate test plans. Implement tests covering these paths.
        ```typescript
        // Example structure (details depend on @xstate/test version and setup)
        // const testModel = createModel(registrationDialogMachine).withEvents({ ... });
        // const plans = testModel.getSimplePathPlans();
        // plans.forEach(plan => {
        //   describe(plan.description, () => {
        //     plan.paths.forEach(path => {
        //       it(path.description, async () => {
        //         // Mock services/actions as needed for this path
        //         const machineWithMocks = registrationDialogMachine.withConfig({ ... });
        //         await path.test(machineWithMocks); // Execute the test path
        //       });
        //     });
        //   });
        // });
        ```

**TDD Anchors:**

*   Test initial state is `intro`.
*   Test `REGISTER_NEW` transition from `intro`.
*   Test `REGISTER_CONTINUE` transition (success and failure paths).
*   Test transitions through `earlyAuth` states (`promptingFirstName`, `promptingLastName`, `promptingEmail`, `promptingPassword`, `promptingConfirmPassword`, `signingUp`).
*   Test `signUpService` invocation and handling of `onDone` (success, confirmation_required, existing_user) and `onError`.
*   Test transitions and service calls within `awaitingConfirmation` (`CONTINUE`, `RESEND`, `EXIT`).
*   Test transitions within `questioning` state (`INPUT_RECEIVED`, `BACK`, `SAVE`, `EXIT`, `REVIEW`, `EDIT`, `SUBMIT`).
*   Test validation logic integration (via guards or actions calling extracted functions).
*   Test skip logic integration (via guards calling extracted functions).
*   Test `submitRegistration` service invocation and handling.
*   Test command handling in `reviewing` state (`EDIT`, `BACK`, `SUBMIT`).
*   Test command handling in `editing` state (`INPUT_RECEIVED`, `SAVE`, `EXIT`).

### 3.4 Component Refactoring (`RegistrationDialog.tsx`)

**Objective:** Align the component with the refactored machine and SSOT messages, simplifying its responsibilities.

**Specification:**

1.  **Use SSOT Messages:** Replace all hardcoded strings (prompts, errors, button text if any) with imports from `registrationMessages.ts`.
2.  **Simplify Props:** Review component props. Ensure it primarily receives necessary shell interaction functions (`addOutputLine`, `sendToShellMachine`) and context (`userSession`). Remove props related to direct state management that are now handled by `useMachine`.
3.  **Align with Machine State:** Ensure component rendering logic correctly interprets the `state` object received from `useMachine` (e.g., `state.matches(...)`, `state.context`).

**TDD Anchors:**

*   *(Component integration tests will verify rendering)*
*   Basic Smoke Test: Verify the component renders without crashing after refactoring (using a simple initial mock state).

### 3.5 Component Integration Tests (RTL/Vitest)

**Objective:** Verify the `RegistrationDialog` component renders correctly based on mocked machine states and dispatches the correct events via the mocked `send` function on user interaction.

**Specification:**

1.  **Cleanup Test File:** Delete all existing content in `platform/src/app/register/components/RegistrationDialog.test.tsx`. Add necessary imports (React, RTL, Vitest, component, mocks).
2.  **Implement Mocking:**
    *   Set up the Vitest mock for `@xstate/react`: `vi.mock('@xstate/react', () => ({ useMachine: vi.fn() }))`.
    *   Import the mocked `useMachine`.
3.  **Implement Test Helpers:** Define helper functions within the test file or a shared utility:
    ```typescript
    import { render, screen, fireEvent, act } from '@testing-library/react';
    import { mocked } from 'vitest';
    import { useMachine } from '@xstate/react';
    import { RegistrationDialog } from './RegistrationDialog'; // Adjust path
    import { registrationMessages } from '@/config/registrationMessages'; // Adjust path

    // Mock the hook
    vi.mock('@xstate/react');
    const mockUseMachine = mocked(useMachine);

    // Define a basic mock state structure (adjust based on actual machine context/states)
    interface MockState {
      value: string | Record<string, string>; // e.g., 'intro', { earlyAuth: 'promptingFirstName' }
      context: Record<string, any>; // Mock relevant context properties
      matches: (parentStateValue: string) => boolean;
    }

    // Mock send function
    const mockSend = vi.fn();

    // Helper to create a basic mock state
    const createMockState = (value: string | Record<string, string>, context: Record<string, any> = {}): MockState => ({
      value,
      context,
      matches: (parentValue) => {
        if (typeof value === 'string') {
          return value.startsWith(parentValue);
        }
        // Basic matching for nested states - adjust if needed
        const keys = parentValue.split('.');
        let current: any = value;
        for (const key of keys) {
          if (typeof current !== 'object' || current === null || !(key in current)) {
            return false;
          }
          current = current[key];
        }
        return true;
      },
    });

    // Helper to render with a specific initial state
    const renderWithMachineState = (initialState: MockState, props = {}) => {
      mockUseMachine.mockReturnValue([initialState, mockSend, undefined as any]);
      return render(<RegistrationDialog {...props} />);
    };

    // Helper to update the mock state and re-render (optional, might be complex)
    // const setMachineState = async (newState: MockState, rerender) => {
    //   mockUseMachine.mockReturnValue([newState, mockSend, undefined as any]);
    //   await act(async () => {
    //      rerender(<RegistrationDialog {...props} />); // Need to manage props
    //   });
    // };

    // Helper to get the mock send function
    const getMockSend = () => mockSend;

    // Reset mocks before each test
    beforeEach(() => {
      vi.clearAllMocks();
    });
    ```
4.  **Write Tests (Red-Green-Refactor):**
    *   **Structure:** Use `describe` blocks based on the machine state being mocked (e.g., `describe('when in state "earlyAuth.promptingFirstName"', () => { ... })`).
    *   **Setup:** Inside each `describe` or `it`, use `renderWithMachineState(createMockState(stateValue, stateContext))` to render the component in the desired state.
    *   **Test Rendering:** Assert that the correct UI elements (prompts, hints, options) are rendered based *only* on the provided `mockState.value` and `mockState.context`. Use `registrationMessages` for assertions.
        ```typescript
        it('should display the first name prompt', () => {
          const state = createMockState({ earlyAuth: 'promptingFirstName' });
          renderWithMachineState(state);
          expect(screen.getByText(registrationMessages.earlyAuth.promptFirstName)).toBeInTheDocument();
          // Assert prompt style/presence
        });
        ```
    *   **Test Event Dispatch:** Simulate user input/commands (e.g., using `fireEvent.change`, `fireEvent.submit` on the input field). Assert that the `mockSend` function was called with the correct event object.
        ```typescript
        it('should send INPUT_RECEIVED event on input submission', () => {
          const state = createMockState({ earlyAuth: 'promptingFirstName' });
          renderWithMachineState(state);
          const input = screen.getByRole('textbox'); // Adjust role/selector
          const send = getMockSend();

          fireEvent.change(input, { target: { value: 'TestName' } });
          fireEvent.submit(input); // Or simulate Enter key press

          expect(send).toHaveBeenCalledWith({ type: 'INPUT_RECEIVED', value: 'TestName' });
        });
        ```
    *   **Test Output Calls (Optional but Recommended):** If the component directly calls `addOutputLine` based on state (simulating entry/exit actions), mock `addOutputLine` prop and assert it was called correctly.
        ```typescript
        it('should call addOutputLine with welcome message on initial render in intro state', () => {
          const mockAddOutputLine = vi.fn();
          const state = createMockState('intro');
          renderWithMachineState(state, { addOutputLine: mockAddOutputLine });

          expect(mockAddOutputLine).toHaveBeenCalledWith(
             registrationMessages.intro.welcome, // Or relevant message key
             expect.any(String) // Or specific type 'info'
          );
        });
        ```
    *   **Focus:** Keep tests focused on a single state and a single interaction/event dispatch. Avoid testing complex sequences.

**TDD Anchors:**

*   **Rendering Tests (per state):**
    *   Test `intro` state renders welcome message.
    *   Test `earlyAuth.promptingFirstName` renders correct prompt.
    *   Test `earlyAuth.promptingLastName` renders correct prompt.
    *   Test `earlyAuth.promptingEmail` renders correct prompt.
    *   Test `earlyAuth.promptingPassword` renders correct prompt (masked).
    *   Test `earlyAuth.promptingConfirmPassword` renders correct prompt (masked).
    *   Test `awaitingConfirmation` renders correct message and prompt.
    *   Test `questioning` state renders correct question text, options, hint based on `mockState.context.currentQuestionIndex` and `mockState.context.questions`.
    *   Test `reviewing` state renders completion message and correct commands.
    *   Test `editing` state renders correct prompt/question.
    *   Test error substates display correct error messages from `registrationMessages`.
*   **Event Dispatch Tests (per interaction):**
    *   Test submitting input in `promptingFirstName` sends `INPUT_RECEIVED`.
    *   Test submitting input in `promptingLastName` sends `INPUT_RECEIVED`.
    *   Test submitting input in `promptingEmail` sends `INPUT_RECEIVED`.
    *   Test submitting input in `promptingPassword` sends `INPUT_RECEIVED`.
    *   Test submitting input in `promptingConfirmPassword` sends `INPUT_RECEIVED`.
    *   Test submitting `continue` in `awaitingConfirmation` sends `CONTINUE`.
    *   Test submitting `resend` in `awaitingConfirmation` sends `RESEND`.
    *   Test submitting answer in `questioning` sends `INPUT_RECEIVED`.
    *   Test submitting `back` command sends `BACK`.
    *   Test submitting `save` command sends `SAVE`.
    *   Test submitting `review` command sends `REVIEW`.
    *   Test submitting `edit [number]` command sends `EDIT` with payload.
    *   Test submitting `submit` command sends `SUBMIT`.

## 4. Verification & Review

*   **Code Reviews:** All code changes (refactoring, tests) must be reviewed via Pull Requests.
*   **Test Execution:** Ensure both machine unit tests and component integration tests pass consistently in CI.
*   **Manual Testing:** Perform manual walkthroughs of the registration flow in the integrated application to catch issues missed by automated tests.
*   **Holistic Review:** A final review should ensure the new testing strategy is effectively implemented and maintainable.

## 5. Future Considerations

*   **E2E Tests:** Implement end-to-end tests (e.g., using Playwright) to cover the full user flow, including interaction with the `TerminalShell` and backend integration, once the unit/integration layers are stable.
*   **Test Utilities:** Consider extracting common test setup logic (mock state creation, rendering helpers) into shared utility files.

---
*End of Specification*