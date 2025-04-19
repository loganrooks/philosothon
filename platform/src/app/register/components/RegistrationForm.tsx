'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { createRegistration } from '../actions';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { questions, FormDataStore } from '../data/registrationQuestions';

// ASCII art for boot sequence
const ASCII_LOGO = `
██████╗ ██╗  ██╗██╗██╗      ██████╗ ███████╗ ██████╗ ████████╗██╗  ██╗ ██████╗ ███╗   ██╗
██╔══██╗██║  ██║██║██║     ██╔═══██╗██╔════╝██╔═══██╗╚══██╔══╝██║  ██║██╔═══██╗████╗  ██║
██████╔╝███████║██║██║     ██║   ██║███████╗██║   ██║   ██║   ███████║██║   ██║██╔██╗ ██║
██╔═══╝ ██╔══██║██║██║     ██║   ██║╚════██║██║   ██║   ██║   ██╔══██║██║   ██║██║╚██╗██║
██║     ██║  ██║██║███████╗╚██████╔╝███████║╚██████╔╝   ██║   ██║  ██║╚██████╔╝██║ ╚████║
╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                                                                                 
 █████╗ ██████╗  ██████╗██╗  ██╗██╗██╗   ██╗███████╗    ██╗   ██╗██████╗ ███████╗       
██╔══██╗██╔══██╗██╔════╝██║  ██║██║██║   ██║██╔════╝    ██║   ██║██╔══██╗██╔════╝       
███████║██████╔╝██║     ███████║██║██║   ██║█████╗      ██║   ██║██████╔╝███████╗       
██╔══██║██╔══██╗██║     ██╔══██║██║╚██╗ ██╔╝██╔══╝      ╚██╗ ██╔╝██╔═══╝ ╚════██║       
██║  ██║██║  ██║╚██████╗██║  ██║██║ ╚████╔╝ ███████╗     ╚████╔╝ ██║     ███████║       
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝      ╚═══╝  ╚═╝     ╚══════╝       
`;

// Define various terminal messages for boot sequence
const BOOT_MESSAGES = [
  { text: "Initializing archive access protocol...", delay: 500 },
  { text: "Loading library session... Done.", delay: 800 },
  { text: "Mounting local disks... [47 million] distributed resources found", delay: 1200 },
  { text: "Connecting network drives...... Error: network inaccessible.", delay: 1000 },
  { text: "Library archive session ready.", delay: 500 },
];



// Terminal command available at different stages
const AVAILABLE_COMMANDS = {
  boot: ['help', 'start', 'about', 'reset'],
  form: ['help', 'list', 'edit [number]', 'clear', 'submit', 'save', 'reset'],
  review: ['help', 'edit [number]', 'submit', 'restart', 'reset']
};

// Types for session data and history items
type HistoryItem = {
  question: string;
  answer: string;
  index: number;
};

type SessionDataType = {
  formData: FormDataStore;
  history: HistoryItem[];
  completed: number[];
};

