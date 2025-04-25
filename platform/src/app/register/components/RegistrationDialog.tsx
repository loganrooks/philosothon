'use client';

import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { registrationDialogMachine } from '../machines/registrationDialogMachine'; // Adjust path as needed

// Define types (can potentially be shared with machine file)
type DialogMode = 'loadingSavedState' | 'intro' | 'earlyAuth' | 'awaitingConfirmation' | 'questioning' | 'review' | 'submitting' | 'success' | 'submissionError';

interface DialogProps {
  addOutputLine: (line: string | React.ReactNode, options?: { timestamp?: boolean; type?: 'input' | 'output' | 'error' | 'system' | 'hint' }) => void;
  sendToShellMachine: (event: any) => void;
  // Removed setDialogState, clearDialogState, changeMode as machine handles state
  userSession: any; // Replace 'any' with actual UserSession type
  dialogState: Record<string, any>; // Keep for potential initial state loading? Or remove if machine handles loading.
  onInput: (input: string) => void; // Assuming this prop exists for handling input submission
}

// Define ShellInteractions type matching the one in the machine
interface ShellInteractions {
  addOutputLine: (line: string | React.ReactNode, options?: { timestamp?: boolean; type?: 'input' | 'output' | 'error' | 'system' | 'hint' }) => void;
  sendToShellMachine: (event: any) => void;
}


const RegistrationDialog: React.FC<DialogProps> = ({
  addOutputLine,
  sendToShellMachine,
  userSession,
  dialogState, // May not be needed if machine handles loading entirely
  onInput,
}) => {

  // Prepare shell interactions object for the machine context
  const shellInteractions: ShellInteractions = {
    addOutputLine,
    sendToShellMachine,
  };

  // Use the XState machine
  const [state, send] = useMachine(registrationDialogMachine, {
    // Pass initial context, including shell interactions
    input: {
        shellInteractions: shellInteractions,
        // Potentially load initial state from dialogState prop here if needed,
        // but the machine's 'loadingSavedState' state handles localStorage loading.
    }
  });

  // Input state managed locally within the component
  const [currentLocalInput, setCurrentLocalInput] = React.useState('');

  // Handle input changes locally
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentLocalInput(event.target.value);
  };

  // Handle form submission - send event to the machine
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = currentLocalInput.trim();
    setCurrentLocalInput(''); // Clear local input field

    // Echo input to the output
    addOutputLine(`> ${input}`, { type: 'input' });

    // Check for global commands first (e.g., help, exit) - Machine can handle this internally
    // Or handle basic commands here and send specific events
    const lowerInput = input.toLowerCase();
    const commandParts = lowerInput.split(' ');
    const command = commandParts[0];
    const args = commandParts.slice(1);

    // Simple command check - refine based on machine's event structure
    if (['help', 'exit', 'back', 'save', 'review', 'edit', 'submit', 'continue', 'resend', 'retry', 'register', 'sign-in'].includes(command)) {
         // Handle 'register new' and 'register continue' specifically if needed before sending command
         if (command === 'register' && args[0] === 'new') {
             send({ type: 'COMMAND_RECEIVED', command: 'register new' });
         } else if (command === 'register' && args[0] === 'continue') {
             send({ type: 'COMMAND_RECEIVED', command: 'register continue' });
         } else {
            send({ type: 'COMMAND_RECEIVED', command: command, args: args });
         }
    } else {
      // If not a recognized command, assume it's input for the current state
      send({ type: 'INPUT_RECEIVED', value: input });
    }
  };

  // Determine if the input should be treated as a password
  const isPasswordInput =
    state.matches('earlyAuth.promptingPassword') ||
    state.matches('earlyAuth.promptingConfirmPassword');

  // --- UI Rendering ---
  // The machine's entry/exit actions handle displaying prompts via addOutputLine.
  // This component mainly provides the input form.

  return (
    <div>
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-2">
        {/* Display prompt indicator based on machine state if needed, though machine handles prompts */}
        {/* Example: <span className="text-hacker-green">{getPromptIndicator(state)}</span> */}
        <input
          type={isPasswordInput ? 'password' : 'text'}
          value={currentLocalInput}
          onChange={handleInputChange}
          className="bg-transparent text-hacker-green border-none outline-none w-full font-mono"
          autoFocus
          // Add other necessary input attributes (e.g., name, id)
        />
        {/* Hidden submit button to allow Enter key submission */}
        <button type="submit" style={{ display: 'none' }} aria-hidden="true"></button>
      </form>

      {/* Optional: Display current machine state for debugging */}
      {/* <pre className="text-xs text-gray-500 mt-4">
        State: {JSON.stringify(state.value)} | Context: {JSON.stringify(state.context, null, 2)}
      </pre> */}
    </div>
  );
};

export default RegistrationDialog;

// Removed old useRegistrationReducer hook and related code.
// Removed old useEffect hooks for intro text, prompt display, localStorage check.
// Removed old useCallback handlers (handleGlobalCommand, handleAwaitingConfirmationInput, etc.).
// State management and side effects are now primarily handled by the XState machine.