'use client';

import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { questions } from '@/app/register/data/registrationQuestions'; // Use correct named import 'questions'
// import useLocalStorage from '@/lib/hooks/useLocalStorage'; // Will be mocked
// import { checkEmailConfirmation } from '@/app/register/actions'; // Removed - Function does not exist
import * as regActions from '@/app/register/actions'; // Keep for other mocks if needed
import { checkCurrentUserConfirmationStatus } from '@/app/register/actions'; // Import the new server action
import { initiateOtpSignIn } from '@/lib/data/auth'; // Import the correct OTP function
// Removed resendConfirmationEmail as it's not used here and doesn't exist in auth DAL

// Define types based on V2 Architecture / Test Mocks (Refine as needed)
type DialogMode = 'intro' | 'early_auth' | 'questioning' | 'awaiting_confirmation' | 'review' | 'submitting' | 'success' | 'error';

interface DialogProps {
  addOutputLine: (line: string | React.ReactNode, options?: { timestamp?: boolean; type?: 'input' | 'output' | 'error' | 'system' | 'hint' }) => void; // Added 'hint'
  sendToShellMachine: (event: any) => void; // Type based on XState machine if used
  setDialogState: (key: string, value: any) => void;
  clearDialogState: () => void;
  userSession: any; // Replace 'any' with actual UserSession type
  dialogState: Record<string, any>;
  onInput: (input: string) => void; // Assuming TerminalShell provides this
  changeMode: (mode: DialogMode) => void;
}

// --- State Management Hook ---
export interface RegistrationState {
  mode: DialogMode;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  isSubmitting: boolean;
}

export type RegistrationAction =
  | { type: 'SET_MODE'; payload: DialogMode }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_INDEX'; payload: number }
  | { type: 'SET_ANSWER'; payload: { stepId: string; answer: any } }
  | { type: 'LOAD_STATE'; payload: Partial<RegistrationState> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END' };

export const registrationInitialState: RegistrationState = {
  mode: 'intro',
  currentQuestionIndex: 0,
  answers: {},
  isSubmitting: false,
};

// Define steps for early auth (kept separate for potential use outside hook)
export const earlyAuthSteps = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];

function registrationReducer(state: RegistrationState, action: RegistrationAction): RegistrationState {
  switch (action.type) {
    case 'SET_MODE':
      const shouldResetIndex = state.mode !== action.payload;
      // Start questioning at index 3 ('academicYear'), otherwise 0 unless already questioning
      const startIndex = (action.payload === 'questioning' && shouldResetIndex) ? 3 : (action.payload !== 'questioning' ? 0 : state.currentQuestionIndex);
      return { ...state, mode: action.payload, currentQuestionIndex: startIndex };
    case 'NEXT_STEP':
      // TODO: Add logic for end of questions
      return { ...state, currentQuestionIndex: state.currentQuestionIndex + 1 };
    case 'PREV_STEP':
      return { ...state, currentQuestionIndex: Math.max(0, state.currentQuestionIndex - 1) };
    case 'SET_INDEX':
       return { ...state, currentQuestionIndex: action.payload };
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.stepId]: action.payload.answer,
        },
      };
    case 'LOAD_STATE':
        // Type guard to ensure payload exists for LOAD_STATE
        if (action.type === 'LOAD_STATE') {
          const newState = { ...state, ...action.payload };
          return newState;
        }
        // Removed erroneous return statements here
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_END':
      return { ...state, isSubmitting: false };
    default:
      return state;
  }
}

export function useRegistrationReducer(initialDialogState?: Partial<RegistrationState>) {
  const [state, dispatch] = useReducer(registrationReducer, { ...registrationInitialState, ...initialDialogState });
  return { state, dispatch };
}
// --- End State Management Hook ---


