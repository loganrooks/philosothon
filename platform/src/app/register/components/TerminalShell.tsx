'use client';

import React, {
  useReducer,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useState,
} from 'react';
import { useFormState } from 'react-dom'; // Needed for dialogs later
import InterestFormPlaceholder from './InterestFormPlaceholder'; // Placeholder import

// --- Types ---

type TerminalMode = 'main' | 'interest_capture' | 'auth' | 'registration'; // Add more modes as needed

interface OutputLine {
  id: number;
  text: string;
  type:
    | 'input'
    | 'output'
    | 'error'
    | 'success'
    | 'warning'
    | 'info'
    | 'question'
    | 'prompt';
}

interface TerminalState {
  mode: TerminalMode;
  outputLines: OutputLine[];
  commandHistory: string[];
  historyIndex: number; // -1 for new command, 0+ for history navigation
  isAuthenticated: boolean; // Placeholder for auth state
  userEmail: string | null; // Placeholder
  dialogState: Record<string, any>; // Mode-specific state
  pendingAction: boolean;
  error: string | null;
  prompt: string; // Current input prompt text
}

type TerminalAction =
  | { type: 'ADD_OUTPUT'; payload: { text: string; outputType?: OutputLine['type'] } }
  | { type: 'ADD_INPUT_TO_HISTORY'; payload: string }
  | { type: 'SET_MODE'; payload: TerminalMode }
  | { type: 'SET_DIALOG_STATE'; payload: { mode: TerminalMode; state: any } }
  | { type: 'SET_PENDING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_OUTPUT' }
  | { type: 'NAVIGATE_HISTORY'; payload: 'up' | 'down' }
  | { type: 'RESET_HISTORY_INDEX' }
  | { type: 'SET_PROMPT'; payload: string };


// --- Initial State & Reducer ---

const initialState: TerminalState = {
  mode: 'main',
  outputLines: [
    { id: 0, text: 'Philosothon Terminal V2. Initializing...', type: 'info' },
    { id: 1, text: 'Type "help" for available commands.', type: 'info' },
  ],
  commandHistory: [],
  historyIndex: -1,
  isAuthenticated: false,
  userEmail: null,
  dialogState: {},
  pendingAction: false,
  error: null,
  prompt: '> ',
};

let outputLineIdCounter = initialState.outputLines.length;

function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'ADD_OUTPUT':
      return {
        ...state,
        outputLines: [
          ...state.outputLines,
          {
            id: outputLineIdCounter++,
            text: action.payload.text,
            type: action.payload.outputType || 'output',
          },
        ],
        error: null, // Clear error on new output
      };
    case 'ADD_INPUT_TO_HISTORY':
      // Avoid adding duplicate consecutive commands
      if (state.commandHistory[state.commandHistory.length - 1] === action.payload) {
        return state;
      }
      return {
        ...state,
        commandHistory: [...state.commandHistory, action.payload],
        historyIndex: -1, // Reset history navigation index
      };
    case 'SET_MODE':
      // Reset dialog state for the new mode if it doesn't exist
      const newDialogState = state.dialogState[action.payload] === undefined
        ? { ...state.dialogState, [action.payload]: {} }
        : state.dialogState;
      return {
        ...state,
        mode: action.payload,
        dialogState: newDialogState,
        prompt: action.payload === 'main' ? '> ' : `${action.payload}> `, // Basic prompt change
        error: null,
      };
    case 'SET_DIALOG_STATE':
      return {
        ...state,
        dialogState: {
          ...state.dialogState,
          [action.payload.mode]: action.payload.state,
        },
      };
    case 'SET_PENDING':
      return { ...state, pendingAction: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, pendingAction: false };
    case 'CLEAR_OUTPUT':
      outputLineIdCounter = 0; // Reset counter
      return { ...state, outputLines: [], error: null };
    case 'NAVIGATE_HISTORY': {
        let newIndex = state.historyIndex;
        if (action.payload === 'up') {
            newIndex = Math.min(state.commandHistory.length - 1, state.historyIndex + 1);
        } else if (action.payload === 'down') {
            newIndex = Math.max(-1, state.historyIndex - 1);
        }
        // Ensure index stays within bounds [-1, history.length - 1]
        newIndex = Math.max(-1, Math.min(newIndex, state.commandHistory.length - 1));
        return { ...state, historyIndex: newIndex };
    }
    case 'RESET_HISTORY_INDEX':
        return { ...state, historyIndex: -1 };
    case 'SET_PROMPT':
        return { ...state, prompt: action.payload };
    default:
      return state;
  }
}

// --- Context (Optional but good practice) ---
interface TerminalContextProps {
  state: TerminalState;
  dispatch: React.Dispatch<TerminalAction>;
  addOutputLine: (text: string, type?: OutputLine['type']) => void;
  changeMode: (newMode: TerminalMode, options?: { initialDialogState?: any }) => void;
  setDialogState: (newState: any) => void; // Updates state for the *current* mode
}

