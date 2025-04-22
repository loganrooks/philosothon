'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { logInterest } from '../actions'; // Assuming action exists here

// --- Types (Mirroring DialogProps from architecture doc) ---
type TerminalMode = 'main' | 'interest_capture' | 'auth' | 'registration';
type OutputLineType =
  | 'input'
  | 'output'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'question'
  | 'prompt';

interface DialogProps {
  // processInput: (input: string) => Promise<void>; // Likely not needed if using form actions
  addOutputLine: (text: string, type?: OutputLineType) => void;
  changeMode: (newMode: TerminalMode, options?: { initialDialogState?: any }) => void;
  setDialogState: (newState: any) => void; // Updates state for the *current* mode
  currentDialogState: any; // The specific sub-state for this dialog
  userSession: { isAuthenticated: boolean; email: string | null } | null; // Auth info
}

// --- Form State ---
interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = {
  message: null,
  success: false,
};

// --- Submit Button Component (Removed) ---
// The form now submits automatically when Enter is pressed in the email field.

// --- InterestFormPlaceholder Component ---
const InterestFormPlaceholder: React.FC<DialogProps> = ({
  addOutputLine,
  changeMode,
  // setDialogState, // Not used in this simple placeholder
  // currentDialogState, // Not used
  // userSession, // Not used
}) => {
  const [state, formAction] = useFormState(logInterest, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const initMessagesAdded = useRef(false); // Flag to prevent double message add

  // Display initial message and focus input when mode activates
  useEffect(() => {
    // Ensure messages are added only once
    if (initMessagesAdded.current) {
      return;
    }
    initMessagesAdded.current = true;

    addOutputLine('--- Interest Registration ---', 'info');
    addOutputLine('γνῶθι σεαυτόν... 0xDEADBEEF...', 'output'); // Placeholder Greek/Hex
    addOutputLine('The full registration system is undergoing techne refinement.', 'output');
    addOutputLine('To express interest and receive updates, please provide your email address below.', 'output');
    addOutputLine('You will be notified when the full system is operational.', 'output');
    addOutputLine('-----------------------------', 'info');
    setShowForm(true); // Show form after initial messages
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once when the component mounts (mode activates)

  useEffect(() => {
    if (showForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showForm]);

  // Handle form submission result
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        addOutputLine(`Success: ${state.message}`, 'success');
        addOutputLine('Thank you for your interest!', 'output');
        // Optionally clear form or change mode after success
        // formRef.current?.reset();
        // setTimeout(() => changeMode('main'), 2000); // Example: return to main after 2s
        changeMode('main'); // Return to main immediately
      } else {
        addOutputLine(`Error: ${state.message}`, 'error');
        // Keep form visible to allow retry
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
      }
    }
  }, [state, addOutputLine, changeMode]);


  return (
    <div className="mt-2">
      {showForm && (
        <form ref={formRef} action={formAction}>
          <label htmlFor="email" className="block text-hacker-green mb-1">
            Email:
          </label>
          <input
            ref={inputRef}
            type="email"
            id="email"
            name="email"
            required
+           pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            className="w-full px-2 py-1 bg-gray-800 border border-medium-gray text-hacker-green focus:outline-none focus:ring-1 focus:ring-hacker-green"
            autoComplete="off"
          />
          {/* Submit button removed; form submits on Enter key press */}
        </form>
      )}
    </div>
  );
};

export default InterestFormPlaceholder;
