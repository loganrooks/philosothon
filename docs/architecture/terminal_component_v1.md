# Architecture: Modular Terminal Component (V1)

**Version:** 1.0
**Date:** 2025-04-21
**Author:** Architect Mode

## 1. Overview

This document outlines the proposed architecture for a modular and extensible terminal UI component in React. This design addresses the complexity issues encountered with the previous monolithic `RegistrationForm.tsx` implementation and provides a foundation for various interactive dialog flows, including registration, authentication, interest capture, and future gamification elements.

## 2. Goals

*   Create a reusable `Terminal` shell component responsible for the overall frame and global state.
*   Decouple specific interaction logic into distinct "dialog" components.
*   Manage state transitions between different modes robustly.
*   Define clear communication patterns between the shell and dialogs.
*   Ensure the architecture is easily extensible for new features and modes.

## 3. Component Structure

```mermaid
graph TD
    subgraph "Terminal UI"
        TerminalShell[Terminal Shell Component] -->|Renders| ActiveDialog{Active Dialog}
        TerminalShell -->|Displays| OutputHistory[Output History Display]
        TerminalShell -->|Renders| InputLine[Input Line Component]
        InputLine -- User Input --> TerminalShell
    end

    subgraph "Dialog Components (Examples)"
        ActiveDialog -- Implements --> InterestForm[InterestFormPlaceholder]
        ActiveDialog -- Implements --> AuthDialog[AuthDialog]
        ActiveDialog -- Implements --> RegistrationDialog[RegistrationDialog]
        ActiveDialog -- Implements --> GamificationDialog[GamificationDialog]
        ActiveDialog -- Implements --> MainMenuDialog[MainMenuDialog]
    end

    TerminalShell -- Manages State --> StateManagement[State Management (Reducer/Context/Machine)]
    StateManagement -- Determines --> ActiveDialog
    TerminalShell -- Passes Input --> ActiveDialog
    ActiveDialog -- Sends Output/Actions --> TerminalShell
```

**Component Responsibilities:**

*   **`TerminalShell`:**
    *   Renders the main terminal frame (background, borders).
    *   Manages core state: `mode`, `outputLines`, `commandHistory`, `isAuthenticated`, `userEmail`, `dialogState`, `pendingAction`, `error`.
    *   Renders `OutputHistory` and `InputLine`.
    *   Dynamically renders the `ActiveDialog` component based on `state.mode`.
    *   Handles global commands (`help`, `clear`, `exit`).
    *   Delegates mode-specific commands/input to the `ActiveDialog` via props.
    *   Provides functions (`addOutputLine`, `changeMode`, `setDialogState`) as props to the `ActiveDialog`.
*   **`InputLine`:**
    *   Renders the input prompt and text field.
    *   Captures user input and calls `onSubmit` prop.
    *   Receives `prompt` and `disabled` status as props.
*   **`OutputHistory`:**
    *   Renders the list of `OutputLine` objects.
    *   Manages scrolling.
    *   Receives `lines` array as prop.
*   **`ActiveDialog` (Dynamic):**
    *   Conditionally rendered by `TerminalShell` based on `state.mode`.
    *   Specific dialog components (e.g., `AuthDialog`, `RegistrationDialog`, `InterestFormPlaceholder`, `GamificationDialog`, `MainMenuDialog`) handle the UI, logic, and sub-state for their respective modes.
    *   Receives core state info (`userSession`) and interaction functions (`onSubmitCommand`, `addOutputLine`, `changeMode`, `setDialogState`, `currentDialogState`) as props.

## 4. State Management

*   **Recommendation:** `useReducer` hook within `TerminalShell` combined with React Context.
    *   `useReducer` is well-suited for managing the defined states (`mode`, `outputLines`, etc.) and transitions.
    *   A `dialogState: Record<TerminalMode, any>` field within the main state allows each dialog to manage its own specific sub-state (e.g., current step, form data) without cluttering the main state object.
    *   React Context can provide `dispatch` and global state (`isAuthenticated`, `userEmail`) to deeply nested components if necessary, but primary interaction for dialogs is via props.
