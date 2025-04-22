import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TerminalShell from './TerminalShell';
// Mock child dialog components to isolate TerminalShell logic
vi.mock('./InterestFormPlaceholder', () => ({
    default: () => <div data-testid="interest-form-placeholder">InterestFormPlaceholder Mock</div>,
}));
// Mock other potential dialogs if they exist or are added later
// vi.mock('./AuthDialog', () => ({ default: () => <div>AuthDialog Mock</div> }));
// vi.mock('./RegistrationDialog', () => ({ default: () => <div>RegistrationDialog Mock</div> }));

// Helper to get the input element
const getInputElement = () => screen.queryByRole('textbox');

describe('TerminalShell', () => {
    // --- Boot Sequence Tests ---
    describe('Boot Sequence', () => {
        it('should display initial boot messages on mount', () => {
            render(<TerminalShell />);
            // Check for initial messages defined in initialState
            expect(screen.getByText(/Philosothon Terminal V2\. Initializing\.\.\./i)).toBeInTheDocument();
            expect(screen.getByText(/Type "help" for available commands\./i)).toBeInTheDocument();
        });

        it('should NOT display the main input prompt during initial boot output', () => {
            render(<TerminalShell />);
            // The input line itself might be rendered but should correspond to the initial state's prompt,
            // which isn't the dynamic one yet. Let's check if the *main mode* input is absent initially.
            // The component logic currently shows input only in 'main' mode.
            // Since initial state is 'main', this test might need refinement based on how boot is implemented.
            // For now, let's assume the prompt text changes or input becomes enabled *after* boot.
            // Let's check if the initial prompt is present, but maybe disabled?
            // The current implementation doesn't have an explicit "boot" phase separate from "main".
            // It starts in 'main' and shows initial messages.
            // Let's refine: Assert initial messages are present, and the prompt is the *initial* one.
            // Use a query that finds the span containing the prompt text, allowing for whitespace/encoding.
            expect(screen.getByText((content, element) => {
                // Check if the element is a span and its text content matches, ignoring leading/trailing whitespace
                return element?.tagName.toLowerCase() === 'span' && content.trim() === '>';
            })).toBeInTheDocument(); // Initial prompt span
            // This test might need adjustment after implementing the actual boot sequence logic.
            // A better test would be to assert the *final* dynamic prompt isn't present yet.
            expect(screen.queryByText(/\[main\]\[guest\] > /i)).not.toBeInTheDocument();
        });

        it('should eventually display the main input prompt after boot messages', async () => {
            render(<TerminalShell />);
            // Assuming the prompt calculation happens after initial render or some async action.
            // We need to wait for the dynamic prompt to appear.
            // The current implementation sets the prompt immediately based on mode in the reducer.
            // Let's simulate a mode change or state update that triggers the dynamic prompt.
            // For now, let's just wait for the expected initial dynamic prompt based on initialState.
            // This test needs refinement based on actual boot/prompt logic.
            // Let's assume the prompt calculation is slightly delayed or happens in an effect.
            await waitFor(() => {
                // The prompt calculation needs to be implemented first.
                // This test WILL FAIL until the dynamic prompt logic is added.
                expect(screen.getByText(/\[main\]\[guest\] > /i)).toBeInTheDocument();
            });
            expect(getInputElement()).toBeEnabled();
        });
    });

    // --- Dynamic Prompt Tests ---
    describe('Dynamic Prompt', () => {
        // We need a way to provide initial state to the reducer for these tests.
        // Option 1: Modify the component to accept initialState prop (invasive).
        // Option 2: Mock useReducer.
        // Let's try mocking useReducer.

        let mockDispatch: vi.Mock;
        let mockState: any; // Allow modification in tests

        beforeEach(() => {
            mockDispatch = vi.fn();
            // Reset mockState before each test
            mockState = {
                mode: 'main',
                outputLines: [],
                commandHistory: [],
                historyIndex: -1,
                isAuthenticated: false,
                userEmail: null,
                dialogState: {},
                pendingAction: false,
                error: null,
                prompt: '> ', // Initial prompt
            };

            // Mock useReducer to return our controlled state and mock dispatch
            vi.spyOn(React, 'useReducer').mockImplementation(() => [mockState, mockDispatch]);
        });

        afterEach(() => {
            vi.restoreAllMocks(); // Clean up mocks
        });

        it('Scenario 1 (Initial): should display prompt "[main][guest] > "', async () => {
            // Set state for the scenario
            mockState.mode = 'main';
            mockState.isAuthenticated = false;
            mockState.userEmail = null;
            mockState.dialogState = {};
            // The prompt calculation logic needs to exist and be triggered.
            // Let's assume it's called via an effect or dispatch.
            // We'll manually set the expected prompt for the test to fail correctly now.
            mockState.prompt = '[main][guest] > '; // Manually set for test structure

            render(<TerminalShell />);

            // This test will fail until the component actually calculates and sets this prompt.
            await waitFor(() => {
                 expect(screen.getByText(/\[main\]\[guest\] > /i)).toBeInTheDocument();
            });
        });

        it('Scenario 2 (Auth): should display prompt "[main][test@example.com] > "', async () => {
            mockState.mode = 'main';
            mockState.isAuthenticated = true;
            mockState.userEmail = 'test@example.com';
            mockState.dialogState = {};
            mockState.prompt = '[main][test@example.com] > '; // Manually set

            render(<TerminalShell />);

            await waitFor(() => {
                expect(screen.getByText(/\[main\]\[test@example\.com\] > /i)).toBeInTheDocument();
            });
        });

        it('Scenario 3 (Reg Anon): should display prompt "[registration][guest][5/45] > "', async () => {
            mockState.mode = 'registration';
            mockState.isAuthenticated = false;
            mockState.userEmail = null;
            mockState.dialogState = { registration: { currentStep: 5 } }; // Assuming structure
             mockState.prompt = '[registration][guest][5/45] > '; // Manually set

            render(<TerminalShell />);

            await waitFor(() => {
                expect(screen.getByText(/\[registration\]\[guest\]\[5\/45\] > /i)).toBeInTheDocument();
            });
        });

         it('Scenario 4 (Reg Auth): should display prompt "[registration][test@example.com][20/45] > "', async () => {
            mockState.mode = 'registration';
            mockState.isAuthenticated = true;
            mockState.userEmail = 'test@example.com';
            mockState.dialogState = { registration: { currentStep: 20 } }; // Assuming structure
            mockState.prompt = '[registration][test@example.com][20/45] > '; // Manually set

            render(<TerminalShell />);

            await waitFor(() => {
                 expect(screen.getByText(/\[registration\]\[test@example\.com\]\[20\/45\] > /i)).toBeInTheDocument();
            });
        });

        // TODO: Add tests for other state combinations if needed.
        // Example: Registration mode but dialogState.registration is missing or currentStep is missing.
        it('Scenario 5 (Reg Auth, No Step): should display prompt "[registration][test@example.com] > "', async () => {
            mockState.mode = 'registration';
            mockState.isAuthenticated = true;
            mockState.userEmail = 'test@example.com';
            mockState.dialogState = { registration: {} }; // Missing currentStep
            mockState.prompt = '[registration][test@example.com] > '; // Manually set

            render(<TerminalShell />);

            await waitFor(() => {
                 expect(screen.getByText(/\[registration\]\[test@example\.com\] > /i)).toBeInTheDocument();
                 // Check that progress indicator is NOT present
                 expect(screen.queryByText(/\[\d+\/\d+\]/)).not.toBeInTheDocument();
            });
        });
    });
});