import { createMachine, assign, fromPromise } from 'xstate';
import { questions } from '@/app/register/data/registrationQuestions';
import * as regActions from '@/app/register/actions';
import { initiateOtpSignIn } from '@/lib/data/auth';
import { checkCurrentUserConfirmationStatus } from '@/app/register/actions';
import { z } from 'zod'; // Assuming Zod is used for validation schema
import { registrationMessages } from '@/config/registrationMessages';
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

type DialogMode = 'loadingSavedState' | 'intro' | 'earlyAuth' | 'awaitingConfirmation' | 'questioning' | 'review' | 'submitting' | 'success' | 'submissionError';

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
  savedStateExists: boolean; // Flag to indicate if resumable state was found
  // validationResult removed - handled by guards/actions calling utils or specific error context
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
type LoadEvent =
  | { type: 'LOAD_SUCCESS'; savedState: Partial<RegistrationContext> }
  | { type: 'LOAD_FAILURE'; error: Error } // Use Error type
  | { type: 'LOAD_NOT_FOUND' };
type SignUpEvent =
  | { type: 'SIGNUP_SUCCESS'; email: string }
  | { type: 'SIGNUP_EXISTS'; email: string }
  | { type: 'SIGNUP_FAILURE'; error: Error }; // Use Error type
type ConfirmationEvent =
  | { type: 'CONFIRMATION_SUCCESS' }
  | { type: 'CONFIRMATION_FAILURE'; error: Error }; // Use Error type
type ResendEvent =
  | { type: 'RESEND_SUCCESS' }
  | { type: 'RESEND_FAILURE'; error: Error }; // Use Error type
type SubmitEvent =
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_FAILURE'; error: Error }; // Use Error type
type NavigationEvent =
  | { type: 'RETRY' }
  | { type: 'EDIT_ANSWER'; index: number }
  | { type: 'GO_TO_REVIEW' }
  | { type: 'GO_TO_SUBMIT' };

export type RegistrationEvent = // Export if needed
  | InputEvent
  | CommandEvent
  | LoadEvent
  | SignUpEvent
  | ConfirmationEvent
  | ResendEvent
  | SubmitEvent
  | NavigationEvent;


// --- Services (Async Logic Wrappers) ---
// These wrap the actual async functions (server actions, utils)