const TerminalContext = createContext<TerminalContextProps | undefined>(undefined);

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};

// --- Child Components (Placeholders) ---

interface InputLineProps {
  prompt: string;
  onSubmit: (command: string) => void;
  disabled: boolean;
  commandHistory: string[];
  historyIndex: number;
  onHistoryNav: (direction: 'up' | 'down') => void;
  onResetHistoryIndex: () => void;
}

const InputLine: React.FC<InputLineProps> = ({
    prompt,
    onSubmit,
    disabled,
    commandHistory,
    historyIndex,
    onHistoryNav,
    onResetHistoryIndex
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update input value when navigating history
    if (historyIndex === -1) {
      setInputValue('');
    } else {
      // History is stored oldest first, navigate backwards from end
      const historyCommand = commandHistory[commandHistory.length - 1 - historyIndex];
      setInputValue(historyCommand || '');
    }
  }, [historyIndex, commandHistory]);

  useEffect(() => {
    // Focus input when not disabled
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onHistoryNav('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onHistoryNav('down');
    } else if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
        // Any other key press while navigating history should reset the index
        // so the user starts editing the historical command as a new one.
        // However, we only reset if they *were* navigating (index != -1)
        // and the input wasn't already manually changed.
        // A simpler approach: reset on any key *except* arrows if index != -1
        // Let's refine: Only reset if they type something other than arrows *while* navigating
        // Best approach: Let the useEffect handle setting value, reset index on submit.
        // Simpler keydown: Reset if non-arrow key pressed *while* historyIndex is not -1? No, too aggressive.
        // Let's stick to resetting index on submit and when input changes manually.
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // If user types while navigating history, stop navigating
    if (historyIndex !== -1) {
        onResetHistoryIndex();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSubmit(inputValue);
      setInputValue(''); // Clear input after submit
      onResetHistoryIndex(); // Reset history nav index
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <span className="text-hacker-green mr-2">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-grow bg-transparent text-hacker-green outline-none border-none focus:ring-0"
        autoComplete="off"
        spellCheck="false"
      />
    </form>
  );
};

interface OutputHistoryProps {
  lines: OutputLine[];
}

const OutputHistory: React.FC<OutputHistoryProps> = ({ lines }) => {
  const endOfHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new lines are added
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const getLineClass = (type: OutputLine['type']) => {
    switch (type) {
      case 'input': return 'text-hacker-green opacity-75';
      case 'error': return 'text-red-500';
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-400';
      case 'question': return 'text-purple-400 font-bold';
      case 'prompt': return 'text-hacker-green'; // Same as input for now
      case 'output':
      default: return 'text-hacker-green';
    }
  };

  return (
    <div className="flex-grow overflow-y-auto mb-2">
      {lines.map((line) => (
        <div key={line.id} className={`whitespace-pre-wrap ${getLineClass(line.type)}`}>
          {line.type === 'input' && '> '} {/* Add prompt marker for input lines */}
          {line.text}
        </div>
      ))}
      <div ref={endOfHistoryRef} />
    </div>
  );
};

// --- Dialog Components Map ---
// This map determines which component to render for each mode.
const dialogComponents: Record<TerminalMode, React.FC<any>> = { // Use 'any' for props initially
  main: () => null, // No specific dialog for main mode initially
  interest_capture: InterestFormPlaceholder,
  auth: () => <div>Auth Dialog Placeholder</div>, // Placeholder
  registration: () => <div>Registration Dialog Placeholder</div>, // Placeholder
  // Add other modes and their components here
};


// --- TerminalShell Component ---

const TerminalShell: React.FC = () => {
  const [state, dispatch] = useReducer(terminalReducer, initialState);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Helper Functions ---
  const addOutputLine = useCallback((text: string, type: OutputLine['type'] = 'output') => {
    dispatch({ type: 'ADD_OUTPUT', payload: { text, outputType: type } });
  }, []);

  const changeMode = useCallback((newMode: TerminalMode, options?: { initialDialogState?: any }) => {
    dispatch({ type: 'SET_MODE', payload: newMode });
    if (options?.initialDialogState) {
      // Need to dispatch *after* mode change potentially, or handle in reducer
      // For now, let's assume reducer handles initial state setup if needed
      // Or dispatch separately:
      dispatch({ type: 'SET_DIALOG_STATE', payload: { mode: newMode, state: options.initialDialogState } });
    }
     // Add initial prompt or message for the new mode
     if (newMode === 'interest_capture') {
        addOutputLine('Entering interest capture mode...', 'info');
     } else if (newMode === 'main') {
        addOutputLine('Returning to main mode.', 'info');
     }
     // Add more mode-specific messages as needed
  }, [addOutputLine]);

  const setDialogState = useCallback((newState: any) => {
    dispatch({ type: 'SET_DIALOG_STATE', payload: { mode: state.mode, state: newState } });
  }, [state.mode]);

  const handleHistoryNav = useCallback((direction: 'up' | 'down') => {
    dispatch({ type: 'NAVIGATE_HISTORY', payload: direction });
  }, []);

  const handleResetHistoryIndex = useCallback(() => {
    dispatch({ type: 'RESET_HISTORY_INDEX' });
  }, []);


  // --- Command Handling ---
  const processCommand = useCallback(async (command: string) => {
    dispatch({ type: 'ADD_OUTPUT', payload: { text: command, outputType: 'input' } });
    dispatch({ type: 'ADD_INPUT_TO_HISTORY', payload: command });
    dispatch({ type: 'SET_PENDING', payload: true });

    const args = command.toLowerCase().trim().split(' ');
    const cmd = args[0];

    // --- Global Commands ---
    if (cmd === 'clear') {
      dispatch({ type: 'CLEAR_OUTPUT' });
      dispatch({ type: 'SET_PENDING', payload: false });
      return;
    }
    if (cmd === 'help') {
      addOutputLine('Available commands: help, clear, register, exit', 'info');
      dispatch({ type: 'SET_PENDING', payload: false });
      return;
    }
     if (cmd === 'exit') {
        if (state.mode !== 'main') {
            changeMode('main');
        } else {
            addOutputLine('Already in main mode. Type "help" for commands.', 'info');
        }
        dispatch({ type: 'SET_PENDING', payload: false });
        return;
    }

    // --- Mode Switching Commands (Handled Globally for now) ---
     if (cmd === 'register' && state.mode === 'main') {
        changeMode('interest_capture');
        dispatch({ type: 'SET_PENDING', payload: false });
        return;
     }


    // --- Delegate to Active Dialog ---
    const ActiveDialogComponent = dialogComponents[state.mode];
    if (ActiveDialogComponent && typeof (ActiveDialogComponent as any).prototype?.processInput === 'function') {
        // If the dialog has a specific input processor (less likely with this prop structure)
        // This path might not be used if dialogs handle input via form actions primarily
        console.warn("Dialog processInput method not standard in this architecture. Input likely handled by form actions.");
    } else if (state.mode !== 'main') {
        // For non-main modes without a specific command handler here,
        // assume input is handled within the dialog component (e.g., form submission)
        // or it's an invalid command for the mode.
        addOutputLine(`Command "${command}" not recognized in ${state.mode} mode. Type "exit" to return to main.`, 'error');
    }
     else {
      // Default for main mode if command not recognized
      addOutputLine(`Command not found: ${command}`, 'error');
    }

    dispatch({ type: 'SET_PENDING', payload: false });

  }, [state.mode, addOutputLine, changeMode]);


  // --- Render Active Dialog ---
  const ActiveDialog = dialogComponents[state.mode];

  // --- Effects ---
   useEffect(() => {
    // Focus container on mount to capture key events if needed, or focus input directly
    // For simplicity, InputLine focuses itself.
    // containerRef.current?.focus();
  }, []);


  // --- Context Value ---
  const contextValue: TerminalContextProps = {
    state,
    dispatch,
    addOutputLine,
    changeMode,
    setDialogState,
  };

  return (
    <TerminalContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className="bg-black text-hacker-green font-mono h-full w-full p-4 flex flex-col overflow-hidden border border-medium-gray"
        // tabIndex={0} // Make div focusable if needed for global keybinds
      >
        <OutputHistory lines={state.outputLines} />

        {/* Render the active dialog if it exists */}
        {ActiveDialog && (
          <ActiveDialog
            // Pass necessary props based on DialogProps interface
            processInput={processCommand} // Or maybe dialogs don't need this if using forms? Revisit.
            addOutputLine={addOutputLine}
            changeMode={changeMode}
            setDialogState={setDialogState}
            currentDialogState={state.dialogState[state.mode] || {}}
            userSession={{ isAuthenticated: state.isAuthenticated, email: state.userEmail }}
          />
        )}

        {/* Only show the main input line if no dialog is handling input OR if the dialog allows it */}
        {/* For now, assume main input is hidden during dialog modes */}
        {state.mode === 'main' && (
             <InputLine
                prompt={state.prompt}
                onSubmit={processCommand}
                disabled={state.pendingAction}
                commandHistory={state.commandHistory}
                historyIndex={state.historyIndex}
                onHistoryNav={handleHistoryNav}
                onResetHistoryIndex={handleResetHistoryIndex}
            />
        )}

        {/* Display global error */}
        {state.error && <div className="text-red-500 mt-1">Error: {state.error}</div>}
      </div>
    </TerminalContext.Provider>
  );
};

export default TerminalShell;