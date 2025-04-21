'use client';

import React, { useState, useEffect, useRef, useCallback, useReducer, useTransition } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { questions as allQuestions, Question } from '../data/registrationQuestions'; // Assuming V3.1 data is here
import {
    submitRegistration,
    updateRegistration,
    deleteRegistration,
    RegistrationState // Keep if used by actions
} from '../actions';
import {
    signInWithPassword,
    signUpUser,
    signOut,
    requestPasswordReset,
    checkUserVerificationStatus,
    resendConfirmationEmail, // Assuming this will be added
    AuthActionResult
} from '../../auth/actions';

// --- Constants ---
const LOCAL_STORAGE_KEY = 'philosothon-registration-v3.1';
const TOTAL_QUESTIONS = allQuestions.length; // Should be 36 based on spec

// --- Types ---
type TerminalMode = 'boot' | 'main' | 'auth' | 'register' | 'review' | 'edit' | 'confirm_delete' | 'confirm_new' | 'awaiting_confirmation';
type AuthSubState = 'idle' | 'awaiting_email' | 'awaiting_password' | 'awaiting_confirm_password';
type PendingAction = 'signIn' | 'signUp' | 'submitReg' | 'updateReg' | 'deleteReg' | 'checkVerification' | 'resendConfirmation' | 'resetPassword' | null;

interface OutputLine {
    id: number;
    text: string;
    type: 'input' | 'output' | 'error' | 'success' | 'warning' | 'info' | 'question' | 'prompt';
    mode?: TerminalMode;
    promptText?: string;
}

// Using Record<string, any> for flexibility, refine if possible
type FormDataStore = Record<string, any> & {
    currentQuestionIndex?: number;
    email?: string;
    firstName?: string; // Added for early auth
    lastName?: string; // Added for early auth
    isVerified?: boolean; // Track if email verification step passed locally (distinct from server confirmation)
};

interface TerminalState {
    mode: TerminalMode;
    outputLines: OutputLine[];
    currentInput: string;
    localData: FormDataStore;
    currentQuestionIndex: number;
    isAuthenticated: boolean;
    userEmail: string | null;
    registrationStatus: 'complete' | 'incomplete' | 'not_started'; // Fetched from server post-auth
    authSubState: AuthSubState;
    passwordAttempt: string; // Store first password attempt during signup/auth
    pendingAction: PendingAction;
    error: string | null;
    infoMessage: string | null; // For non-error messages like "Saved."
    isBooting: boolean;
}

type TerminalAction =
    | { type: 'BOOT_COMPLETE'; payload: { isAuthenticated: boolean; email: string | null; localData: FormDataStore } }
    | { type: 'SET_MODE'; payload: TerminalMode }
    | { type: 'ADD_OUTPUT'; payload: { text: string; type: OutputLine['type']; promptOverride?: string } }
    | { type: 'SET_INPUT'; payload: string }
    | { type: 'PROCESS_INPUT' } // Handled in effect/callback
    | { type: 'SET_AUTH_STATE'; payload: { isAuthenticated: boolean; email: string | null } }
    | { type: 'UPDATE_LOCAL_DATA'; payload: Partial<FormDataStore> }
    | { type: 'SET_QUESTION_INDEX'; payload: number }
    | { type: 'SET_AUTH_SUBSTATE'; payload: AuthSubState }
    | { type: 'SET_PASSWORD_ATTEMPT'; payload: string }
    | { type: 'ACTION_START'; payload: PendingAction }
    | { type: 'ACTION_SUCCESS'; payload?: { message?: string; userId?: string; requiresConfirmation?: boolean } } // requiresConfirmation for signUpUser
    | { type: 'ACTION_FAILURE'; payload: string }
    | { type: 'CLEAR_ERROR' }
    | { type: 'SET_INFO_MESSAGE'; payload: string | null }
    | { type: 'CLEAR_OUTPUT' };

// --- Initial State ---
const initialState: TerminalState = {
    mode: 'boot',
    outputLines: [],
    currentInput: '',
    localData: {},
    currentQuestionIndex: 0,
    isAuthenticated: false,
    userEmail: null,
    registrationStatus: 'not_started',
    authSubState: 'idle',
    passwordAttempt: '',
    pendingAction: null,
    error: null,
    infoMessage: null,
    isBooting: true,
};

