# ADR: New Testing Strategy for XState RegistrationDialog

**Date:** 2025-04-25
**Status:** Proposed

## Context

The existing test suite (`platform/src/app/register/components/RegistrationDialog.test.tsx`) for the XState-based `RegistrationDialog` component has proven extremely difficult to maintain and fix. Key issues identified through multiple TDD and Debug cycles include:

*   **Fragility:** Tests frequently break due to timing issues (`REG-TEST-TIMING-001`), state initialization problems (`REG-TEST-STATE-INIT-001`), and environmental factors within Vitest/JSDOM.
*   **Verbosity & Complexity:** The primary testing pattern involves manually simulating the entire user flow (authentication, confirmation, answering multiple questions) within each test case to reach a specific state. This is extremely verbose (>50 lines of simulation per test), context-heavy, and prone to errors.
*   **Mocking Challenges:** While the critical `TypeError` with the `useMachine` mock has been resolved (commit `1a8c5b9`), reliably interacting with the mocked machine state and asserting transitions/events remains cumbersome with the manual simulation approach.
*   **Tooling Issues:** The large size of the test file (>3500 lines) has caused persistent problems with tooling (`apply_diff`, `search_and_replace`), hindering refactoring and fixing efforts.
*   **Lack of Clarity:** The current tests mix component rendering assertions, state setup simulation, and implicit machine logic verification, making them hard to understand and debug.

Given these persistent problems and user directive, the decision has been made to **abandon the current test suite** and design a new, robust, and maintainable testing strategy.

## Decision

We will adopt a **layered testing strategy** that separates the testing of the XState machine logic from the testing of the React component's integration with that machine. We will also implement a Single Source of Truth (SSOT) for UI messages and refactor the machine/component slightly for better testability.

**1. Layered Testing Approach:**

*   **Layer 1: Machine Unit Tests (XState v5 Actor Model)**
    *   **File:** `platform/src/app/register/machines/registrationDialogMachine.test.ts` (New file)
    *   **Focus:** Test the `registrationDialogMachine` logic in isolation using XState v5's actor model (`createActor`). Verify transitions, context updates, action execution, service invocations (mocked via `.provide()`), and guards by creating an actor, sending events, and inspecting state snapshots (`actor.getSnapshot()`).
    *   **Benefit:** Fast, reliable, framework-agnostic testing of core state logic using built-in v5 features.

*   **Layer 2: Component Integration Tests (React Testing Library + Vitest)**
    *   **File:** `platform/src/app/register/components/RegistrationDialog.test.tsx` (Replace existing content)
    *   **Focus:** Test the `RegistrationDialog` component's interaction with a *mocked* machine interface (`state`, `send`). Verify rendering based on `state`, event dispatch via `send` on user interaction, and calls to `addOutputLine`.
    *   **Mocking:** Use the standard Vitest mock for `@xstate/react`. Control the mocked `state` object returned by `useMachine` within tests using helpers.
    *   **Benefit:** Verifies UI rendering and event handling against the machine contract without running the full machine logic.

*   **Layer 3: E2E Tests (Playwright/Cypress - Future)**
    *   Test full user flows in a real browser environment, covering integration with `TerminalShell` and backend. (Out of scope for this ADR).

**2. Mocking/Controlling `useMachine` for Component Tests:**

*   Use `vi.mock('@xstate/react', () => ({ useMachine: vi.fn() }))`.
*   Use `mockedUseMachine.mockReturnValue([mockState, mockSend, undefined])` in `beforeEach` or tests.
*   Implement test helpers:
    *   `renderWithMachineState(initialState)`: Renders component with `useMachine` returning `initialState`.
    *   `setMachineState(newState)`: Updates mock return value and triggers re-render.
    *   `getMockSend()`: Returns the mocked `send` function for assertions.

**3. Test Setup:**

*   Machine tests use `createActor` and inspect snapshots (`actor.getSnapshot()`). Mock dependencies using `machine.provide()`.
*   Component tests use `renderWithMachineState(desiredState)` to directly render the component in the required state, eliminating lengthy simulation flows.

**4. SSOT for UI Messages:**

*   Create `platform/src/config/registrationMessages.ts`.
*   Define exported `registrationMessages` object with keys for prompts, errors, hints, etc.
*   Import and use these keys in the machine, component, and tests instead of hardcoded strings.

**5. Test Structure:**

*   Separate files: `registrationDialogMachine.test.ts` and `RegistrationDialog.test.tsx`.
*   Use `describe` blocks within files to group tests by machine state or component interaction type.

**6. Refactoring for Testability:**

*   **Machine (`registrationDialogMachine.ts`):**
    *   Extract complex validation and skip logic into separate, testable functions outside `createMachine`.
    *   Refactor async operations (`loadSavedState`, `signUpService`, etc.) to use `invoke` for easier mocking in machine tests.
    *   Ensure strong typing for context and events.
    *   Replace hardcoded strings with identifiers from `registrationMessages.ts`.
*   **Component (`RegistrationDialog.tsx`):**
    *   Replace hardcoded strings with identifiers from `registrationMessages.ts`.
    *   Minimize props, passing only essential shell interactions/context.

