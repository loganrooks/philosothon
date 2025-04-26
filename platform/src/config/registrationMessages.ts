// platform/src/config/registrationMessages.ts

/**
 * Single Source of Truth (SSOT) for all user-facing messages
 * in the registration dialog flow.
 */
export const registrationMessages = {
  // General Prompts / Headers
  dialogHeader: "Registration Mode",
  awaitingConfirmationHeader: "Awaiting Confirmation",
  prompts: {
    registration: "[registration]>",
    auth: "[auth]>",
    awaitingConfirmation: "[awaiting_confirmation]>",
    questioning: "[reg {current}/{total}]>", // Example dynamic prompt
  },

  // System Messages
  system: {
    checkingSavedProgress: "Checking for saved progress...",
    startingNewRegistration: "Starting new registration...",
    resumingRegistration: "Resuming registration...",
    creatingAccount: "Creating account...",
    checkingConfirmation: "Checking confirmation status...",
    resendingConfirmation: "Resending confirmation email...",
    startingQuestions: "Moving to first question...",
    submitting: "Submitting registration...",
  },

  // Intro State
  intro: {
    welcome: "Welcome to the Philosothon registration form! We need to collect some information to get you started.",
    overwriteWarning: "Existing registration progress found. Use 'register continue' to resume, or 'register new' to start over (will overwrite).",
    noContinueData: "No registration in progress found. Use 'register new'.",
  },

  // Early Authentication State
  earlyAuth: {
    promptFirstName: "Enter your First Name:",
    promptLastName: "Enter your Last Name:",
    promptEmail: "Enter your University Email Address:",
    promptPassword: "Password (min. 8 characters):", // Slightly more informative
    promptConfirmPassword: "Confirm Password:",
    existingUserError: "An account with this email already exists. Please use 'sign-in' or 'reset-password'.",
    signUpError: "Failed to create account. Please try again.",
    signUpErrorDetailed: "Sign-up failed: {message}", // For specific errors
    confirmationRequired: "Account created. Please check your email ({email}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.",
    accountVerified: "Account verified/created.", // Added for clarity
  },

  // Awaiting Confirmation State
  awaitingConfirmation: {
    checkFailed: "Email not confirmed yet. Please check your email or use 'resend'.",
    checkError: "Failed to check status: {message}", // Added placeholder
    resendSuccess: "Confirmation email resent to {email}.",
    resendError: "Failed to resend email: {message}", // Added placeholder
  },

  // Questioning State
  questioning: {
    progressIndicator: "Question {current}/{total}",
    completionMessage: "Registration questions complete. Use 'review' to check answers or 'submit'.", // Added next steps
    hint: "Hint: {hintText}", // Placeholder for question hints
    reprompt: "Please re-enter:",
  },

  // Command Related Messages
  commands: {
    save: {
      success: "Progress saved.",
      error: "Error saving progress.",
      progress: "Saving progress...",
    },
    exit: {
      message: "Exiting registration...",
    },
    review: {
      header: "Reviewing your answers:",
      instructions: "Use 'edit [number]' to change an answer, 'back' to return to questions, or 'submit'.",
      itemFormat: "  {index}. {label}: {answer}", // Simplified format example
    },
    edit: {
      prompt: "Editing question {index}: {label}",
      currentAnswer: "Current answer: {answer}",
      instructions: "Enter new answer or 'save' to keep current, 'exit' to cancel.",
      invalidNumber: "Invalid question number: {number}",
    },
    help: {
        // Define help text for different contexts if needed
        general: "Available commands: help, back, save, review, edit [number], submit, exit.",
        earlyAuth: "Enter your details. Available commands: help, exit.",
        awaitingConfirmation: "Available commands: continue, resend, help, exit.",
        review: "Available commands: edit [number], back, submit, help, exit.",
        edit: "Available commands: save, exit, help.",
    }
    // Add other commands (back, submit, etc.) if they have specific messages
  },

  // Validation Errors
  validationErrors: {
    generic: "Invalid input.",
    genericDetailed: "Invalid input: {message}",
    required: "This field is required.",
    invalidEmail: "Please enter a valid email address.",
    passwordMismatch: "Passwords do not match.",
    passwordTooShort: "Password must be at least 8 characters long.",
    invalidNumber: "Please enter a valid number.",
    outOfRange: "Please enter a number between {min} and {max}.",
    invalidSelection: "Invalid selection. Please choose from the available options.",
    // Multi-Select
    invalidMultiSelectFormat: "Please enter numbers separated by spaces.",
    // Ranked-Choice
    invalidRankingFormat: "Invalid format. Use '[OptionNumber]:[RankNumber]' separated by spaces/commas (e.g., 5:1 2:2 8:3).",
    rankingUniqueOptionError: "Each option number can only be used once.",
    rankingUniqueRankError: "Each rank number can only be used once.",
    rankingMinError: "Please rank at least {minRanked} options.",
    rankingStrictCountError: "Please rank exactly {minRanked} options.",
    rankingInvalidOptionNumber: "Invalid option number used in ranking: {number}.",
    rankingInvalidRankNumber: "Invalid rank number used: {number}. Must be between 1 and {maxRank}.",
  },

  // General Errors
  errors: {
    questionNotFound: "Question not found.",
    loadStateFailed: "Failed to load saved state: {message}",
    submitFailed: "Submission failed: {message}",
    invalidCommandIntro: "Command '{command}' not available. Use 'register new' or 'register continue'.",
    invalidCommandConfirmation: "Command '{command}' not available. Use 'continue', 'resend', or 'exit'.",
    invalidCommandReview: "Command '{command}' not available during review. Use 'edit [number]', 'back', or 'submit'.",
    invalidCommandEdit: "Command '{command}' not available while editing. Use 'save' or 'exit'.",
    invalidCommandSubmitError: "Command '{command}' not available. Use 'retry' or 'exit'.",
    invalidCommandGeneral: "Command '{command}' not available in this state.",
  },

  // Submission Error State
  submissionError: {
    prompt: "An error occurred during submission. Please 'retry' or 'exit'.",
  },

  // Success State
  success: {
    message: "Registration submitted successfully!",
    thankYou: "Thank you.",
  },

} as const; // Use 'as const' for stricter typing and better intellisense

// Optional: Define a deep keyof type helper if needed later for strong typing
// type PathImpl<T, Key extends keyof T> =
//   Key extends string
//   ? T[Key] extends Record<string, any>
//     ? | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
//       | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
//     : `${Key}`
//   : never;
// type Path<T> = PathImpl<T, keyof T> | keyof T;
// export type RegistrationMessageKey = Path<typeof registrationMessages>;