const services = {
  loadStateService: fromPromise(utils.loadSavedState),

  signUpService: fromPromise(async ({ input }: { input: { answers: Record<string, any> } }) => {
    const { email } = input.answers;
    // Using initiateOtpSignIn as per spec V3.1 and previous code
    const { data, error } = await initiateOtpSignIn(email);
    if (error) {
      // Check for specific 'user already exists' error if Supabase provides one
      // Example check (adjust based on actual Supabase error structure):
      if (error.message.includes("User already registered")) {
          return { status: 'existing_user', email };
      }
      throw new Error(error.message || 'Sign-up failed');
    }
    // If OTP initiated, it implies user *might* not exist or confirmation is needed
    return { status: 'confirmation_required', email };
  }),

  checkConfirmationService: fromPromise(async () => {
      const isConfirmed = await checkCurrentUserConfirmationStatus();
      if (!isConfirmed) {
          throw new Error(registrationMessages.awaitingConfirmation.checkFailed);
      }
      return true; // Indicate success
  }),

  resendConfirmationService: fromPromise(async ({ input }: { input: { email: string | null } }) => {
      if (!input.email) {
          throw new Error("Cannot resend confirmation without email.");
      }
      const { error } = await initiateOtpSignIn(input.email);
      if (error) {
          throw new Error(error.message || registrationMessages.awaitingConfirmation.resendError);
      }
      return { email: input.email };
  }),

  submitRegistrationService: fromPromise(async ({ input }: { input: { answers: Record<string, any> } }) => {
      // Assuming submitRegistrationFromMachine is the correct server action
      const result = await regActions.submitRegistrationFromMachine(input.answers);
      // Adjust based on actual server action return type { success: boolean; message: string | null; }
      if (!result.success) {
          throw new Error(result.message || 'Submission failed');
      }
      return result;
  }),

  saveStateService: fromPromise(async ({ input }: { input: Pick<RegistrationContext, 'currentQuestionIndex' | 'answers' | 'userEmail'> }) => {
      utils.saveStateToStorage(input); // Util handles try/catch, rethrow on error
  }),

  clearStateService: fromPromise(async () => {
      utils.clearSavedState(); // Util handles try/catch, rethrow on error
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
    currentQuestionIndex: 0,
    answers: {},
    currentInput: '',
    error: null,
    userEmail: null,
    questions: questions, // Load questions from import
    shellInteractions: input.shellInteractions,
    isSubmitting: false,
    savedStateExists: false,
  }),
  initial: 'loadingSavedState',
  states: {
    loadingSavedState: {
      invoke: {
        id: 'loadStateService',
        src: 'loadStateService', // Use service key from services object
        onDone: {
          target: 'intro',
          actions: assign({
            savedStateExists: true,
            // Merge loaded state - ensure keys match context
            answers: ({ event }) => event.output.answers || {},
            currentQuestionIndex: ({ event }) => event.output.currentQuestionIndex ?? 0,
            userEmail: ({ event }) => event.output.userEmail || null,
          }),
        },
        onError: [
           {
             target: 'intro',
             guard: ({ event }) => event.error instanceof Error && event.error.message === "No saved data found.",
             actions: assign({ savedStateExists: false, error: null }),
           },
           {
             target: 'intro',
             actions: assign({
               savedStateExists: false,
               // Use generic error message, specific message handled by service
               error: ({ event }) => registrationMessages.errors.loadStateFailed.replace('{message}', event.error instanceof Error ? event.error.message : 'Unknown error'),
             }),
           }
        ]
      },
      entry: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.system.checkingSavedProgress, { type: 'system' })],
      exit: [
        // Display error if loading failed
        ({ context }) => {
            // Check if the error message starts with the generic load failed message
            if (context.error?.startsWith(registrationMessages.errors.loadStateFailed.split(':')[0])) {
                context.shellInteractions.addOutputLine(context.error, { type: 'error' });
            }
        },
        assign({ error: null }), // Clear error after handling
      ], // <-- Add missing bracket
    }, // <-- Correctly placed comma
      intro: {
        entry: [
          ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.intro.welcome),
          ({ context }) => {
              if (context.savedStateExists) {
                  context.shellInteractions.addOutputLine(registrationMessages.intro.overwriteWarning, { type: 'system' });
              }
              // No specific message needed if not resuming, welcome message is sufficient.
          }
        ],
        on: {
          COMMAND_RECEIVED: [
             {
               target: 'earlyAuth',
               guard: ({ event }) => event.command === 'register new',
               // TODO: Add confirmation guard/action if context.savedStateExists is true
               actions: [
                  assign({ currentQuestionIndex: 0, answers: {}, error: null, userEmail: null }), // Reset state
                  'clearSavedStateAction', // Use named action for service invocation
                  ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.system.startingNewRegistration, { type: 'system' })
               ]
             },
             {
               target: 'questioning', // Go directly to questioning if resuming
               guard: ({ event, context }) => event.command === 'register continue' && context.savedStateExists,
               actions: [
                  ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.system.resumingRegistration, { type: 'system' })
                  // State should already be loaded from loadingSavedState.onDone
               ]
             },
             {
               guard: ({ event, context }) => event.command === 'register continue' && !context.savedStateExists,
               actions: ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.intro.noContinueData, { type: 'error' })
             },
             {
               // Handle invalid command in intro state
               actions: ({ context, event }) => context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandIntro.replace('{command}', event.command), { type: 'error' }) // Use SSOT
             }
          ]
        }
      }, // <-- Added missing comma
    earlyAuth: {
      initial: 'promptingFirstName',
      states: {
        promptingFirstName: {
          entry: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptFirstName)],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        promptingLastName: {
          entry: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptLastName)],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        promptingEmail: {
          entry: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptEmail)],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        promptingPassword: {
          entry: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptPassword)],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        promptingConfirmPassword: {
          entry: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.earlyAuth.promptConfirmPassword)],
          on: { INPUT_RECEIVED: { target: 'validating', actions: assign({ currentInput: ({ event }) => event.value }) } }
        },
        validating: {
           // Use guards with imported utils instead of entry action
           always: [
             { target: 'handleValidInput', guard: 'isValidEarlyAuthInput' },
             { target: 'handleInvalidInput', actions: 'assignEarlyAuthValidationError' } // Assign error in action
           ]
        },
        handleValidInput: {
          entry: [
            assign({
              answers: ({ context }) => {
                const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
                return { ...context.answers, [stepId]: context.currentInput };
              },
              error: null
            }),
            ({ context }) => context.shellInteractions.addOutputLine(`> ${context.currentInput}`, { type: 'input' }),
          ],
          always: [
            { target: '#registrationDialog.signingUp', guard: ({ context }) => context.currentQuestionIndex === 4 },
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
            // Error message assigned in 'assignEarlyAuthValidationError' action
            ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' }),
            // Re-prompt based on current index using SSOT messages
            ({ context }) => {
                const prompts = [
                    registrationMessages.earlyAuth.promptFirstName,
                    registrationMessages.earlyAuth.promptLastName,
                    registrationMessages.earlyAuth.promptEmail,
                    registrationMessages.earlyAuth.promptPassword,
                    registrationMessages.earlyAuth.promptConfirmPassword
                ];
                context.shellInteractions.addOutputLine(prompts[context.currentQuestionIndex]);
            }
          ],
          always: [ // Go back to the correct prompting state
             { target: 'promptingFirstName', guard: ({ context }) => context.currentQuestionIndex === 0 },
             { target: 'promptingLastName', guard: ({ context }) => context.currentQuestionIndex === 1 },
             { target: 'promptingEmail', guard: ({ context }) => context.currentQuestionIndex === 2 },
             { target: 'promptingPassword', guard: ({ context }) => context.currentQuestionIndex === 3 },
             { target: 'promptingConfirmPassword', guard: ({ context }) => context.currentQuestionIndex === 4 },
          ]
        }
      },
      on: { // Global commands for earlyAuth
         COMMAND_RECEIVED: {
            actions: ({ context, event }) => {
                if (event.command === 'exit') {
                    context.shellInteractions.sendToShellMachine({ type: 'EXIT' });
                } else if (event.command === 'help') {
                    context.shellInteractions.addOutputLine(registrationMessages.commands.help.earlyAuth); // Use SSOT
                    // Re-prompt
                    const prompts = [
                        registrationMessages.earlyAuth.promptFirstName,
                        registrationMessages.earlyAuth.promptLastName,
                        registrationMessages.earlyAuth.promptEmail,
                        registrationMessages.earlyAuth.promptPassword,
                        registrationMessages.earlyAuth.promptConfirmPassword
                    ];
                    context.shellInteractions.addOutputLine(prompts[context.currentQuestionIndex]);
                } else {
                    context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandGeneral.replace('{command}', event.command), { type: 'error' }); // Use SSOT
                    // Re-prompt
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
    },
    signingUp: {
       entry: [
         assign({ isSubmitting: true, error: null }),
         ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.system.creatingAccount, { type: 'system' })
       ],
       invoke: {
         id: 'signUpService',
         src: 'signUpService', // Use service key
         input: ({ context }) => ({ // Pass necessary context to the service
            answers: context.answers
         }),
         onDone: [ // Handle different success statuses
            {
              target: 'awaitingConfirmation',
              guard: ({ event }) => event.output.status === 'confirmation_required',
              actions: assign({
                 isSubmitting: false,
                 userEmail: ({ event }) => event.output.email,
                 error: null
              }),
            },
            { // Handle case where user already exists (if service returns this)
              target: 'earlyAuth.promptingEmail', // Go back to email prompt
              guard: ({ event }) => event.output.status === 'existing_user',
              actions: assign({
                 isSubmitting: false,
                 error: registrationMessages.earlyAuth.existingUserError, // Use SSOT
                 userEmail: ({ event }) => event.output.email, // Store email even if exists?
              }),
            }
         ],
         onError: {
           target: 'earlyAuth.promptingConfirmPassword', // Go back on error
           actions: [
             assign({
                isSubmitting: false,
                // Access error message correctly from event.error for onError
                error: ({ event }) => registrationMessages.earlyAuth.signUpErrorDetailed.replace('{message}', event.error instanceof Error ? event.error.message : 'Unknown error')
             }),
             ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
           ]
         }
       }
    },
    awaitingConfirmation: {
      entry: [
        ({ context }) => context.shellInteractions.addOutputLine(
            registrationMessages.earlyAuth.confirmationRequired.replace('{email}', context.userEmail || 'your email')
        )
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
            actions: [ ({ context }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' }) ]
          },
          { // Handle help or invalid commands
            actions: ({ context, event }) => {
                const reprompt = registrationMessages.earlyAuth.confirmationRequired.replace('{email}', context.userEmail || 'your email');
                if (event.command === 'help') {
                    context.shellInteractions.addOutputLine(registrationMessages.commands.help.awaitingConfirmation); // Use SSOT
                    context.shellInteractions.addOutputLine(reprompt);
                } else {
                    context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandConfirmation.replace('{command}', event.command), { type: 'error' }); // Use SSOT
                    context.shellInteractions.addOutputLine(reprompt);
                }
            }
          }
        ]
      }
    },
    checkingConfirmation: {
      entry: [assign({ isSubmitting: true, error: null }), ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.system.checkingConfirmation, { type: 'system' })],
      invoke: {
        id: 'checkConfirmationService',
        src: 'checkConfirmationService', // Use service key
        onDone: {
          target: 'questioning',
          actions: [
            assign({ isSubmitting: false, error: null, currentQuestionIndex: 5 }), // Start questions after early auth (index 5?)
            ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.system.startingQuestions, { type: 'system' }) // Use system message
          ]
        },
        onError: {
          target: 'awaitingConfirmation',
          actions: [
            assign({
              isSubmitting: false,
              // Access error message correctly from event.error
              error: ({ event }) => registrationMessages.awaitingConfirmation.checkError.replace('{message}', event.error instanceof Error ? event.error.message : 'Unknown error')
            }),
            ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
          ]
        }
      }
    },
    resendingConfirmation: {
       entry: [assign({ isSubmitting: true, error: null }), ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.system.resendingConfirmation, { type: 'system' })],
       invoke: {
         id: 'resendConfirmationService',
         src: 'resendConfirmationService', // Use service key
         input: ({ context }) => ({ email: context.userEmail }),
         onDone: {
           target: 'awaitingConfirmation',
           actions: [
             assign({ isSubmitting: false, error: null }),
             ({ context, event }) => context.shellInteractions.addOutputLine(
                 registrationMessages.awaitingConfirmation.resendSuccess.replace('{email}', event.output.email), { type: 'system' }
             )
           ]
         },
         onError: {
           target: 'awaitingConfirmation',
           actions: [
             assign({
               isSubmitting: false,
               // Access error message correctly from event.error
               error: ({ event }) => registrationMessages.awaitingConfirmation.resendError.replace('{message}', event.error instanceof Error ? event.error.message : 'Unknown error')
             }),
             ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' })
           ]
         }
       }
    },
    questioning: {
      entry: [
        'displayCurrentQuestionAction' // Use named action
      ],
      on: {
        INPUT_RECEIVED: {
          target: 'validatingAnswer',
          actions: assign({ currentInput: ({ event }) => event.value })
        },
        COMMAND_RECEIVED: [
           // Target transitions first for state changes
           {
             target: 'questioning', // Re-enter to display prev question
             guard: ({ context, event }) => event.command === 'back' && utils.findPrevQuestionIndex(context.currentQuestionIndex, context.answers) !== context.currentQuestionIndex,
             actions: assign({ currentQuestionIndex: ({context}) => utils.findPrevQuestionIndex(context.currentQuestionIndex, context.answers), error: null })
           },
           {
             target: 'reviewing',
             guard: ({ event }) => event.command === 'review',
             actions: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.commands.review.header, { type: 'system' })] // Use header
           },
           // Actions-only commands
           {
             guard: ({ event }) => event.command === 'save',
             actions: ['saveStateAction'] // Use named action
           },
           {
             guard: ({ event }) => event.command === 'exit',
             actions: [({ context }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' })]
           },
           {
             guard: ({ event }) => event.command === 'help',
             actions: [
                 ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.commands.help.general), // Use general help
                 'displayCurrentQuestionAction' // Re-display prompt
             ]
           },
           { // Handle back at boundary and invalid commands
             actions: ({ context, event }) => {
               if (event.command === 'back') {
                 // No specific message for already being at the start
                 context.shellInteractions.addOutputLine("Cannot go back further.", { type: 'system' }); // Simple message
               } else {
                 context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandGeneral.replace('{command}', event.command), { type: 'error' }); // Use SSOT
               }
               // Re-display prompt
               const question = context.questions[context.currentQuestionIndex];
               if (question) context.shellInteractions.addOutputLine(question.label);
             }
           }
        ]
      }
    },
    validatingAnswer: {
       always: [ // Use guards calling utils
         { target: 'handleValidAnswer', guard: 'isValidAnswerInput' },
         { target: 'handleInvalidAnswer', actions: 'assignAnswerValidationError' } // Assign error in action
       ]
    },
    handleValidAnswer: {
      entry: [
        assign({
          answers: ({ context }) => {
            const questionId = context.questions[context.currentQuestionIndex]?.id;
            // TODO: Handle potential type conversion based on question.type (e.g., number, boolean)
            return { ...context.answers, [questionId]: context.currentInput };
          },
          error: null
        }),
        ({ context }) => context.shellInteractions.addOutputLine(`> ${context.currentInput}`, { type: 'input' }),
      ],
      always: [
        {
          target: 'reviewing',
          guard: ({ context }) => utils.findNextQuestionIndex(context.currentQuestionIndex, context.answers) >= context.questions.length,
          actions: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.questioning.completionMessage, { type: 'system' })]
        },
        {
          target: 'questioning',
          actions: assign({
            currentQuestionIndex: ({ context }) => utils.findNextQuestionIndex(context.currentQuestionIndex, context.answers),
          })
        }
      ]
    },
    handleInvalidAnswer: {
      entry: [
        // Error message assigned in 'assignAnswerValidationError' action
        ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' }),
        'displayCurrentQuestionAction' // Re-display prompt
      ],
      always: { target: 'questioning' }
    },
    reviewing: { // Renamed state
      entry: [
        'displayReviewAction' // Use named action
      ],
      on: {
        COMMAND_RECEIVED: [
          {
            guard: ({ event }) => event.command === 'submit',
            target: 'submitting'
          },
          {
            guard: ({ event }) => event.command === 'edit' && !!event.args?.[0] && !isNaN(parseInt(event.args[0], 10)),
            target: 'editing',
            actions: assign({
              currentQuestionIndex: ({ context, event }) => {
                const targetIndex = parseInt(event.args![0], 10) - 1;
                // TODO: Add validation: ensure index is within bounds and not an earlyAuth question (index >= 5?)
                return Math.max(5, Math.min(targetIndex, context.questions.length - 1));
              },
              error: null
            })
          },
          {
            guard: ({ event }) => event.command === 'back',
            target: 'questioning',
            actions: assign({
                // Go back to the actual last question index before review
                currentQuestionIndex: ({ context }) => context.questions.length -1 // Or find last *answered* index?
            })
          },
          { // Handle help or invalid commands
            actions: ({ context, event }) => {
                const reprompt = registrationMessages.commands.review.instructions; // Use instructions as reprompt
                if (event.command === 'help') {
                    context.shellInteractions.addOutputLine(registrationMessages.commands.help.review); // Use SSOT
                } else {
                    context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandReview.replace('{command}', event.command), { type: 'error' }); // Use SSOT
                }
                 context.shellInteractions.addOutputLine(reprompt);
            }
          }
        ]
      }
    },
    editing: {
       entry: [
         'displayEditingQuestionAction' // Use named action
       ],
       on: {
         INPUT_RECEIVED: {
           target: 'validatingEditedAnswer',
           actions: assign({ currentInput: ({ event }) => event.value })
         },
         COMMAND_RECEIVED: [
            // Target transitions first
            {
              target: 'reviewing',
              guard: ({ event }) => event.command === 'exit' || event.command === 'review',
              actions: [({ context }) => context.shellInteractions.addOutputLine(registrationMessages.commands.review.header, { type: 'system' })] // Use review header as confirmation
            },
            // Actions-only commands
            {
              guard: ({ event }) => event.command === 'save',
              actions: ['saveStateAction'] // Use named action
            },
            {
              guard: ({ event }) => event.command === 'help',
              actions: [
                  ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.commands.help.edit), // Use SSOT
                  'displayEditingQuestionAction' // Re-prompt
              ]
            },
            { // Handle invalid commands
              actions: ({ context, event }) => {
                  context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandEdit.replace('{command}', event.command), { type: 'error' }); // Use SSOT
                  // Re-prompt
                  const question = context.questions[context.currentQuestionIndex];
                  if (question) context.shellInteractions.addOutputLine(question.label);
              }
            }
         ]
       }
    },
    validatingEditedAnswer: {
       always: [ // Use guards calling utils
         { target: 'handleValidEditedAnswer', guard: 'isValidAnswerInput' }, // Reuse same guard
         { target: 'handleInvalidEditedAnswer', actions: 'assignAnswerValidationError' } // Assign error in action
       ]
    },
    handleValidEditedAnswer: {
      entry: [
        assign({
          answers: ({ context }) => {
            const questionId = context.questions[context.currentQuestionIndex]?.id;
            // TODO: Handle type conversion
            return { ...context.answers, [questionId]: context.currentInput };
          },
          error: null
        }),
        ({ context }) => context.shellInteractions.addOutputLine(`> ${context.currentInput}`, { type: 'input' }),
        ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.commands.edit.answerUpdated, { type: 'system' }),
        'saveStateAction', // Auto-save after successful edit
      ],
      always: { target: 'reviewing' }
    },
    handleInvalidEditedAnswer: {
       entry: [
         // Error message assigned in 'assignAnswerValidationError' action
         ({ context }) => context.shellInteractions.addOutputLine(context.error!, { type: 'error' }),
         'displayEditingQuestionAction' // Re-display edit prompt
       ],
       always: { target: 'editing' }
    },
    submitting: {
      entry: [assign({ isSubmitting: true, error: null }), ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.system.submitting, { type: 'system' })],
      invoke: {
        id: 'submitRegistrationService',
        src: 'submitRegistrationService', // Use service key
        input: ({ context }) => ({ answers: context.answers }),
        onDone: {
          target: 'success',
          actions: [
            assign({ isSubmitting: false, error: null }),
            'clearSavedStateAction' // Use named action
          ]
        },
        onError: {
          target: 'submissionError',
          actions: [
            assign({
              isSubmitting: false,
              // Access error message correctly from event.error
              error: ({ event }) => registrationMessages.errors.submitFailed.replace('{message}', event.error instanceof Error ? event.error.message : 'Unknown error')
            }),
          ]
        }
      }
    },
    success: {
      entry: [
        ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.success.message),
        ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.success.thankYou),
        'clearSavedStateAction', // Use named action
        ({ context }) => context.shellInteractions.sendToShellMachine({ type: 'REGISTRATION_COMPLETE' })
      ],
      type: 'final'
    },
    submissionError: {
      entry: [
        ({ context }) => context.shellInteractions.addOutputLine(
            registrationMessages.errors.submitFailed.replace('{message}', context.error || 'Unknown error'), { type: 'error' }
        ),
         ({ context }) => context.shellInteractions.addOutputLine(registrationMessages.submissionError.prompt) // Use SSOT
      ],
      on: {
        COMMAND_RECEIVED: [
            {
                guard: ({ event }) => event.command === 'retry',
                target: 'submitting'
            },
            {
                guard: ({ event }) => event.command === 'review', // Changed from 'back'
                target: 'reviewing'
            },
            {
                guard: ({ event }) => event.command === 'exit',
                actions: [ ({ context }) => context.shellInteractions.sendToShellMachine({ type: 'EXIT' }) ]
            },
            { // Handle help or invalid commands
                actions: ({ context, event }) => {
                    const reprompt = registrationMessages.submissionError.prompt;
                    if (event.command === 'help') {
                        context.shellInteractions.addOutputLine(registrationMessages.commands.help.general); // Use general help
                    } else {
                        context.shellInteractions.addOutputLine(registrationMessages.errors.invalidCommandSubmitError.replace('{command}', event.command), { type: 'error' }); // Use SSOT
                    }
                    context.shellInteractions.addOutputLine(reprompt);
                }
            }
        ]
      }
    }
  }
