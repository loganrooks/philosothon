'use client';

import React, { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { registrationDialogMachine } from '../machines/registrationDialogMachine'; // Adjust path as needed

// Define types (can potentially be shared with machine file)
type DialogMode = 'loadingSavedState' | 'intro' | 'earlyAuth' | 'awaitingConfirmation' | 'questioning' | 'review' | 'submitting' | 'success' | 'submissionError';

interface DialogProps {
  addOutputLine: (line: string | React.ReactNode, options?: { timestamp?: boolean; type?: 'input' | 'output' | 'error' | 'system' | 'hint' }) => void;
  sendToShellMachine: (event: any) => void; // Added back prop
  userSession: any; // Replace 'any' with actual UserSession type
  // currentPrompt prop removed - dialog generates its own prompt
  // dialogState prop likely not needed if machine handles loading
  // onInput prop likely not needed as dialog handles its own form submission
}

// Define ShellInteractions type matching the one in the machine
interface ShellInteractions {
  addOutputLine: (line: string | React.ReactNode, options?: { timestamp?: boolean; type?: 'input' | 'output' | 'error' | 'system' | 'hint' }) => void;
  sendToShellMachine: (event: any) => void; // Added back - required by machine context
}


const RegistrationDialog: React.FC<DialogProps> = ({
  addOutputLine,
  sendToShellMachine, // Added back prop
  userSession,
  // Removed currentPrompt, dialogState and onInput from destructuring
}) => {

  // Prepare shell interactions object for the machine context
  const shellInteractions: ShellInteractions = {
    addOutputLine,
    sendToShellMachine, // Added back - required by machine context
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

  // Generate prompt based on machine state
  const generatePrompt = () => {
    const { currentQuestionIndex, questions } = state.context;
    const totalQuestions = questions.length; // Should be 41

    // Use a consistent format, adjusting index display for non-questioning states
    let displayIndex = '?';
    if (state.matches('questioning') || state.matches('editing')) {
        // Ensure index is valid before accessing questions
        if (currentQuestionIndex >= 0 && currentQuestionIndex < totalQuestions) {
             // Display 1-based index for user
            displayIndex = (currentQuestionIndex + 1).toString();
        }
    } else if (state.matches('earlyAuth')) {
        // Show early auth step number (0-4) + 1
        displayIndex = (currentQuestionIndex + 1).toString();
    } else if (state.matches('awaitingConfirmation')) {
        displayIndex = 'confirm';
    } else if (state.matches('reviewing')) {
        displayIndex = 'review';
    } else if (state.matches('submitting') || state.matches('submissionError')) {
        displayIndex = 'submit';
    } else if (state.matches('success')) {
        displayIndex = 'done';
    } else {
        // Default for intro, loading, etc.
        displayIndex = 'init';
    }

    // Use totalQuestions (should be 41) consistently
    return `[reg ${displayIndex}/${totalQuestions}]> `;
  };

  const displayPrompt = generatePrompt();

  return (
    <div>
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-2">
        {/* Wrap prompt and input in a flex container */}
        <div className="flex items-baseline"> {/* Added items-baseline */}
          <span className="text-hacker-green mr-2">{displayPrompt}</span>
          <input
            type={isPasswordInput ? 'password' : 'text'}
          value={currentLocalInput}
          onChange={handleInputChange}
          className="bg-transparent text-hacker-green border-none outline-none w-full font-mono"
          autoFocus
          // Add other necessary input attributes (e.g., name, id)
          />
        </div>
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