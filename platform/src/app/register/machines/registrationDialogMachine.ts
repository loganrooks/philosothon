import { createMachine, assign, fromPromise } from 'xstate';
import { questions } from '@/app/register/data/registrationQuestions';
import * as regActions from '@/app/register/actions';
import { initiateOtpSignIn } from '@/lib/data/auth';
import { checkCurrentUserConfirmationStatus } from '@/app/register/actions';
import { z } from 'zod'; // Assuming Zod is used for validation schema

// --- Types ---

// TODO: Define Question type properly based on registrationSchema.ts
interface Question {
  id: string;
  label: string;
  type: string; // 'text', 'email', 'password', 'confirmPassword', 'number', 'scale', 'boolean', 'single-select', 'multi-select-numbered', 'ranked-choice-numbered', 'paragraph';
  required?: boolean;
  options?: string[];
  hint?: string;
  description?: string;
  validationRules?: any; // Define based on schema
  dependsOn?: string;
  dependsValue?: any;
  otherField?: boolean;
  // Add other fields from schema as needed
}

type DialogMode = 'loadingSavedState' | 'intro' | 'earlyAuth' | 'awaitingConfirmation' | 'questioning' | 'review' | 'submitting' | 'success' | 'submissionError';

interface RegistrationContext {
  currentQuestionIndex: number;
  answers: Record<string, any>;
  currentInput: string;
  error: string | null;
  userEmail: string | null; // Store email after early auth
  questions: Question[]; // Load questions into context
  // Props from component needed for actions/services
  shellInteractions: ShellInteractions; // Use defined type
  // Internal machine state
  isSubmitting: boolean;
  savedStateExists: boolean; // Flag to indicate if resumable state was found
  validationResult: { isValid: boolean; message?: string } | null;
}

// Type for input when creating the machine
interface MachineInput {
  shellInteractions: ShellInteractions;
}

// Type for shell interactions passed from the component
interface ShellInteractions {
  addOutputLine: (line: string | React.ReactNode, options?: { timestamp?: boolean; type?: 'input' | 'output' | 'error' | 'system' | 'hint' }) => void;
  sendToShellMachine: (event: any) => void;
  // Add other needed props like changeMode if shell manages it
}


type RegistrationEvent =
  | { type: 'INPUT_RECEIVED'; value: string }
  | { type: 'LOAD_SUCCESS'; savedState: Partial<RegistrationContext> }
  | { type: 'LOAD_FAILURE'; error: string }
  | { type: 'LOAD_NOT_FOUND' }
  | { type: 'VALIDATION_COMPLETE'; result: { isValid: boolean; message?: string } } // Event from validation service
  | { type: 'SIGNUP_SUCCESS'; email: string } // Pass email on success
  | { type: 'SIGNUP_EXISTS'; email: string }
  | { type: 'SIGNUP_FAILURE'; error: string }
  | { type: 'CONFIRMATION_SUCCESS' }
  | { type: 'CONFIRMATION_FAILURE'; error: string }
  | { type: 'RESEND_SUCCESS' }
  | { type: 'RESEND_FAILURE'; error: string }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_FAILURE'; error: string }
  | { type: 'COMMAND_RECEIVED'; command: string; args?: string[] } // For commands like back, review, edit, save, submit, retry, exit
  | { type: 'RETRY' } // Generic retry event
  | { type: 'EDIT_ANSWER'; index: number } // Event to jump to specific question index
  | { type: 'GO_TO_REVIEW' }
  | { type: 'GO_TO_SUBMIT' };


// --- Helper Functions ---

// Placeholder for validation logic - should be more robust
// This will likely become an invoked service
const validateAnswer = (question: Question | undefined, answer: string, allAnswers: Record<string, any>): { isValid: boolean; message?: string } => {
  if (!question) return { isValid: false, message: "Question not found." };

  if (question.required && !answer) {
    return { isValid: false, message: question.validationRules?.required || "Input cannot be empty." };
  }

  // Add more complex validation based on question.type and question.validationRules
  // Example for ranked-choice (needs full implementation based on spec V3.1)
  if (question.type === 'ranked-choice-numbered') {
    // Parse input (e.g., "5:1 2:2 8:3")
    // Validate format, uniqueness, range, count (minRanked, strict)
    // Return { isValid: false, message: "Specific error..." } on failure
    console.warn("Ranked-choice validation not fully implemented in machine yet.");
  }

  // Add other type validations...

  return { isValid: true };
};

