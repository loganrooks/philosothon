import React from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RegistrationForm } from './RegistrationForm';
import '@testing-library/jest-dom';
import * as registrationActions from '../actions'; // Import actual actions
import * as authActions from '../../auth/actions'; // Import actual actions
import { Question } from '../data/registrationQuestions'; // Assuming type export

// --- Mocks ---

// Keep mock function variables for resetting/assertions
const mockSubmitRegistration = vi.fn();
const mockUpdateRegistration = vi.fn();
const mockDeleteRegistration = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUpUser = vi.fn();
const mockSignOut = vi.fn();
const mockRequestPasswordReset = vi.fn();
const mockFetchRegistration = vi.fn(); // Added for edit/view

// Spy on actions in beforeEach

// Mock useLocalStorage hook
let mockLocalStorageStore: Record<string, any> = {};
const mockSetLocalStorage = vi.fn((newValue: any) => {
    const key = 'philosothon-registration-v3.1'; // V3.1 Key
    // Basic obfuscation simulation (Base64)
    const obfuscatedValue = Buffer.from(JSON.stringify(
        typeof newValue === 'function'
            ? newValue(mockLocalStorageStore[key] ? JSON.parse(Buffer.from(mockLocalStorageStore[key], 'base64').toString('utf-8')) : {})
            : newValue
    )).toString('base64');
    mockLocalStorageStore[key] = obfuscatedValue;
});
vi.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key: string, initialValue: any) => {
    const storedValue = mockLocalStorageStore[key];
    const deobfuscatedValue = storedValue ? JSON.parse(Buffer.from(storedValue, 'base64').toString('utf-8')) : initialValue;
    return [deobfuscatedValue, mockSetLocalStorage];
  }),
}));

// Mock Supabase client methods
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockSignInWithOtp = vi.fn(); // Keep if magiclink is used
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
      signInWithOtp: mockSignInWithOtp,
      getUser: mockGetUser,
      // Use actual action mocks via spyOn
    },
    // Mock data fetching if needed for view/edit
    from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({ data: mockFetchRegistration(), error: null }), // Mock fetch for view/edit
        // Add other methods if needed
    })),
  })),
}));

// Removed outdated mockQuestions array. Relying on imported actualV3Questions.

// Attempt to import the *actual* generated questions for V3 tests
import { questions as actualV3Questions } from '../data/registrationQuestions';


// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Helper to wait for boot and simulate entering a command/answer
const enterInput = async (text: string) => {
  // Wait briefly for potential async updates after previous command/input
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });

  const input = screen.getByRole('textbox');
  // Ensure it's not disabled before interacting
  expect(input).not.toBeDisabled();

  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.submit(input.closest('form')!);
  });
  // Wait again for effects of the submission AND rendering updates
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); }); // Increased delay significantly
};

// Helper to get the displayed output history
const getOutputHistory = () => {
    // Use a more specific selector if possible, or add data-testid
    const terminalDiv = screen.getByText(/Initializing Terminal/i).closest('div.flex-col');
    const outputContainer = terminalDiv?.querySelector('div.flex-grow');
    return outputContainer?.textContent ?? '';
};