// --- Reducer ---
function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
    switch (action.type) {
        case 'BOOT_COMPLETE':
            const { isAuthenticated, email, localData } = action.payload;
            const initialMode = isAuthenticated ? 'main' : 'main'; // Always start in main after boot
            // Determine initial registration status based on auth/local data (simplified)
            const initialRegStatus = isAuthenticated ? 'incomplete' : (localData.currentQuestionIndex !== undefined ? 'incomplete' : 'not_started');
            return {
                ...state,
                isAuthenticated,
                userEmail: email,
                localData,
                currentQuestionIndex: localData.currentQuestionIndex ?? 0,
                registrationStatus: initialRegStatus, // TODO: Fetch actual status post-auth
                mode: initialMode,
                isBooting: false,
            };
        case 'SET_MODE':
            // Reset auth sub-state when changing main modes
            return { ...state, mode: action.payload, authSubState: 'idle', passwordAttempt: '', error: null, infoMessage: null };
        case 'ADD_OUTPUT':
            const newOutputLine: OutputLine = {
                id: Date.now() + Math.random(), // Simple unique ID
                text: action.payload.text,
                type: action.payload.type,
                mode: state.mode,
                promptText: action.payload.promptOverride ?? getPromptText(state.mode, state.isAuthenticated, state.userEmail, state.authSubState, state.currentQuestionIndex)
            };
            // Avoid adding duplicate consecutive messages of the same type/text
            const lastLine = state.outputLines[state.outputLines.length - 1];
            if (lastLine && lastLine.text === newOutputLine.text && lastLine.type === newOutputLine.type) {
                return state;
            }
            return { ...state, outputLines: [...state.outputLines, newOutputLine] };
        case 'SET_INPUT':
            return { ...state, currentInput: action.payload };
        case 'SET_AUTH_STATE':
            return { ...state, isAuthenticated: action.payload.isAuthenticated, userEmail: action.payload.email };
        case 'UPDATE_LOCAL_DATA':
            return { ...state, localData: { ...state.localData, ...action.payload } };
        case 'SET_QUESTION_INDEX':
            return { ...state, currentQuestionIndex: action.payload, error: null, infoMessage: null }; // Clear errors on navigation
        case 'SET_AUTH_SUBSTATE':
            return { ...state, authSubState: action.payload };
        case 'SET_PASSWORD_ATTEMPT':
            return { ...state, passwordAttempt: action.payload };
        case 'ACTION_START':
            return { ...state, pendingAction: action.payload, error: null, infoMessage: null };
        case 'ACTION_SUCCESS':
            return { ...state, pendingAction: null, error: null, infoMessage: action.payload?.message ?? null };
        case 'ACTION_FAILURE':
            return { ...state, pendingAction: null, error: action.payload, infoMessage: null };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'SET_INFO_MESSAGE':
            return { ...state, infoMessage: action.payload };
        case 'CLEAR_OUTPUT':
            return { ...state, outputLines: [] };
        default:
            return state;
    }
}

// --- Helper: Get Prompt Text ---
const getPromptText = (mode: TerminalMode, auth: boolean, email: string | null, authSubState: AuthSubState, questionIndex: number): string => {
    if (mode === 'auth') {
        if (authSubState === 'awaiting_email') return '[auth] Email: ';
        if (authSubState === 'awaiting_password') return '[auth] Password: ';
    }
    if (mode === 'register' || mode === 'edit') {
        const question = allQuestions[questionIndex];
        if (question) {
            if (question.id === 'email' && authSubState === 'awaiting_email') return '[reg] Email: ';
            if (question.id === 'password' && authSubState === 'awaiting_password') return '[reg] Password: ';
            if (question.id === 'confirmPassword' && authSubState === 'awaiting_confirm_password') return '[reg] Confirm Password: ';
        }
        // Default registration prompt shows progress
        return `[reg ${questionIndex + 1}/${TOTAL_QUESTIONS}]> `;
    }

    switch (mode) {
        case 'boot': return '';
        case 'review': return '[review]> ';
        case 'confirm_delete': return 'Confirm DELETE> ';
        case 'confirm_new': return 'Overwrite? (yes/no)> ';
        case 'awaiting_confirmation': return '[awaiting_confirmation]> ';
        case 'main':
        default: return auth && email ? `[${email}]$ ` : '[guest@philosothon]$ ';
    }
};

