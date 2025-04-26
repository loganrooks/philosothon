import { questions } from '@/app/register/data/registrationQuestions';
import { registrationMessages } from '@/config/registrationMessages';
import type { RegistrationContext, Question } from './registrationDialogMachine'; // Assuming types are exported or defined appropriately

// --- Validation Helpers ---

export function validateFirstName(input: string): { isValid: boolean; message?: string } {
  if (!input) return { isValid: false, message: registrationMessages.validationErrors.required };
  // Add any other specific first name validation if needed
  return { isValid: true };
}

export function validateLastName(input: string): { isValid: boolean; message?: string } {
  if (!input) return { isValid: false, message: registrationMessages.validationErrors.required };
  // Add any other specific last name validation if needed
  return { isValid: true };
}

export function validateEmail(input: string): { isValid: boolean; message?: string } {
  if (!input) return { isValid: false, message: registrationMessages.validationErrors.required };
  if (!/\S+@\S+\.\S+/.test(input)) return { isValid: false, message: registrationMessages.validationErrors.invalidEmail };
  // Add domain validation if needed (e.g., utoronto.ca)
  return { isValid: true };
}

export function validatePassword(input: string): { isValid: boolean; message?: string } {
  if (!input) return { isValid: false, message: registrationMessages.validationErrors.required };
  if (input.length < 8) return { isValid: false, message: registrationMessages.validationErrors.passwordTooShort };
  return { isValid: true };
}

export function validateConfirmPassword(input: string, password?: string): { isValid: boolean; message?: string } {
  if (!input) return { isValid: false, message: registrationMessages.validationErrors.required };
  if (input !== password) return { isValid: false, message: registrationMessages.validationErrors.passwordMismatch };
  return { isValid: true };
}

// Placeholder for the more complex answer validation logic
export function validateAnswer(question: Question | undefined, answer: string, allAnswers: Record<string, any>): { isValid: boolean; message?: string } {
  if (!question) return { isValid: false, message: "Question not found." }; // Use SSOT?

  if (question.required && !answer) {
    return { isValid: false, message: question.validationRules?.required || registrationMessages.validationErrors.required };
  }

  // TODO: Implement full validation based on question.type and question.validationRules
  // (e.g., ranked-choice, multi-select, number range, scale, boolean)
  if (question.type === 'ranked-choice-numbered') {
    console.warn("Ranked-choice validation not fully implemented in utils yet.");
    // Add full parsing and validation logic here
  }
  if (question.type === 'multi-select-numbered') {
     console.warn("Multi-select validation not fully implemented in utils yet.");
     // Add full parsing and validation logic here
  }
  // ... other types

  return { isValid: true };
};


// --- Skip Logic Helpers ---

export function shouldSkipQuestion(question: Question | undefined, answers: Record<string, any>): boolean {
  if (!question?.dependsOn) {
    return false;
  }
  const dependsOnAnswer = answers[question.dependsOn];
  const conditionMet = Array.isArray(question.dependsValue)
    ? question.dependsValue.includes(dependsOnAnswer)
    : dependsOnAnswer === question.dependsValue;

  // Skip if the dependency condition is NOT met
  return !conditionMet;
}


export function findNextQuestionIndex(currentIndex: number, answers: Record<string, any>): number {
  let nextIndex = currentIndex + 1;
  while (nextIndex < questions.length) {
    const nextQuestion = questions[nextIndex];
    if (shouldSkipQuestion(nextQuestion, answers)) {
      nextIndex++;
      continue;
    }
    break; // Found the next valid index
  }
  return nextIndex;
};

export function findPrevQuestionIndex(currentIndex: number, answers: Record<string, any>): number {
    let prevIndex = currentIndex - 1;
    const minIndex = 3; // Cannot go below index 3 ('academicYear') in questioning mode

    while (prevIndex >= minIndex) {
        const prevQuestion = questions[prevIndex];
         if (shouldSkipQuestion(prevQuestion, answers)) {
            prevIndex--;
            continue;
        }
        break; // Found the previous valid index
    }
    return Math.max(minIndex, prevIndex); // Ensure it doesn't go below minIndex
};


// --- Local Storage Helpers ---

const LOCAL_STORAGE_KEY = 'philosothon-registration-v3.1';

export const loadSavedState = async (): Promise<Partial<RegistrationContext>> => {
  try {
    // Check if localStorage is available (important for SSR/testing)
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        console.warn("localStorage not available. Cannot load saved state.");
        throw new Error("No saved data found."); // Treat as not found
    }
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      const decodedData = atob(savedData);
      const parsedState = JSON.parse(decodedData);
      // Basic validation
      if (parsedState && typeof parsedState.currentQuestionIndex === 'number' && typeof parsedState.answers === 'object') {
        console.log("Loaded saved state:", parsedState);
        return parsedState as Partial<RegistrationContext>;
      } else {
        console.error("Invalid saved data structure:", parsedState);
        throw new Error("Saved data is invalid.");
      }
    } else {
      throw new Error("No saved data found.");
    }
  } catch (error) {
    // Don't log generic errors in production, but useful for debug
    // console.error("Failed to load saved state:", error);
    if (error instanceof Error && error.message === "No saved data found.") {
        // This is an expected case, not necessarily an error to log loudly
        throw error;
    }
    // Rethrow other errors (parsing, invalid structure)
    throw new Error(`Failed to load or parse saved state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const saveStateToStorage = (context: Pick<RegistrationContext, 'currentQuestionIndex' | 'answers' | 'userEmail'>): void => {
  try {
     // Check if localStorage is available
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        console.warn("localStorage not available. Cannot save state.");
        return; // Silently fail or handle differently?
    }
    const stateToSave = {
      currentQuestionIndex: context.currentQuestionIndex,
      answers: context.answers,
      userEmail: context.userEmail,
      // Add other relevant context fields if needed
    };
    const encodedData = btoa(JSON.stringify(stateToSave));
    localStorage.setItem(LOCAL_STORAGE_KEY, encodedData);
    console.log("Saved state to localStorage:", stateToSave);
    // Message is handled by the machine action calling this util
  } catch (error) {
    console.error("Failed to save state:", error);
    // Error message is handled by the machine action calling this util
    throw new Error(`Failed to save state: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const clearSavedState = (): void => {
    try {
        // Check if localStorage is available
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
            console.warn("localStorage not available. Cannot clear saved state.");
            return;
        }
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        console.log("Cleared saved state from localStorage.");
    } catch (error) {
        console.error("Failed to clear saved state:", error);
        // Optionally inform the user via machine context/actions
        throw new Error(`Failed to clear saved state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};