// --- V3 Tests ---
describe('RegistrationForm (Terminal UI V3 - Red Phase)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLocalStorageStore = {};
        mockSetLocalStorage.mockClear();
        vi.mocked(window.HTMLElement.prototype.scrollIntoView).mockClear();

        // Spy on and mock implementations of server actions
        vi.spyOn(registrationActions, 'submitRegistration').mockImplementation(mockSubmitRegistration);
        vi.spyOn(registrationActions, 'updateRegistration').mockImplementation(mockUpdateRegistration);
        vi.spyOn(registrationActions, 'deleteRegistration').mockImplementation(mockDeleteRegistration);
        vi.spyOn(authActions, 'signInWithPassword').mockImplementation(mockSignInWithPassword);
        vi.spyOn(authActions, 'signUpUser').mockImplementation(mockSignUpUser);
        vi.spyOn(authActions, 'signOut').mockImplementation(mockSignOut);
        vi.spyOn(authActions, 'requestPasswordReset').mockImplementation(mockRequestPasswordReset);

        // Reset mock implementations and set default resolved values
        mockSubmitRegistration.mockResolvedValue({ success: true, message: 'Submitted' });
        mockUpdateRegistration.mockResolvedValue({ success: true, message: 'Updated' });
        mockDeleteRegistration.mockResolvedValue({ success: true, message: 'Deleted' });
        mockSignInWithPassword.mockResolvedValue({ success: true, message: 'Signed in' });
        mockSignUpUser.mockResolvedValue({ success: true, message: 'User created', userId: 'mock-user-id' });
        mockSignOut.mockResolvedValue({ success: true, message: 'Signed out' });
        mockRequestPasswordReset.mockResolvedValue({ success: true, message: 'Reset email sent' });
        mockFetchRegistration.mockResolvedValue({ /* mock registration data */ });

        // Reset other mocks
        mockGetUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
        mockGetSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // --- Subset 1 Tests ---

    it('should render initial V3 boot sequence and guest prompt', async () => {
        render(<RegistrationForm />);
        // Check for V3 boot text if applicable, or just the final prompt
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        expect(screen.getByText(/Type 'help' for available commands./i)).toBeInTheDocument();
    });

    it('should display correct commands in help for anonymous user', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('help');
        // Check output after help command
        const output = getOutputHistory();
        expect(output).toMatch(/register \[new\|continue]/i); // V3.1 format
        expect(output).toMatch(/sign-in/i);
        expect(output).toMatch(/about/i);
        expect(output).toMatch(/help \[command]/i);
        // Check 'continue' is NOT shown initially
        expect(output).not.toMatch(/continue\s+- Continue/i);
    });

    it('should display "about" information', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('about');
        expect(await screen.findByText(/Philosothon Event Platform v2/i)).toBeInTheDocument(); // Basic check
    });

    it('should show status line indicating no local data initially', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        // Check the status line element if it has a specific role or test id
        // For now, check it doesn't show the "in progress" message
        expect(screen.queryByText(/Registration in progress found/i)).not.toBeInTheDocument();
    });

    it('should show status line indicating local data exists', async () => {
       mockLocalStorageStore['philosothon-registration-v3.1'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 5, formData: { email: 'local@test.com' }})).toString('base64'); // Use v3.1 key
       render(<RegistrationForm />);
       expect(await screen.findByText(/Registration in progress found. Use 'register continue' to resume./i)).toBeInTheDocument();
    });

    it('should show register sub-menu on "register" command', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register');
        expect(await screen.findByText(/Usage: register \[new\|continue]/i)).toBeInTheDocument();
        expect(screen.getByText(/new\s+- Start a new registration/i)).toBeInTheDocument();
        expect(screen.queryByText(/continue\s+- Continue an existing registration/i)).not.toBeInTheDocument(); // No local data
        expect(screen.getByText(/back\s+- Return to main menu/i)).toBeInTheDocument();
    });

    it('should show "continue" in register sub-menu if local data exists', async () => {
       mockLocalStorageStore['philosothon-registration-v3.1'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 1, formData: { email: 'local@test.com' }})).toString('base64'); // Use v3.1 key
       render(<RegistrationForm />);
       expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
       await enterInput('register');
       expect(await screen.findByText(/Usage: register \[new\|continue]/i)).toBeInTheDocument();
       expect(screen.getByText(/continue\s+- Continue an existing registration/i)).toBeInTheDocument(); // Should be visible now
    });

    it('should show V3.1 intro and prompt for First Name (Q1a) on "register new"', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register new');
        // Check for V3.1 intro text
        expect(await screen.findByText(/Welcome to the Philosothon registration form!/i)).toBeInTheDocument();
        expect(await screen.findByText(/April 26-27, 2025/i)).toBeInTheDocument();
        expect(await screen.findByText(/Thursday, April 24th at midnight/i)).toBeInTheDocument(); // V3.1 deadline
        // Check for first V3.1 question prompt (First Name - Q1a)
        expect(await screen.findByText(/^> $/)).toBeInTheDocument(); // Correct V3 prompt during auth flow
        const firstNameQuestion = actualV3Questions.find(q => q.id === 'firstName'); // Q1a
        expect(firstNameQuestion).toBeDefined();
        expect(screen.getByText(firstNameQuestion!.label + ":")).toBeInTheDocument(); // Check explicit prompt
    });

    it('should warn before overwriting local data on "register new"', async () => {
        mockLocalStorageStore['philosothon-registration-v3.1'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 1, formData: { email: 'old@test.com' }})).toString('base64'); // Use v3.1 key
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register new');
        expect(await screen.findByText(/Existing registration data found. Starting new will overwrite it. Proceed\? \(yes\/no\)/i)).toBeInTheDocument();
        // Should not proceed yet
        expect(screen.queryByText(/First Name:/i)).not.toBeInTheDocument();
        await enterInput('yes');
        // Now should proceed
        expect(await screen.findByText(/First Name:/i)).toBeInTheDocument();
        expect(mockLocalStorageStore['philosothon-registration-v3.1']).toBeUndefined(); // Storage cleared
     });

    it('should show error on "register continue" if no local data exists', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register continue');
        expect(await screen.findByText(/No registration in progress found. Use 'register new'./i)).toBeInTheDocument();
        expect(screen.queryByText(/^> $/)).not.toBeInTheDocument(); // Should not enter registration mode
     });

    it('should resume registration from correct index on "register continue"', async () => {
        // Assume Q1a, Q1b, Q2, PW, ConfirmPW are done. Next is Q3 (Pronouns). Index = 5 (0-based)
        const initialData = { currentQuestionIndex: 5, formData: { firstName: 'Test', lastName: 'User', email: 'a@b.c', password: 'set', confirmPassword: 'set' } };
        mockLocalStorageStore['philosothon-registration-v3.1'] = Buffer.from(JSON.stringify(initialData)).toString('base64'); // Use v3.1 key
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register continue');
        // Should show previous answers visually (hard to test precisely without seeing output structure)
        // Check it resumes at Q3 (Pronouns)
        const pronounsQuestion = actualV3Questions.find(q => q.id === 'pronouns');
        expect(pronounsQuestion).toBeDefined();
        expect(await screen.findByText(pronounsQuestion!.label)).toBeInTheDocument(); // Q3 Label
        expect(await screen.findByText(/\[reg 3\/36]>/)).toBeInTheDocument(); // V3.1 Total
     });

    it('should proceed through early auth flow (Q1a -> Q1b -> Q2 -> PW -> Confirm -> signUpUser -> Q3)', async () => {
        mockSignUpUser.mockResolvedValue({ success: true, userId: 'mock-id' }); // Mock successful signup
        render(<RegistrationForm />);
        await enterInput('register new');

        // Q1a: First Name
        const firstNameQuestion = actualV3Questions.find(q => q.id === 'firstName');
        expect(await screen.findByText(firstNameQuestion!.label + ":")).toBeInTheDocument();
        await enterInput('Test');

        // Q1b: Last Name
        const lastNameQuestion = actualV3Questions.find(q => q.id === 'lastName');
        expect(await screen.findByText(lastNameQuestion!.label + ":")).toBeInTheDocument();
        await enterInput('UserV3.1');

        // Q2: Email
        const emailQuestion = actualV3Questions.find(q => q.id === 'email');
        expect(await screen.findByText(emailQuestion!.label + ":")).toBeInTheDocument();
        await enterInput('v3.1@test.com');

        // Q2.1: Password
        expect(await screen.findByText(/^Password:/i)).toBeInTheDocument();
        const pwInput = await screen.findByRole('textbox');
        expect(pwInput).toHaveAttribute('type', 'password'); // Check masking
        await enterInput('passwordV3.1');

        // Q2.2: Confirm Password
        await waitFor(async () => {
            expect(await screen.findByText(/Confirm Password:/i)).toBeInTheDocument();
        });
        const confirmPwInput = await screen.findByRole('textbox');
        expect(confirmPwInput).toHaveAttribute('type', 'password'); // Check masking
        await enterInput('passwordV3.1'); // Matching password

        // Check signUpUser was called
        await waitFor(() => {
            expect(mockSignUpUser).toHaveBeenCalledWith({ email: 'v3.1@test.com', password: 'passwordV3.1' });
        });

        // Check local storage for user verification indication and names/email
        await waitFor(() => {
            const storedData = JSON.parse(Buffer.from(mockLocalStorageStore['philosothon-registration-v3.1'], 'base64').toString('utf-8')); // Use v3.1 key
            expect(storedData.formData.firstName).toBe('Test');
            expect(storedData.formData.lastName).toBe('UserV3.1');
            expect(storedData.formData.email).toBe('v3.1@test.com');
            expect(storedData.userVerified).toBe(true); // Assuming a flag is set
        });

        // Check it proceeds to Q3 (Pronouns - based on V3.1 schema order 3)
        const pronounsQuestion = actualV3Questions.find(q => q.id === 'pronouns');
        expect(pronounsQuestion).toBeDefined();
        expect(await screen.findByText(pronounsQuestion!.label)).toBeInTheDocument(); // Q3 Label
        expect(await screen.findByText(/\[reg 3\/36]>/)).toBeInTheDocument(); // V3.1 Total
     });

    it('should show validation error for invalid email format', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test'); // Q1a
        await enterInput('User'); // Q1b
        await enterInput('invalid-email'); // Q2 (Invalid)
        // Check for specific error message from validationRules
        expect(await screen.findByText(/Invalid email format/i)).toBeInTheDocument();
        // Check hint is also displayed
        const emailQuestion = actualV3Questions.find(q => q.id === 'email');
        expect(await screen.findByText(emailQuestion!.hint)).toBeInTheDocument();
        // Should remain at email step
        expect(screen.getByText(emailQuestion!.label + ":")).toBeInTheDocument();
        // Check input is preserved
        expect(screen.getByRole('textbox')).toHaveValue('invalid-email');
     });

    it('should show validation error for non-matching passwords', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test'); // Q1a
        await enterInput('User'); // Q1b
        await enterInput('v3@test.com'); // Q2
        await enterInput('password123'); // Q2.1
        await enterInput('password456'); // Q2.2 (Mismatch)
        expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
        // Check hint is also displayed (assuming password has a hint)
        // const passwordQuestion = actualV3Questions.find(q => q.id === 'password');
        // expect(await screen.findByText(passwordQuestion!.hint)).toBeInTheDocument();
        // Should remain at confirm password step
        expect(screen.getByText(/Confirm Password:/i)).toBeInTheDocument();
        // Check input is preserved
        expect(screen.getByRole('textbox')).toHaveValue('password456');
     });

    it('should show validation error for short password', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test'); // Q1a
        await enterInput('User'); // Q1b
        await enterInput('v3@test.com'); // Q2
        await enterInput('pass'); // Q2.1 (Too short)
        expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
        // Check hint is also displayed (assuming password has a hint)
        // const passwordQuestion = actualV3Questions.find(q => q.id === 'password');
        // expect(await screen.findByText(passwordQuestion!.hint)).toBeInTheDocument();
        // Should remain at password step
        expect(screen.getByText(/^Password:/i)).toBeInTheDocument();
        // Check input is preserved
        expect(screen.getByRole('textbox')).toHaveValue('pass');
    });

    it('should show error and stay at password step if signUpUser fails', async () => {
        mockSignUpUser.mockResolvedValue({ success: false, message: 'Email already exists' }); // Mock failed signup
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test'); // Q1a
        await enterInput('User'); // Q1b
        await enterInput('exists@test.com'); // Q2
        await enterInput('password123'); // Q2.1
        await enterInput('password123'); // Q2.2

        // Check signUpUser was called
        await waitFor(() => {
            expect(mockSignUpUser).toHaveBeenCalledWith({ email: 'exists@test.com', password: 'password123' });
        });

        // Check error message is displayed
        expect(await screen.findByText(/Error: Email already exists/i)).toBeInTheDocument();

        // Should remain at password step (or maybe email?) - Let's assume password for now
        expect(screen.getByText(/^Password:/i)).toBeInTheDocument();
        // Check local storage does NOT indicate user verification
        const storedData = JSON.parse(Buffer.from(mockLocalStorageStore['philosothon-registration-v3.1'], 'base64').toString('utf-8')); // Use v3.1 key
        expect(storedData.userVerified).toBeUndefined();
    });

    it('should switch to Auth Mode on "sign-in" command', async () => {
      render(<RegistrationForm />);
      expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
      await enterInput('sign-in');
      expect(await screen.findByText(/\[auth]>/)).toBeInTheDocument(); // V3 prompt
      expect(screen.getByText(/Enter email:/i)).toBeInTheDocument();
    });

    // --- Add more V3 tests here as needed ---

});