// Placeholder for skip logic - needs refinement
const findNextQuestionIndex = (currentIndex: number, answers: Record<string, any>): number => {
  let nextIndex = currentIndex + 1;
  while (nextIndex < questions.length) {
    const nextQuestion = questions[nextIndex];
    if (nextQuestion?.dependsOn) {
      const dependsOnAnswer = answers[nextQuestion.dependsOn];
      const conditionMet = Array.isArray(nextQuestion.dependsValue)
        ? nextQuestion.dependsValue.includes(dependsOnAnswer)
        : dependsOnAnswer === nextQuestion.dependsValue;
      if (!conditionMet) {
        nextIndex++;
        continue;
      }
    }
    break; // Found the next valid index
  }
  return nextIndex;
};

const findPrevQuestionIndex = (currentIndex: number, answers: Record<string, any>): number => {
    let prevIndex = currentIndex - 1;
    const minIndex = 3; // Cannot go below index 3 ('academicYear') in questioning mode

    while (prevIndex >= minIndex) {
        const prevQuestion = questions[prevIndex];
        if (prevQuestion?.dependsOn) {
            const dependsOnAnswer = answers[prevQuestion.dependsOn];
            const conditionMet = Array.isArray(prevQuestion.dependsValue)
                ? prevQuestion.dependsValue.includes(dependsOnAnswer)
                : dependsOnAnswer === prevQuestion.dependsValue;
            if (!conditionMet) {
                prevIndex--;
                continue;
            }
        }
        break; // Found the previous valid index
    }
    return Math.max(minIndex, prevIndex); // Ensure it doesn't go below minIndex
};

// Placeholder for loading state from localStorage
const loadSavedState = async (): Promise<Partial<RegistrationContext>> => {
  try {
    const savedData = localStorage.getItem('philosothon-registration-v3.1');
    if (savedData) {
      const decodedData = atob(savedData);
      const parsedState = JSON.parse(decodedData);
      // Validate parsedState structure if necessary
      if (parsedState && typeof parsedState.currentQuestionIndex === 'number') {
        return parsedState as Partial<RegistrationContext>;
      } else {
        throw new Error("Saved data is invalid.");
      }
    } else {
      // Return empty object instead of throwing error for tests
      // throw new Error("No saved data found.");
      return {};
    }
  } catch (error) {
    console.error("Failed to load saved state:", error);
    if (error instanceof Error && error.message === "No saved data found.") {
        throw error; // Re-throw specific error
    }
    throw new Error("Failed to load or parse saved state."); // Generic error
  }
};

// Placeholder for saving state to localStorage
const saveStateToStorage = (context: RegistrationContext) => {
  try {
    const stateToSave = {
      currentQuestionIndex: context.currentQuestionIndex,
      answers: context.answers,
      userEmail: context.userEmail,
      // Add other relevant context fields if needed
    };
    const encodedData = btoa(JSON.stringify(stateToSave));
    localStorage.setItem('philosothon-registration-v3.1', encodedData);
    context.shellInteractions.addOutputLine("Progress saved.", { type: 'system' });
  } catch (error) {
    console.error("Failed to save state:", error);
    context.shellInteractions.addOutputLine("Error saving progress.", { type: 'error' });
  }
};

// Placeholder for clearing saved state
const clearSavedState = () => {
    try {
        localStorage.removeItem('philosothon-registration-v3.1');
    } catch (error) {
        console.error("Failed to clear saved state:", error);
        // Optionally inform the user
    }
};

// --- Machine Definition ---