## Consequences

*   **Pros:**
    *   **Improved Reliability:** Separating machine logic tests from component tests reduces fragility caused by DOM/async/environment issues.
    *   **Maintainability:** Tests become smaller, focused, and easier to understand/debug. Eliminates massive simulation blocks.
    *   **Faster Feedback:** Machine unit tests run significantly faster than component tests.
    *   **Clearer Coverage:** Easier to reason about the coverage of state logic vs. UI integration.
    *   **SSOT:** Ensures UI consistency and makes tests less brittle to text changes.
    *   **Alignment:** Follows recommended practices for testing XState machines and React components.
*   **Cons:**
    *   **Initial Effort:** Requires rewriting the entire test suite and some refactoring.
    *   **New Dependency:** None specifically for machine testing (uses core `xstate`).
    *   **Mocking Overhead:** Requires careful setup for `.provide()` in machine tests and `useMachine` mock in component tests (though helpers mitigate this).
    *   **Gap:** Doesn't fully guarantee the component and machine work together perfectly in all scenarios (this is where E2E tests eventually help).

## Implementation Plan & Detailed Guidance

This plan outlines the steps for implementing the new testing strategy and associated refactoring. Specific guidance is provided for different modes involved.

**Phase 1: Setup & Refactoring (Code Mode)**

1.  **Implement SSOT for Messages:**
    *   **Action:** Create `platform/src/config/registrationMessages.ts`. Define and export a comprehensive `registrationMessages` constant object containing prompts, errors, hints, command descriptions, etc., used by the registration flow. Structure logically (e.g., nested by category).
    *   **Verification:** Ensure all user-facing strings from the machine and component are represented.

2.  **Refactor Machine (`registrationDialogMachine.ts`):**
    *   **Action (Code Mode):**
        *   Replace hardcoded strings with imports from `registrationMessages.ts`.
        *   Extract complex synchronous logic (validation, skip logic) into pure, testable functions outside `createMachine`. Update machine actions/guards to call these functions.
        *   Refactor asynchronous operations (`loadSavedState`, `signUpService`, `checkConfirmationService`, `resendConfirmationService`, `submitRegistrationFromMachineService`) to use `invoke` with `fromPromise`. Ensure inputs are passed correctly and outputs/errors are handled via `onDone`/`onError`.
        *   Ensure strong typing for context, events, and service inputs/outputs. Define the `Question` type accurately based on `registrationSchema.ts`.
    *   **Verification (Code Mode / TDD Mode):** Type checking passes. Basic manual testing of the component might reveal issues introduced during refactoring. Machine unit tests (Phase 2) will provide comprehensive verification.
    *   **Potential Pitfalls:** Incorrectly mapping service results/errors in `onDone`/`onError`; type mismatches; breaking existing logic during extraction.

4.  **Refactor Component (`RegistrationDialog.tsx`):**
    *   **Action (Code Mode):**
        *   Replace any remaining hardcoded strings with imports from `registrationMessages.ts`.
        *   Review props and ensure only necessary shell interactions (`addOutputLine`, `sendToShellMachine`) and context (`userSession`) are passed. Remove obsolete props related to direct state management.
    *   **Verification (Code Mode / TDD Mode):** Type checking passes. Component integration tests (Phase 3) will verify rendering and event handling.

**Phase 2: Machine Unit Testing (TDD Mode)**

4.  **Create Machine Test File:**
    *   **Action:** Create `platform/src/app/register/machines/registrationDialogMachine.test.ts`.
    *   **Setup:** Import `createActor` from `xstate`, the refactored `registrationDialogMachine`, and necessary mocks (e.g., for services, actions, guards to be provided).

5.  **Write Machine Unit Tests:**
    *   **Action (TDD Mode):** Follow Red-Green-Refactor strictly.
        *   **Setup Actor:** Create actor with mocked implementations: `const actor = createActor(registrationDialogMachine.provide({ services: { mockService: ... }, actions: { mockAction: ... } })).start();`
        *   **Test Transitions/Context:** Send events (`actor.send(...)`) and assert the resulting snapshot (`actor.getSnapshot().value`, `actor.getSnapshot().context`).
        *   **Test Actions/Services:** Assert that mocked functions provided via `.provide()` were called (`expect(mockServiceLogic).toHaveBeenCalledWith(...)`).
        *   **Test Guards:** Provide mock guards via `.provide()` or test transitions that should be allowed/blocked by guards based on context, asserting the resulting state.
        *   **Coverage:** Focus on testing critical paths, transitions, specific logic branches, and error states directly by sending sequences of events and asserting snapshots. Path generation utilities are not standard in v5; manual path/scenario testing is the norm.
    *   **Verification (TDD Mode):** All machine tests pass (`npm test -- registrationDialogMachine.test.ts`). Coverage meets requirements for critical logic.
    *   **Potential Pitfalls:** Incorrectly mocking implementations via `.provide()`; misunderstanding snapshot properties; timing issues if testing delays (use fake timers if necessary); incomplete coverage of important scenarios.
    *   **Debugging Tips:** Use `console.log` within mock implementations; inspect the full `actor.getSnapshot()` object; use XState inspector/visualizer with the machine definition.

