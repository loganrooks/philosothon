import { createMachine, assign, fromPromise } from 'xstate';
import { questions } from '@/app/register/data/registrationQuestions';
import * as regActions from '@/app/register/actions';
// Corrected import paths and function name
import { initiateOtpSignIn, resendConfirmationEmail, checkUserVerificationStatus, signInWithPassword } from '@/app/auth/actions'; // Correct function name
import { checkUserProfileExists } from '@/app/register/actions'; // Keep register-specific actions
import { z } from 'zod'; // Assuming Zod is used for validation schema
import { registrationMessages } from '@/config/registrationMessages'; // Removed unused import
import * as utils from './registrationMachineUtils'; // Import utils

// --- Types ---

// TODO: Define Question type properly based on registrationSchema.ts
export interface Question {
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

// Removed DialogMode as it's implicit in state names

export interface RegistrationContext {
  currentQuestionIndex: number;
  answers: Record<string, any>;
  currentInput: string;
  error: string | null; // Stores general error messages or validation messages from utils
  userEmail: string | null; // Store email after early auth
  questions: Question[]; // Load questions from import
  // Props from component needed for actions/services
  shellInteractions: ShellInteractions; // Use defined type
  // Internal machine state
  isSubmitting: boolean; // Used for async operations
  userId: string | null; // Added from ADR
  lastSavedIndex: number; // Added from ADR - Track last successfully saved index
  // Add flags for command handling if needed, e.g., isExiting: boolean;
}

// Type for input when creating the machine
export interface MachineInput { // Export if needed by component
  shellInteractions: ShellInteractions;
}

// Type for shell interactions passed from the component
export interface ShellInteractions { // Export if needed by component
  addOutputLine: (line: string | React.ReactNode, options?: { timestamp?: boolean; type?: 'input' | 'output' | 'error' | 'system' | 'hint' }) => void;
  sendToShellMachine: (event: any) => void;
  // Add other needed props like changeMode if shell manages it
}


// --- Events ---
// Define specific event types for better type safety
type InputEvent = { type: 'INPUT_RECEIVED'; value: string };
type CommandEvent = { type: 'COMMAND_RECEIVED'; command: string; args?: string[] };
// Removed LoadEvent as localStorage is gone
type SignUpEvent =
  | { type: 'SIGNUP_SUCCESS'; email: string } // Likely internal from service
  | { type: 'SIGNUP_EXISTS'; email: string } // Likely internal from service
  | { type: 'SIGNUP_FAILURE'; error: Error }; // Likely internal from service
type SignInEvent = // Added for sign-in service
  | { type: 'SIGNIN_SUCCESS'; userId: string; email: string } // Likely internal from service
  | { type: 'SIGNIN_FAILURE'; error: Error }; // Likely internal from service
type ConfirmationEvent =
  | { type: 'CONFIRMATION_SUCCESS' } // Likely internal from service
  | { type: 'CONFIRMATION_FAILURE'; error: Error }; // Likely internal from service
type ResendEvent =
  | { type: 'RESEND_SUCCESS'; email: string } // Likely internal from service
  | { type: 'RESEND_FAILURE'; error: Error }; // Likely internal from service
type FetchEvent = // Added for fetch service
  | { type: 'FETCH_SUCCESS'; registrationData: Record<string, any> | null } // Likely internal from service
  | { type: 'FETCH_FAILURE'; error: Error }; // Likely internal from service
type SaveEvent = // Added for save service
  | { type: 'SAVE_SUCCESS' } // Likely internal from service
  | { type: 'SAVE_FAILURE'; error: Error }; // Likely internal from service
type SubmitEvent =
  | { type: 'SUBMIT_SUCCESS' } // Likely internal from service
  | { type: 'SUBMIT_FAILURE'; error: Error }; // Likely internal from service
type NavigationEvent = // Simplified
  | { type: 'RETRY' }
  | { type: 'EDIT_ANSWER'; index: number } // Keep for review state
  | { type: 'GO_TO_REVIEW' } // Keep for questioning state
  | { type: 'GO_TO_SUBMIT' }; // Keep for review state

export type RegistrationEvent = // Export if needed
  | InputEvent
  | CommandEvent
  // | LoadEvent // Removed
  | SignUpEvent
  | SignInEvent // Added
  | ConfirmationEvent
  | ResendEvent
  | FetchEvent // Added
  | SaveEvent // Added
  | SubmitEvent
  | NavigationEvent;


// --- Services (Async Logic Wrappers) ---
// These wrap the actual async functions (server actions, utils)

const services = {

  fetchRegistrationService: fromPromise(async ({ input }: { input: { userId: string } }) => {
    const { registration, error } = await regActions.fetchRegistrationAction(input.userId);
    if (error) {
      console.error('Error fetching registration via action:', error);
      throw new Error(error);
    }
    return { registrationData: registration };
  }),

  saveAnswerService: fromPromise(async ({ input }: { input: { userId: string; questionId: string; answer: any; currentQuestionIndex: number } }) => {
    // Assuming userId is available in context and passed correctly when invoking
    const { error } = await regActions.saveAnswerAction(input.userId, input.questionId, input.answer, input.currentQuestionIndex);
    if (error) {
      console.error('Error saving answer via action:', error);
      throw new Error(error);
    }
    return {}; // Resolve indicates success
  }),

  signUpService: fromPromise(async ({ input }: { input: { answers: Record<string, any> } }) => {
    const { email, password, firstName, lastName } = input.answers;
    const { signUpUser } = await import('@/app/auth/actions'); // Ensure import
    const result = await signUpUser({ email, password, firstName, lastName });

    if (!result.success) {
      console.error("signUpUser action failed:", result.message);
      const lowerCaseMessage = result.message.toLowerCase();
      if (lowerCaseMessage.includes("user already registered") || lowerCaseMessage.includes("already exists")) {
        // Specific output for existing user, handled by onDone guard
        return { status: 'existing_user', email };
      }
      throw new Error(result.message || 'Sign-up failed'); // Throw other errors
    }
    // Specific output for success requiring confirmation
    return { status: 'confirmation_required', email };
  }),

  signInService: fromPromise(async ({ input }: { input: { email: string | null, password?: string } }) => {
      if (!input.email || !input.password) {
          throw new Error('Email and password required for sign in.');
      }
      // signInWithPassword already imported at top level
      const result = await signInWithPassword({ email: input.email, password: input.password });
      if (!result.success || !result.userId) {
          throw new Error(result.message || 'Sign in failed');
      }
      return { userId: result.userId, email: input.email }; // Return userId and email
  }),

  checkAuthConfirmationService: fromPromise(async () => {
      const result = await checkUserVerificationStatus();
      if (!result.success) {
          throw new Error(result.message || registrationMessages.awaitingConfirmation.checkFailed);
      }
      // Resolve indicates success
  }),

  // Service to invoke the checkUserProfileExists server action - DEPRECATED by fetchRegistrationService
  // checkProfileService: fromPromise(async () => { ... }),

  resendConfirmationService: fromPromise(async ({ input }: { input: { email: string | null } }) => {
      if (!input.email) {
          throw new Error("Cannot resend confirmation without email.");
      }
      // resendConfirmationEmail already imported at top level
      const result = await resendConfirmationEmail({ email: input.email });
      if (!result.success) {
          throw new Error(result.message || registrationMessages.awaitingConfirmation.resendError);
      }
      return { email: input.email }; // Return email on success
  }),

  submitRegistrationService: fromPromise(async ({ input }: { input: { answers: Record<string, any> } }) => {
      const result = await regActions.submitRegistrationFromMachine(input.answers);
      if (!result.success) {
          throw new Error(result.message || 'Submission failed');
      }
      return result; // Resolve indicates success
  }),
};


// --- Machine Definition ---

export const registrationDialogMachine = createMachine({
  id: 'registrationDialog',
  types: {
    context: {} as RegistrationContext,
    events: {} as RegistrationEvent,
    input: {} as MachineInput,
  },
  context: ({ input }: { input: MachineInput }) => ({
    currentQuestionIndex: 0, // Will be adjusted based on flow
    answers: {},
    currentInput: '',
    error: null,
    userEmail: null,
    questions: questions, // Load questions from import
    shellInteractions: input.shellInteractions,
    isSubmitting: false,
    userId: null, // Initialize userId
    lastSavedIndex: -1, // Initialize lastSavedIndex
  }),
  initial: 'idle', // Set initial state to idle
  states: {

    idle: { // Define the idle state
      entry: ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine("Machine is idle. Waiting for 'register' command.", { type: 'system' }), // Optional entry action
      on: {
        COMMAND_RECEIVED: {
          target: 'promptingSignInOrUp',
          guard: ({ event }: { event: CommandEvent }) => event.type === 'COMMAND_RECEIVED' && event.command === 'register', // Add type check for safety
          actions: ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine('Register command received...', { type: 'system' })
        },
        // TODO: Add other global commands handled in idle if any (e.g., help?)
      }
    },

    // Removed 'intro' state as 'idle' handles the initial wait

    promptingSignInOrUp: {
      entry: ['displaySignInOrUpPrompt'], // Use action name
      on: {
        COMMAND_RECEIVED: [
          {
            target: 'signUpFlow', // Target top-level state
            guard: ({ event }: { event: CommandEvent }) => event.command === 'sign-up',
            actions: ['resetRegistrationState'] // Use action name
          },
          {
            target: 'signInFlow', // Target top-level state
            guard: ({ event }: { event: CommandEvent }) => event.command === 'sign-in'
          },
          {
            target: 'idle',
            guard: ({ event }: { event: CommandEvent }) => event.command === 'back'
          },
          { // Handle invalid commands
            guard: ({ event }: { event: CommandEvent }) => !['sign-up', 'sign-in', 'back'].includes(event.command),
            actions: [
              ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandGeneral.replace('{command}', event.command) + " Use 'sign-up', 'sign-in', or 'back'.", { type: 'error' }),
              'displaySignInOrUpPrompt' // Re-display prompt
            ]
          }
        ]
      }
    },

    // --- Sign Up Flow ---
    signUpFlow: {
      initial: 'earlyAuth',
      states: {
        earlyAuth: {
          initial: 'promptingFirstName',
          states: {
            promptingFirstName: {
              entry: [({ context }: { context: RegistrationContext }) => {
                        context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptFirstName);
                     }],
              on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }: { event: InputEvent }) => event.value }) } }
            },
            promptingLastName: {
              entry: [({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptLastName)],
              on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }: { event: InputEvent }) => event.value }) } }
            },
            promptingEmail: {
              entry: [({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptEmail)],
              on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }: { event: InputEvent }) => event.value }) } }
            },
            promptingPassword: {
              entry: [({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptPassword)],
              on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }: { event: InputEvent }) => event.value }) } }
            },
            promptingConfirmPassword: {
              entry: [({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptConfirmPassword)],
              on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }: { event: InputEvent }) => event.value }) } }
            },
            validating: {
               always: [
                 { target: 'handleValidInput', guard: 'isValidEarlyAuthInput' },
                 { target: 'handleInvalidInput', actions: 'assignEarlyAuthValidationError' }
               ]
            },
            handleValidInput: {
              entry: [
                assign({
                  answers: ({ context }: { context: RegistrationContext }) => {
                    const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
                    return { ...context.answers, [stepId]: context.currentInput };
                  },
                  error: null
                }),
                ({ context }: { context: RegistrationContext }) => {
                    const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
                    const displayInput = (stepId === 'password' || stepId === 'confirmPassword') ? '********' : context.currentInput;
                    context.shellInteractions.addOutputLine(`> ${displayInput}`, { type: 'input' });
                },
              ],
              always: [
                // Target relative within signUpFlow using '.'
                { target: '#registrationDialog.signUpFlow.signingUp', guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 4 },
                {
                  target: 'promptingLastName',
                  guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 0,
                  actions: assign({ currentQuestionIndex: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex + 1 })
                },
                {
                  target: 'promptingEmail',
                  guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 1,
                  actions: assign({ currentQuestionIndex: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex + 1 })
                },
                {
                  target: 'promptingPassword',
                  guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 2,
                  actions: assign({ currentQuestionIndex: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex + 1 })
                },
                {
                  target: 'promptingConfirmPassword',
                  guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 3,
                  actions: assign({ currentQuestionIndex: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex + 1 })
                },
              ]
            },
            handleInvalidInput: {
              entry: [
                ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' }),
              ],
              always: [ // Go back to the correct prompting state
                 { target: 'promptingFirstName', guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 0 },
                 { target: 'promptingLastName', guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 1 },
                 { target: 'promptingEmail', guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 2 },
                 { target: 'promptingPassword', guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 3 },
                 { target: 'promptingConfirmPassword', guard: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex === 4 },
              ]
            }
          },
          on: { // Global commands for earlyAuth
             COMMAND_RECEIVED: {
                actions: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
                    if (event.command === 'exit') {
                        context.shellInteractions.sendToShellMachine({ type: 'EXIT' });
                    } else if (event.command === 'help') {
                        context.shellInteractions.addOutputLine(registrationMessages.commands.help.earlyAuth);
                        const prompts = [
                            registrationMessages.earlyAuth.promptFirstName,
                            registrationMessages.earlyAuth.promptLastName,
                            registrationMessages.earlyAuth.promptEmail,
                            registrationMessages.earlyAuth.promptPassword,
                            registrationMessages.earlyAuth.promptConfirmPassword
                        ];
                        context.shellInteractions.addOutputLine(prompts[context.currentQuestionIndex]);
                    } else {
                        context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandGeneral.replace('{command}', event.command), { type: 'error' });
                         const prompts = [
                            registrationMessages.earlyAuth.promptFirstName,
                            registrationMessages.earlyAuth.promptLastName,
                            registrationMessages.earlyAuth.promptEmail,
                            registrationMessages.earlyAuth.promptPassword,
                            registrationMessages.earlyAuth.promptConfirmPassword
                        ];
                        context.shellInteractions.addOutputLine(prompts[context.currentQuestionIndex]);
                    }
                }
             }
          }
        }, // End earlyAuth

        signingUp: {
           entry: [
             assign({ isSubmitting: true, error: null }),
             ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.system.creatingAccount, { type: 'system' })
           ],
           invoke: {
             id: 'signUpService',
             src: 'signUpService',
             input: ({ context }: { context: RegistrationContext }) => ({ answers: context.answers }),
             onDone: [
                {
                  target: 'awaitingConfirmation', // Relative target
                  guard: ({ event }: { event: { output: { status: string } } }) => event.output.status === 'confirmation_required',
                  actions: assign({
                     isSubmitting: false,
                     userEmail: ({ event }) => event.output.email,
                     error: null
                  }),
                },
                { // Handle existing user
                  target: '#registrationDialog.promptingSignInOrUp', // Go back to choice
                  guard: ({ event }: { event: { output: { status: string } } }) => event.output.status === 'existing_user',
                  actions: [
                      assign({
                         isSubmitting: false,
                         error: registrationMessages.earlyAuth.existingUserError,
                         userEmail: ({ event }) => event.output.email,
                         answers: ({ context }: { context: RegistrationContext }) => {
                             const { password, confirmPassword, ...rest } = context.answers;
                             return rest;
                         },
                         currentQuestionIndex: 0 // Reset index
                      }),
                      ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.existingUserError, { type: 'error' })
                  ],
                }
             ],
             onError: {
               // Target relative within signUpFlow
               target: 'earlyAuth.promptingConfirmPassword',
               actions: [
                 assign({
                    isSubmitting: false,
                    error: ({ event }) => registrationMessages.earlyAuth.signUpErrorDetailed.replace('{message}', event.error instanceof Error ? event.error.message : String(event.error || 'Unknown error'))
                 }),
                 ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
               ]
             }
           }
        }, // End signingUp

        awaitingConfirmation: {
          entry: [
            ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(
                registrationMessages.earlyAuth.confirmationRequired.replace('{email}', context.userEmail || 'your email')
            )
          ],
          on: {
            COMMAND_RECEIVED: [
              {
                guard: ({ event }: { event: CommandEvent }) => event.command === 'continue',
                target: 'checkingAuthConfirmation' // Relative target
              },
              {
                guard: ({ event }: { event: CommandEvent }) => event.command === 'resend',
                target: 'resendingConfirmation' // Relative target
              },
              {
                guard: ({ event }: { event: CommandEvent }) => event.command === 'exit',
                actions: [ ({ context }: { context: RegistrationContext }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' }) ]
              },
              { // Handle help or invalid commands
                actions: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
                    const reprompt = registrationMessages.earlyAuth.confirmationRequired.replace('{email}', context.userEmail || 'your email');
                    if (event.command === 'help') {
                        context.shellInteractions.addOutputLine(registrationMessages.commands.help.awaitingConfirmation);
                        context.shellInteractions.addOutputLine(reprompt);
                    } else {
                        context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandConfirmation.replace('{command}', event.command), { type: 'error' });
                        context.shellInteractions.addOutputLine(reprompt);
                    }
                }
              },
            ]
          }
        }, // End awaitingConfirmation

        checkingAuthConfirmation: {
          entry: [assign({ isSubmitting: true, error: null }), ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.system.checkingConfirmation, { type: 'system' })],
          invoke: {
            id: 'checkAuthConfirmationService',
            src: 'checkAuthConfirmationService',
            onDone: {
              // Target top-level state after confirmation
              target: '#registrationDialog.fetchingRegistration', // Go fetch registration data
              actions: assign({ isSubmitting: false, error: null }),
            },
            onError: {
              target: 'awaitingConfirmation', // Relative target within signUpFlow
              actions: [
                assign({
                  isSubmitting: false,
                  error: ({ event }) => registrationMessages.awaitingConfirmation.checkFailedDetailed.replace('{message}', event.error instanceof Error ? event.error.message : String(event.error || 'Unknown error'))
                }),
                ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
              ]
            }
          }
        }, // End checkingAuthConfirmation

        // Removed checkingProfile state - fetchRegistrationService handles this logic

        resendingConfirmation: {
           entry: [assign({ isSubmitting: true, error: null }), ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.system.resendingConfirmation, { type: 'system' })],
           invoke: {
             id: 'resendConfirmationService',
             src: 'resendConfirmationService',
             input: ({ context }: { context: RegistrationContext }) => ({ email: context.userEmail }),
             onDone: {
               target: 'awaitingConfirmation', // Relative target
               actions: [
                 assign({ isSubmitting: false, error: null }),
                 ({ context, event }: { context: RegistrationContext, event: { output: { email: string } } }) => context.shellInteractions.addOutputLine(
                     registrationMessages.awaitingConfirmation.resendSuccess.replace('{email}', event.output.email), { type: 'system' }
                 )
               ]
             },
             onError: {
               target: 'awaitingConfirmation', // Relative target
               actions: [
                 assign({
                   isSubmitting: false,
                   error: ({ event }) => registrationMessages.awaitingConfirmation.resendError.replace('{message}', event.error instanceof Error ? event.error.message : String(event.error || 'Unknown error'))
                 }),
                 ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
               ]
             }
           }
        } // End resendingConfirmation
      } // End signUpFlow states
    }, // End signUpFlow

    // --- Sign In Flow ---
    signInFlow: {
      initial: 'promptingEmail',
      states: {
        promptingEmail: {
          entry: ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine('Enter your email to sign in:'),
          on: {
            INPUT_RECEIVED: {
              // TODO: Add validation? Maybe reuse earlyAuth email validation?
              target: 'promptingPassword',
              actions: assign({
                userEmail: ({ event }: { event: InputEvent }) => event.value,
                currentInput: '', // Clear input buffer
                error: null,
              })
            },
            COMMAND_RECEIVED: [ // Handle back/exit/help
              {
                target: '#registrationDialog.promptingSignInOrUp', // Absolute target
                guard: ({ event }: { event: CommandEvent }) => event.command === 'back'
              },
              {
                 guard: ({ event }: { event: CommandEvent }) => event.command === 'exit',
                 actions: [ ({ context }: { context: RegistrationContext }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' }) ]
              },
              { // Handle help or invalid commands
                 actions: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
                     const reprompt = 'Enter your email to sign in:';
                     if (event.command === 'help') {
                         context.shellInteractions.addOutputLine("Available commands: back, exit, help.");
                     } else {
                         context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandGeneral.replace('{command}', event.command), { type: 'error' });
                     }
                     context.shellInteractions.addOutputLine(reprompt);
                 }
              }
            ]
          }
        },
        promptingPassword: {
          entry: ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine('Enter your password:'),
          on: {
            INPUT_RECEIVED: {
              target: 'authenticating',
              actions: assign({
                 currentInput: ({ event }: { event: InputEvent }) => event.value, // Store password temporarily
                 error: null,
              })
            },
             COMMAND_RECEIVED: [ // Handle back/exit/help
              {
                target: 'promptingEmail', // Relative target within signInFlow
                guard: ({ event }: { event: CommandEvent }) => event.command === 'back'
              },
              {
                 guard: ({ event }: { event: CommandEvent }) => event.command === 'exit',
                 actions: [ ({ context }: { context: RegistrationContext }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' }) ]
              },
              { // Handle help or invalid commands
                 actions: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
                     const reprompt = 'Enter your password:';
                     if (event.command === 'help') {
                         context.shellInteractions.addOutputLine("Available commands: back, exit, help.");
                     } else {
                         context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandGeneral.replace('{command}', event.command), { type: 'error' });
                     }
                     context.shellInteractions.addOutputLine(reprompt);
                 }
              }
            ]
          }
        },
        authenticating: {
          entry: [assign({ isSubmitting: true, error: null }), ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine('Signing in...', { type: 'system' })],
          invoke: {
            id: 'signInService',
            src: 'signInService', // Use service key defined in actors
            input: ({ context }: { context: RegistrationContext }) => ({ email: context.userEmail, password: context.currentInput }),
            onDone: {
              target: '#registrationDialog.fetchingRegistration', // Absolute target
              actions: assign({
                  isSubmitting: false,
                  error: null,
                  userId: ({ event }) => event.output.userId,
                  userEmail: ({ event }) => event.output.email, // Store email too
                  currentInput: '', // Clear password
              })
            },
            onError: {
              target: 'promptingPassword', // Relative target
              actions: [
                assign({
                    isSubmitting: false,
                    error: ({ event }) => event.error instanceof Error ? event.error.message : String(event.error) || 'Sign in failed',
                    currentInput: '',
                }),
                ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
              ]
            }
          }
        }
      }
    }, // End signInFlow

    // --- Data Fetching & Initial Save ---
    fetchingRegistration: {
      entry: [assign({ isSubmitting: true, error: null }), ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine('Checking registration status...', { type: 'system' })],
      invoke: {
        id: 'fetchRegistrationService',
        src: 'fetchRegistrationService',
        input: ({ context }: { context: RegistrationContext }) => ({ userId: context.userId! }), // Assert userId is non-null here
        onDone: [
          {
            target: 'resumingProgress',
            guard: ({ event }: { event: { output: { registrationData: any } } }) => !!event.output.registrationData,
            actions: assign({
              isSubmitting: false,
              error: null,
              answers: ({ event }: { event: { output: { registrationData: any } } }) => event.output.registrationData.answers || {},
              lastSavedIndex: ({ event }) => event.output.registrationData.last_completed_index ?? -1,
              // Determine currentQuestionIndex based on lastSavedIndex
              currentQuestionIndex: ({ event }) => {
                  const lastIndex = event.output.registrationData.last_completed_index ?? -1;
                  // Assuming early auth is 0-4, questions start at 5
                  return Math.max(5, lastIndex + 1);
              }
            })
          },
          {
            target: 'savingInitialProgress', // No data found, save initial details
            guard: ({ event }: { event: { output: { registrationData: any } } }) => !event.output.registrationData,
            actions: assign({
              isSubmitting: false,
              error: null,
              // Keep userId and email from context
              answers: ({ context }: { context: RegistrationContext }) => ({ // Pre-populate answers with known details
                  userEmail: context.userEmail,
                  // Add firstName/lastName if available from signup/profile?
              }),
              currentQuestionIndex: 5, // Start at Q3 (index 5)
              lastSavedIndex: -1,
            })
          }
        ],
        onError: {
          target: 'idle', // Go to idle on fetch error
          actions: [
            assign({
              isSubmitting: false,
              error: ({ event }) => `Failed to fetch registration: ${event.error instanceof Error ? event.error.message : String(event.error) || 'Unknown error'}`,
              userId: null, // Clear userId on error?
              userEmail: null,
            }),
            ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
          ]
        }
      }
    }, // End fetchingRegistration

    resumingProgress: {
      entry: [
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine('Resuming previous registration.', { type: 'system' }),
        // Optionally display summary here? Or let questioning handle it.
      ],
      always: { target: 'questioning' } // Immediately go to questioning state
    }, // End resumingProgress

    savingInitialProgress: {
      entry: [assign({ isSubmitting: true, error: null }), ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine('Saving initial details...', { type: 'system' })],
      invoke: {
        id: 'saveInitialAnswerService', // Use a different ID?
        src: 'saveAnswerService', // Reuse the service
        // Input needs to save multiple initial fields if available (email, maybe name)
        input: ({ context }: { context: RegistrationContext }) => ({
            userId: context.userId!,
            questionId: 'userEmail', // Assuming 'userEmail' is the ID for the email answer
            answer: context.userEmail,
            currentQuestionIndex: -1 // Indicate initial save? Or use a specific question index?
            // TODO: How to save multiple initial fields (name?) in one go? Modify service/action?
        }),
        onDone: {
          target: 'questioning', // Proceed to questions
          actions: assign({
            isSubmitting: false,
            error: null,
            currentQuestionIndex: 5, // Ensure starting at Q3 (index 5)
            lastSavedIndex: -1 // Or update based on what was saved?
          })
        },
        onError: {
          target: 'idle', // Go to idle on save error
          actions: [
            assign({
              isSubmitting: false,
              error: ({ event }) => `Failed to save initial details: ${event.error instanceof Error ? event.error.message : String(event.error) || 'Unknown error'}`,
              userId: null,
              userEmail: null,
            }),
            ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
          ]
        }
      }
    }, // End savingInitialProgress

    // --- Main Questioning Flow ---
    questioning: {
      entry: [
        'displayCurrentQuestionAction' // Use named action
      ],
      on: {
        INPUT_RECEIVED: {
          target: 'validatingAnswer',
          actions: assign({ currentInput: ({ event }: { event: InputEvent }) => event.value })
        },
        COMMAND_RECEIVED: [
           {
             target: 'questioning', // Re-enter to display prev question
             guard: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => event.command === 'back' && utils.findPrevQuestionIndex(context.currentQuestionIndex, context.answers) !== context.currentQuestionIndex,
             actions: assign({ currentQuestionIndex: ({context}: { context: RegistrationContext }) => utils.findPrevQuestionIndex(context.currentQuestionIndex, context.answers), error: null })
           },
           {
             target: 'reviewing',
             guard: ({ event }: { event: CommandEvent }) => event.command === 'review',
             actions: [({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.commands.review.header, { type: 'system' })]
           },
           { // Explicit save command
             target: 'savingAnswer', // Go to save state
             guard: ({ event }: { event: CommandEvent }) => event.command === 'save',
             actions: [({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.commands.save.progress, { type: 'system' })]
           },
           {
             guard: ({ event }: { event: CommandEvent }) => event.command === 'exit',
             // TODO: Should save before exiting? Add target to savingAnswer with exit flag?
             actions: [({ context }: { context: RegistrationContext }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' })]
           },
           {
             guard: ({ event }: { event: CommandEvent }) => event.command === 'help',
             actions: [
                 ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.commands.help.general),
                 'displayCurrentQuestionAction' // Re-display prompt
             ]
           },
           { // Handle back at boundary and invalid commands
             actions: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
               if (event.command === 'back') {
                 context.shellInteractions.addOutputLine("Cannot go back further.", { type: 'system' });
               } else {
                 context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandGeneral.replace('{command}', event.command), { type: 'error' });
               }
               // Re-display prompt happens on re-entry to questioning state
             }
           }
        ]
      }
    }, // End questioning

    validatingAnswer: {
       always: [
         { target: 'handleValidAnswer', guard: 'isValidAnswerInput' },
         { target: 'handleInvalidAnswer', actions: 'assignAnswerValidationError' }
       ]
    }, // End validatingAnswer

    handleValidAnswer: {
      entry: [
        assign({
          answers: ({ context }: { context: RegistrationContext }) => {
            const questionId = context.questions[context.currentQuestionIndex]?.id;
            return { ...context.answers, [questionId]: context.currentInput };
          },
          error: null
        }),
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(`> ${context.currentInput}`, { type: 'input' }),
      ],
      always: { target: 'savingAnswer' } // Always save after valid input
    }, // End handleValidAnswer

    handleInvalidAnswer: {
      entry: [
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' }),
        'displayCurrentQuestionAction' // Re-display prompt
      ],
      always: { target: 'questioning' } // Go back to allow re-entry
    }, // End handleInvalidAnswer

    savingAnswer: {
      entry: [assign({ isSubmitting: true, error: null })], // No message needed if transient
      invoke: {
        id: 'saveAnswerService',
        src: 'saveAnswerService',
        input: ({ context }: { context: RegistrationContext }) => {
            const questionId = context.questions[context.currentQuestionIndex]?.id;
            const answer = context.answers[questionId];
            return {
                userId: context.userId!,
                questionId: questionId,
                answer: answer,
                currentQuestionIndex: context.currentQuestionIndex
            };
        },
        onDone: {
          target: 'questioning', // Go back to questioning
          actions: [
            assign({
              isSubmitting: false,
              error: null,
              lastSavedIndex: ({ context }: { context: RegistrationContext }) => context.currentQuestionIndex, // Update last saved index
              // Find next question index *after* saving
              currentQuestionIndex: ({ context }: { context: RegistrationContext }) => {
                  const nextIndex = utils.findNextQuestionIndex(context.currentQuestionIndex, context.answers);
                  // Check if we reached the end
                  if (nextIndex >= context.questions.length) {
                      // This transition should ideally happen based on the index check,
                      // maybe by having 'savingAnswer' transition to a 'checkCompletion' state.
                      // For now, just log completion and stay in questioning (will show review prompt).
                      context.shellInteractions.addOutputLine(registrationMessages.questioning.completionMessage, { type: 'system' });
                      return context.currentQuestionIndex; // Stay put, let questioning handle review transition
                  }
                  return nextIndex;
              }
            }),
            // Check if next index indicates completion, if so, maybe transition to review?
            // This logic is getting complex here, might need refinement.
          ]
        },
        onError: {
          target: 'questioning', // Go back to questioning with error
          actions: [
            assign({
              isSubmitting: false,
              error: ({ event }) => `Failed to save answer: ${event.error instanceof Error ? event.error.message : String(event.error) || 'Unknown error'}`,
            }),
            ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
            // Re-display current question happens on re-entry to questioning
          ]
        }
      }
    }, // End savingAnswer

    // --- Review and Edit ---
    reviewing: {
      entry: [
        'displayReviewAction'
      ],
      on: {
        COMMAND_RECEIVED: [
          {
            guard: ({ event }: { event: CommandEvent }) => event.command === 'submit',
            target: 'submitting'
          },
          {
            guard: ({ event }: { event: CommandEvent }) => event.command === 'edit' && !!event.args?.[0] && !isNaN(parseInt(event.args[0], 10)),
            target: 'editing',
            actions: assign({
              currentQuestionIndex: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
                const targetIndex = parseInt(event.args![0], 10) - 1;
                // Validate index is within question bounds (after early auth)
                if (targetIndex >= 5 && targetIndex < context.questions.length) {
                    return targetIndex;
                }
                context.shellInteractions.addOutputLine(registrationMessages.commands.edit.invalidNumber.replace('{number}', event.args![0]), { type: 'error' });
                return context.currentQuestionIndex; // Stay in review if invalid
              },
              error: null
            })
          },
          {
            guard: ({ event }: { event: CommandEvent }) => event.command === 'back',
            target: 'questioning', // Go back to last question
            actions: assign({
                currentQuestionIndex: ({ context }: { context: RegistrationContext }) => context.lastSavedIndex // Go to last successfully saved index
            })
          },
          { // Handle help or invalid commands
            actions: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
                const reprompt = registrationMessages.commands.review.instructions;
                if (event.command === 'help') {
                    context.shellInteractions.addOutputLine(registrationMessages.commands.help.review);
                } else {
                    context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandReview.replace('{command}', event.command), { type: 'error' });
                }
                 context.shellInteractions.addOutputLine(reprompt);
            }
          }
        ]
      }
    }, // End reviewing

    editing: {
       entry: [
         'displayEditingQuestionAction'
       ],
       on: {
         INPUT_RECEIVED: {
           target: 'validatingEditedAnswer',
           actions: assign({ currentInput: ({ event }: { event: InputEvent }) => event.value })
         },
         COMMAND_RECEIVED: [
            { // Allow 'save' command to trigger validation/save of current input
              target: 'validatingEditedAnswer',
              guard: ({ event }: { event: CommandEvent }) => event.command === 'save',
              // Input is already in context.currentInput from previous INPUT_RECEIVED
            },
            {
              target: 'reviewing', // Go back to review on exit
              guard: ({ event }: { event: CommandEvent }) => event.command === 'exit',
              actions: [({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.commands.review.header, { type: 'system' })]
            },
            {
              guard: ({ event }: { event: CommandEvent }) => event.command === 'help',
              actions: [
                  ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.commands.help.edit),
                  'displayEditingQuestionAction' // Re-prompt
              ]
            },
            { // Handle invalid commands
              actions: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
                  context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandEdit.replace('{command}', event.command), { type: 'error' });
                  // Re-display prompt happens on re-entry to editing state
              }
            }
         ]
       }
    }, // End editing

    validatingEditedAnswer: {
       always: [
         { target: 'handleValidEditedAnswer', guard: 'isValidAnswerInput' },
         { target: 'handleInvalidEditedAnswer', actions: 'assignAnswerValidationError' }
       ]
    }, // End validatingEditedAnswer

    handleValidEditedAnswer: {
      entry: [
        assign({
          answers: ({ context }: { context: RegistrationContext }) => {
            const questionId = context.questions[context.currentQuestionIndex]?.id;
            return { ...context.answers, [questionId]: context.currentInput };
          },
          error: null
        }),
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(`> ${context.currentInput}`, { type: 'input' }),
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.commands.edit.answerUpdated, { type: 'system' }),
      ],
      // Go save the edited answer
      always: { target: 'savingAnswer' } // Reuse savingAnswer state
    }, // End handleValidEditedAnswer

    handleInvalidEditedAnswer: {
       entry: [
         ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' }),
         'displayEditingQuestionAction' // Re-display edit prompt
       ],
       always: { target: 'editing' } // Go back to allow re-entry
    }, // End handleInvalidEditedAnswer

    // --- Submission Flow ---
    submitting: {
      entry: [assign({ isSubmitting: true, error: null }), ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.system.submitting, { type: 'system' })],
      invoke: {
        id: 'submitRegistrationService',
        src: 'submitRegistrationService',
        input: ({ context }: { context: RegistrationContext }) => ({ answers: context.answers }),
        onDone: {
          target: 'success',
          actions: [
            assign({ isSubmitting: false, error: null }),
            // TODO: Clear saved state here?
          ]
        },
        onError: {
          target: 'submissionError',
          actions: [
            assign({
              isSubmitting: false,
              error: ({ event }) => registrationMessages.errors.submitFailed.replace('{message}', event.error instanceof Error ? event.error.message : String(event.error || 'Unknown error'))
            }),
          ]
        }
      }
    }, // End submitting

    success: {
      entry: [
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.success.message),
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.success.thankYou),
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.sendToShellMachine({ type: 'REGISTRATION_COMPLETE' })
      ],
      type: 'final'
    }, // End success

    submissionError: {
      entry: [
        ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(
            registrationMessages.errors.submitFailed.replace('{message}', context.error || 'Unknown error'), { type: 'error' }
        ),
         ({ context }: { context: RegistrationContext }) => context.shellInteractions.addOutputLine(registrationMessages.submissionError.prompt)
      ],
      on: {
        COMMAND_RECEIVED: [
            {
                guard: ({ event }: { event: CommandEvent }) => event.type === 'COMMAND_RECEIVED' && event.command === 'retry',
                target: 'submitting'
            },
            {
                guard: ({ event }: { event: CommandEvent }) => event.type === 'COMMAND_RECEIVED' && event.command === 'review',
                target: 'reviewing'
            },
            {
                guard: ({ event }: { event: CommandEvent }) => event.type === 'COMMAND_RECEIVED' && event.command === 'exit',
                actions: [ ({ context }: { context: RegistrationContext }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' }) ]
            },
            { // Handle help or invalid commands
                actions: ({ context, event }: { context: RegistrationContext, event: CommandEvent }) => {
                    const reprompt = registrationMessages.submissionError.prompt;
                    if (event.command === 'help') {
                        context.shellInteractions.addOutputLine(registrationMessages.commands.help.general);
                    } else {
                        context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandSubmitError.replace('{command}', event.command), { type: 'error' });
                    }
                    context.shellInteractions.addOutputLine(reprompt);
                }
            }
        ]
      }
    } // End submissionError

  } // <-- Closing brace for main 'states' object
}, // <-- Closing brace for DEFINITION object, comma separates from options
// --- Machine Options (Actions, Guards, Services) ---
{ // <-- Start of options object
  actors: services, // Correct key for invoked promises/services in XState v5
  actions: {
    displaySignInOrUpPrompt: ({ context }: { context: RegistrationContext }) => {
      context.shellInteractions.addOutputLine(registrationMessages.signInOrUp.prompt); // Use the new message key
    },
    resetRegistrationState: assign({
      answers: {},
      currentQuestionIndex: 0, // Reset to start of earlyAuth
      error: null,
      userEmail: null, // Also reset email potentially stored from failed signup
      userId: null, // Reset userId
      lastSavedIndex: -1,
    }),
    // --- Named Actions ---
    displayCurrentQuestionAction: ({ context }: { context: RegistrationContext }) => {
      // Check if index is valid before accessing question
      if (context.currentQuestionIndex < 0 || context.currentQuestionIndex >= context.questions.length) {
          // Handle end of questions or invalid index - maybe transition to review?
          context.shellInteractions.addOutputLine(registrationMessages.questioning.completionMessage, { type: 'system' });
          // Consider transitioning to 'reviewing' state here instead of just logging
          return;
      }

      const question = context.questions[context.currentQuestionIndex];
      if (question) {
        // Use SSOT for progress indicator - Adjust index based on start (assuming 5 early auth steps)
        const questionNumber = context.currentQuestionIndex - 4;
        const totalQuestions = context.questions.length - 5;
        if (questionNumber > 0 && questionNumber <= totalQuestions) {
            const progress = registrationMessages.questioning.progressIndicator
                .replace('{current}', questionNumber.toString())
                .replace('{total}', totalQuestions.toString());
            context.shellInteractions.addOutputLine(`--- ${progress} ---`);
        }

        context.shellInteractions.addOutputLine(question.label);
        if (question.hint) context.shellInteractions.addOutputLine(registrationMessages.questioning.hint.replace('{hintText}', question.hint), { type: 'hint' });
        if (question.options) {
          question.options.forEach((opt: string, i: number) => context.shellInteractions.addOutputLine(`${i + 1}. ${opt}`)); // Added types
        }
         // Add prompt - Adjust index for display
         if (questionNumber > 0 && questionNumber <= totalQuestions) {
             context.shellInteractions.addOutputLine(registrationMessages.prompts.questioning.replace('{current}', questionNumber.toString()).replace('{total}', totalQuestions.toString()));
         } else {
             // Fallback prompt if not in main question range
             context.shellInteractions.addOutputLine('>');
         }
      } else {
        context.shellInteractions.addOutputLine(registrationMessages.errors.questionNotFound, { type: 'error' });
      }
    },
    displayReviewAction: ({ context }: { context: RegistrationContext }) => {
      context.shellInteractions.addOutputLine(registrationMessages.commands.review.header);
      context.questions.forEach((q: Question, index: number) => { // Added types
        // Skip early auth questions (indices 0-4)
        if (index < 5) return;
        const answer = context.answers[q.id];
        const displayAnswer = answer ?? "[No Answer]";
        const questionNumber = index - 4; // Adjust index for display
        context.shellInteractions.addOutputLine(
            registrationMessages.commands.review.itemFormat
                .replace('{index}', questionNumber.toString()) // Use adjusted index
                .replace('{label}', q.label)
                .replace('{answer}', String(displayAnswer))
        );
      });
      context.shellInteractions.addOutputLine(registrationMessages.commands.review.instructions);
    },
    displayEditingQuestionAction: ({ context }: { context: RegistrationContext }) => {
       const question = context.questions[context.currentQuestionIndex];
       if (question) {
         const questionNumber = context.currentQuestionIndex - 4; // Adjust index
         context.shellInteractions.addOutputLine(registrationMessages.commands.edit.prompt.replace('{index}', questionNumber.toString()).replace('{label}', question.label));
         context.shellInteractions.addOutputLine(registrationMessages.commands.edit.currentAnswer.replace('{answer}', context.answers[question.id] ?? "[No Answer]"));
         if (question.hint) context.shellInteractions.addOutputLine(registrationMessages.questioning.hint.replace('{hintText}', question.hint), { type: 'hint' });
         if (question.options) {
           question.options.forEach((opt: string, i: number) => context.shellInteractions.addOutputLine(`${i + 1}. ${opt}`)); // Added types
         }
         context.shellInteractions.addOutputLine(registrationMessages.commands.edit.instructions);
       } else {
         context.shellInteractions.addOutputLine(registrationMessages.errors.questionNotFound, { type: 'error' });
       }
    },
    // --- Actions for assigning validation errors ---
    assignEarlyAuthValidationError: assign({
        error: ({ context }: { context: RegistrationContext }) => {
            const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
            let result;
            if (stepId === 'firstName') result = utils.validateFirstName(context.currentInput);
            else if (stepId === 'lastName') result = utils.validateLastName(context.currentInput);
            else if (stepId === 'email') result = utils.validateEmail(context.currentInput);
            else if (stepId === 'password') result = utils.validatePassword(context.currentInput);
            else if (stepId === 'confirmPassword') result = utils.validateConfirmPassword(context.currentInput, context.answers.password);
            else result = { isValid: false, message: 'Unknown validation step' };
            return result.message || registrationMessages.validationErrors.generic;
        }
    }),
    assignAnswerValidationError: assign({
        error: ({ context }: { context: RegistrationContext }) => {
            const question = context.questions[context.currentQuestionIndex];
            const result = utils.validateAnswer(question, context.currentInput, context.answers);
            return result.message || registrationMessages.validationErrors.generic;
        }
    }),
  },
  guards: {
    // --- Named Guards ---
    isValidEarlyAuthInput: ({ context }: { context: RegistrationContext }) => {
        const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
        if (stepId === 'firstName') return utils.validateFirstName(context.currentInput).isValid;
        if (stepId === 'lastName') return utils.validateLastName(context.currentInput).isValid;
        if (stepId === 'email') return utils.validateEmail(context.currentInput).isValid;
        if (stepId === 'password') return utils.validatePassword(context.currentInput).isValid;
        if (stepId === 'confirmPassword') return utils.validateConfirmPassword(context.currentInput, context.answers.password).isValid;
        return false;
    },
     isValidAnswerInput: ({ context }: { context: RegistrationContext }) => {
        const question = context.questions[context.currentQuestionIndex];
        return utils.validateAnswer(question, context.currentInput, context.answers).isValid;
     },
  },
} // <-- Closing brace for options object
);