const RegistrationDialog: React.FC<DialogProps> = ({
  addOutputLine,
  sendToShellMachine,
  setDialogState,
  clearDialogState,
  userSession,
  dialogState,
  onInput, // Assuming this prop exists for handling input submission
  changeMode,
}) => {
  // Use the custom hook, passing the dialogState prop for initialization
  const { state, dispatch } = useRegistrationReducer(dialogState);

  const [currentInput, setCurrentInput] = useState(''); // Example input state
  const [showPrompt, setShowPrompt] = useState(true); // Flag to control prompt display after errors

  // Note: isSubmitting state is now handled by the hook's reducer

  // Determine current step ID based on state
  const currentStepId = state.mode === 'early_auth' ? earlyAuthSteps[state.currentQuestionIndex] : null;

  // Removed useEffect for dialogState synchronization as it's handled during initialization now.


  // Effect for initial intro text
  useEffect(() => {
    if (state.mode === 'intro') {
      addOutputLine("Welcome to the Philosothon Registration!"); // TODO: Get full text
      addOutputLine("We need to collect some information to get you started.");
      dispatch({ type: 'SET_MODE', payload: 'early_auth' });
    }
  }, [state.mode, addOutputLine]); // Run only once when mode becomes 'intro' initially

  // Effect to display current prompt based on state.mode and currentStepId
    // Removed debug log
  useEffect(() => {
    if (!showPrompt) {
      setShowPrompt(true); // Reset flag for next interaction
      return; // Don't show prompt if flag was false
    }

    if (state.mode === 'early_auth') {
       const currentStepId = earlyAuthSteps[state.currentQuestionIndex]; // Get step ID for early auth
       if (currentStepId) { // Check if step ID is valid
        switch (currentStepId) {
          case 'firstName':
          addOutputLine("Please enter your First Name:");
          break;
        case 'lastName':
          addOutputLine("Please enter your Last Name:");
          break;
        case 'email':
           addOutputLine("Please enter your University Email Address:");
           break;
        case 'password':
            addOutputLine("Please create a password (min. 8 characters):");
            break;
        case 'confirmPassword':
            addOutputLine("Please confirm your password:");
            break;
        default:
          // Handle end of early auth or invalid index
          break;
      }
    }
    } else if (state.mode === 'questioning') {
      // Ensure we only display prompts when the index is valid for questioning mode
      if (state.currentQuestionIndex >= 3) { // Index 3 is 'academicYear'
        const currentQuestion = questions[state.currentQuestionIndex];
        if (currentQuestion) {
          addOutputLine(currentQuestion.label); // Display label
          if (currentQuestion.hint) {
            addOutputLine(currentQuestion.hint, { type: 'hint' }); // Display hint
          }
          if (currentQuestion.options) {
            // Format options as numbered list
            const optionsText = currentQuestion.options
              .map((opt, index) => `${index + 1}: ${opt}`)
              .join('\n');
            addOutputLine(optionsText);
          }
          // TODO: Add prompt indicator like [reg 4/47]> (adjusting for 0-based index vs 1-based display)
        } else {
          // Handle end of questions or invalid index
          addOutputLine("Error: Could not find next question.", { type: 'error' });
          // Potentially change mode or show summary
        }
      }
    } else if (state.mode === 'awaiting_confirmation') {
        // Display prompt when entering this mode
        const confirmationPrompt = `Account created. Please check your email (${state.answers.email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`;
        addOutputLine(confirmationPrompt);
    }
    // Add other modes (review, success, error)
  // Reverted dependencies
  }, [state.mode, state.currentQuestionIndex, state.answers, addOutputLine, showPrompt]); // Added showPrompt

  // Effect to check for saved progress on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('philosothon-registration-v3.1');
      if (savedData) {
        // Basic check if data exists, no need to fully parse here for the prompt
        addOutputLine('Existing registration progress found. Use "register continue" to resume.', { type: 'system' });
      }
    } catch (error) {
      // Ignore errors reading localStorage on mount for this prompt
      console.error("Error checking localStorage on mount:", error);
    }
    // Run only once on mount, addOutputLine is a dependency
  }, [addOutputLine]);


  // Simplified input handling - will need refinement based on tests
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(event.target.value);
  };

  // Async function to handle the sign-up process (Moved before handleSubmit)
  const handleSignUp = useCallback(async () => {
      // Check isSubmitting state from reducer
      if (state.isSubmitting) return;
      dispatch({ type: 'SUBMIT_START' });
      addOutputLine("Creating account...");

      const { email, password, firstName, lastName } = state.answers;

      // Password match already validated in handleSubmit

      try {
          // Call the initiateOtpSignIn function from DAL
          const { data, error } = await initiateOtpSignIn(email);

          if (error) {
              // Handle OTP initiation error
              setShowPrompt(false); // Prevent default prompt display
              addOutputLine(`Error initiating sign-in: ${error.message || 'Unknown error'}`, { type: 'error' });
              // Reset the state to the password step index. The useEffect hook will handle re-prompting.
              const passwordStepIndex = earlyAuthSteps.indexOf('password');
              if (passwordStepIndex !== -1) {
                dispatch({ type: 'SET_INDEX', payload: passwordStepIndex });
              }
          } else {
              // OTP initiated successfully
              // Construct the confirmation message using the email from the state
              const confirmationMessage = `Account created. Please check your email (${state.answers.email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`;
              // addOutputLine(confirmationMessage); // Message displayed by useEffect on mode change
              dispatch({ type: 'SET_MODE', payload: 'awaiting_confirmation' });
          }
      } catch (error) {
          setShowPrompt(false); // Prevent default prompt display
          addOutputLine(`An unexpected error occurred during sign-in initiation: ${error instanceof Error ? error.message : String(error)}`, { type: 'error' });
           // Re-prompt for confirm password
           addOutputLine("Please confirm your password:");
      } finally {
          dispatch({ type: 'SUBMIT_END' });
      }
  // Removed changeMode from dependencies as it's no longer called here
  }, [state.answers, state.isSubmitting, addOutputLine, dispatch, setDialogState]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => { // Make async
    event.preventDefault();
    const input = currentInput.trim();
    addOutputLine(`> ${input}`, { type: 'input' }); // Echo input
    onInput(input); // Pass input to TerminalShell/Dialog handler
    setCurrentInput(''); // Clear input field

    const currentQuestion = questions[state.currentQuestionIndex]; // Get current question for potential re-display
    const lowerInput = input.toLowerCase();

    // --- Global Command Handling (Executes regardless of mode) ---
    if (lowerInput === 'exit') {
        sendToShellMachine({ type: 'EXIT' });
        return;
    } else if (lowerInput === 'help') {
      const helpMessage = [
        "Available commands:",
        "  next      - Go to the next question (or press Enter with input)",
        "  back      - Go back to the previous question",
        "  review    - Show a summary of your answers",
        "  save      - Save your progress and exit",
        "  exit      - Exit without saving",
        "  help      - Show this help message",
        "  edit [n]  - Jump back to edit question number 'n'",
        "  register continue - Load saved progress",
      ].join('\n');
      addOutputLine(helpMessage);
      // Re-display current prompt (if applicable)
      setShowPrompt(false); // Prevent useEffect from re-displaying
      if (state.mode === 'questioning' && currentQuestion) {
        addOutputLine(currentQuestion.label);
        if (currentQuestion.hint) addOutputLine(currentQuestion.hint, { type: 'hint' });
        if (currentQuestion.options) {
          const optionsText = currentQuestion.options.map((opt, index) => `${index + 1}: ${opt}`).join('\n');
          addOutputLine(optionsText);
        }
      } else if (state.mode === 'early_auth' && currentStepId) {
         let prompt = "Please enter your First Name:";
         if (currentStepId === 'lastName') prompt = "Please enter your Last Name:";
         else if (currentStepId === 'email') prompt = "Please enter your University Email Address:";
         else if (currentStepId === 'password') prompt = "Please create a password (min. 8 characters):";
         else if (currentStepId === 'confirmPassword') prompt = "Please confirm your password:";
         addOutputLine(prompt);
      } else if (state.mode === 'awaiting_confirmation') {
         const confirmationPrompt = `Account created. Please check your email (${state.answers.email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`;
         addOutputLine(confirmationPrompt);
      }
      return;
    } else if (lowerInput === 'register continue') {
      addOutputLine("Loading saved progress...");
      try {
        const savedData = localStorage.getItem('philosothon-registration-v3.1');
        if (savedData) {
          const decodedData = atob(savedData);
          const parsedState: Partial<RegistrationState> = JSON.parse(decodedData);
          if (parsedState && typeof parsedState.currentQuestionIndex === 'number') {
            const stateToLoad = { ...parsedState, mode: 'questioning' as DialogMode };
            dispatch({ type: 'LOAD_STATE', payload: stateToLoad });
            addOutputLine("Registration progress loaded.");
            // Relying on useEffect triggered by state change to display prompt
          } else {
            throw new Error("Saved data is invalid or missing essential properties.");
          }
        } else {
          setShowPrompt(false); // Prevent default prompt display
          addOutputLine("No registration in progress found.", { type: 'error' });
          // Re-display current prompt based on the *current* state index
          const promptQuestion = questions[state.currentQuestionIndex];
           if (promptQuestion && state.mode === 'questioning') {
             addOutputLine(promptQuestion.label);
             if (promptQuestion.hint) addOutputLine(promptQuestion.hint, { type: 'hint' });
             if (promptQuestion.options) {
                const optionsText = promptQuestion.options.map((opt, index) => `${index + 1}: ${opt}`).join('\n');
                addOutputLine(optionsText);
             }
           } else {
             // Fallback if not in questioning or question not found (e.g., if continue is used in early_auth)
             addOutputLine("Please enter your First Name:"); // Or appropriate prompt for current mode
           }
        }
      } catch (error) {
        setShowPrompt(false); // Prevent default prompt display
        addOutputLine(`Failed to load saved progress. Data might be corrupted. Error: ${error instanceof Error ? error.message : String(error)}`, { type: 'error' });
         // Re-display current prompt based on the *current* state index
         const promptQuestion = questions[state.currentQuestionIndex];
         if (promptQuestion && state.mode === 'questioning') {
           addOutputLine(promptQuestion.label);
           if (promptQuestion.hint) addOutputLine(promptQuestion.hint, { type: 'hint' });
           if (promptQuestion.options) {
                const optionsText = promptQuestion.options.map((opt, index) => `${index + 1}: ${opt}`).join('\n');
                addOutputLine(optionsText);
            }
         } else {
             // Fallback if not in questioning or question not found (e.g., if continue is used in early_auth)
             addOutputLine("Please enter your First Name:"); // Or appropriate prompt for current mode
         }
      }
      return; // Prevent falling through after attempting load
    }

    // --- Mode-Specific Logic ---

    // --- Awaiting Confirmation Mode ---
    if (state.mode === 'awaiting_confirmation') {
       if (lowerInput === 'continue') {
           addOutputLine("Checking confirmation status...");
           try {
               const isConfirmed = await checkCurrentUserConfirmationStatus();
               if (isConfirmed) {
                   addOutputLine("Email confirmed. Starting registration questions...");
                   dispatch({ type: 'SET_MODE', payload: 'questioning' });
               } else {
                   setShowPrompt(false); // Prevent default prompt display
                   addOutputLine("Email not confirmed yet. Please check your email or use 'resend'.", { type: 'error' });
                   const confirmationPrompt = `Account created. Please check your email (${state.answers.email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`;
                   addOutputLine(confirmationPrompt);
               }
           } catch (error) {
                setShowPrompt(false); // Prevent default prompt display
                addOutputLine(`Error during confirmation check: ${error instanceof Error ? error.message : String(error)}`, { type: 'error' });
                const confirmationPrompt = `Account created. Please check your email (${state.answers.email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`;
                addOutputLine(confirmationPrompt);
           }
       } else if (lowerInput === 'resend') {
           const email = state.answers.email;
           if (!email) {
               setShowPrompt(false); // Prevent default prompt display
               addOutputLine("Error: Could not find email to resend confirmation.", { type: 'error' });
               const confirmationPrompt = `Account created. Please check your email for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`;
               addOutputLine(confirmationPrompt);
               return;
           }
           addOutputLine("Resending confirmation email...");
           try {
               const { error } = await initiateOtpSignIn(email);
               if (error) {
                   setShowPrompt(false); // Prevent default prompt display
                   addOutputLine(`Error resending confirmation: ${error.message || 'Unknown error'}`, { type: 'error' });
               } else {
                   addOutputLine("Confirmation email resent. Please check your inbox.");
               }
           } catch (error) {
               setShowPrompt(false); // Prevent default prompt display
               addOutputLine(`An unexpected error occurred during resend: ${error instanceof Error ? error.message : String(error)}`, { type: 'error' });
           } finally {
               // Always re-display the prompt after attempting resend
               const confirmationPrompt = `Account created. Please check your email (${email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`;
               addOutputLine(confirmationPrompt);
           }
       } else {
           setShowPrompt(false); // Prevent default prompt display
           addOutputLine(`Unknown command: ${input}. Please enter 'continue' or 'resend'.`);
           const confirmationPrompt = `Account created. Please check your email (${state.answers.email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`;
           addOutputLine(confirmationPrompt);
       }
       return; // Ensure no further processing after handling awaiting_confirmation input
    }

    // --- Early Auth Mode ---
    else if (state.mode === 'early_auth' && currentStepId) {
        let isValid = true;
        let errorMessage = "Input cannot be empty.";

        if (!input) {
            isValid = false;
        } else if (currentStepId === 'email') {
            if (!/\S+@\S+\.\S+/.test(input)) { isValid = false; errorMessage = "Invalid email format."; }
        } else if (currentStepId === 'password') {
            if (input.length < 8) { isValid = false; errorMessage = "Password must be at least 8 characters."; }
        } else if (currentStepId === 'confirmPassword') {
            if (input !== state.answers.password) { isValid = false; errorMessage = "Passwords do not match."; }
        }

        if (isValid) {
            setShowPrompt(true); // Ensure prompt shows for next step
            dispatch({ type: 'SET_ANSWER', payload: { stepId: currentStepId, answer: input } });
            if (currentStepId !== 'confirmPassword') {
                dispatch({ type: 'NEXT_STEP' });
            } else {
                handleSignUp();
            }
        } else {
            setShowPrompt(false); // Prevent default prompt display
            addOutputLine(errorMessage, { type: 'error' });
            let prompt = "Please enter your First Name:";
             if (currentStepId === 'lastName') prompt = "Please enter your Last Name:";
             else if (currentStepId === 'email') prompt = "Please enter your University Email Address:";
             else if (currentStepId === 'password') prompt = "Please create a password (min. 8 characters):";
             else if (currentStepId === 'confirmPassword') prompt = "Please confirm your password:";
            addOutputLine(prompt);
        }
        return; // Ensure no further processing after handling early_auth input
    }

    // --- Questioning Mode (Answer Handling) ---
    else if (state.mode === 'questioning') {
        // Commands specific to questioning mode
        if (lowerInput === 'review') {
          addOutputLine('--- Registration Summary ---');
          for (let i = 0; i < state.currentQuestionIndex; i++) {
            const question = questions[i];
            if (question && state.answers[question.id] !== undefined) {
              let displayAnswer = state.answers[question.id];
              if (typeof displayAnswer === 'boolean') displayAnswer = displayAnswer ? 'Yes' : 'No';
              else if (Array.isArray(displayAnswer)) displayAnswer = displayAnswer.join(', ');
              addOutputLine(`${question.label}: ${displayAnswer}`);
            }
          }
          addOutputLine("Enter 'continue' to proceed, 'submit' to finalize, or question number to edit.");
          setShowPrompt(false); // Prevent default prompt display
          if (currentQuestion) {
            addOutputLine(currentQuestion.label);
            if (currentQuestion.hint) addOutputLine(currentQuestion.hint, { type: 'hint' });
            if (currentQuestion.options) {
              const optionsText = currentQuestion.options.map((opt, index) => `${index + 1}: ${opt}`).join('\n');
              addOutputLine(optionsText);
            }
          }
          return;
        } else if (lowerInput === 'back') {
            dispatch({ type: 'PREV_STEP' });
            return;
        } else if (lowerInput === 'save') {
            try {
              const stateToSave = { answers: state.answers, currentQuestionIndex: state.currentQuestionIndex, mode: state.mode };
              const jsonState = JSON.stringify(stateToSave);
              const encodedState = btoa(jsonState);
              localStorage.setItem('philosothon-registration-v3.1', encodedState);
              addOutputLine("Progress saved.");
            } catch (error) {
              addOutputLine(`Error saving progress: ${error instanceof Error ? error.message : String(error)}`, { type: 'error' });
            }
            setShowPrompt(false); // Prevent default prompt display
            if (currentQuestion) {
              addOutputLine(currentQuestion.label);
              if (currentQuestion.hint) addOutputLine(currentQuestion.hint, { type: 'hint' });
              if (currentQuestion.options) {
                const optionsText = currentQuestion.options.map((opt, index) => `${index + 1}: ${opt}`).join('\n');
                addOutputLine(optionsText);
              }
            }
            return;
        } else if (lowerInput.startsWith('edit ')) {
          const parts = input.split(' ');
          if (parts.length !== 2) {
            setShowPrompt(false); // Prevent default prompt display
            addOutputLine("Invalid command format. Use 'edit [number]'.", { type: 'error' });
            return;
          }
          const numberStr = parts[1];
          const targetQuestionNumber = parseInt(numberStr, 10);
          if (isNaN(targetQuestionNumber)) {
             setShowPrompt(false); // Prevent default prompt display
             addOutputLine("Invalid command format. Use 'edit [number]'.", { type: 'error' });
             return;
          }
          const maxValidQuestionNumber = state.currentQuestionIndex;
          if (targetQuestionNumber < 1 || targetQuestionNumber > maxValidQuestionNumber) {
             setShowPrompt(false); // Prevent default prompt display
             const rangeMessage = `Invalid question number. Please enter a number between 1 and ${maxValidQuestionNumber}.`;
             addOutputLine(rangeMessage, { type: 'error' });
             return;
          }
          const targetIndex = targetQuestionNumber - 1;
          addOutputLine(`Jumping back to question ${targetQuestionNumber}...`);
          dispatch({ type: 'SET_INDEX', payload: targetIndex });
          return;
        }
        // --- Answer Handling ---
        else {
            if (!currentQuestion) {
                addOutputLine("Error: No current question found.", { type: 'error' });
                return;
            }

            let isValid = true;
            let errorMessage = "Invalid input.";
            let processedAnswer: any = input;

            // ... (Existing validation logic for boolean, single-select, multi-select, ranked-choice, text) ...
             if (currentQuestion.required && !input) {
                 isValid = false;
                 errorMessage = "Input cannot be empty.";
             } else if (currentQuestion.type === 'boolean') {
                 const lowerInput = input.toLowerCase();
                 if (lowerInput === 'y' || lowerInput === 'yes') processedAnswer = true;
                 else if (lowerInput === 'n' || lowerInput === 'no') processedAnswer = false;
                 else { isValid = false; errorMessage = "Invalid input. Please enter 'y' or 'n'."; }
             } else if (currentQuestion.type === 'single-select' || currentQuestion.type === 'scale') {
                  const choiceIndex = parseInt(input, 10);
                  if (isNaN(choiceIndex) || choiceIndex < 1 || (currentQuestion.options && choiceIndex > currentQuestion.options.length)) {
                      isValid = false;
                      errorMessage = "Invalid input. Please enter the number corresponding to your choice.";
                 } else if (currentQuestion.options) {
                      processedAnswer = currentQuestion.options[choiceIndex - 1];
                 } else {
                      processedAnswer = String(choiceIndex);
                 }
             }
             else if (currentQuestion.type === 'multi-select-numbered') {
                 const selectedNumbers: number[] = [];
                 const invalidInputs: string[] = [];
                 const parts = input.split(' ').filter(part => part !== '');

                 if (parts.length === 0 && currentQuestion.required) {
                     isValid = false;
                     errorMessage = "Input cannot be empty.";
                 } else {
                     parts.forEach(part => {
                         const num = parseInt(part, 10);
                         if (isNaN(num)) invalidInputs.push(part);
                         else if (!currentQuestion.options || num < 1 || num > currentQuestion.options.length) invalidInputs.push(part);
                         else { if (!selectedNumbers.includes(num)) selectedNumbers.push(num); }
                     });

                     if (invalidInputs.length > 0) {
                         isValid = false;
                         errorMessage = `Invalid input: "${invalidInputs.join('", "')}". Please enter space-separated numbers corresponding to your choices.`;
                     } else if (selectedNumbers.length === 0 && currentQuestion.required) {
                          isValid = false;
                          errorMessage = "Input cannot be empty.";
                     } else {
                         const selectedOptions = selectedNumbers
                             .sort((a, b) => a - b)
                             .map(num => currentQuestion.options ? currentQuestion.options[num - 1] : '')
                             .filter(option => option !== '');
                         processedAnswer = selectedOptions;
                     }
                 }
            } else if (currentQuestion.type === 'ranked-choice-numbered') {
               // --- Ranked Choice Validation ---
               isValid = true;
               errorMessage = '';
               const minRequiredRanks = currentQuestion.validationRules?.minRanked?.value ?? 3;
               const isStrictCount = currentQuestion.validationRules?.strict ?? false;
               const numOptions = currentQuestion.options?.length ?? 0;
               const maxRankValue = numOptions;
               const parsedEntries: { option: number; rank: number }[] = [];
               const seenOptions = new Set<number>();
               const seenRanks = new Set<number>();
               const entries = input.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
               const rankPattern = /^\d+:\d+$/;

               for (const entry of entries) {
                 if (!rankPattern.test(entry)) {
                    isValid = false;
                    const parts = entry.split(':');
                    if (parts.length === 2) {
                        if (isNaN(parseInt(parts[0], 10))) errorMessage = 'Invalid option number';
                        else if (isNaN(parseInt(parts[1], 10))) errorMessage = 'Invalid rank number';
                        else errorMessage = 'Invalid format. Use format "OptionNumber:Rank" separated by commas';
                    } else errorMessage = 'Invalid format. Use format "OptionNumber:Rank" separated by commas';
                    break;
                 }
                 const parts = entry.split(':');
                 const optionNum = parseInt(parts[0], 10);
                 const rankNum = parseInt(parts[1], 10);
                 if (optionNum < 1 || optionNum > numOptions) { isValid = false; errorMessage = `Invalid option number. Must be between 1 and ${numOptions}.`; break; }
                 if (rankNum < 1 || rankNum > maxRankValue) { isValid = false; errorMessage = `Rank must be between 1 and ${maxRankValue}.`; break; } // Use dynamic maxRankValue
                 if (seenOptions.has(optionNum)) { isValid = false; errorMessage = 'Each theme can only be ranked once'; break; }
                 seenOptions.add(optionNum);
                 if (seenRanks.has(rankNum)) { isValid = false; errorMessage = `Each rank must be used only once`; break; }
                 seenRanks.add(rankNum);
                 parsedEntries.push({ option: optionNum, rank: rankNum });
               }

               if (isValid) {
                 if (parsedEntries.length > 0) {
                   const sortedRanks = Array.from(seenRanks).sort((a, b) => a - b);
                   for (let i = 0; i < sortedRanks.length; i++) {
                     if (sortedRanks[i] !== i + 1) {
                       isValid = false;
                       errorMessage = `Ranks must be sequential (1, 2, 3, ...). Missing rank: ${i + 1}`;
                       break;
                     }
                   }
                 }
                 if (isValid) {
                    if (isStrictCount && entries.length !== minRequiredRanks) { isValid = false; errorMessage = `Please rank exactly ${minRequiredRanks} themes`; }
                    else if (!isStrictCount && entries.length < minRequiredRanks) { isValid = false; errorMessage = `Please rank at least ${minRequiredRanks} themes`; }
                 }
               }

               if (isValid) processedAnswer = parsedEntries;
               // --- End Ranked Choice Validation ---

             } else {
               // Default text input
               if (currentQuestion.required && !input) { isValid = false; errorMessage = "Input cannot be empty."; }
               else processedAnswer = input;
             }

            // Check validity after all type validations
            if (isValid) {
                setShowPrompt(true); // Ensure prompt shows for next step
                dispatch({ type: 'SET_ANSWER', payload: { stepId: currentQuestion.id, answer: processedAnswer } });
                if (state.currentQuestionIndex === questions.length - 1) {
                    addOutputLine("Registration complete. Thank you!");
                    dispatch({ type: 'SET_MODE', payload: 'success' });
                    return;
                }

                const nextQuestionIndex = state.currentQuestionIndex + 1;
                const nextQuestion = questions[nextQuestionIndex];
                let skipNext = false;
                if (nextQuestion?.dependsOn === currentQuestion.id && nextQuestion.dependsValue !== processedAnswer) {
                    skipNext = true;
                }

                dispatch({ type: 'NEXT_STEP' });
                if (skipNext) {
                    dispatch({ type: 'NEXT_STEP' });
                }
            } else {
                setShowPrompt(false); // Prevent default prompt display
                addOutputLine(errorMessage, { type: 'error' });
                // Re-display current prompt
                 if (currentQuestion) { // Add check for currentQuestion safety
                   addOutputLine(currentQuestion.label);
                   if (currentQuestion.hint) addOutputLine(currentQuestion.hint, { type: 'hint' });
                   if (currentQuestion.options) {
                     const optionsText = currentQuestion.options.map((opt, index) => `${index + 1}: ${opt}`).join('\n');
                     addOutputLine(optionsText);
                   }
                 }
                 return; // Explicitly return after handling validation error
            }
        }
    }
    // Add logic for other modes (review, commands) here
  };

  // The onInput prop from TerminalShell should likely call handleSubmit or similar logic here
  // For now, using internal form submission for basic testing


  return (
    <div>
      {/* Basic input form - TerminalShell might provide its own input mechanism */}
      <form onSubmit={handleSubmit}>
        {/* The prompt is displayed via addOutputLine, input is separate */}
        <input
          type={state.mode === 'early_auth' && (currentStepId === 'password' || currentStepId === 'confirmPassword') ? 'password' : 'text'}

          value={currentInput}
          onChange={handleInputChange}
          // autoFocus // Might be handled by TerminalShell
          className="bg-transparent border-none outline-none text-inherit w-full" // Basic styling
        />
      </form>
    </div>
  );
};

export default RegistrationDialog;