// --- Component ---
export function RegistrationForm({ initialAuthStatus }: { initialAuthStatus?: { isAuthenticated: boolean; email?: string | null } }) {
    const [state, dispatch] = useReducer(terminalReducer, initialState);
    const [localData, setLocalData] = useLocalStorage<FormDataStore>(LOCAL_STORAGE_KEY, {});
    const [isSubmitting, startSubmitTransition] = useTransition(); // For form actions

    const inputRef = useRef<HTMLInputElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const hasBooted = useRef(false);

    // --- Effects ---

    // Initial Boot Sequence & Local Storage Load
    useEffect(() => {
        if (hasBooted.current) return;
        hasBooted.current = true;

        const runBootLogic = () => {
            dispatch({ type: 'ADD_OUTPUT', payload: { text: "Initializing Terminal v3.1...", type: 'info' } });
            dispatch({ type: 'ADD_OUTPUT', payload: { text: "Checking session...", type: 'info' } });

            // Load from local storage first
            const loadedData = localData ?? {};

            dispatch({
                type: 'BOOT_COMPLETE',
                payload: {
                    isAuthenticated: initialAuthStatus?.isAuthenticated ?? false,
                    email: initialAuthStatus?.email ?? null,
                    localData: loadedData
                }
            });

            if (initialAuthStatus?.isAuthenticated) {
                dispatch({ type: 'ADD_OUTPUT', payload: { text: `Session found for ${initialAuthStatus.email}.`, type: 'success' } });
                // TODO: Fetch actual registration status from server
            } else {
                dispatch({ type: 'ADD_OUTPUT', payload: { text: "No active session found.", type: 'info' } });
                if (loadedData.currentQuestionIndex !== undefined) {
                    dispatch({ type: 'ADD_OUTPUT', payload: { text: "Local registration data found. Use 'register continue' or 'sign-in'.", type: 'warning' } });
                }
            }
            dispatch({ type: 'ADD_OUTPUT', payload: { text: "Type 'help' for available commands.", type: 'info' } });
        };

        // Simplified boot for now, add async delays later if needed
        runBootLogic();

    }, [initialAuthStatus, localData]); // Depend on localData read by useLocalStorage

    // Update local storage when state.localData changes
    useEffect(() => {
        setLocalData(state.localData);
    }, [state.localData, setLocalData]);

    // Scroll to bottom and focus input
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight, behavior: 'smooth' });
        }, 50); // Short delay ensures content is rendered
    }, []);

    useEffect(() => {
        scrollToBottom();
        if (state.mode !== 'boot' && !state.pendingAction) {
             setTimeout(() => inputRef.current?.focus(), 100); // Delay focus slightly
        }
    }, [state.outputLines, state.mode, state.pendingAction, scrollToBottom]);

    // Display current question/prompt text
    useEffect(() => {
        if (state.mode === 'register' || state.mode === 'edit') {
            const question = allQuestions[state.currentQuestionIndex];
            if (question) {
                // Avoid adding duplicate question prompts if already last line
                const lastLine = state.outputLines[state.outputLines.length - 1];
                if (!lastLine || lastLine.text !== question.label || lastLine.type !== 'question') {
                    dispatch({ type: 'ADD_OUTPUT', payload: { text: question.label, type: 'question' } });
                    if (question.hint) {
                         dispatch({ type: 'ADD_OUTPUT', payload: { text: `Hint: ${question.hint}`, type: 'info' } });
                    }
                }
            }
        } else if (state.mode === 'auth') {
            if (state.authSubState === 'awaiting_email') {
                dispatch({ type: 'ADD_OUTPUT', payload: { text: "Enter email:", type: 'question' } });
            } else if (state.authSubState === 'awaiting_password') {
                dispatch({ type: 'ADD_OUTPUT', payload: { text: "Enter password:", type: 'question' } });
            }
        } else if (state.mode === 'awaiting_confirmation') {
             dispatch({ type: 'ADD_OUTPUT', payload: { text: `Account created. Please check your email (${state.userEmail}) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.`, type: 'info' } });
        }
        // Add other mode-specific prompts if needed
    }, [state.mode, state.currentQuestionIndex, state.authSubState, state.userEmail, state.outputLines]); // Added outputLines dependency carefully

    // Display info/error messages
    useEffect(() => {
        if (state.error) {
            dispatch({ type: 'ADD_OUTPUT', payload: { text: `Error: ${state.error}`, type: 'error' } });
            // Optionally re-display hint for current question on error
            const question = allQuestions[state.currentQuestionIndex];
            if ((state.mode === 'register' || state.mode === 'edit') && question?.hint) {
                 dispatch({ type: 'ADD_OUTPUT', payload: { text: `Hint: ${question.hint}`, type: 'info' } });
            }
            dispatch({ type: 'CLEAR_ERROR' }); // Clear error after displaying
        }
        if (state.infoMessage) {
            dispatch({ type: 'ADD_OUTPUT', payload: { text: state.infoMessage, type: 'success' } }); // Assuming info is usually success
            dispatch({ type: 'SET_INFO_MESSAGE', payload: null }); // Clear after displaying
        }
    }, [state.error, state.infoMessage, state.mode, state.currentQuestionIndex]);


    // --- Input Handling ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: 'SET_INPUT', payload: e.target.value });
    };

    const processInput = useCallback(async () => {
        const input = state.currentInput.trim();
        const command = input.toLowerCase();
        const args = input.split(' ').slice(1);

        // Add input to output lines (mask password)
        const isMasked = state.authSubState === 'awaiting_password' || state.authSubState === 'awaiting_confirm_password';
        dispatch({
            type: 'ADD_OUTPUT',
            payload: {
                text: isMasked ? '*'.repeat(input.length) : input,
                type: 'input',
                promptOverride: getPromptText(state.mode, state.isAuthenticated, state.userEmail, state.authSubState, state.currentQuestionIndex)
            }
        });

        dispatch({ type: 'SET_INPUT', payload: '' }); // Clear input field

        if (!input && state.mode !== 'register' && state.mode !== 'edit') return; // Allow empty submit only in reg/edit for optional fields

        // --- Global Commands ---
        if (command === 'help') {
            // TODO: Implement detailed help logic based on mode/args
            dispatch({ type: 'ADD_OUTPUT', payload: { text: "Help system not fully implemented yet.", type: 'info' } });
            return;
        }
        if (command === 'clear') {
            dispatch({ type: 'CLEAR_OUTPUT' });
            return;
        }
        if (command === 'about') {
             dispatch({ type: 'ADD_OUTPUT', payload: { text: "Philosothon Registration Terminal v3.1", type: 'output' } });
             return;
        }

        // --- Mode-Specific Logic ---
        try {
            switch (state.mode) {
                case 'main':
                    await handleMainModeCommand(command, args);
                    break;
                case 'auth':
                    await handleAuthModeInput(input);
                    break;
                case 'register':
                case 'edit':
                    await handleRegisterModeInput(input, command, args);
                    break;
                case 'review':
                    await handleReviewModeCommand(command, args);
                    break;
                case 'confirm_delete':
                    await handleConfirmDeleteCommand(command);
                    break;
                case 'confirm_new':
                    await handleConfirmNewCommand(command);
                    break;
                case 'awaiting_confirmation':
                    await handleAwaitingConfirmationCommand(command);
                    break;
                default:
                    dispatch({ type: 'ACTION_FAILURE', payload: `Command processing not implemented for mode: ${state.mode}` });
            }
        } catch (err) {
            console.error("Input processing error:", err);
            dispatch({ type: 'ACTION_FAILURE', payload: (err as Error).message || 'An unexpected error occurred.' });
        }

    }, [state, dispatch]); // Include all dependencies used within

    const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        processInput();
    };

    // --- Command Handlers ---

    const handleMainModeCommand = async (command: string, args: string[]) => {
        if (state.isAuthenticated) {
            // Authenticated commands
            switch (command) {
                case 'register': // Treat as view/edit if registered
                case 'view':
                    // TODO: Fetch and display server data
                    dispatch({ type: 'ADD_OUTPUT', payload: { text: "Viewing registration (placeholder)...", type: 'info' } });
                    dispatch({ type: 'ADD_OUTPUT', payload: { text: JSON.stringify(state.localData, null, 2), type: 'output' } }); // Show local for now
                    break;
                case 'edit':
                    // TODO: Fetch server data first
                    dispatch({ type: 'ADD_OUTPUT', payload: { text: "Entering edit mode...", type: 'info' } });
                    dispatch({ type: 'SET_MODE', payload: 'edit' });
                    dispatch({ type: 'SET_QUESTION_INDEX', payload: 0 }); // Start edit from beginning
                    break;
                case 'delete':
                    dispatch({ type: 'ADD_OUTPUT', payload: { text: "Are you sure? This cannot be undone.", type: 'warning' } });
                    dispatch({ type: 'ADD_OUTPUT', payload: { text: "Type 'DELETE' to confirm, or 'cancel'.", type: 'warning' } });
                    dispatch({ type: 'SET_MODE', payload: 'confirm_delete' });
                    break;
                case 'sign-out':
                    dispatch({ type: 'ACTION_START', payload: 'signIn' }); // Reusing signIn for consistency
                    startSubmitTransition(async () => {
                        const result = await signOut();
                        if (result.success) {
                            dispatch({ type: 'ACTION_SUCCESS', payload: { message: result.message } });
                            dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: false, email: null } });
                            dispatch({ type: 'UPDATE_LOCAL_DATA', payload: {} }); // Clear local data on sign out
                            dispatch({ type: 'SET_MODE', payload: 'main' });
                        } else {
                            dispatch({ type: 'ACTION_FAILURE', payload: result.message });
                        }
                    });
                    break;
                default:
                    dispatch({ type: 'ACTION_FAILURE', payload: `Unknown command: ${command}` });
            }
        } else {
            // Anonymous commands
            switch (command) {
                case 'register':
                    if (args[0] === 'new') {
                        if (state.localData.currentQuestionIndex !== undefined) {
                            dispatch({ type: 'ADD_OUTPUT', payload: { text: "Existing local data found. Overwrite? (yes/no)", type: 'warning' } });
                            dispatch({ type: 'SET_MODE', payload: 'confirm_new' });
                        } else {
                            handleStartNewRegistration();
                        }
                    } else if (args[0] === 'continue') {
                        if (state.localData.currentQuestionIndex !== undefined) {
                            dispatch({ type: 'ADD_OUTPUT', payload: { text: "Resuming registration...", type: 'info' } });
                            dispatch({ type: 'SET_MODE', payload: 'register' });
                            // Resume index is already set during boot
                        } else {
                            dispatch({ type: 'ACTION_FAILURE', payload: "No registration in progress found." });
                        }
                    } else {
                        dispatch({ type: 'ADD_OUTPUT', payload: { text: "Usage: register [new|continue]", type: 'info' } });
                    }
                    break;
                case 'sign-in':
                    dispatch({ type: 'SET_MODE', payload: 'auth' });
                    dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_email' });
                    break;
                case 'reset-password': // Allow from main mode too
                     dispatch({ type: 'SET_MODE', payload: 'auth' });
                     dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_email' }); // Need email first
                     dispatch({ type: 'ADD_OUTPUT', payload: { text: "Enter email to send reset link:", type: 'question' } });
                     // Logic to trigger reset will be in handleAuthModeInput
                     break;
                default:
                    dispatch({ type: 'ACTION_FAILURE', payload: `Unknown command: ${command}` });
            }
        }
    };

    const handleAuthModeInput = async (input: string) => {
        const command = input.toLowerCase(); // Check for commands within auth mode

        if (command === 'back' || command === 'exit') {
            dispatch({ type: 'SET_MODE', payload: 'main' });
            dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { email: undefined } }); // Clear email attempt
            return;
        }
         if (command === 'reset-password') {
             if (state.localData.email) {
                 dispatch({ type: 'ACTION_START', payload: 'resetPassword' });
                 startSubmitTransition(async () => {
                     const result = await requestPasswordReset({ email: state.localData.email! });
                     if (result.success) {
                         dispatch({ type: 'ACTION_SUCCESS', payload: { message: result.message } });
                         dispatch({ type: 'SET_MODE', payload: 'main' }); // Go back to main after request
                     } else {
                         dispatch({ type: 'ACTION_FAILURE', payload: result.message });
                         // Stay in auth mode, maybe clear email?
                         dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_email' });
                         dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { email: undefined } });
                     }
                 });
             } else {
                 dispatch({ type: 'ACTION_FAILURE', payload: "Enter email first to reset password." });
                 dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_email' });
             }
             return;
         }
         // TODO: Handle magiclink command if needed

        switch (state.authSubState) {
            case 'awaiting_email':
                if (input && input.includes('@')) {
                    dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { email: input } });
                    dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_password' });
                } else {
                    dispatch({ type: 'ACTION_FAILURE', payload: "Invalid email format." });
                }
                break;
            case 'awaiting_password':
                dispatch({ type: 'ACTION_START', payload: 'signIn' });
                startSubmitTransition(async () => {
                    const result = await signInWithPassword({ email: state.localData.email!, password: input });
                    if (result.success) {
                        dispatch({ type: 'ACTION_SUCCESS', payload: { message: result.message } });
                        dispatch({ type: 'SET_AUTH_STATE', payload: { isAuthenticated: true, email: state.localData.email! } });
                        // TODO: Fetch registration status
                        dispatch({ type: 'SET_MODE', payload: 'main' });
                    } else {
                        dispatch({ type: 'ACTION_FAILURE', payload: result.message });
                        // Reset to email prompt on failure
                        dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_email' });
                        dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { email: undefined } });
                    }
                });
                break;
            default:
                 dispatch({ type: 'ACTION_FAILURE', payload: `Invalid auth state: ${state.authSubState}` });
        }
    };

    const handleRegisterModeInput = async (input: string, command: string, args: string[]) => {
        // Handle commands first
        switch (command) {
            case 'next':
                // Validate current before moving? Or allow skipping optional? Let's allow skipping optional.
                const nextIndex = findNextQuestionIndex(state.currentQuestionIndex, state.localData);
                if (nextIndex < allQuestions.length) {
                    dispatch({ type: 'SET_QUESTION_INDEX', payload: nextIndex });
                } else {
                    checkAndHandleCompletion(state.localData); // Check if complete
                }
                return;
            case 'prev':
                 const prevIndex = findPrevQuestionIndex(state.currentQuestionIndex, state.localData);
                 if (prevIndex >= 0) {
                     dispatch({ type: 'SET_QUESTION_INDEX', payload: prevIndex });
                 } else {
                      dispatch({ type: 'SET_INFO_MESSAGE', payload: "Already at the first question." });
                 }
                return;
            case 'save':
                // Local data is saved on every valid answer via UPDATE_LOCAL_DATA
                dispatch({ type: 'SET_INFO_MESSAGE', payload: "Progress saved locally." });
                return;
            case 'exit':
            case 'back': // Simple back = exit for now
                dispatch({ type: 'SET_INFO_MESSAGE', payload: "Exiting registration..." });
                dispatch({ type: 'SET_MODE', payload: 'main' });
                return;
            case 'submit':
                 if (checkCompletion(state.localData)) {
                     handleFinalSubmit();
                 } else {
                     dispatch({ type: 'ACTION_FAILURE', payload: "Please complete all required questions." });
                 }
                 return;
             case 'review':
                 handleReviewCommand();
                 dispatch({ type: 'SET_MODE', payload: 'review' });
                 return;
            // No 'edit' command here, handled in review mode
        }

        // If not a command, process as an answer
        await processAnswer(input);
    };

    const processAnswer = async (answer: string) => {
        const question = allQuestions[state.currentQuestionIndex];
        if (!question) return;

        // --- Early Auth Flow within processAnswer ---
        if (question.id === 'firstName') {
             if (!answer && question.required) {
                 dispatch({ type: 'ACTION_FAILURE', payload: "First name is required." }); return;
             }
             dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { firstName: answer } });
             advanceToNextQuestion(answer); return;
        }
        if (question.id === 'lastName') {
             if (!answer && question.required) {
                 dispatch({ type: 'ACTION_FAILURE', payload: "Last name is required." }); return;
             }
             dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { lastName: answer } });
             advanceToNextQuestion(answer); return;
        }
        if (question.id === 'email') {
            if (!answer.includes('@')) {
                dispatch({ type: 'ACTION_FAILURE', payload: "Invalid email format." }); return;
            }
            dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { email: answer } });
            dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_password' }); // Move to password
            // Don't advance index here, stay on 'email' conceptually until password done
            return;
        }
        if (question.id === 'password') {
            if (answer.length < 8) {
                dispatch({ type: 'ACTION_FAILURE', payload: "Password must be at least 8 characters." }); return;
            }
            dispatch({ type: 'SET_PASSWORD_ATTEMPT', payload: answer });
            dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_confirm_password' });
            // Stay on 'password' conceptually
            return;
        }
        if (question.id === 'confirmPassword') {
            if (answer !== state.passwordAttempt) {
                dispatch({ type: 'ACTION_FAILURE', payload: "Passwords do not match." });
                // Reset to password entry
                dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_password' });
                dispatch({ type: 'SET_PASSWORD_ATTEMPT', payload: '' });
                // Find password index and set it? Or just let user re-enter? Let's reset.
                const passwordIndex = allQuestions.findIndex(q => q.id === 'password');
                dispatch({ type: 'SET_QUESTION_INDEX', payload: passwordIndex >= 0 ? passwordIndex : state.currentQuestionIndex });
                return;
            }
            // Passwords match - Trigger signUpUser
            dispatch({ type: 'ACTION_START', payload: 'signUp' });
            startSubmitTransition(async () => {
                const result = await signUpUser({
                    email: state.localData.email!,
                    password: state.passwordAttempt,
                    firstName: state.localData.firstName,
                    lastName: state.localData.lastName
                });

                if (result.success) {
                    // Check spec: Existing user detection
                    if (result.message.includes('User already registered')) { // Adjust based on actual Supabase error
                         dispatch({ type: 'ACTION_FAILURE', payload: "An account with this email already exists. Please use 'sign-in' or 'reset-password'." });
                         dispatch({ type: 'SET_MODE', payload: 'main' }); // Return to main as per spec
                         dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { email: undefined, firstName: undefined, lastName: undefined } }); // Clear sensitive info
                    }
                    // Check spec: Confirmation required? Assume yes for now based on spec text.
                    else if (true) { // Replace with actual check if Supabase provides it in result
                         dispatch({ type: 'ACTION_SUCCESS', payload: { message: "Account created. Awaiting email confirmation." } });
                         dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { isVerified: false } }); // Mark locally as awaiting server confirmation
                         dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'idle' });
                         dispatch({ type: 'SET_PASSWORD_ATTEMPT', payload: '' });
                         dispatch({ type: 'SET_MODE', payload: 'awaiting_confirmation' });
                         // User email is already set from BOOT_COMPLETE or previous steps
                    }
                    // Optional: Handle case where confirmation is NOT required
                    // else {
                    //     dispatch({ type: 'ACTION_SUCCESS', payload: { message: "Account created successfully." } });
                    //     dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { isVerified: true } }); // Mark locally as verified
                    //     dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'idle' });
                    //     dispatch({ type: 'SET_PASSWORD_ATTEMPT', payload: '' });
                    //     // Advance to the first *real* question (Q3)
                    //     const firstQIndex = allQuestions.findIndex(q => q.order === 3);
                    //     dispatch({ type: 'SET_QUESTION_INDEX', payload: firstQIndex >= 0 ? firstQIndex : 0 });
                    // }
                } else {
                    dispatch({ type: 'ACTION_FAILURE', payload: `Account creation failed: ${result.message}` });
                    // Reset to email prompt? Or password? Let's go back to password.
                    dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'awaiting_password' });
                    dispatch({ type: 'SET_PASSWORD_ATTEMPT', payload: '' });
                    const passwordIndex = allQuestions.findIndex(q => q.id === 'password');
                    dispatch({ type: 'SET_QUESTION_INDEX', payload: passwordIndex >= 0 ? passwordIndex : state.currentQuestionIndex });
                }
            });
            return; // Stop processing after handling confirmPassword
        }
        // --- End Early Auth Flow ---


        // --- Standard Answer Processing & Validation ---
        let processedAnswerValue: any = answer;
        let validationError: string | undefined = undefined;

        if (question.required && !answer) {
            validationError = "This field is required.";
        } else if (answer) { // Only validate non-empty answers further (unless required check failed)
            // TODO: Implement detailed validation based on question.type and question.validationRules
            // Example:
            if (question.type === 'number' || question.type === 'scale') {
                const num = parseInt(answer, 10);
                if (isNaN(num)) validationError = "Invalid number.";
                // Add min/max checks from validationRules
                processedAnswerValue = num;
            } else if (question.type === 'boolean') {
                 const lower = answer.toLowerCase();
                 if (['yes', 'y', '1'].includes(lower)) processedAnswerValue = true;
                 else if (['no', 'n', '2'].includes(lower)) processedAnswerValue = false;
                 else validationError = "Invalid input. Please enter 'yes' or 'no'.";
            } else if (question.type === 'multi-select-numbered') {
                 const nums = answer.split(' ').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                 // TODO: Add validation (valid options, min/max selections)
                 processedAnswerValue = nums;
            } else if (question.type === 'ranking-numbered') {
                 // TODO: Implement parsing and validation (format, unique, minRanked)
                 processedAnswerValue = answer; // Placeholder
            }
            // Add email pattern check etc.
        }

        if (validationError) {
            dispatch({ type: 'ACTION_FAILURE', payload: validationError });
            return;
        }

        // Save valid answer and advance
        dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { [question.id]: processedAnswerValue } });
        advanceToNextQuestion(processedAnswerValue);
    };

    const advanceToNextQuestion = (currentAnswer: any) => {
         const nextIndex = findNextQuestionIndex(state.currentQuestionIndex, { ...state.localData, [allQuestions[state.currentQuestionIndex].id]: currentAnswer });
         if (nextIndex >= allQuestions.length) {
             checkAndHandleCompletion({ ...state.localData, [allQuestions[state.currentQuestionIndex].id]: currentAnswer });
         } else {
             dispatch({ type: 'SET_QUESTION_INDEX', payload: nextIndex });
         }
    };

    const findNextQuestionIndex = (currentIndex: number, currentData: FormDataStore): number => {
        let nextIndex = currentIndex + 1;
        while (nextIndex < allQuestions.length) {
            const nextQuestion = allQuestions[nextIndex];
            // Skip auth questions if already handled
            if (['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(nextQuestion.id)) {
                 nextIndex++; continue;
            }
            if (nextQuestion.dependsOn) {
                const dependencyValue = currentData[nextQuestion.dependsOn as keyof FormDataStore];
                if (dependencyValue !== nextQuestion.dependsValue) {
                    nextIndex++; continue; // Skip if dependency not met
                }
            }
            return nextIndex; // Found valid next question
        }
        return nextIndex; // Return length if no more questions
    };

     const findPrevQuestionIndex = (currentIndex: number, currentData: FormDataStore): number => {
         let prevIndex = currentIndex - 1;
         while (prevIndex >= 0) {
             const prevQuestion = allQuestions[prevIndex];
             // Skip auth questions
             if (['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(prevQuestion.id)) {
                  prevIndex--; continue;
             }
             if (prevQuestion.dependsOn) {
                 const dependencyValue = currentData[prevQuestion.dependsOn as keyof FormDataStore];
                 // This logic might be complex - if going back *changes* a dependency, subsequent questions might become invalid.
                 // For simplicity, just check if it *would* have been shown based on current data.
                 if (dependencyValue !== prevQuestion.dependsValue) {
                     prevIndex--; continue; // Skip if dependency not met
                 }
             }
             return prevIndex; // Found valid previous question
         }
         // Return -1 or 0 if no valid previous question (adjust based on desired behavior at start)
         // Let's return index of first *real* question (Q3) if we go before it.
         const firstQIndex = allQuestions.findIndex(q => q.order === 3);
         return Math.max(prevIndex, firstQIndex >= 0 ? firstQIndex : 0);
     };

    const checkCompletion = (data: FormDataStore): boolean => {
        // Filter out auth questions for completion check
        const registrationQuestions = allQuestions.filter(q => !['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(q.id));
        return registrationQuestions.every(q => {
            if (!q.required) return true; // Skip optional
            // Skip if dependency not met
            if (q.dependsOn && data[q.dependsOn as keyof FormDataStore] !== q.dependsValue) return true;
            // Check if required question has an answer
            const answer = data[q.id as keyof FormDataStore];
            return answer !== undefined && answer !== null && answer !== '';
        });
    };

     const checkAndHandleCompletion = (data: FormDataStore) => {
         if (checkCompletion(data)) {
             dispatch({ type: 'SET_INFO_MESSAGE', payload: "All questions answered. Review your answers." });
             dispatch({ type: 'SET_MODE', payload: 'review' });
             handleReviewCommand(); // Display review immediately
         } else {
             // Should not happen if findNextQuestionIndex is correct, but handle defensively
             dispatch({ type: 'ACTION_FAILURE', payload: "Reached end but not all required questions answered." });
         }
     };

    const handleReviewCommand = () => {
        dispatch({ type: 'ADD_OUTPUT', payload: { text: "--- Review Answers ---", type: 'info' } });
        allQuestions.forEach((q, idx) => {
            // Skip auth questions in review
            if (['password', 'confirmPassword'].includes(q.id)) return;
            const answer = state.localData[q.id as keyof FormDataStore];
            const displayAnswer = answer === undefined || answer === null ? '[Not Answered]' : JSON.stringify(answer); // Stringify arrays/objects
            dispatch({ type: 'ADD_OUTPUT', payload: { text: `${idx + 1}. ${q.label}: ${displayAnswer}`, type: 'output' } });
        });
        dispatch({ type: 'ADD_OUTPUT', payload: { text: "--- End Review ---", type: 'info' } });
        dispatch({ type: 'ADD_OUTPUT', payload: { text: "Use 'submit', 'edit [number]', or 'back'.", type: 'info' } });
    };

    const handleReviewModeCommand = async (command: string, args: string[]) => {
        switch(command) {
            case 'submit':
                handleFinalSubmit();
                break;
            case 'edit':
                const indexStr = args[0];
                const indexToEdit = parseInt(indexStr, 10) - 1; // User enters 1-based index
                if (!isNaN(indexToEdit) && indexToEdit >= 0 && indexToEdit < allQuestions.length) {
                     const questionToEdit = allQuestions[indexToEdit];
                     // Prevent editing auth fields directly here
                     if (['firstName', 'lastName', 'email', 'password', 'confirmPassword'].includes(questionToEdit.id)) {
                          dispatch({ type: 'ACTION_FAILURE', payload: "Cannot edit authentication fields directly." });
                          return;
                     }
                     dispatch({ type: 'ADD_OUTPUT', payload: { text: `Editing question ${indexToEdit + 1}: ${questionToEdit.label}`, type: 'info' } });
                     dispatch({ type: 'SET_MODE', payload: 'edit' });
                     dispatch({ type: 'SET_QUESTION_INDEX', payload: indexToEdit });
                     // Pre-fill input? Maybe not, let them re-enter.
                } else {
                     dispatch({ type: 'ACTION_FAILURE', payload: "Invalid question number. Use 'edit [number]' based on review list." });
                }
                break;
            case 'back':
                dispatch({ type: 'SET_MODE', payload: 'main' });
                break;
            default:
                 dispatch({ type: 'ACTION_FAILURE', payload: `Unknown command: ${command}` });
        }
    };

    const handleConfirmDeleteCommand = async (command: string) => {
         if (command === 'delete') {
             dispatch({ type: 'ACTION_START', payload: 'deleteReg' });
             startSubmitTransition(async () => {
                 // const result = await deleteRegistration(); // Assumes action exists
                 const result = { success: true, message: "Registration deleted (simulated)." }; // Placeholder
                 if (result.success) {
                     dispatch({ type: 'ACTION_SUCCESS', payload: { message: result.message } });
                     dispatch({ type: 'UPDATE_LOCAL_DATA', payload: {} }); // Clear local
                     dispatch({ type: 'SET_MODE', payload: 'main' });
                     // TODO: Update registrationStatus state
                 } else {
                     dispatch({ type: 'ACTION_FAILURE', payload: result.message });
                     dispatch({ type: 'SET_MODE', payload: 'main' }); // Go back on failure too
                 }
             });
         } else if (command === 'cancel') {
             dispatch({ type: 'SET_INFO_MESSAGE', payload: "Deletion cancelled." });
             dispatch({ type: 'SET_MODE', payload: 'main' });
         } else {
             dispatch({ type: 'ACTION_FAILURE', payload: "Invalid confirmation. Type 'DELETE' or 'cancel'." });
         }
     };

     const handleConfirmNewCommand = (command: string) => {
         if (command === 'yes') {
             handleStartNewRegistration();
         } else if (command === 'no') {
             dispatch({ type: 'SET_INFO_MESSAGE', payload: "Operation cancelled." });
             dispatch({ type: 'SET_MODE', payload: 'main' });
         } else {
             dispatch({ type: 'ACTION_FAILURE', payload: "Invalid input. Type 'yes' or 'no'." });
         }
     };

     const handleStartNewRegistration = () => {
         dispatch({ type: 'UPDATE_LOCAL_DATA', payload: {} }); // Clear data
         dispatch({ type: 'ADD_OUTPUT', payload: { text: "Starting new registration...", type: 'info' } });
         dispatch({ type: 'ADD_OUTPUT', payload: { text: "Welcome to the Philosothon registration form! ... Please submit your responses by Thursday, April 24th at midnight.", type: 'output' } }); // Add full intro text
         dispatch({ type: 'SET_MODE', payload: 'register' });
         // Start with First Name (assuming it's the first relevant question)
         const firstNameIndex = allQuestions.findIndex(q => q.id === 'firstName');
         dispatch({ type: 'SET_QUESTION_INDEX', payload: firstNameIndex >= 0 ? firstNameIndex : 0 });
         dispatch({ type: 'SET_AUTH_SUBSTATE', payload: 'idle' }); // Reset auth substate
         dispatch({ type: 'SET_PASSWORD_ATTEMPT', payload: '' });
     };

     const handleAwaitingConfirmationCommand = async (command: string) => {
          switch(command) {
              case 'continue':
                  dispatch({ type: 'ACTION_START', payload: 'checkVerification' });
                  startSubmitTransition(async () => {
                      const result = await checkUserVerificationStatus();
                      if (result.success) {
                          dispatch({ type: 'ACTION_SUCCESS', payload: { message: "Email confirmed. Proceeding..." } });
                          dispatch({ type: 'UPDATE_LOCAL_DATA', payload: { isVerified: true } }); // Mark verified locally
                          // Find first *real* question index (Q3)
                          const firstQIndex = allQuestions.findIndex(q => q.order === 3);
                          dispatch({ type: 'SET_QUESTION_INDEX', payload: firstQIndex >= 0 ? firstQIndex : 0 });
                          dispatch({ type: 'SET_MODE', payload: 'register' });
                      } else {
                          dispatch({ type: 'ACTION_FAILURE', payload: result.message });
                          // Stay in awaiting_confirmation mode
                      }
                  });
                  break;
              case 'resend':
                   dispatch({ type: 'ACTION_START', payload: 'resendConfirmation' });
                   startSubmitTransition(async () => {
                       // const result = await resendConfirmationEmail({ email: state.userEmail! }); // Assuming action exists and takes email
                       const result = { success: true, message: "Confirmation email resent (simulated)." }; // Placeholder
                       if (result.success) {
                           dispatch({ type: 'ACTION_SUCCESS', payload: { message: result.message } });
                       } else {
                           dispatch({ type: 'ACTION_FAILURE', payload: result.message });
                       }
                       // Stay in awaiting_confirmation mode
                   });
                   break;
              case 'exit':
              case 'back':
                  dispatch({ type: 'SET_MODE', payload: 'main' });
                  // Decide whether to clear local data or keep it
                  break;
              default:
                   dispatch({ type: 'ACTION_FAILURE', payload: `Unknown command: ${command}` });
          }
     };

     const handleFinalSubmit = () => {
         dispatch({ type: 'ACTION_START', payload: 'submitReg' });
         const formDataForServer = new FormData();
         // Populate formDataForServer from state.localData, excluding helper fields
         Object.entries(state.localData).forEach(([key, value]) => {
             if (key === 'currentQuestionIndex' || key === 'isVerified') return;
             // Handle arrays (e.g., multi-select)
             if (Array.isArray(value)) {
                 value.forEach(item => formDataForServer.append(key, String(item)));
             } else if (value !== undefined && value !== null) {
                 formDataForServer.append(key, String(value));
             }
         });

         startSubmitTransition(async () => {
             // Pass null for formState if not using useFormState directly here
             const result = await submitRegistration(null as any, formDataForServer);
             if (result.success) {
                 dispatch({ type: 'ACTION_SUCCESS', payload: { message: "Registration submitted successfully!" } });
                 dispatch({ type: 'UPDATE_LOCAL_DATA', payload: {} }); // Clear local data
                 // TODO: Update registrationStatus state based on server confirmation
                 dispatch({ type: 'SET_MODE', payload: 'main' });
             } else {
                 dispatch({ type: 'ACTION_FAILURE', payload: result.message || 'Submission failed.' });
                 // Handle specific field errors if available in result.errors
                 if (result.errors) {
                      Object.entries(result.errors).forEach(([field, errors]) => {
                          if (errors) {
                              dispatch({ type: 'ADD_OUTPUT', payload: { text: ` - ${field}: ${errors.join(', ')}`, type: 'error' } });
                          }
                      });
                 }
                 dispatch({ type: 'SET_MODE', payload: 'review' }); // Stay in review on failure
             }
         });
     };


    // --- Rendering ---
    const currentPromptText = getPromptText(state.mode, state.isAuthenticated, state.userEmail, state.authSubState, state.currentQuestionIndex);
    const isInputPassword = state.authSubState === 'awaiting_password' || state.authSubState === 'awaiting_confirm_password';
    const isProcessing = state.pendingAction !== null || isSubmitting;

    return (
        <div className="bg-black text-hacker-green font-mono p-4 border border-gray-700 rounded h-[70vh] flex flex-col">
            <div ref={terminalRef} className="flex-grow overflow-y-auto mb-2 scroll-smooth">
                {state.outputLines.map(line => (
                    <div key={line.id} className={`whitespace-pre-wrap ${
                        line.type === 'error' ? 'text-orange-500' : // Use orange for errors
                        line.type === 'success' ? 'text-green-500' :
                        line.type === 'warning' ? 'text-yellow-500' :
                        line.type === 'info' ? 'text-blue-400' :
                        line.type === 'question' ? 'text-cyan-400' :
                        line.type === 'input' ? 'text-white' :
                        'text-hacker-green' // Default
                    }`}>
                        {line.type === 'input' && <span className="text-gray-500">{line.promptText}</span>}
                        {line.text}
                    </div>
                ))}
                 {/* Display current question label if in register/edit mode */}
                 {/* This is handled by the useEffect hook now */}
            </div>

            {state.mode !== 'boot' && (
                <form onSubmit={handleSubmit} className="flex items-center mt-auto pt-2 border-t border-gray-700">
                    <span className="text-gray-500 mr-1">{currentPromptText}</span>
                    <input
                        ref={inputRef}
                        type={isInputPassword ? 'password' : 'text'}
                        value={state.currentInput}
                        onChange={handleInputChange}
                        className="bg-transparent border-none text-hacker-green outline-none flex-grow p-0 m-0 focus:ring-0"
                        autoComplete="off"
                        autoFocus
                        disabled={isProcessing || state.isBooting}
                        data-testid="terminal-input"
                    />
                </form>
            )}
        </div>
    );
}