export const registrationDialogMachine = createMachine({
  id: 'registrationDialog',
  types: {
    context: {} as RegistrationContext,
    events: {} as RegistrationEvent,
    input: {} as MachineInput, // Define input type
  },
  context: ({ input }: { input: MachineInput }) => ({ // Use input to pass initial props
    currentQuestionIndex: 0,
    answers: {},
    currentInput: '',
    error: null,
    userEmail: null,
    questions: questions, // Load questions from import
    shellInteractions: input.shellInteractions, // Get shell interactions from props
    isSubmitting: false,
    savedStateExists: false, // Initialize flag
    validationResult: null,
  }),
  initial: 'loadingSavedState',
  states: {
    loadingSavedState: {
      invoke: {
        id: 'loadStateService',
        src: fromPromise(loadSavedState),
        onDone: {
          target: 'intro', // Go to intro even if loaded, intro decides next step
          actions: assign({
            savedStateExists: true,
            // Optionally merge loaded state here, or handle in intro
            // answers: ({ event }) => event.output.answers || {},
            // currentQuestionIndex: ({ event }) => event.output.currentQuestionIndex ?? 0,
            // userEmail: ({ event }) => event.output.userEmail || null,
          }),
        },
        onError: [
           {
             target: 'intro',
             guard: ({ event }) => event.error instanceof Error && event.error.message === "No saved data found.",
             actions: assign({ savedStateExists: false, error: null }), // Clear error if just not found
           },
           {
             target: 'intro', // Go to intro even on load failure
             actions: assign({
               savedStateExists: false, // Assume no usable state
               error: ({ event }) => `Failed to load saved state: ${event.error instanceof Error ? event.error.message : 'Unknown error'}`,
             }),
           }
        ]
      },
      entry: [({ context }) => context.shellInteractions.addOutputLine("Checking for saved progress...")],
      exit: [
        // Display error if loading failed (and wasn't 'not found')
        assign({ error: null }), // Clear error after displaying/handling
        ({ context }) => {
            if (context.error && context.error.includes("Failed to load")) {
                context.shellInteractions.addOutputLine(context.error, { type: 'error' });
            }
        }
      ]
    },
    intro: {
      entry: [
        ({ context }) => context.shellInteractions.addOutputLine("Welcome to the Philosothon Registration!"), // TODO: Full intro text
        ({ context }) => context.shellInteractions.addOutputLine("We need to collect some information to get you started."),
        ({ context }) => {
            if (context.savedStateExists) {
                context.shellInteractions.addOutputLine('Existing registration progress found. Use "register continue" to resume, or "register new" to start over (will overwrite).', { type: 'system' });
            }
        }
      ],
      // Automatically move to earlyAuth or prompt for command
      // For simplicity, let's assume it waits for 'register new' or 'register continue' via COMMAND_RECEIVED
      on: {
        COMMAND_RECEIVED: [
           {
             target: 'earlyAuth',
             guard: ({ event }) => event.command === 'register new',
             actions: [
                // TODO: Add confirmation if context.savedStateExists is true
                assign({ currentQuestionIndex: 0, answers: {}, error: null }), // Reset state
                clearSavedState, // Clear storage on new registration
                ({ context }) => context.shellInteractions.addOutputLine("Starting new registration...")
             ]
           },
           {
             target: 'questioning', // Or a dedicated loading state
             guard: ({ event, context }) => event.command === 'register continue' && context.savedStateExists,
             actions: [
                // Invoke service to load state properly now
                // For now, just transition and assume state was loaded in loadingSavedState
                ({ context }) => context.shellInteractions.addOutputLine("Resuming registration...")
                // Need to properly load state here if not done in loadingSavedState
             ]
           },
           {
             // Handle invalid command in intro state
             actions: ({ context, event }) => context.shellInteractions.addOutputLine(`Command "${event.command}" not available. Use 'register new' or 'register continue'.`, { type: 'error' })
           }
        ]
      }
    },
    earlyAuth: {
      initial: 'promptingFirstName',
      entry: [
        assign({ currentQuestionIndex: 0 }) // Ensure starting at first name
      ],
      states: {
        promptingFirstName: {
          entry: [({ context }) => context.shellInteractions.addOutputLine("Please enter your First Name:")],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        promptingLastName: {
          entry: [({ context }) => context.shellInteractions.addOutputLine("Please enter your Last Name:")],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        promptingEmail: {
          entry: [({ context }) => context.shellInteractions.addOutputLine("Please enter your University Email Address:")],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        promptingPassword: {
          entry: [({ context }) => context.shellInteractions.addOutputLine("Please create a password (min. 8 characters):")],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        promptingConfirmPassword: {
          entry: [({ context }) => context.shellInteractions.addOutputLine("Please confirm your password:")],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        validating: {
           // Invoke a validation service/actor here based on currentQuestionIndex
           entry: [
             // Simple inline validation for now
             assign({
               validationResult: ({ context }) => {
                 const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
                 const input = context.currentInput;
                 if (!input) return { isValid: false, message: "Input cannot be empty." };
                 if (stepId === 'email' && !/\S+@\S+\.\S+/.test(input)) return { isValid: false, message: "Invalid email format." };
                 if (stepId === 'password' && input.length < 8) return { isValid: false, message: "Password must be at least 8 characters." };
                 if (stepId === 'confirmPassword' && input !== context.answers.password) return { isValid: false, message: "Passwords do not match." };
                 return { isValid: true };
               }
             })
           ],
           always: [
             { target: 'handleValidInput', guard: ({ context }) => context.validationResult?.isValid === true },
             { target: 'handleInvalidInput', guard: ({ context }) => context.validationResult?.isValid === false }
           ]
        },
        handleValidInput: {
          entry: [
            // Save answer
            assign({
              answers: ({ context }) => {
                const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
                return { ...context.answers, [stepId]: context.currentInput };
              },
              error: null // Clear previous error
            }),
            // Echo input
            ({ context }) => context.shellInteractions.addOutputLine(`> ${context.currentInput}`, { type: 'input' }),
          ],
          always: [
            // Check if last step (confirmPassword)
            { target: '#registrationDialog.signingUp', guard: ({ context }) => context.currentQuestionIndex === 4 },
            // Otherwise, advance index and go to next prompt
            {
              target: 'promptingLastName',
              guard: ({ context }) => context.currentQuestionIndex === 0,
              actions: assign({ currentQuestionIndex: ({ context }) => context.currentQuestionIndex + 1 })
            },
            {
              target: 'promptingEmail',
              guard: ({ context }) => context.currentQuestionIndex === 1,
              actions: assign({ currentQuestionIndex: ({ context }) => context.currentQuestionIndex + 1 })
            },
            {
              target: 'promptingPassword',
              guard: ({ context }) => context.currentQuestionIndex === 2,
              actions: assign({ currentQuestionIndex: ({ context }) => context.currentQuestionIndex + 1 })
            },
            {
              target: 'promptingConfirmPassword',
              guard: ({ context }) => context.currentQuestionIndex === 3,
              actions: assign({ currentQuestionIndex: ({ context }) => context.currentQuestionIndex + 1 })
            },
          ]
        },
        handleInvalidInput: {
          entry: [
            assign({ error: ({ context }) => context.validationResult?.message || "Invalid input." }),
            ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' }),
            // Re-prompt based on current index
            ({ context }) => {
                if (context.currentQuestionIndex === 0) context.shellInteractions.addOutputLine("Please enter your First Name:");
                else if (context.currentQuestionIndex === 1) context.shellInteractions.addOutputLine("Please enter your Last Name:");
                else if (context.currentQuestionIndex === 2) context.shellInteractions.addOutputLine("Please enter your University Email Address:");
                else if (context.currentQuestionIndex === 3) context.shellInteractions.addOutputLine("Please create a password (min. 8 characters):");
                else if (context.currentQuestionIndex === 4) context.shellInteractions.addOutputLine("Please confirm your password:");
            }
          ],
          // Go back to the correct prompting state based on index
          always: [
             { target: 'promptingFirstName', guard: ({ context }) => context.currentQuestionIndex === 0 },
             { target: 'promptingLastName', guard: ({ context }) => context.currentQuestionIndex === 1 },
             { target: 'promptingEmail', guard: ({ context }) => context.currentQuestionIndex === 2 },
             { target: 'promptingPassword', guard: ({ context }) => context.currentQuestionIndex === 3 },
             { target: 'promptingConfirmPassword', guard: ({ context }) => context.currentQuestionIndex === 4 },
          ]
        }
      },
      // Global commands for earlyAuth
      on: {
         COMMAND_RECEIVED: {
            actions: ({ context, event }) => {
                if (event.command === 'exit') {
                    context.shellInteractions.sendToShellMachine({ type: 'EXIT' });
                } else if (event.command === 'help') {
                    // Show early auth help
                    context.shellInteractions.addOutputLine("Early Auth Help..."); // TODO: Add help text
                    // Re-prompt
                     if (context.currentQuestionIndex === 0) context.shellInteractions.addOutputLine("Please enter your First Name:");
                     else if (context.currentQuestionIndex === 1) context.shellInteractions.addOutputLine("Please enter your Last Name:");
                     // ... etc.
                } else {
                    context.shellInteractions.addOutputLine(`Command "${event.command}" not available here.`, { type: 'error' });
                    // Re-prompt
                     if (context.currentQuestionIndex === 0) context.shellInteractions.addOutputLine("Please enter your First Name:");
                     // ... etc.
                }
            }
         }
      }
    },
    signingUp: {
       entry: [
         assign({ isSubmitting: true }),
         ({ context }) => context.shellInteractions.addOutputLine("Creating account...")
       ],
       invoke: {
         id: 'signUpService',
         src: fromPromise(async ({ input }) => {
            const { email } = input.answers; // Get context passed via input
            // Using initiateOtpSignIn as per spec V3.1 and existing code
            const { data, error } = await initiateOtpSignIn(email);
            if (error) {
                // Check for specific 'user already exists' error if Supabase provides one
                // For now, assume any error means failure
                throw new Error(error.message || 'Sign-up failed');
            }
            // If OTP initiated, it implies user *might* not exist or confirmation is needed
            // We transition to awaitingConfirmation regardless, as per spec
            return { email }; // Pass email to onDone event
         }),
         input: ({ context }) => ({ // Pass necessary context to the service
            answers: context.answers
         }),
         onDone: {
           target: 'awaitingConfirmation',
           actions: [
             assign({
                isSubmitting: false,
                userEmail: ({ event }) => event.output.email, // Store email from successful signup
                error: null
             }),
           ]
         },
         onError: {
           target: 'earlyAuth.promptingConfirmPassword', // Go back to confirm password on error
           actions: [
             assign({
                isSubmitting: false,
                error: ({ event }) => `Sign-up failed: ${event.error instanceof Error ? event.error.message : 'Unknown error'}`
             }),
             ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
           ]
         }
       }
    },
    awaitingConfirmation: {
      entry: [
        ({ context }) => context.shellInteractions.addOutputLine(`Account created. Please check your email (${context.userEmail}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`)
      ],
      on: {
        COMMAND_RECEIVED: [
          {
            guard: ({ event }) => event.command === 'continue',
            target: 'checkingConfirmation'
          },
          {
            guard: ({ event }) => event.command === 'resend',
            target: 'resendingConfirmation'
          },
          {
            guard: ({ event }) => event.command === 'exit',
            actions: [
                ({ context }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' }) // Or transition to intro?
            ]
          },
          { // Handle help or invalid commands
            actions: ({ context, event }) => {
                 if (event.command === 'help') {
                    context.shellInteractions.addOutputLine("Awaiting Confirmation Help..."); // TODO: Add help text
                 } else {
                    context.shellInteractions.addOutputLine(`Unknown command: ${event.command}. Use 'continue', 'resend', or 'exit'.`, { type: 'error' });
                 }
                 // Re-display prompt
                 context.shellInteractions.addOutputLine(`Account created... Enter 'continue' or 'resend'.`);
            }
          }
        ]
      }
    },
    checkingConfirmation: {
       entry: [({ context }) => context.shellInteractions.addOutputLine("Checking confirmation status...")],
       invoke: {
         id: 'checkConfirmationService',
         src: fromPromise(checkCurrentUserConfirmationStatus), // Assumes this returns boolean
         onDone: [
            {
                target: 'questioning',
                guard: ({ event }) => event.output === true, // If function returns true
                actions: [
                    assign({ error: null, currentQuestionIndex: 3 }), // Start questioning at index 3
                    ({ context }) => context.shellInteractions.addOutputLine("Email confirmed. Starting registration questions...")
                ]
            },
            {
                target: 'awaitingConfirmation', // Stay if not confirmed
                guard: ({ event }) => event.output === false,
                actions: [
                    assign({ error: "Email not confirmed yet. Please check your email or use 'resend'." }),
                    ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
                ]
            }
         ],
         onError: {
           target: 'awaitingConfirmation',
           actions: [
             assign({ error: ({ event }) => `Error checking confirmation: ${event.error instanceof Error ? event.error.message : 'Unknown error'}` }),
             ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
           ]
         }
       }
    },
    resendingConfirmation: {
        entry: [({ context }) => context.shellInteractions.addOutputLine("Resending confirmation email...")],
        invoke: {
            id: 'resendConfirmationService',
            src: fromPromise(async ({ input }) => {
                const { email } = input;
                if (!email) throw new Error("Email address not found.");
                const { error } = await initiateOtpSignIn(email); // Use OTP sign-in to resend
                if (error) throw new Error(error.message || 'Failed to resend');
                return {}; // Success
            }),
            input: ({ context }) => ({ email: context.userEmail }),
            onDone: {
                target: 'awaitingConfirmation',
                actions: [
                    assign({ error: null }),
                    ({ context }) => context.shellInteractions.addOutputLine("Confirmation email resent. Please check your inbox.")
                ]
            },
            onError: {
                target: 'awaitingConfirmation',
                actions: [
                    assign({ error: ({ event }) => `Error resending confirmation: ${event.error instanceof Error ? event.error.message : 'Unknown error'}` }),
                    ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
                ]
            }
        }
    },
    questioning: {
      initial: 'prompting',
      states: {
        prompting: {
          entry: [
            // Display question, hint, options based on currentQuestionIndex
            assign({ error: null }), // Clear previous error
            ({ context }) => {
              const question = context.questions[context.currentQuestionIndex];
              if (question) {
                context.shellInteractions.addOutputLine(question.label);
                if (question.hint) {
                  context.shellInteractions.addOutputLine(question.hint, { type: 'hint' });
                }
                if (question.options) {
                  const optionsText = question.options.map((opt, index) => `${index + 1}: ${opt}`).join('\n');
                  context.shellInteractions.addOutputLine(optionsText);
                }
                // Add prompt indicator
                context.shellInteractions.addOutputLine(`[reg ${context.currentQuestionIndex + 1}/${context.questions.length}]> `); // Example prompt
              } else {
                 // Should transition to review/completed state if index is out of bounds
                 console.error("Invalid question index in questioning state:", context.currentQuestionIndex);
                 // TODO: Transition to appropriate end state
              }
            }
          ],
          on: {
            INPUT_RECEIVED: {
              target: 'validating',
              actions: assign({ currentInput: ({ event }) => event.value })
            },
            COMMAND_RECEIVED: { target: 'handlingCommand' }
          }
        },
        validating: {
          // Invoke validation service
          invoke: {
             id: 'validationService',
             src: fromPromise(async ({ input }) => {
                 const { question, answer, allAnswers } = input;
                 // Simulate async validation if needed, or just call sync function
                 return validateAnswer(question, answer, allAnswers);
             }),
             input: ({ context }) => ({
                 question: context.questions[context.currentQuestionIndex],
                 answer: context.currentInput,
                 allAnswers: context.answers
             }),
             onDone: {
                 target: 'handleValidationResult',
                 actions: assign({ validationResult: ({ event }) => event.output })
             },
             onError: { // Handle errors *during* validation itself
                 target: 'prompting', // Go back to prompting
                 actions: [
                     assign({ error: ({ event }) => `Validation error: ${event.error instanceof Error ? event.error.message : 'Unknown error'}` }),
                     ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
                 ]
             }
          }
        },
        handleValidationResult: {
           always: [
             { target: 'processingAnswer', guard: ({ context }) => context.validationResult?.isValid === true },
             { target: 'prompting', // Go back to prompting on invalid
               guard: ({ context }) => context.validationResult?.isValid === false,
               actions: [
                 assign({ error: ({ context }) => context.validationResult?.message || "Invalid input." }),
                 ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' }),
                 // Re-display hint if available
                 ({ context }) => {
                    const question = context.questions[context.currentQuestionIndex];
                    if (question?.hint) {
                        context.shellInteractions.addOutputLine(question.hint, { type: 'hint' });
                    }
                 }
                 // Prompt is re-displayed by re-entering 'prompting' state
               ]
             }
           ]
        },
        processingAnswer: {
          entry: [
            // Save answer
            assign({
              answers: ({ context }) => {
                const questionId = context.questions[context.currentQuestionIndex]?.id;
                return questionId ? { ...context.answers, [questionId]: context.currentInput } : context.answers;
              }
            }),
            // Echo input
            ({ context }) => context.shellInteractions.addOutputLine(`> ${context.currentInput}`, { type: 'input' }),
            // Find next index considering skips
            assign({
              currentQuestionIndex: ({ context }) => findNextQuestionIndex(context.currentQuestionIndex, context.answers)
            })
          ],
          always: [
             // Check if we've reached the end
             { target: '#registrationDialog.review', guard: ({ context }) => context.currentQuestionIndex >= context.questions.length },
             // Otherwise, go to next prompt
             { target: 'prompting' }
          ]
        },
        handlingCommand: {
          entry: [
            ({ context, event }) => {
              if (event.type !== 'COMMAND_RECEIVED') return;
              const { command, args } = event;

              if (command === 'back') {
                 // Find previous index considering skips
                 const prevIndex = findPrevQuestionIndex(context.currentQuestionIndex, context.answers);
                 // Remove answer for the *current* index before going back
                 const currentQuestionId = context.questions[context.currentQuestionIndex]?.id;
                 const newAnswers = { ...context.answers };
                 if (currentQuestionId) delete newAnswers[currentQuestionId];

                 assign({ // REMOVED immediate invocation
                    currentQuestionIndex: prevIndex,
                    answers: newAnswers, // Update answers state
                    error: null
                 })
              } else if (command === 'save') {
                 saveStateToStorage(context);
                 // Stay in prompting state after save
              } else if (command === 'exit') {
                 saveStateToStorage(context);
                 context.shellInteractions.sendToShellMachine({ type: 'EXIT' }); // Or transition to intro?
              } else if (command === 'review') {
                 // Transition handled by 'always' below
              } else if (command === 'edit' && args?.[0]) {
                 const targetQNum = parseInt(args[0], 10);
                 if (!isNaN(targetQNum) && targetQNum >= 1 && targetQNum <= context.questions.length) {
                    // TODO: Need to handle jumping back correctly, considering dependencies.
                    // For now, just set index. Might need more complex logic.
                    assign({ currentQuestionIndex: targetQNum - 1 }) // REMOVED immediate invocation
                 } else {
                    context.shellInteractions.addOutputLine(`Invalid question number: ${args[0]}. Use 'edit [1-${context.questions.length}]'.`, { type: 'error' });
                 }
              } else if (command === 'help') {
                 context.shellInteractions.addOutputLine("Questioning Mode Help..."); // TODO: Add help text
              } else {
                 context.shellInteractions.addOutputLine(`Unknown command: ${command}`, { type: 'error' });
              }
            }
          ],
          always: [
             // Transition after handling command
             { target: 'prompting', guard: ({ event }) => event.type === 'COMMAND_RECEIVED' && ['back', 'save', 'edit', 'help', 'unknown'].includes(event.command) }, // Go back to prompting for most commands
             { target: '#registrationDialog.review', guard: ({ event }) => event.type === 'COMMAND_RECEIVED' && event.command === 'review' },
             // Exit is handled directly in entry action
          ]
        }
      }
    },
    review: {
      entry: [
        ({ context }) => context.shellInteractions.addOutputLine("--- Registration Summary ---"),
        ({ context }) => {
          context.questions.forEach((q, index) => {
            const answer = context.answers[q.id];
            const displayAnswer = answer !== undefined && answer !== null ? String(answer) : '[No Answer]';
            context.shellInteractions.addOutputLine(`${index + 1}. ${q.label}: ${displayAnswer}`);
          });
        },
        ({ context }) => context.shellInteractions.addOutputLine("--- End Summary ---"),
        ({ context }) => context.shellInteractions.addOutputLine("Use 'submit', 'edit [number]', or 'back' to return to questions.")
      ],
      on: {
        COMMAND_RECEIVED: [
          {
            target: 'submitting',
            guard: ({ event }) => event.command === 'submit'
          },
          {
            target: 'questioning.handlingCommand', // Delegate to questioning command handler
            guard: ({ event }) => event.command === 'edit' && !!event.args?.[0],
            // actions: assign({ currentQuestionIndex: ... }) // Index set in handlingCommand
          },
          {
            target: 'questioning', // Go back to the last question
            guard: ({ event }) => event.command === 'back',
            actions: assign({ currentQuestionIndex: ({ context }) => context.questions.length - 1 }) // Or find last *answered*?
          },
          { // Handle help or invalid commands
            actions: ({ context, event }) => {
                 if (event.command === 'help') {
                    context.shellInteractions.addOutputLine("Review Mode Help..."); // TODO: Add help text
                 } else {
                    context.shellInteractions.addOutputLine(`Unknown command: ${event.command}. Use 'submit', 'edit [number]', or 'back'.`, { type: 'error' });
                 }
                 // Re-display prompt/info
                 context.shellInteractions.addOutputLine("Use 'submit', 'edit [number]', or 'back'.");
            }
          }
        ]
      }
    },
    submitting: {
      entry: [
        assign({ isSubmitting: true }),
        ({ context }) => context.shellInteractions.addOutputLine("Submitting registration...")
      ],
      invoke: {
        id: 'submitRegistrationFromMachineService', // Renamed service ID
        src: fromPromise(async ({ input }) => {
            // Call the new server action that accepts the answers object directly
            const { success, message } = await regActions.submitRegistrationFromMachine(input.answers);
            if (!success) {
                throw new Error(message || 'Submission failed');
            }
            return {}; // Success
        }),
        input: ({ context }) => ({ answers: context.answers }),
        onDone: {
          target: 'success',
          actions: [
            assign({ isSubmitting: false, error: null }),
            clearSavedState // Clear local storage on successful submission
          ]
        },
        onError: {
          target: 'submissionError',
          actions: [
            assign({
                isSubmitting: false,
                error: ({ event }) => `Submission failed: ${event.error instanceof Error ? event.error.message : 'Unknown error'}`
            }),
            ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
          ]
        }
      }
    },
    success: {
      entry: [
        ({ context }) => context.shellInteractions.addOutputLine("Registration submitted successfully! Thank you."),
        ({ context }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' }) // Exit after success message
      ],
      type: 'final' // End state
    },
    submissionError: {
      entry: [
        ({ context }) => context.shellInteractions.addOutputLine("An error occurred during submission. Please try again."),
        ({ context }) => context.shellInteractions.addOutputLine("Use 'retry' or 'back' to review/edit.")
      ],
      on: {
        COMMAND_RECEIVED: [
          {
            target: 'submitting',
            guard: ({ event }) => event.command === 'retry'
          },
          {
            target: 'review',
            guard: ({ event }) => event.command === 'back'
          },
          { // Handle help or invalid commands
            actions: ({ context, event }) => {
                 if (event.command === 'help') {
                    context.shellInteractions.addOutputLine("Submission Error Help..."); // TODO: Add help text
                 } else {
                    context.shellInteractions.addOutputLine(`Unknown command: ${event.command}. Use 'retry' or 'back'.`, { type: 'error' });
                 }
                 // Re-display prompt/info
                 context.shellInteractions.addOutputLine("Use 'retry' or 'back'.");
            }
          }
        ]
      }
    }
  }
});