export function RegistrationForm({ userEmail }: { userEmail?: string | null }) {
  // Local state management with persistence
  const [sessionData, setSessionData] = useLocalStorage<SessionDataType>('philosothon-registration', {
    formData: { email: userEmail || '' },
    history: [],
    completed: []
  });
  
  // UI state
  const [bootComplete, setBootComplete] = useState(false);
  const [bootMessages, setBootMessages] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 during boot
  const [currentInput, setCurrentInput] = useState('');
  const [currentMode, setCurrentMode] = useState<'boot' | 'form' | 'review' | 'edit'>('boot');
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [serverState, formAction] = useFormState(createRegistration, { 
    message: null, 
    errors: {}, 
    success: false 
  });

  // Refs for focus and scrolling
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
    const isBooting = useRef(false); // Note: This ref seems unused, consider removing if confirmed.
    const hasBooted = useRef(false); // Ref to prevent double boot in StrictMode

  // Boot sequence effect - fixed to prevent multiple sequences
  useEffect(() => {
    if (hasBooted.current) return; // Prevent double execution
    hasBooted.current = true; // Mark as booted

    // Check if boot is already complete in localStorage
    const bootCompleted = localStorage.getItem('philosothon-boot-completed') === 'true';
    
    // Skip full boot sequence if already completed
    if (bootCompleted) {
      console.log('Boot already completed, loading from cache');
      setBootComplete(true);
      // Just load the boot messages directly
      setBootMessages([
        ASCII_LOGO, 
        ...BOOT_MESSAGES.map(m => m.text), 
        "> Type 'start' to begin registration or 'help' for commands"
      ]);
      return;
    }
    
    // Clear previous boot state to fix issues with stuck boot sequence
    localStorage.removeItem('philosothon-boot-started');
    
    // Run boot sequence animation
    const bootSequence = async () => {
      try {
        // Set boot flag after clearing it
        localStorage.setItem('philosothon-boot-started', 'true');
        
        // Clear any existing messages first
        setBootMessages([]);
        
        // Display logo first with initial visibility
        setBootMessages([ASCII_LOGO]);
        await new Promise(r => setTimeout(r, 1500));
        
        // Then show boot messages with typing effect
        for (const message of BOOT_MESSAGES) {
          setBootMessages(prev => [...prev, message.text]);
          await new Promise(r => setTimeout(r, message.delay));
        }
        
        setBootMessages(prev => [...prev, "> Type 'start' to begin registration or 'help' for commands"]);
        setBootComplete(true);
        // Notice we don't change currentMode here - user must type 'start'
      } catch (error) {
        console.error('Boot sequence error:', error);
        // Recover from errors by completing boot
        setBootComplete(true);
      }
    };
    
    bootSequence();
  }, []);  // Empty dependency array - only run once
  
  // Add this effect to clean up the boot flag when component unmounts
  useEffect(() => {
    return () => {
      // Only remove the boot flag when component is unmounted
      // This prevents duplicate boot sequences
      if (bootComplete) {
        localStorage.removeItem('philosothon-boot-started');
      }
    };
  }, [bootComplete]);
  
  // Ensure input is focused after boot and on mode changes - fixed focus issue
  useEffect(() => {
    if (bootComplete) {
      // Use a timeout to ensure DOM is fully rendered before focusing
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      
      // Scroll terminal to bottom
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
      
      return () => clearTimeout(timer);
    }
  }, [bootComplete, currentQuestionIndex, currentMode]); // Removed bootMessages.length

  // Command processor with debug logging
  const processCommand = (cmd: string): boolean => {
    const command = cmd.trim().toLowerCase();
    
    console.log('Processing command:', command); // Debug logging
    
    // Reset command available in all modes
    if (command === 'reset') {
      localStorage.removeItem('philosothon-registration');
      localStorage.removeItem('philosothon-boot-started');
      window.location.reload();
      return true;
    }
    
    // Boot mode commands
    if (currentMode === 'boot') {
      if (command === 'start') {
        console.log('Starting registration...'); // Debug
        setCurrentMode('form');
        setCurrentQuestionIndex(0);
        return true;
      }
      
      if (command === 'help') {
        setBootMessages(prev => [...prev, 
          "> help", 
          "Available commands: start (begin registration), about (information), reset (start over)"
        ]);
        return true;
      }
      
      if (command === 'about') {
        setBootMessages(prev => [...prev, 
          "> about",
          "Philosothon Registration Terminal v2.0",
          "University of Toronto, April 2025",
          "This terminal interface allows registration for the upcoming Philosothon event."
        ]);
        return true;
      }
      
      setBootMessages(prev => [...prev, `> ${command}`, "Unknown command. Type 'help' for available commands."]);
      return true;
    }
    
    // Form mode commands
    if (currentMode === 'form' || currentMode === 'review') {
      if (command === 'list') {
        const status = sessionData.completed.map((idx: number) => questions[idx].label);
        setSessionData((prev: SessionDataType) => ({
          ...prev,
          history: [...prev.history, {
            question: "Command: list",
            answer: "Showing completed questions:",
            index: -1
          }]
        }));
        
        // Add each completed question to history display
        status.forEach((item: string, idx: number) => {
          setSessionData((prev: SessionDataType) => ({
            ...prev,
            history: [...prev.history, {
              question: `${idx + 1}.`,
              answer: item,
              index: sessionData.completed[idx]
            }]
          }));
        });
        return true;
      }
      
      if (command === 'help') {
        setSessionData((prev: SessionDataType) => ({
          ...prev,
          history: [...prev.history, {
            question: "Command: help",
            answer: "Available commands: list (show progress), edit [number] (edit a response), submit (finalize registration), clear (clear screen), reset (start over)",
            index: -1
          }]
        }));
        return true;
      }
      
      if (command === 'clear') {
        setSessionData((prev: SessionDataType) => ({
          ...prev,
          history: []
        }));
        return true;
      }
      
      if (command === 'submit' && isComplete) {
        handleFinalSubmit();
        return true;
      }
      
      if (command.startsWith('edit ')) {
        const indexStr = command.split(' ')[1];
        const index = parseInt(indexStr, 10) - 1; // Convert to 0-based
        
        if (isNaN(index) || index < 0 || index >= sessionData.completed.length) {
          setSessionData((prev: SessionDataType) => ({
            ...prev,
            history: [...prev.history, {
              question: `Command: ${command}`,
              answer: "Invalid question number. Use 'list' to see available questions.",
              index: -1
            }]
          }));
        } else {
          setCurrentMode('edit');
          const editingIndex = sessionData.completed[index];
          setCurrentInput('');
          setCurrentQuestionIndex(editingIndex);
        }
        return true;
      }
    }
    
    // If we get here, it wasn't a system command
    return false;
  };

  // Form submission with debug logging
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted, input:', currentInput, 'mode:', currentMode);
    
    if (!bootComplete) return;
    
    // Process as command first
    if (processCommand(currentInput)) {
      setCurrentInput('');
      return;
    }
    
    // If in boot mode and not a valid command, show error
    if (currentMode === 'boot') {
      setBootMessages(prev => [...prev, `> ${currentInput}`, "Unknown command. Type 'help' for available commands."]);
      setCurrentInput('');
      return;
    }
    
    // Handle form responses
    const question = questions[currentQuestionIndex];
    if (!question) return;
    
    // Validate input
    const value = currentInput.trim();
    let validationError: string | null = null;
    let processedAnswer: any = value;
    
    // Basic validation
    if (question.required && !value) {
      validationError = "This field is required.";
    } else if (question.validation && value) {
      validationError = question.validation(value);
    }
    
    // Type conversion
    if (!validationError) {
      if (question.type === 'number' || question.type === 'range') {
        processedAnswer = parseInt(value, 10);
      } else if (question.type === 'boolean') {
        processedAnswer = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
      } else if (question.id.endsWith('_rankings')) {
        // Handle comma-separated rankings
        processedAnswer = value.split(',').map(v => v.trim()).filter(Boolean);
      }
    }
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Clear any errors
    setError(null);
    
    // Update storage with new value
    const newFormData = { ...sessionData.formData, [question.id]: processedAnswer };
    
    // If editing, update the stored value but don't advance
    if (currentMode === 'edit') {
      setSessionData((prev: SessionDataType) => {
        // Update the specific history item that matches this question index
        const newHistory = [...prev.history];
        const historyIndex = newHistory.findIndex(h => h.index === currentQuestionIndex);
        if (historyIndex >= 0) {
          newHistory[historyIndex] = {
            ...newHistory[historyIndex],
            answer: value
          };
        }
        
        return {
          ...prev,
          formData: newFormData, 
          history: newHistory
        };
      });
      
      // Return to previous mode
      setCurrentMode('form');
      
      // Find first unanswered question
      const nextUnanswered = questions.findIndex(
        (_, idx: number) => !sessionData.completed.includes(idx)
      );
      setCurrentQuestionIndex(nextUnanswered >= 0 ? nextUnanswered : 0);
      
      setCurrentInput('');
      return;
    }
    
    // Normal form flow - add to history and advance
    setSessionData((prev: SessionDataType) => ({
      ...prev,
      formData: newFormData,
      history: [...prev.history, { 
        question: question.label, 
        answer: value,
        index: currentQuestionIndex
      }],
      completed: Array.from(new Set([...prev.completed, currentQuestionIndex]))
    }));
    
    setCurrentInput('');
    
    // Find next question accounting for dependencies
    let nextIndex = currentQuestionIndex + 1;
    
    // Skip dependent questions if condition isn't met
    while (
      questions[nextIndex] && 
      questions[nextIndex].dependsOn && 
      newFormData[questions[nextIndex].dependsOn as keyof typeof newFormData] !== questions[nextIndex].dependsValue
    ) {
      nextIndex++;
    }
    
    // Check if we're done
    if (nextIndex >= questions.length) {
      setIsComplete(true);
      setCurrentMode('review');
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handleFinalSubmit = () => {
    // Convert data for server submission
    const formDataForServer = new FormData();
    
    // Add all form fields
    Object.entries(sessionData.formData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      if (Array.isArray(value)) {
        value.forEach(item => formDataForServer.append(key, String(item)));
      } else {
        formDataForServer.append(key, String(value));
      }
    });
    
    // Submit the form
    formAction(formDataForServer);
  };

  // Render the CRT monitor frame with terminal inside
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Debug element to show current state (for development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-black/80 text-white p-2 text-xs">
          Mode: {currentMode}, Boot: {bootComplete ? 'Complete' : 'In Progress'}
        </div>
      )}
      
      {/* CRT Monitor frame */}
      <div className="bg-gray-300 border-8 border-gray-400 rounded-lg p-3 shadow-lg">
        {/* Screen bezel */}
        <div className="bg-black rounded border-2 border-gray-500 p-1">
          {/* Scanlines overlay */}
          <div className="relative overflow-hidden rounded">
            <div className="absolute inset-0 pointer-events-none" 
                 style={{
                   backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.05) 50%)',
                   backgroundSize: '100% 4px'
                 }}>
            </div>
            
            {/* Terminal content */}
            <div 
              ref={terminalRef}
              className="bg-black text-hacker-green font-mono p-4 h-[600px] overflow-y-auto border border-gray-700 rounded relative"
            >
              {/* Boot sequence */}
              {!bootComplete ? (
                <div className="animate-pulse">
                  {bootMessages.map((msg, idx) => (
                    <div key={idx} className={msg.startsWith('> ') ? 'text-hacker-green' : 'text-gray-400'}>
                      <pre className="whitespace-pre-wrap">{msg}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Session header */}
                  <div className="pb-3 mb-4 border-b border-gray-700">
                    <span className="text-hacker-green">Library archive session ready.</span>
                    <br />
                    <span className="text-gray-400">&gt; Searching for locally cached resources....</span>
                  </div>
                  
                  {/* Command history */}
                  {sessionData.history.map((item: HistoryItem, index: number) => (
                    <div key={index} className="mb-2">
                      {/* Only show question label for actual questions */}
                      {item.index >= 0 && (
                        <div className="text-gray-400">{item.question}</div>
                      )}
                      <div className="flex">
                        <span className="text-gray-500 mr-1">{item.index >= 0 ? '>' : ''}</span>
                        <span className={item.index >= 0 ? '' : 'text-gray-300'}>{item.answer}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Current question */}
                  {!isComplete && questions[currentQuestionIndex] && (
                    <div className="current-question mt-4">
                      <div className="text-gray-300 mb-1">{questions[currentQuestionIndex].label}</div>
                      {questions[currentQuestionIndex].options && Array.isArray(questions[currentQuestionIndex].options) && (
                        <div className="text-gray-500 mb-2">
                          Options: {questions[currentQuestionIndex].options.map((o: { label: string }) => o.label).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Review mode message */}
                  {isComplete && currentMode === 'review' && !serverState.success && (
                    <div className="mb-4 p-2 border border-gray-700 bg-gray-900">
                      <p className="text-yellow-400">Registration complete! Review your answers with &apos;list&apos;.</p>
                      <p className="text-gray-400 mt-2">Use &apos;edit [number]&apos; to modify responses or &apos;submit&apos; to finalize.</p>
                    </div>
                  )}
                  
                  {/* Submission status */}
                  {serverState.message && (
                    <div className={`p-2 mb-4 ${serverState.success ? 'text-green-400' : 'text-red-400'}`}>
                      {serverState.message}
                    </div>
                  )}
                  
                  {/* Input form - updated to improve focus handling */}
                  {!serverState.success && (
                    <form 
                      onSubmit={handleSubmit} 
                      className="flex items-center mt-2"
                    >
                      <span className="text-gray-500 mr-1">[admin@local]#</span>
                      <input
                        ref={inputRef}
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onFocus={() => console.log('Input focused')}
                        className="bg-transparent border-none text-hacker-green outline-none flex-grow p-0 m-0 focus:ring-0"
                        autoComplete="off"
                        aria-describedby={error ? "terminal-error" : undefined}
                        autoFocus={bootComplete}
                      />
                    </form>
                  )}
                  
                  {/* Error message */}
                  {error && (
                    <p id="terminal-error" className="text-red-400 mt-1">Error: {error}</p>
                  )}
                </>
              )}
              
              {/* Command help footer - always visible */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between py-2 px-4 bg-gray-900 border-t border-gray-700">
                {currentMode === 'boot' && (
                  <>
                    <span className="text-gray-400">AI_feedback.eml</span>
                    <span className="text-gray-400">spinoza_ethics.eml</span>
                    <span className="text-gray-400">straton_of_stageira.wiki</span>
                    <span className="text-gray-400">exit</span>
                  </>
                )}
                
                {(currentMode === 'form' || currentMode === 'edit' || currentMode === 'review') && (
                  <>
                    <span className="text-gray-400">help</span>
                    <span className="text-gray-400">list</span>
                    <span className="text-gray-400">{currentMode === 'edit' ? 'cancel' : 'edit'}</span>
                    <span className="text-gray-400">{isComplete ? 'submit' : 'save'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}