**Phase 3: Component Integration Testing (TDD Mode)**

6.  **Cleanup Existing Component Test File:**
    *   **Action:** Delete all content within `platform/src/app/register/components/RegistrationDialog.test.tsx`. Add basic imports (React, RTL, Vitest, component).

7.  **Implement Test Helpers:**
    *   **Action (TDD Mode):** Implement `renderWithMachineState`, `setMachineState`, and `getMockSend` helpers within the test file or a shared test utility file. Ensure `renderWithMachineState` correctly sets the `mockReturnValue` *before* rendering. Ensure `setMachineState` updates the mock and triggers a re-render using RTL's `rerender`.

8.  **Write Component Integration Tests:**
    *   **Action (TDD Mode):** Follow Red-Green-Refactor.
        *   **Structure:** Use `describe` blocks for different machine states (e.g., `describe('when machine state is "earlyAuth.promptingFirstName"', ...)`).
        *   **Setup:** Use `renderWithMachineState(testState)` within each `describe` or `it` block to set the desired machine state for the test. Define `testState` objects mimicking the structure of XState's `State` object (including `value`, `context`, and a basic `matches` function).
        *   **Test Rendering:** Assert the component renders the correct UI elements (prompts from `registrationMessages`, hints, options, input type) based *only* on the provided `mockState`. Use RTL queries (`getByText`, `getByRole`, etc.).
        *   **Test Event Dispatch:** Simulate user input/commands using `fireEvent` or the `simulateInputCommand` helper (verify its reliability or simplify it). Use `getMockSend()` and assert that the correct event object (`{ type: 'EVENT_NAME', ...payload }`) was sent to the machine mock (`expect(mockSend).toHaveBeenCalledWith(...)`).
        *   **Test Output Calls:** Assert that `addOutputLine` was called with the expected messages (imported from `registrationMessages`) based on the provided `mockState` (simulating entry/exit actions).
    *   **Verification (TDD Mode):** All component tests pass (`npm test -- RegistrationDialog.test.tsx`). Tests cover rendering and event dispatch for key machine states.
    *   **Potential Pitfalls:** Mock state object doesn't accurately reflect the structure XState uses; `setMachineState` doesn't trigger re-render correctly; assertions accidentally rely on machine logic instead of just the mocked state; timing issues with `waitFor` if asserting asynchronous effects triggered by `send` (should be minimized by focusing on event dispatch). **Avoid testing complex sequences of interactions**; focus on single state rendering and single event dispatches.
    *   **Debugging Tips:** Use `screen.debug()` to inspect rendered DOM; `console.log` the `mockState` being passed; verify the `mockSend` function is captured correctly; ensure `waitFor` is used appropriately for asynchronous assertions related to `addOutputLine` calls.

**Phase 4: Review & Integration (Architect / Holistic Reviewer / Integration Mode)**

9.  **Review:**
    *   **Action:** Review machine tests for coverage and correctness. Review component tests for clarity, focus (testing integration, not logic), and proper use of mocks/helpers. Ensure adherence to SSOT.
    *   **Verification:** Tests are reliable, maintainable, and cover critical aspects of the machine and component integration.

10. **Integration:**
    *   **Action:** Ensure the refactored component and machine integrate correctly within the `TerminalShell`.
    *   **Verification:** Manual testing of the registration flow within the running application. E2E tests (future).

## Guidance for Specific Modes

*   **TDD Mode:**
    *   **Machine Tests:** Strictly follow Red-Green-Refactor. Focus on one transition, context update, or action/service call at a time. Use `createActor`, `.send()`, `.getSnapshot()`, and `.provide()` for mocking.
    *   **Component Tests:** Strictly follow Red-Green-Refactor. Use helpers (`renderWithMachineState`, `setMachineState`). **Focus tests on:** 1) Does the UI render correctly given a specific `mockState`? 2) Does user interaction call `send` with the correct event object? 3) Does the component call `addOutputLine` correctly based on `mockState`? **Do NOT** test sequences of interactions or complex state logic here.
    *   **Tooling:** Use targeted test runs (`-t`). Commit frequently. If `apply_diff` fails, **verify file state** before retrying or use `insert_content`. Be mindful of context window.
*   **Code Mode:**
    *   Focus on implementing the refactoring steps cleanly (extracting logic, using `invoke`, implementing SSOT).
    *   Ensure strong typing throughout.
    *   Run type checks frequently.
*   **Debug Mode:**
    *   **Machine Issues:** Use XState inspector/visualizer; add logging within machine actions/services provided via `.provide()`; inspect `actor.getSnapshot()`.
    *   **Component Issues:** Use `screen.debug()`; log props and `mockState`; check mock setup (`mockReturnValue`); verify `send` is called correctly; check `addOutputLine` calls.
    *   **Environment Issues:** If tests behave inconsistently (pass in isolation, fail in suite), suspect mock cleanup issues (`beforeEach`/`afterEach`), fake timer conflicts, or Vitest caching (`--no-cache`). Isolate the failing test.

This enhanced strategy provides a clearer, more robust path forward for testing the `RegistrationDialog`.