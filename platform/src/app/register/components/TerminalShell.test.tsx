// platform/src/app/register/components/TerminalShell.test.tsx

// Import necessary testing utilities and React
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, afterEach } from 'vitest';

// Import the component for boot sequence tests and types/state/function for unit tests
import OriginalTerminalShell, { initialState, TerminalState, calculatePrompt } from './TerminalShell';

// --- Mocks ---
// Mock child dialog components (needed for rendering OriginalTerminalShell)
vi.mock('./InterestFormPlaceholder', () => ({
    default: () => <div data-testid="interest-form-placeholder">InterestFormPlaceholder Mock</div>,
}));
// Mock other potential dialogs if they exist or are added later
// vi.mock('./AuthDialog', () => ({ default: () => <div>AuthDialog Mock</div> }));
// vi.mock('./RegistrationDialog', () => ({ default: () => <div>RegistrationDialog Mock</div> }));

// --- Helper ---
const getInputElement = () => screen.queryByRole('textbox');

// --- Test Suite ---
describe('TerminalShell', () => {

    // Restore timers after each test
    afterEach(() => {
        vi.useRealTimers();
    });

    // --- Boot Sequence Tests ---
    describe('Boot Sequence', () => {
        it('should display initial boot messages on mount', () => {
            render(<OriginalTerminalShell />);
            expect(screen.getByText(/Philosothon Terminal V2\. Initializing\.\.\./i)).toBeInTheDocument();
            expect(screen.getByText(/Type "help" for available commands\./i)).toBeInTheDocument();
        });

        it('should NOT display the main input prompt during initial boot output', () => {
             render(<OriginalTerminalShell />);
             // Check that the final prompt isn't there yet.
             expect(screen.queryByText(/\[main\]\[guest\] > /i)).not.toBeInTheDocument();
        });

        it('should eventually enable input after boot messages', async () => { // Make test async
            vi.useFakeTimers();

            render(<OriginalTerminalShell />);
            // Calculate total delay based on component's bootMessages array + buffer
            // Delays: 50+100+150+200+250+300+350+400+450 = 2250ms
            const totalBootTime = 2250 + 100; // Sum of delays + 100ms buffer

            act(() => { // Keep act synchronous if runAllTimers is synchronous
                vi.advanceTimersByTime(totalBootTime + 50);
                vi.runAllTimers(); // Run all pending timers explicitly
            });

            // Check only if the input is enabled after the boot sequence
            await waitFor(() => {
                expect(getInputElement()).toBeEnabled();
            });
        }, 10000); // Increase timeout to 10 seconds
    });

    // --- Dynamic Prompt Unit Tests ---
    describe('Dynamic Prompt (Unit Tests)', () => {

        it('should return correct prompt for main mode, guest user', () => {
            const state: TerminalState = {
                ...initialState, // Includes mode: 'main', isAuthenticated: false, userEmail: null
            };
            expect(calculatePrompt(state)).toBe('[main][guest] > ');
        });

        it('should return correct prompt for main mode, authenticated user', () => {
            const state: TerminalState = {
                ...initialState,
                isAuthenticated: true,
                userEmail: 'test@example.com',
                mode: 'main',
            };
            expect(calculatePrompt(state)).toBe('[main][test@example.com] > ');
        });

        it('should return correct prompt for registration mode, anonymous user, step 5', () => {
            const state: TerminalState = {
                ...initialState,
                isAuthenticated: false,
                userEmail: null,
                mode: 'registration',
                dialogState: { registration: { currentStep: 4 } }, // 0-indexed
            };
            expect(calculatePrompt(state)).toBe('[registration][guest][5/45] > ');
        });

        it('should return correct prompt for registration mode, authenticated user, step 20', () => {
            const state: TerminalState = {
                ...initialState,
                isAuthenticated: true,
                userEmail: 'test@example.com',
                mode: 'registration',
                dialogState: { registration: { currentStep: 19 } }, // 0-indexed
            };
            expect(calculatePrompt(state)).toBe('[registration][test@example.com][20/45] > ');
        });

        it('should return correct prompt for registration mode, authenticated user, no step', () => {
            const state: TerminalState = {
                ...initialState,
                isAuthenticated: true,
                userEmail: 'test@example.com',
                mode: 'registration',
                dialogState: { registration: {} }, // currentStep missing
            };
            expect(calculatePrompt(state)).toBe('[registration][test@example.com] > ');
        });

         it('should return correct prompt for registration mode, anonymous user, no step', () => {
            const state: TerminalState = {
                ...initialState,
                isAuthenticated: false,
                userEmail: null,
                mode: 'registration',
                dialogState: { registration: {} }, // currentStep missing
            };
            expect(calculatePrompt(state)).toBe('[registration][guest] > ');
        });

         it('should return correct prompt for registration mode, anonymous user, step 0', () => {
            const state: TerminalState = {
                ...initialState,
                isAuthenticated: false,
                userEmail: null,
                mode: 'registration',
                dialogState: { registration: { currentStep: 0 } }, // 0-indexed
            };
            expect(calculatePrompt(state)).toBe('[registration][guest][1/45] > ');
        });

         it('should return correct prompt for registration mode, anonymous user, step -1 (pre-questions)', () => {
            const state: TerminalState = {
                ...initialState,
                isAuthenticated: false,
                userEmail: null,
                mode: 'registration',
                dialogState: { registration: { currentStep: -1 } }, // Special case
            };
            // Based on current logic, this should omit the progress part
            expect(calculatePrompt(state)).toBe('[registration][guest] > ');
        });

    });
});