// --- Machine Options (Actions, Guards, Services) ---
}, {
  actions: {
    // --- Named Actions ---
    clearSavedStateAction: ({ context }) => {
        try {
            utils.clearSavedState();
            // No success message needed usually
        } catch (error) {
             context.shellInteractions.addOutputLine(
                registrationMessages.errors.clearStateFailed.replace('{message}', error instanceof Error ? error.message : 'Unknown error'),
                { type: 'error' }
            );
        }
    },
    saveStateAction: ({ context }) => {
         try {
            utils.saveStateToStorage({
                currentQuestionIndex: context.currentQuestionIndex,
                answers: context.answers,
                userEmail: context.userEmail,
            });
             context.shellInteractions.addOutputLine(registrationMessages.commands.save.success, { type: 'system' });
        } catch (error) {
             context.shellInteractions.addOutputLine(
                 `${registrationMessages.commands.save.error}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                 { type: 'error' }
             );
        }
    },
    displayCurrentQuestionAction: ({ context }) => {
      const question = context.questions[context.currentQuestionIndex];
      if (question) {
        // Use SSOT for progress indicator
        const progress = registrationMessages.questioning.progressIndicator
            .replace('{current}', (context.currentQuestionIndex - 4).toString()) // Adjust index based on start (assuming 5 early auth steps)
            .replace('{total}', (context.questions.length - 5).toString()); // Adjust total count
        context.shellInteractions.addOutputLine(`--- ${progress} ---`);
        context.shellInteractions.addOutputLine(question.label);
        if (question.hint) context.shellInteractions.addOutputLine(registrationMessages.questioning.hint.replace('{hintText}', question.hint), { type: 'hint' }); // Use SSOT
        if (question.options) {
          question.options.forEach((opt, i) => context.shellInteractions.addOutputLine(`${i + 1}. ${opt}`));
        }
         // Add prompt
         context.shellInteractions.addOutputLine(registrationMessages.prompts.questioning.replace('{current}', (context.currentQuestionIndex - 4).toString()).replace('{total}', (context.questions.length - 5).toString()));
      } else {
        context.shellInteractions.addOutputLine(registrationMessages.errors.questionNotFound, { type: 'error' });
      }
    },
    displayReviewAction: ({ context }) => {
      context.shellInteractions.addOutputLine(registrationMessages.commands.review.header);
      context.questions.forEach((q, index) => {
        if (index < 5) return; // Skip early auth
        const answer = context.answers[q.id];
        const displayAnswer = answer ?? "[No Answer]"; // Use simple fallback
        context.shellInteractions.addOutputLine(
            registrationMessages.commands.review.itemFormat
                .replace('{index}', (index + 1).toString())
                .replace('{label}', q.label)
                .replace('{answer}', String(displayAnswer)) // Ensure string conversion
        );
      });
      context.shellInteractions.addOutputLine(registrationMessages.commands.review.instructions); // Use SSOT
    },
    displayEditingQuestionAction: ({ context }) => {
       const question = context.questions[context.currentQuestionIndex];
       if (question) {
         context.shellInteractions.addOutputLine(registrationMessages.commands.edit.prompt.replace('{index}', (context.currentQuestionIndex + 1).toString()).replace('{label}', question.label)); // Use SSOT
         context.shellInteractions.addOutputLine(registrationMessages.commands.edit.currentAnswer.replace('{answer}', context.answers[question.id] ?? "[No Answer]")); // Use simple fallback
         if (question.hint) context.shellInteractions.addOutputLine(registrationMessages.questioning.hint.replace('{hintText}', question.hint), { type: 'hint' }); // Use SSOT
         if (question.options) {
           question.options.forEach((opt, i) => context.shellInteractions.addOutputLine(`${i + 1}. ${opt}`));
         }
         context.shellInteractions.addOutputLine(registrationMessages.commands.edit.instructions); // Use SSOT
       } else {
         context.shellInteractions.addOutputLine(registrationMessages.errors.questionNotFound, { type: 'error' }); // Use SSOT
         // TODO: Should this transition back to review? Maybe assign error and let state handle?
       }
    },
    // --- Actions for assigning validation errors ---
    assignEarlyAuthValidationError: assign({
        error: ({ context }) => {
            const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
            let result;
            if (stepId === 'firstName') result = utils.validateFirstName(context.currentInput);
            else if (stepId === 'lastName') result = utils.validateLastName(context.currentInput);
            else if (stepId === 'email') result = utils.validateEmail(context.currentInput);
            else if (stepId === 'password') result = utils.validatePassword(context.currentInput);
            else if (stepId === 'confirmPassword') result = utils.validateConfirmPassword(context.currentInput, context.answers.password);
            else result = { isValid: false, message: 'Unknown validation step' };
            return result.message || registrationMessages.validationErrors.generic; // Use SSOT
        }
    }),
    assignAnswerValidationError: assign({
        error: ({ context }) => {
            const question = context.questions[context.currentQuestionIndex];
            const result = utils.validateAnswer(question, context.currentInput, context.answers);
            return result.message || registrationMessages.validationErrors.generic; // Use SSOT
        }
    }),
  },
  guards: {
    // --- Named Guards ---
    isValidEarlyAuthInput: ({ context }) => {
        const stepId = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'][context.currentQuestionIndex];
        if (stepId === 'firstName') return utils.validateFirstName(context.currentInput).isValid;
        if (stepId === 'lastName') return utils.validateLastName(context.currentInput).isValid;
        if (stepId === 'email') return utils.validateEmail(context.currentInput).isValid;
        if (stepId === 'password') return utils.validatePassword(context.currentInput).isValid;
        if (stepId === 'confirmPassword') return utils.validateConfirmPassword(context.currentInput, context.answers.password).isValid;
        return false;
    },
     // No need for isInvalid guard if using actions to assign error
     isValidAnswerInput: ({ context }) => {
        const question = context.questions[context.currentQuestionIndex];
        return utils.validateAnswer(question, context.currentInput, context.answers).isValid;
     },
    // No need for isInvalid guard if using actions to assign error
  },
});