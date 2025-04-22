// platform/src/app/register/components/RegistrationDialog.tsx
'use client';

import React, { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { questions as registrationQuestions } from '@/app/register/data/registrationQuestions'; // Assuming path is correct
import { signUpUser, checkUserVerificationStatus, resendConfirmationEmail } from '@/app/auth/actions';
import {
  submitRegistration,
  savePartialRegistration,
  loadPartialRegistration,
  deletePartialRegistration,
  // updateRegistration, // For later edit functionality
  // deleteRegistration, // For later delete functionality
  RegistrationState // Import the state type
} from '@/app/register/actions';
import { AuthActionResult } from '@/app/auth/actions'; // Import the type

// --- Types ---

type TerminalMode = 'main' | 'auth' | 'interest_capture' | 'registration' | 'awaiting_confirmation' | 'gamification'; // Add other modes as needed
type InternalDialogMode = 'initializing' | 'displaying_intro' | 'answering' | 'password_entry' | 'awaiting_confirmation' | 'completed' | 'error'; // Added displaying_intro

interface OutputLine {
  id: number;
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'warning' | 'info' | 'question' | 'prompt';
}

interface UserSession {
  isAuthenticated: boolean;
  email: string | null;
}

interface DialogProps {
  processInput: (input: string) => Promise<void>; // Dialog implements its command/input logic here
  addOutputLine: (text: string, type: OutputLine['type']) => void;
  changeMode: (newMode: TerminalMode, options?: { initialDialogState?: any }) => void;
  setDialogState: (newState: any) => void; // Updates state.dialogState[currentMode]
  currentDialogState: RegistrationDialogState | null | undefined; // The specific sub-state for this dialog
  userSession: UserSession | null; // Auth info
}

interface RegistrationDialogState {
  internalMode: InternalDialogMode; // Track internal state
  currentQuestionIndex: number;
  formData: Record<string, any>;
  passwordStep?: 'enter' | 'confirm'; // Track password entry stage
  error?: string | null;
  _lastInput?: string; // Test workaround: Property to trigger input handling
}

const TOTAL_QUESTIONS = registrationQuestions.length; // Use actual length

// --- Component ---

const RegistrationDialog: React.FC<DialogProps> = ({
  processInput: handleInputProp,
  addOutputLine,
  changeMode,
  setDialogState,
  currentDialogState,
  userSession,
}) => {
  const [state, setState] = useState<RegistrationDialogState>(
    () => currentDialogState || {
      internalMode: 'initializing',
      currentQuestionIndex: 0,
      formData: {},
      passwordStep: undefined,
      error: null,
      _lastInput: undefined,
    }
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const processedInputTriggerRef = useRef<string | undefined>(undefined);
  const isMountedRef = useRef(false); // Track mount status

  // --- Helper Functions ---

  const displayQuestion = useCallback((index: number) => {
    // This function now only focuses on displaying based on current state
    if (state.internalMode === 'answering' && index >= 0 && index < TOTAL_QUESTIONS) {
      const question = registrationQuestions[index];
      if (!question) return;
      addOutputLine(`${question.label} (${index + 1}/${TOTAL_QUESTIONS})`, 'question');
      if (question.hint) {
        addOutputLine(question.hint, 'info');
      }
    } else if (state.internalMode === 'password_entry' && index === -1) {
        if (state.passwordStep === 'enter') {
            addOutputLine("Password:", 'question');
            addOutputLine("Minimum 8 characters.", 'info');
        } else if (state.passwordStep === 'confirm') {
            addOutputLine("Confirm Password:", 'question');
        }
    } else if (state.internalMode === 'awaiting_confirmation') {
        const email = state.formData?.email || 'your email';
        addOutputLine(`Please check your email (${email}) for a confirmation link.`, 'output');
        addOutputLine(`Enter 'continue' here once confirmed, or 'resend' to request a new link.`, 'info');
    } else if (state.internalMode === 'completed') {
        addOutputLine("Registration questions complete.", 'output');
        addOutputLine("Available commands: submit, review, edit [number], back", 'info');
    }
  }, [addOutputLine, state.internalMode, state.passwordStep, state.formData?.email]);

  const handleAnswer = useCallback(async (answer: string) => {
    const questionDef = registrationQuestions[state.currentQuestionIndex];
    if (!questionDef || state.internalMode !== 'answering') return;

    // --- Validation ---
    let validationError: string | null = null;
    if (questionDef.required && !answer.trim()) {
      validationError = `${questionDef.label} is required.`;
    }
    // TODO: Add more validation

    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      addOutputLine(validationError, 'error'); // Display error
      if (questionDef.hint) addOutputLine(questionDef.hint, 'info'); // Display hint
      return; // Stop processing
    }

    // --- State Update ---
    const nextFormData = { ...state.formData, [questionDef.id]: answer };
    let nextIndex = state.currentQuestionIndex + 1; // Calculate potential next index
    let nextPasswordStep: 'enter' | 'confirm' | undefined = undefined;
    let nextInternalMode: InternalDialogMode = 'answering';

    if (questionDef.id === 'email') {
        nextIndex = -1; // Use special index for password steps
        nextPasswordStep = 'enter';
        nextInternalMode = 'password_entry';
    } else if (nextIndex >= TOTAL_QUESTIONS) {
        nextInternalMode = 'completed';
    }

    // Update state - rely on useEffect to display based on new state
    setState(prev => ({
      ...prev,
      internalMode: nextInternalMode,
      formData: nextFormData,
      currentQuestionIndex: nextIndex,
      passwordStep: nextPasswordStep,
      error: null, // Clear error on valid input
    }));

  }, [state.currentQuestionIndex, state.internalMode, state.formData, addOutputLine]);

  const handlePassword = useCallback(async (passwordInput: string) => {
     if (state.internalMode !== 'password_entry') return;

     if (state.passwordStep === 'enter') {
        if (passwordInput.length < 8) {
            setState(prev => ({ ...prev, error: "Password must be at least 8 characters." }));
            addOutputLine("Password must be at least 8 characters.", 'error');
            // Re-display prompt via effect
            return;
        }
        setState(prev => ({
            ...prev,
            formData: { ...prev.formData, password: passwordInput },
            passwordStep: 'confirm',
            error: null,
        }));
     } else if (state.passwordStep === 'confirm') {
        if (passwordInput !== state.formData.password) {
            setState(prev => ({
                ...prev,
                formData: { ...prev.formData, password: undefined },
                passwordStep: 'enter',
                error: "Passwords do not match.",
            }));
            addOutputLine("Passwords do not match.", 'error');
            // Re-display prompt via effect
            return;
        }

        setIsProcessing(true);
        setState(prev => ({ ...prev, error: null }));
        try {
            const result = await signUpUser({
                email: state.formData.email,
                password: passwordInput,
                firstName: state.formData.firstName,
                lastName: state.formData.lastName,
            });

            const needsConfirmation = result.message?.includes('check your email');

            if (result.success) {
                if (needsConfirmation) {
                     addOutputLine("Account created. Confirmation required.", 'success');
                     setState(prev => ({
                         ...prev,
                         internalMode: 'awaiting_confirmation',
                         currentQuestionIndex: -1, // Reset index for this mode
                         passwordStep: undefined,
                         formData: { ...prev.formData, password: undefined },
                     }));
                } else {
                    addOutputLine("Account created successfully.", 'success');
                    const nextIndex = 3; // Index of academicYear
                     setState(prev => ({
                        ...prev,
                        internalMode: 'answering',
                        currentQuestionIndex: nextIndex,
                        passwordStep: undefined,
                        error: null,
                        formData: { ...prev.formData, password: undefined },
                    }));
                }
            } else {
                const errorMessage = result.message || "Sign up failed.";
                 addOutputLine(errorMessage, 'error');
                 setState(prev => ({
                     ...prev,
                     error: errorMessage,
                     passwordStep: 'enter', // Reset to re-enter password
                     formData: { ...prev.formData, password: undefined }
                 }));
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";
            addOutputLine(message, 'error');
            setState(prev => ({
                ...prev,
                error: message,
                passwordStep: 'enter',
                formData: { ...prev.formData, password: undefined }
            }));
        } finally {
            setIsProcessing(false);
        }
     }
  }, [state.internalMode, state.passwordStep, state.formData, addOutputLine, changeMode]);

  const handleCommand = useCallback(async (command: string) => {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    setState(prev => ({ ...prev, error: null }));

    // --- Awaiting Confirmation Mode Commands ---
    if (state.internalMode === 'awaiting_confirmation') {
        if (cmd === 'continue') {
            setIsProcessing(true);
            try {
                const result = await checkUserVerificationStatus();
                if (result.success) {
                    addOutputLine("Email confirmed successfully!", 'success');
                    const nextIndex = 3;
                    setState(prev => ({
                        ...prev,
                        internalMode: 'answering',
                        currentQuestionIndex: nextIndex,
                    }));
                } else {
                    addOutputLine(result.message || "Email not confirmed yet.", 'error');
                    setState(prev => ({ ...prev, error: result.message }));
                }
            } catch (error) {
                 const message = error instanceof Error ? error.message : "Error checking verification.";
                 addOutputLine(message, 'error');
                 setState(prev => ({ ...prev, error: message }));
            } finally { setIsProcessing(false); }
            return; // Command handled
        } else if (cmd === 'resend') {
            setIsProcessing(true);
            try {
                const emailToResend = state.formData?.email;
                if (!emailToResend) throw new Error("Email not available.");
                const result = await resendConfirmationEmail({ email: emailToResend });
                addOutputLine(result.message || (result.success ? "Resend request sent." : "Failed."), result.success ? 'success' : 'error');
                if (!result.success) setState(prev => ({ ...prev, error: result.message }));
            } catch (error) {
                 const message = error instanceof Error ? error.message : "Error resending email.";
                 addOutputLine(message, 'error');
                 setState(prev => ({ ...prev, error: message }));
            } finally { setIsProcessing(false); }
            return; // Command handled
        }
        // Allow exit/help from this mode too
        if (!['exit', 'help'].includes(cmd)) {
             addOutputLine(`Invalid command. Use 'continue', 'resend', 'exit', or 'help'.`, 'error');
             return;
        }
    }

    // --- General Commands ---
    switch (cmd) {
      case 'next':
        if (state.internalMode === 'answering' && state.currentQuestionIndex < TOTAL_QUESTIONS - 1) {
             const nextIndex = state.currentQuestionIndex + 1;
             setState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
        } else { addOutputLine("Cannot go 'next'.", 'info'); }
        break;
      case 'prev':
         const lowerBound = (state.formData.email) ? 3 : 0; // Can't go back before Q3 if email entered
         if (state.internalMode === 'answering' && state.currentQuestionIndex > lowerBound) {
             const prevIndex = state.currentQuestionIndex - 1;
             setState(prev => ({ ...prev, currentQuestionIndex: prevIndex }));
         } else { addOutputLine("Cannot go back further.", 'info'); }
        break;
      case 'exit':
        if (userSession?.isAuthenticated) {
            setIsProcessing(true);
            try {
                const { password, _lastInput, ...saveData } = state.formData;
                await savePartialRegistration(saveData);
                addOutputLine("Progress saved.", 'success');
            } catch (error) { addOutputLine("Failed to save progress.", 'error'); }
            finally { setIsProcessing(false); }
        } else { addOutputLine("Progress saved locally.", 'success'); }
        changeMode('main');
        break;
      case 'submit':
         if (state.internalMode === 'completed') {
             setIsProcessing(true);
             try {
                 const formDataToSend = new FormData();
                 const { password, _lastInput, ...finalData } = state.formData;
                 Object.entries(finalData).forEach(([key, value]) => {
                     if (Array.isArray(value) || typeof value === 'object') {
                         formDataToSend.append(key, JSON.stringify(value));
                     } else if (value !== undefined && value !== null) {
                         formDataToSend.append(key, String(value));
                     }
                 });
                 const initialState: RegistrationState = { success: false, message: null, errors: {} };
                 const result = await submitRegistration(initialState, formDataToSend);
                 if (result.success) {
                     addOutputLine(result.message || "Registration submitted successfully!", 'success');
                     if (userSession?.isAuthenticated) { await deletePartialRegistration(); }
                     changeMode('main');
                 } else {
                     addOutputLine(result.message || "Submission failed.", 'error');
                     setState(prev => ({ ...prev, error: result.message }));
                 }
             } catch (error) {
                 const message = error instanceof Error ? error.message : "An unexpected error occurred.";
                 addOutputLine(message, 'error');
                 setState(prev => ({ ...prev, error: message }));
             } finally { setIsProcessing(false); }
         } else { addOutputLine("Please complete all questions before submitting.", 'warning'); }
         break;
      // TODO: Implement help, back, save, review, edit
      default:
        // Avoid showing error if it was handled by confirmation mode logic (already returned)
        addOutputLine(`Unknown command: ${command}`, 'error');
        break;
    }
  }, [state, userSession, addOutputLine, changeMode]);

  // Main Input Handler
  const handleDialogInput = useCallback(async (input: string) => {
    if (isProcessing) return;
    setState(prev => ({ ...prev, error: null }));

    addOutputLine(input, 'input');

    const potentialCommand = input.toLowerCase().trim();
    const commandWord = potentialCommand.split(' ')[0];
    const knownCommands = ['next', 'prev', 'exit', 'help', 'back', 'save', 'submit', 'review', 'edit', 'continue', 'resend'];

    // Route based on internal mode
    if (state.internalMode === 'answering') {
        if (knownCommands.includes(commandWord)) await handleCommand(potentialCommand);
        else await handleAnswer(input.trim());
    } else if (state.internalMode === 'password_entry') {
        if (knownCommands.includes(commandWord)) await handleCommand(potentialCommand); // Allow commands like exit?
        else await handlePassword(input.trim());
    } else if (state.internalMode === 'awaiting_confirmation') {
        // Let handleCommand deal with specific commands for this mode
        if (knownCommands.includes(commandWord)) await handleCommand(potentialCommand);
        else addOutputLine(`Invalid command. Use 'continue', 'resend', or 'exit'.`, 'error');
    } else if (state.internalMode === 'completed') {
        if (['submit', 'review', 'edit', 'back', 'exit', 'help'].includes(commandWord)) await handleCommand(potentialCommand);
        else addOutputLine(`Invalid command. Use 'submit', 'review', 'edit [number]', or 'back'.`, 'error');
    } else { // Initializing or error state
        if (knownCommands.includes(commandWord)) await handleCommand(potentialCommand);
        else addOutputLine(`Invalid command in current state.`, 'error');
    }
  }, [isProcessing, state, handleCommand, handlePassword, handleAnswer, addOutputLine]);

  // --- Effects ---

   // Effect for initial display (Intro)
   useEffect(() => {
     if (!isMountedRef.current && state.internalMode === 'initializing' && !currentDialogState) {
       addOutputLine("Welcome to the Philosothon registration form! Please answer the following questions. You can type 'help' for commands. Please submit your responses by **Thursday, April 24th at midnight**.", 'output');
       // Set mounted and transition state AFTER intro message is likely sent
       setTimeout(() => {
            isMountedRef.current = true;
            setState(prev => ({ ...prev, internalMode: 'answering' }));
       }, 10); // Small delay to allow intro message processing
     } else if (!isMountedRef.current) {
         // If resuming or starting not in initializing, just mark as mounted
         isMountedRef.current = true;
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [state.internalMode, currentDialogState, addOutputLine]);

   // Effect to display the current question or prompt based on state
   useEffect(() => {
     // Only display if the component is mounted and in a relevant mode
     if (isMountedRef.current && ['answering', 'password_entry', 'awaiting_confirmation', 'completed'].includes(state.internalMode)) {
        // Add a slight delay to ensure state update from intro effect completes
        const timer = setTimeout(() => {
            displayQuestion(state.currentQuestionIndex);
        }, 20); // Slightly longer delay
        return () => clearTimeout(timer); // Cleanup timer
     }
   }, [state.internalMode, state.currentQuestionIndex, state.passwordStep, displayQuestion]);


  // Effect to sync with currentDialogState prop changes (e.g., resuming)
  useEffect(() => {
    if (currentDialogState) {
      const { _lastInput: propInput, ...propStateWithoutTrigger } = currentDialogState;
      const { _lastInput: stateInput, ...currentStateWithoutTrigger } = state;
      if (JSON.stringify(propStateWithoutTrigger) !== JSON.stringify(currentStateWithoutTrigger)) {
          setState({ ...currentDialogState, internalMode: currentDialogState.internalMode || 'answering' });
          isMountedRef.current = true; // Ensure mounted if resuming
      }
    }
  }, [currentDialogState]);

  // Effect to update parent state (TerminalShell) when internal state changes
  useEffect(() => {
    const { _lastInput, ...stateToShare } = state;
    setDialogState(stateToShare);
  }, [state, setDialogState]);

  // --- Test Workaround: Trigger input handling via prop change ---
  useEffect(() => {
    const triggerValue = currentDialogState?._lastInput;
    if (triggerValue && triggerValue !== processedInputTriggerRef.current) {
      processedInputTriggerRef.current = triggerValue;
      // Ensure component is mounted before handling input
      if (isMountedRef.current) {
          handleDialogInput(triggerValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDialogState?._lastInput, handleDialogInput]);


  // --- Render ---
  return <div data-testid="registration-dialog-container" />;
};

export default RegistrationDialog;
