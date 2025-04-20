'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useFormState } from 'react-dom';
// Correct import path for useLocalStorage
import { useLocalStorage } from '../hooks/useLocalStorage';
// Import V2 questions data
import { questions, FormDataStore, Question } from '../data/registrationQuestions';
import {
    // Import V2 actions
    submitRegistration,
    updateRegistration,
    deleteRegistration,
    RegistrationState // Keep state type if actions use it
} from '../actions';
import {
    // Import V2 auth actions
    signInWithPassword,
    signUpUser,
    signOut,
    requestPasswordReset,
    AuthActionResult
} from '../../auth/actions'; // Adjust path if needed

// --- Constants ---
const LOCAL_STORAGE_KEY = 'philosothon-registration-v2';
type TerminalMode = 'boot' | 'main' | 'auth' | 'register' | 'review' | 'edit' | 'confirm_delete' | 'confirm_new';

interface OutputLine {
    id: number;
    text: string;
    type: 'input' | 'output' | 'error' | 'success' | 'warning' | 'info' | 'prompt' | 'question';
    mode?: TerminalMode; // Store mode when line was added for context
    promptText?: string; // Store the prompt text used
}

// --- Component ---
export function RegistrationForm({ initialAuthStatus }: { initialAuthStatus?: { isAuthenticated: boolean; email?: string | null } }) {
    const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentMode, setCurrentMode] = useState<TerminalMode>('boot');
    // useLocalStorage hook likely returns only [value, setValue]
    const [localData, setLocalData] = useLocalStorage<FormDataStore>(LOCAL_STORAGE_KEY, {});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [isAuthenticated, setIsAuthenticated] = useState(initialAuthStatus?.isAuthenticated ?? false);
    const [userEmail, setUserEmail] = useState<string | null>(initialAuthStatus?.email ?? null);
    const [registrationStatus, setRegistrationStatus] = useState<'complete' | 'incomplete' | 'not_started'>('not_started');
    const [isPasswordInput, setIsPasswordInput] = useState(false);
    const [passwordAttempt, setPasswordAttempt] = useState('');
    const [isComplete, setIsComplete] = useState(false); // Ensure isComplete state exists
    const [isSubmitting, startSubmitTransition] = useTransition();
    const [isBooting, setIsBooting] = useState(true);
    const [isAuthActionPending, startAuthTransition] = useTransition();

    const inputRef = useRef<HTMLInputElement>(null);
    const terminalRef = useRef<HTMLDivElement>(null);
    const outputIdCounter = useRef(0);
    const hasBooted = useRef(false);

    // --- Helper Functions ---
    const addOutputLine = useCallback((text: string, type: OutputLine['type'], promptOverride?: string) => {
        setOutputLines(prev => [
            ...prev,
            {
                id: outputIdCounter.current++,
                text,
                type,
                mode: currentMode,
                promptText: promptOverride ?? getPromptText(currentMode, isAuthenticated, userEmail)
            }
        ]);
    }, [currentMode, isAuthenticated, userEmail]);

    const getPromptText = (mode: TerminalMode, auth: boolean, email: string | null): string => {
        switch (mode) {
            case 'boot': return '';
            case 'auth': return '[auth]> ';
            case 'register':
            case 'edit':
                 const qIndex = currentQuestionIndex;
                 const totalQuestions = questions.length;
                 return `[reg ${qIndex + 1}/${totalQuestions}]> `;
            case 'review': return '[review]> ';
            case 'confirm_delete': return 'Confirm DELETE> ';
            case 'confirm_new': return 'Overwrite? (yes/no)> ';
            case 'main':
            default: return auth && email ? `[${email}]$ ` : '[guest@philosothon]$ ';
        }
    };

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
        }, 0);
    }, []);

    // --- Effects ---

    useEffect(() => {
        if (hasBooted.current) return;
        hasBooted.current = true;

        const runBootLogic = () => {
            addOutputLine("Initializing Terminal v2.0...", 'info');
            addOutputLine("Checking session...", 'info');

            if (initialAuthStatus?.isAuthenticated) {
                setIsAuthenticated(true);
                setUserEmail(initialAuthStatus.email ?? null);
                setRegistrationStatus('incomplete'); // Placeholder
                addOutputLine(`Session found for ${initialAuthStatus.email}.`, 'success');
            } else {
                addOutputLine("No active session found.", 'info');
                 if (localData.currentQuestionIndex !== undefined && localData.email) {
                     addOutputLine("Local registration data found. Use 'register continue' or 'sign-in'.", 'warning');
                 }
            }
            addOutputLine("Type 'help' for available commands.", 'info');
            setCurrentMode('main');
            setIsBooting(false);
        };

        if (process.env.NODE_ENV === 'test') {
            // Run synchronously for tests
            runBootLogic();
        } else {
            // Run asynchronously for runtime
            const bootSequenceAsync = async () => {
                addOutputLine("Initializing Terminal v2.0...", 'info');
                await new Promise(r => setTimeout(r, 300));
                addOutputLine("Checking session...", 'info');
                await new Promise(r => setTimeout(r, 500));

                if (initialAuthStatus?.isAuthenticated) {
                    setIsAuthenticated(true);
                    setUserEmail(initialAuthStatus.email ?? null);
                    setRegistrationStatus('incomplete'); // Placeholder
                    addOutputLine(`Session found for ${initialAuthStatus.email}.`, 'success');
                } else {
                    addOutputLine("No active session found.", 'info');
                     if (localData.currentQuestionIndex !== undefined && localData.email) {
                         addOutputLine("Local registration data found. Use 'register continue' or 'sign-in'.", 'warning');
                     }
                }
                await new Promise(r => setTimeout(r, 300));
                addOutputLine("Type 'help' for available commands.", 'info');
                setCurrentMode('main');
                setIsBooting(false);
            };
            bootSequenceAsync();
        }
    }, [addOutputLine, initialAuthStatus, localData, setIsBooting, setIsAuthenticated, setUserEmail, setRegistrationStatus]); // Added all state setters used in boot logic

    useEffect(() => {
        scrollToBottom();
        if (currentMode !== 'boot') {
             setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [outputLines, currentMode, scrollToBottom]);

    // --- Command/Input Handling ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentInput(e.target.value);
    };

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        const input = currentInput.trim();
        const currentPrompt = getPromptText(currentMode, isAuthenticated, userEmail);

        if (input || (currentMode !== 'register' && currentMode !== 'edit')) {
             addOutputLine(input, 'input', currentPrompt);
        }

        setCurrentInput('');

        if (!input && (currentMode === 'register' || currentMode === 'edit')) {
             const question = questions[currentQuestionIndex];
             if (question && !question.required) {
                 await processAnswer('');
                 return;
             } else if (question && question.required) {
                 addOutputLine("This field is required.", 'error');
                 addOutputLine(question.label, 'question');
                 return;
             }
             return;
        } else if (!input) {
             return;
        }

        const command = input.toLowerCase();
        const args = input.split(' ').slice(1);

        if (command === 'help') {
            handleHelpCommand(args);
            return;
        }
        if (command === 'clear') {
            setOutputLines([]);
            return;
        }
         if (command === 'reset') {
             addOutputLine("This will clear all local data and reload. Are you sure? (yes/no)", 'warning');
             // TODO: Implement confirmation logic for reset
             return;
         }

        try {
            switch (currentMode) {
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
            }
        } catch (err) {
             console.error("Command processing error:", err);
             addOutputLine(`Error: ${(err as Error).message || 'An unexpected error occurred.'}`, 'error');
        }
    };

    // --- Mode-Specific Handlers ---

    const handleHelpCommand = (args: string[]) => {
        addOutputLine("Available commands:", 'info');
        let commands: string[] = [];
        switch (currentMode) {
            case 'main':
                commands = isAuthenticated
                    ? ['view', 'edit', 'delete', 'sign-out', 'help', 'about', 'clear', 'reset']
                    : ['register new', 'register continue', 'sign-in', 'help', 'about', 'clear', 'reset'];
                break;
            case 'auth':
                commands = ['magiclink', 'reset-password', 'back', 'help', 'clear', 'reset'];
                break;
            case 'register':
            case 'edit':
                const isRegComplete = questions.every(q =>
                    !q.required || localData.hasOwnProperty(q.id) ||
                    (q.dependsOn && localData[q.dependsOn as keyof FormDataStore] !== q.dependsValue)
                );
                 commands = ['next', 'prev', 'save', 'exit', 'help', 'clear', 'reset'];
                 if (isRegComplete) commands.push('submit');
                break;
            case 'review':
                 commands = ['submit', 'edit [number]', 'back', 'help', 'clear', 'reset'];
                 break;
             case 'confirm_delete':
                 commands = ["'DELETE'", 'cancel', 'help'];
                 break;
             case 'confirm_new':
                 commands = ['yes', 'no', 'help'];
                 break;
        }
        addOutputLine(commands.join(', '), 'info');
    };

    const handleMainModeCommand = async (command: string, args: string[]) => {
        if (isAuthenticated) {
            switch (command) {
                case 'view':
                    addOutputLine("Fetching registration data...", 'info');
                    addOutputLine(JSON.stringify(localData, null, 2), 'output');
                    break;
                case 'edit':
                    addOutputLine("Entering edit mode...", 'info');
                    setCurrentMode('edit');
                    setCurrentQuestionIndex(0);
                    setIsPasswordInput(false);
                    addOutputLine(questions[0].label, 'question');
                    break;
                case 'delete':
                    addOutputLine("Are you sure? This cannot be undone.", 'warning');
                    addOutputLine("Type 'DELETE' to confirm, or 'cancel'.", 'warning');
                    setCurrentMode('confirm_delete');
                    break;
                case 'sign-out':
                    addOutputLine("Signing out...", 'info');
                    startAuthTransition(async () => {
                        const result = await signOut();
                        if (result.success) {
                            addOutputLine(result.message, 'success');
                            setIsAuthenticated(false);
                            setUserEmail(null);
                            setRegistrationStatus('not_started');
                            setLocalData({}); // Use setter to clear
                        } else {
                            addOutputLine(`Sign out failed: ${result.message}`, 'error');
                        }
                        setCurrentMode('main');
                    });
                    break;
                case 'about':
                     addOutputLine("Philosothon Registration Terminal v2.0", 'output');
                     break;
                default:
                    addOutputLine(`Unknown command: ${command}. Type 'help'.`, 'error');
            }
        } else {
            switch (command) {
                 case 'register new':
                     if (localData.currentQuestionIndex !== undefined && localData.email) {
                         addOutputLine("Existing local data found. Overwrite? (yes/no)", 'warning');
                         setCurrentMode('confirm_new');
                     } else {
                         handleStartNewRegistration();
                     }
                     break;
                 case 'register continue':
                     if (localData.currentQuestionIndex !== undefined && localData.email) {
                         addOutputLine("Resuming registration...", 'info');
                         setCurrentMode('register');
                         const resumeIndex = Math.max(0, Math.min(localData.currentQuestionIndex, questions.length -1));
                         setCurrentQuestionIndex(resumeIndex);
                         setIsPasswordInput(false);
                         addOutputLine(questions[resumeIndex].label, 'question');
                     } else {
                         addOutputLine("No registration in progress found. Use 'register new'.", 'error');
                     }
                     break;
                case 'sign-in':
                    addOutputLine("Entering authentication mode...", 'info');
                    setCurrentMode('auth');
                    addOutputLine("Enter email:", 'question');
                    setIsPasswordInput(false);
                    setPasswordAttempt('');
                    break;
                 case 'about':
                     addOutputLine("Philosothon Registration Terminal v2.0", 'output');
                     break;
                default:
                    addOutputLine(`Unknown command: ${command}. Type 'help'.`, 'error');
            }
        }
    };

     const handleConfirmDeleteCommand = async (command: string) => {
         if (command === 'delete') {
             addOutputLine("Deleting registration...", 'warning');
             startSubmitTransition(async () => {
                 const result = await deleteRegistration();
                 if (result.success) {
                     addOutputLine("Registration deleted successfully.", 'success');
                     setRegistrationStatus('not_started');
                     setLocalData({}); // Use setter to clear
                 } else {
                     addOutputLine(`Error: ${result.message}`, 'error');
                 }
                 setCurrentMode('main');
             });
         } else if (command === 'cancel') {
             addOutputLine("Deletion cancelled.", 'info');
             setCurrentMode('main');
         } else {
             addOutputLine("Invalid confirmation. Type 'DELETE' or 'cancel'.", 'error');
         }
     };

     const handleConfirmNewCommand = (command: string) => {
         if (command === 'yes') {
             handleStartNewRegistration();
         } else if (command === 'no') {
             addOutputLine("Operation cancelled. Use 'register continue' or 'sign-in'.", 'info');
             setCurrentMode('main');
         } else {
             addOutputLine("Invalid input. Type 'yes' or 'no'.", 'error');
         }
     };

     const handleStartNewRegistration = () => {
         setLocalData({}); // Use setter to clear data
         addOutputLine("Starting new registration...", 'info');
         setCurrentMode('register');
         setCurrentQuestionIndex(0);
         setIsPasswordInput(false);
         setPasswordAttempt('');
         addOutputLine(questions[0].label, 'question');
     };

    const handleAuthModeInput = async (input: string) => {
        const command = input.toLowerCase();
         if (command === 'back') {
             addOutputLine("Returning to main menu...", 'info');
             setCurrentMode('main');
             setLocalData((prev: FormDataStore) => ({ ...prev, email: undefined })); // Add type
             setIsPasswordInput(false);
             setPasswordAttempt('');
             return;
         }
         if (command === 'help' || command === 'magiclink' || command === 'reset-password') {
             await handleAuthModeCommandInternal(command);
             return;
         }

        if (!localData.email) {
            if (input && input.includes('@')) {
                setLocalData((prev: FormDataStore) => ({ ...prev, email: input })); // Add type
                addOutputLine("Enter password:", 'question');
                setIsPasswordInput(true);
                setPasswordAttempt('');
            } else {
                addOutputLine("Invalid email format. Please try again.", 'error');
                addOutputLine("Enter email:", 'question');
            }
        } else {
            addOutputLine("Authenticating...", 'info');
            setIsPasswordInput(false);
            startAuthTransition(async () => {
                const result = await signInWithPassword({ email: localData.email!, password: input });
                if (result.success) {
                    addOutputLine(result.message, 'success');
                    setIsAuthenticated(true);
                    setUserEmail(localData.email);
                    setRegistrationStatus('incomplete');
                    setCurrentMode('main');
                } else {
                    addOutputLine(`Authentication failed: ${result.message}`, 'error');
                    addOutputLine("Enter email:", 'question');
                    setLocalData((prev: FormDataStore) => ({ ...prev, email: undefined })); // Add type
                }
            });
        }
    };

    const handleAuthModeCommandInternal = async (command: string) => {
        switch (command) {
            case 'magiclink':
                if (localData.email) {
                     addOutputLine(`Requesting magic link for ${localData.email}...`, 'info');
                     startAuthTransition(async () => {
                         const result = await requestPasswordReset({ email: localData.email! });
                         if (result.success) {
                             addOutputLine("Magic link request sent. Check your email.", 'success');
                             setCurrentMode('main');
                         } else {
                             addOutputLine(`Failed to send magic link: ${result.message}`, 'error');
                         }
                     });
                } else {
                     addOutputLine("Please enter your email first.", 'error');
                }
                break;
            case 'reset-password':
                 if (localData.email) {
                     addOutputLine(`Requesting password reset for ${localData.email}...`, 'info');
                      startAuthTransition(async () => {
                         const result = await requestPasswordReset({ email: localData.email! });
                         if (result.success) {
                             addOutputLine("Password reset email sent. Check your email.", 'success');
                             setCurrentMode('main');
                         } else {
                             addOutputLine(`Failed to send reset email: ${result.message}`, 'error');
                         }
                     });
                 } else {
                     addOutputLine("Please enter your email first to reset password.", 'error');
                 }
                 break;
             case 'help':
                  handleHelpCommand([]);
                  break;
            default:
                 addOutputLine(`Unknown command in auth mode: ${command}.`, 'error');
        }
    };

    const handleRegisterModeInput = async (input: string, command: string, args: string[]) => {
        switch (command) {
            case 'next':
                const currentQ = questions[currentQuestionIndex];
                if (currentQ?.required && !localData[currentQ.id as keyof FormDataStore]) {
                     addOutputLine("Please answer the current question before proceeding.", 'warning');
                     return;
                }
                const nextIdx = findNextQuestionIndex(currentQuestionIndex, localData);
                if (nextIdx < questions.length) {
                    setCurrentQuestionIndex(nextIdx);
                    addOutputLine(questions[nextIdx].label, 'question');
                } else {
                     addOutputLine("Already at the last question.", 'info');
                     checkAndHandleCompletion(localData);
                }
                return;
            case 'prev':
                 const prevIdx = findPrevQuestionIndex(currentQuestionIndex, localData);
                 if (prevIdx >= 0) {
                     setCurrentQuestionIndex(prevIdx);
                     addOutputLine(questions[prevIdx].label, 'question');
                 } else {
                      addOutputLine("Already at the first question.", 'info');
                 }
                return;
            case 'save':
                setLocalData((prev: FormDataStore) => ({ ...prev, currentQuestionIndex }));
                addOutputLine("Progress saved locally.", 'success');
                return;
            case 'exit':
            case 'back':
                addOutputLine("Saving progress and exiting registration...", 'info');
                setLocalData((prev: FormDataStore) => ({ ...prev, currentQuestionIndex }));
                setCurrentMode('main');
                return;
             case 'submit':
                 if (checkCompletion(localData)) {
                     handleFinalSubmit();
                 } else {
                     addOutputLine("Please complete all required questions before submitting.", 'warning');
                 }
                 return;
             case 'review':
                 handleReviewCommand();
                 return;
            default:
                await processAnswer(input);
        }
    };

     const handleReviewModeCommand = async (command: string, args: string[]) => {
         switch(command) {
             case 'submit':
                 handleFinalSubmit();
                 break;
             case 'edit':
                 const indexStr = args[0];
                 const indexToEdit = parseInt(indexStr, 10) - 1;
                 if (!isNaN(indexToEdit) && indexToEdit >= 0 && indexToEdit < questions.length) {
                      addOutputLine(`Editing question ${indexToEdit + 1}: ${questions[indexToEdit].label}`, 'info');
                      setCurrentMode('edit');
                      setCurrentQuestionIndex(indexToEdit);
                      setCurrentInput(localData[questions[indexToEdit].id as keyof FormDataStore] ?? '');
                      addOutputLine(questions[indexToEdit].label, 'question');
                 } else {
                      addOutputLine("Invalid question number. Use 'edit [number]'.", 'error');
                 }
                 break;
             case 'back':
                 addOutputLine("Returning to main menu...", 'info');
                 setCurrentMode('main');
                 break;
             default:
                  addOutputLine(`Unknown command: ${command}. Use 'submit', 'edit [number]', or 'back'.`, 'error');
         }
     };

     const handleReviewCommand = () => {
         addOutputLine("--- Review Answers ---", 'info');
         questions.forEach((q, idx) => {
             const answer = localData[q.id as keyof FormDataStore];
             const displayAnswer = answer === undefined || answer === null ? '[Not Answered]' : String(answer);
             addOutputLine(`${idx + 1}. ${q.label}: ${displayAnswer}`, 'output');
         });
         addOutputLine("--- End Review ---", 'info');
     };

    const processAnswer = async (answer: string) => {
        const question = questions[currentQuestionIndex];
        if (!question) return;

        if (question.id === 'email') {
             if (answer && answer.includes('@')) {
                 setLocalData((prev: FormDataStore) => ({ ...prev, email: answer }));
                 advanceQuestion(answer);
             } else {
                 addOutputLine("Invalid email format.", 'error');
                 addOutputLine(question.label, 'question');
             }
             return;
        }

        if (question.id === 'password') {
             if (answer.length >= 8) {
                 setPasswordAttempt(answer);
                 advanceQuestion(answer);
             } else {
                 addOutputLine("Password must be at least 8 characters.", 'error');
                 addOutputLine(question.label, 'question');
             }
             return;
        }

        if (question.id === 'confirmPassword') {
             if (answer === passwordAttempt) {
                 addOutputLine("Password confirmed. Creating account...", 'info');
                 setIsPasswordInput(false);
                 startAuthTransition(async () => {
                     const result = await signUpUser({ email: localData.email!, password: passwordAttempt });
                     if (result.success || result.message.includes('User already registered')) {
                         addOutputLine(result.success ? "Account created/verified." : "Account already exists, proceeding.", 'success');
                         setLocalData((prev: FormDataStore) => ({ ...prev, isVerified: true }));
                         advanceQuestion(answer);
                     } else {
                         addOutputLine(`Account creation failed: ${result.message}`, 'error');
                         setCurrentQuestionIndex(0);
                         addOutputLine(questions[0].label, 'question');
                         setLocalData((prev: FormDataStore) => ({ ...prev, email: undefined }));
                         setPasswordAttempt('');
                     }
                 });
             } else {
                 addOutputLine("Passwords do not match. Try again.", 'error');
                 const passwordIndex = questions.findIndex(q => q.id === 'password');
                 setCurrentQuestionIndex(passwordIndex >= 0 ? passwordIndex : 0);
                 addOutputLine(questions[passwordIndex >= 0 ? passwordIndex : 0].label, 'question');
                 setIsPasswordInput(true);
                 setPasswordAttempt('');
             }
             return;
        }

        let validationError: string | undefined = undefined;
        if (question.required && !answer) {
            validationError = "This field is required.";
        } else if (question.clientValidation) {
            validationError = question.clientValidation(answer, localData);
        }

        if (validationError) {
            addOutputLine(`Error: ${validationError}`, 'error');
            addOutputLine(question.label, 'question');
            return;
        }

        let processedAnswer: any = answer;
        if (question.type === 'boolean') {
            processedAnswer = answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'true';
        } else if (question.type === 'number') { // Removed 'range' check
             processedAnswer = parseInt(answer, 10);
             if (isNaN(processedAnswer)) {
                 addOutputLine("Invalid number.", 'error');
                 addOutputLine(question.label, 'question');
                 return;
             }
        }

        const newData: FormDataStore = { ...localData, [question.id]: processedAnswer };

        if (currentMode === 'edit') {
             addOutputLine("Saving update...", 'info');
             setLocalData(newData);
             startSubmitTransition(async () => {
                 const updateData = { [question.id]: processedAnswer };
                 const formDataForUpdate = new FormData(); // Create FormData for action
                 Object.entries(updateData).forEach(([key, value]) => {
                     if (value !== undefined && value !== null) {
                         formDataForUpdate.append(key, String(value));
                     }
                 });
                 const result = await updateRegistration(null as any, formDataForUpdate);
                 if (result.success) {
                     addOutputLine("Update saved successfully.", 'success');
                 } else {
                     addOutputLine(`Update failed: ${result.message}`, 'error');
                 }
                 setCurrentMode('review');
                 handleReviewCommand();
             });
             return;
        }

        advanceQuestion(processedAnswer);
    };

    // Helper function to advance to the next question or completion
    const advanceQuestion = (currentAnswer: any) => {
        const currentQ = questions[currentQuestionIndex];
        if (!currentQ) {
            console.error("Cannot advance, current question is undefined.");
            return;
        }
        const newData: FormDataStore = { ...localData, [currentQ.id]: currentAnswer };
        setLocalData((prev: FormDataStore) => ({
            ...newData,
            currentQuestionIndex: currentQuestionIndex
        }));

        const nextIndex = findNextQuestionIndex(currentQuestionIndex, newData);

        if (nextIndex >= questions.length) {
            if (checkCompletion(newData)) {
                addOutputLine("All questions answered.", 'success');
                setIsComplete(true);
                setCurrentMode('review');
                addOutputLine("Review your answers. Use 'submit' or 'edit [number]'.", 'info');
                handleReviewCommand();
            } else {
                 addOutputLine("Error: Could not determine next question or not all required answered.", 'error');
            }
        } else {
            setCurrentQuestionIndex(nextIndex);
            addOutputLine(questions[nextIndex].label, 'question');
            setIsPasswordInput(questions[nextIndex].type === 'password');
        }
    };
    // Removed duplicate advanceQuestion function

     const checkCompletion = (data: FormDataStore): boolean => {
         const registrationQuestions = questions.filter(q => q.id !== 'email' && q.id !== 'password' && q.id !== 'confirmPassword');
         return registrationQuestions.every(q => {
             if (!q.required) return true;
             if (q.dependsOn && data[q.dependsOn as keyof FormDataStore] !== q.dependsValue) return true;
             const answer = data[q.id as keyof FormDataStore];
             return answer !== undefined && answer !== null && answer !== '';
         });
     };

     const checkAndHandleCompletion = (data: FormDataStore) => {
         if (checkCompletion(data)) {
             setIsComplete(true);
             setCurrentMode('review');
             addOutputLine("All questions answered. Review your answers.", 'info');
             handleReviewCommand();
         }
     };

    const handleFinalSubmit = () => {
        addOutputLine("Submitting registration...", 'info');
        const formDataForServer = new FormData();
        Object.entries(localData).forEach(([key, value]) => {
            if (key === 'currentQuestionIndex' || key === 'isVerified') return;
            if (value !== undefined && value !== null) {
                 if (Array.isArray(value)) {
                     value.forEach(item => formDataForServer.append(key, String(item)));
                 } else {
                     formDataForServer.append(key, String(value));
                 }
            }
        });

        startSubmitTransition(async () => {
             const result = await submitRegistration(null as any, formDataForServer);
             if (result.success) {
                 addOutputLine("Registration submitted successfully!", 'success');
                 setLocalData({});
                 setRegistrationStatus('complete');
                 setCurrentMode('main');
             } else {
                 addOutputLine(`Submission failed: ${result.message || 'Unknown error'}`, 'error');
                 if (result.errors) {
                     Object.entries(result.errors).forEach(([field, errors]) => {
                         if (errors) {
                             addOutputLine(` - ${field}: ${errors.join(', ')}`, 'error');
                         }
                     });
                 }
                 setCurrentMode('review');
             }
        });
    };

    const findNextQuestionIndex = (currentIndex: number, currentData: FormDataStore): number => {
        let nextIndex = currentIndex + 1;
        while (nextIndex < questions.length) {
            const nextQuestion = questions[nextIndex];
            if (nextQuestion.id === 'confirmPassword' && !passwordAttempt) continue;
            if (nextQuestion.dependsOn) {
                const dependencyValue = currentData[nextQuestion.dependsOn as keyof FormDataStore];
                if (dependencyValue !== nextQuestion.dependsValue) {
                    nextIndex++;
                    continue;
                }
            }
            return nextIndex;
        }
        return nextIndex;
    };

     const findPrevQuestionIndex = (currentIndex: number, currentData: FormDataStore): number => {
         let prevIndex = currentIndex - 1;
         while (prevIndex >= 0) {
             const prevQuestion = questions[prevIndex];
             if (prevQuestion.id === 'password' || prevQuestion.id === 'confirmPassword') {
                  prevIndex--;
                  continue;
             }
             if (prevQuestion.dependsOn) {
                 const dependencyValue = currentData[prevQuestion.dependsOn as keyof FormDataStore];
                 if (dependencyValue !== prevQuestion.dependsValue) {
                     prevIndex--;
                     continue;
                 }
             }
             return prevIndex;
         }
         return prevIndex;
     };

    // --- Rendering ---
    const currentPromptText = getPromptText(currentMode, isAuthenticated, userEmail);
    const currentQuestion = (currentMode === 'register' || currentMode === 'edit') && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length
        ? questions[currentQuestionIndex]
        : null;

    return (
        <div className="bg-black text-hacker-green font-mono p-4 border border-gray-700 rounded h-[70vh] flex flex-col">
            <div ref={terminalRef} className="flex-grow overflow-y-auto mb-2 scroll-smooth">
                {outputLines.map(line => (
                    <div key={line.id} className={`whitespace-pre-wrap ${
                        line.type === 'error' ? 'text-red-500' :
                        line.type === 'success' ? 'text-green-500' :
                        line.type === 'warning' ? 'text-yellow-500' :
                        line.type === 'info' ? 'text-blue-400' :
                        line.type === 'question' ? 'text-cyan-400' :
                        line.type === 'input' ? 'text-white' :
                        'text-hacker-green'
                    }`}>
                        {line.type === 'input' && <span className="text-gray-500">{line.promptText}</span>}
                        {line.text}
                    </div>
                ))}
                 {currentQuestion && currentMode !== 'auth' && (
                     <div className="text-cyan-400 mt-1">{currentQuestion.label}</div>
                 )}
                 {currentQuestion?.id === 'confirmPassword' && (
                      <div className="text-cyan-400 mt-1">Confirm Password:</div>
                 )}
            </div>

            {currentMode !== 'boot' && (
                <form onSubmit={handleSubmit} className="flex items-center mt-auto pt-2 border-t border-gray-700">
                    <span className="text-gray-500 mr-1">{currentPromptText}</span>
                    <input
                        ref={inputRef}
                        type={isPasswordInput ? 'password' : 'text'}
                        value={currentInput}
                        onChange={handleInputChange}
                        className="bg-transparent border-none text-hacker-green outline-none flex-grow p-0 m-0 focus:ring-0"
                        autoComplete="off"
                        autoFocus
                        // Temporarily remove disabled check for testing
                        disabled={isBooting || isSubmitting || isAuthActionPending}
                    />
                </form>
            )}
        </div>
    );
}