*   **Future Consideration:** For highly complex flows (like multi-stage gamification with branching logic), migrating to a state machine library (e.g., XState) could offer better visualization, stricter transition control, and potentially easier debugging.

**Core State (`TerminalState`):**

```typescript
type TerminalMode = 'main' | 'auth' | 'interest_capture' | 'registration' | 'gamification' | /* ... other modes */ ;

interface OutputLine { id: number; text: string; type: 'input' | 'output' | 'error' | 'success' | 'warning' | 'info' | 'question' | 'prompt'; }

interface TerminalState {
  mode: TerminalMode;
  outputLines: OutputLine[];
  commandHistory: string[];
  historyIndex: number;
  isAuthenticated: boolean;
  userEmail: string | null;
  // Stores mode-specific sub-state, keyed by mode name
  dialogState: Record<string, any>; // e.g., { registration: { currentStep: 3, formData: {...} }, auth: { stage: 'awaitingPassword' } }
  pendingAction: boolean;
  error: string | null;
}
```

## 5. Communication & Command Routing

1.  **Input:** `InputLine` -> `TerminalShell` (`onSubmit` prop).
2.  **Processing:** `TerminalShell` parses input.
3.  **Global Commands:** Handled directly by `TerminalShell`'s reducer/logic. State updated.
4.  **Mode-Specific Input/Commands:** Delegated by `TerminalShell` to the current `ActiveDialog` via the `onSubmitCommand(input: string)` prop.
5.  **Dialog Logic:** The active dialog component processes the input based on its mode and `currentDialogState`.
6.  **Dialog Feedback:** The dialog uses props passed from `TerminalShell` to interact:
    *   `addOutputLine(text, type)`: Display messages in the history.
    *   `changeMode(newMode, options?)`: Request a transition to a different mode.
    *   `setDialogState(newState)`: Update its own sub-state within the main state structure (`state.dialogState[currentMode]`).
    *   Dialogs can also directly import and call Server Actions for backend operations.

## 6. Dialog Interface (Props)

Dialog components should expect props similar to this:

```typescript
interface DialogProps {
  // Function to send processed input/commands back to the shell if needed (less common)
  // OR more likely, the shell passes the raw input for the dialog to handle.
  // Let's refine: Shell passes raw input/command for dialog to process.
  processInput: (input: string) => Promise<void>; // Dialog implements its command/input logic here

  // Functions provided by the Shell for the Dialog to use
  addOutputLine: (text: string, type: OutputLine['type']) => void;
  changeMode: (newMode: TerminalMode, options?: { initialDialogState?: any }) => void;
  setDialogState: (newState: any) => void; // Updates state.dialogState[currentMode]

  // State provided by the Shell
  currentDialogState: any; // The specific sub-state for this dialog (state.dialogState[currentMode])
  userSession: { isAuthenticated: boolean; email: string | null } | null; // Auth info
}
```
*(Self-correction: Renamed `onSubmitCommand` to `processInput` for clarity - the dialog handles its own input processing)*

## 7. Extensibility

Adding a new mode involves:
1.  Defining the mode identifier (e.g., `'settings'`).
2.  Creating the corresponding dialog component (`SettingsDialog.tsx`) implementing `DialogProps`.
3.  Updating `TerminalShell` to render `SettingsDialog` when `state.mode === 'settings'`.
4.  Adding logic in relevant places (e.g., `MainMenuDialog`) to trigger `changeMode('settings')`.
5.  Updating the reducer to handle the `settings` mode state initialization/cleanup within `dialogState`.

## 8. Conclusion

This modular architecture separates concerns, making the terminal UI more manageable, testable, and extensible compared to the previous monolithic approach. It provides a clear pattern for adding new interactive flows while keeping the core shell component stable. The recommended state management approach (`useReducer` + Context, with potential for XState later) balances flexibility and structure.