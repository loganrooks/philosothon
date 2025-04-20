import React from 'react';
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrationForm } from './RegistrationForm';
import '@testing-library/jest-dom';
import * as registrationActions from '../actions'; // Import actual actions
import * as authActions from '../../auth/actions'; // Import actual actions

// --- Mocks ---

// Keep mock function variables for resetting/assertions
const mockSubmitRegistration = vi.fn();
const mockUpdateRegistration = vi.fn();
const mockDeleteRegistration = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUpUser = vi.fn();
const mockSignOut = vi.fn();
const mockRequestPasswordReset = vi.fn();

// REMOVED vi.mock for ../actions and ../../auth/actions
// We will use vi.spyOn in beforeEach instead

// Mock useLocalStorage hook
let mockLocalStorageStore: Record<string, any> = {};
const mockSetLocalStorage = vi.fn((newValue: any) => { // Keep for beforeEach reset
    const key = 'philosothon-registration-v2';
    mockLocalStorageStore[key] = typeof newValue === 'function'
        ? newValue(mockLocalStorageStore[key] || {})
        : newValue;
});
vi.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key: string, initialValue: any) => {
    // Use the mockSetLocalStorage defined outside the factory but accessible here
    return [mockLocalStorageStore[key] ?? initialValue, mockSetLocalStorage];
  }),
}));

// Mock Supabase client methods with inline vi.fn()
const mockGetUser = vi.fn();       // Keep for beforeEach reset
const mockGetSession = vi.fn();    // Keep for beforeEach reset
const mockSignInWithOtp = vi.fn(); // Keep for beforeEach reset
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      // Use the mock functions defined outside the factory but accessible here
      getSession: mockGetSession,
      signInWithOtp: mockSignInWithOtp,
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUpUser,
      signOut: mockSignOut,
      resetPasswordForEmail: mockRequestPasswordReset,
    },
  })),
}));

// Mock generated questions data directly inside the factory function
vi.mock('../data/registrationQuestions', () => ({
  questions: [
    { id: 'email', label: 'Email Address', type: 'email', required: true, order: 1 },
    { id: 'password', label: 'Password', type: 'password', required: true, order: 2 },
    { id: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true, order: 3, dependsOn: 'password' },
    { id: 'full_name', label: 'Full Name', type: 'text', required: true, order: 4 },
    { id: 'university', label: 'University/Institution', type: 'text', required: true, order: 5 },
    { id: 'attendance_preference', label: 'Attendance Preference', type: 'single-select', required: true, options: ['In-Person', 'Online'], order: 6 },
    { id: 'dietary_restrictions', label: 'Dietary Restrictions', type: 'text', required: false, dependsOn: 'attendance_preference', dependsValue: 'In-Person', order: 7 },
  ],
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Helper to wait for boot and simulate entering a command/answer
const enterInput = async (text: string) => {
  // Fake timers should be active, input should appear synchronously after runAllTimers
  const input = screen.getByRole('textbox');
  // Ensure it's not disabled before interacting
  expect(input).not.toBeDisabled();

  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.submit(input.closest('form')!);
  });
  // Remove fixed delay, rely on act wrapping the call site
};

describe('RegistrationForm (Terminal UI V2)', () => {
  // Removed vi.useFakeTimers();

  beforeEach(() => {
    vi.clearAllMocks(); // Clears spies as well
    mockLocalStorageStore = {};
    mockSetLocalStorage.mockClear();
    vi.mocked(window.HTMLElement.prototype.scrollIntoView).mockClear();

    // Spy on and mock implementations of server actions BEFORE resetting
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

    // Reset other mocks
    mockGetUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
    mockGetSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  });

  it('should render boot sequence and transition to main mode', async () => {
    render(<RegistrationForm />);
    expect(screen.getByText(/Initializing Terminal v2.0.../i)).toBeInTheDocument();
    // Boot is synchronous in test env, findByText should work directly
    expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument(); // Check prompt
    expect(screen.getByText(/Type 'help' for available commands./i)).toBeInTheDocument();
  });

  describe('Main Mode (Anonymous)', () => {
    it('should display guest prompt and initial commands', async () => {
      render(<RegistrationForm />);
      // Boot is synchronous
      expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
      await act(async () => { await enterInput('help'); });
      expect(await screen.findByText(/register new/i)).toBeInTheDocument();
      expect(screen.getByText(/sign-in/i)).toBeInTheDocument();
    });

    it('should show status line if local registration data exists', async () => {
       mockLocalStorageStore['philosothon-registration-v2'] = { currentQuestionIndex: 1, email: 'local@test.com' };
       render(<RegistrationForm />);
       expect(await screen.findByText(/Local registration data found/i)).toBeInTheDocument();
    });

    it('should switch to Auth Mode on "sign-in" command', async () => {
      render(<RegistrationForm />);
      // Boot is synchronous
      expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
      await act(async () => { await enterInput('sign-in'); });
      expect(await screen.findByText(/\[auth]> /, {}, { timeout: 2000 })).toBeInTheDocument();
      expect(screen.getByText(/Enter email:/i)).toBeInTheDocument();
    });
  });

  describe('Registration Mode (New)', () => {
     it('should start new registration and prompt for email on "register new"', async () => {
       render(<RegistrationForm />);
       // Boot is synchronous
       expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
       await act(async () => { await enterInput('register new'); });
       expect(await screen.findByText(/\[reg 1\/\d+]> /, {}, { timeout: 2000 })).toBeInTheDocument();
       expect(screen.getByText(/Email Address/i)).toBeInTheDocument();
       expect(mockLocalStorageStore['philosothon-registration-v2']).toEqual({});
     });

     it('should prompt for password after valid email', async () => {
        render(<RegistrationForm />);
        // Boot is synchronous
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await act(async () => { await enterInput('register new'); });
        await act(async () => { await enterInput('test@example.com'); });
        // Check for prompt change with increased timeout
        expect(await screen.findByText(/\[reg 2\/\d+]> /, {}, { timeout: 2000 })).toBeInTheDocument();
        const input = await screen.findByRole('textbox');
        expect(input).toHaveAttribute('type', 'password');
     });

     it('should call signUpUser action after password confirmation', async () => {
        render(<RegistrationForm />);
        // Boot is synchronous
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await act(async () => { await enterInput('register new'); });
        await act(async () => { await enterInput('test@example.com'); });
        await act(async () => { await enterInput('password123'); });
        await act(async () => { await enterInput('password123'); });
        await waitFor(() => {
            expect(mockSignUpUser).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
        });
     });

     it('should proceed to first registration question after user creation/verification', async () => {
        mockSignUpUser.mockResolvedValue({ success: true, userId: 'mock-id' });
        render(<RegistrationForm />);
        // Boot is synchronous
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await act(async () => { await enterInput('register new'); });
        await act(async () => { await enterInput('test@example.com'); });
        await act(async () => { await enterInput('password123'); });
        await act(async () => { await enterInput('password123'); });
        expect(await screen.findByText(/Full Name/i)).toBeInTheDocument();
        expect(await screen.findByText(/\[reg 4\/\d+]> /, {}, { timeout: 2000 })).toBeInTheDocument();
     });

     it('should save answer and show next question', async () => {
        mockSignUpUser.mockResolvedValue({ success: true, userId: 'mock-id' });
        render(<RegistrationForm />);
        // Boot is synchronous
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await act(async () => { await enterInput('register new'); });
        await act(async () => { await enterInput('test@example.com'); });
        await act(async () => { await enterInput('password123'); });
        await act(async () => { await enterInput('password123'); }); // At Full Name
        await act(async () => { await enterInput('Test User'); }); // Answer Full Name
  
        expect(mockSetLocalStorage).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Test User' }));
        expect(await screen.findByText(/University\/Institution/i)).toBeInTheDocument();
     });

     it('should handle "next" and "prev" commands', async () => {
        mockSignUpUser.mockResolvedValue({ success: true, userId: 'mock-id' });
        render(<RegistrationForm />);
        // Boot is synchronous
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await act(async () => { await enterInput('register new'); });
        await act(async () => { await enterInput('test@example.com'); });
        await act(async () => { await enterInput('password123'); });
        await act(async () => { await enterInput('password123'); }); // At Full Name
        await act(async () => { await enterInput('Test User'); }); // At University
  
        await act(async () => { await enterInput('prev'); });
        expect(await screen.findByText(/Full Name/i)).toBeInTheDocument();
        expect(await screen.findByText(/\[reg 4\/\d+]> /, {}, { timeout: 2000 })).toBeInTheDocument(); // Check prompt after prev
  
        await act(async () => { await enterInput('next'); });
        expect(await screen.findByText(/University\/Institution/i)).toBeInTheDocument();
        expect(await screen.findByText(/\[reg 5\/\d+]> /, {}, { timeout: 2000 })).toBeInTheDocument(); // Check prompt after next
     });

     it('should handle "exit" command', async () => {
        render(<RegistrationForm />);
        // Boot is synchronous
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await act(async () => { await enterInput('register new'); });
        await act(async () => { await enterInput('test@example.com'); });
        await act(async () => { await enterInput('exit'); });
        expect(await screen.findByText(/\[guest@philosothon]\$/, {}, { timeout: 2000 })).toBeInTheDocument();
        expect(mockSetLocalStorage).toHaveBeenCalledWith(expect.objectContaining({ currentQuestionIndex: 0 }));
     });

     it('should show completion options and switch to review mode after last question', async () => {
        mockSignUpUser.mockResolvedValue({ success: true, userId: 'mock-id' });
        render(<RegistrationForm />);
        // Boot is synchronous
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await act(async () => { await enterInput('register new'); });
        await act(async () => { await enterInput('test@example.com'); });
        await act(async () => { await enterInput('password123'); });
        await act(async () => { await enterInput('password123'); }); // -> Full Name
        await act(async () => { await enterInput('Test User'); });   // -> University
        await act(async () => { await enterInput('UofT'); });        // -> Attendance Pref
        await act(async () => { await enterInput('In-Person'); });   // -> Dietary
        await act(async () => { await enterInput('None'); });        // -> Should be complete
  
        expect(await screen.findByText(/All questions answered./i)).toBeInTheDocument();
        expect(await screen.findByText(/\[review]> /, {}, { timeout: 2000 })).toBeInTheDocument();
        expect(await screen.findByText(/Full Name: Test User/)).toBeInTheDocument();
     });

     it('should call submitRegistration action on "submit" in review mode', async () => {
        mockSignUpUser.mockResolvedValue({ success: true, userId: 'mock-id' });
        render(<RegistrationForm />);
        // Boot is synchronous
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await act(async () => { await enterInput('register new'); });
        await act(async () => { await enterInput('test@example.com'); });
        await act(async () => { await enterInput('password123'); });
        await act(async () => { await enterInput('password123'); });
        await act(async () => { await enterInput('Test User'); });
        await act(async () => { await enterInput('UofT'); });
        await act(async () => { await enterInput('In-Person'); });
        await act(async () => { await enterInput('None'); }); // Now in review mode
  
        await act(async () => { await enterInput('submit'); });
        await waitFor(() => {
            expect(mockSubmitRegistration).toHaveBeenCalled();
        });
     });
  });

  describe('Auth Mode', () => {
     it('should prompt for email and password (masked)', async () => {
       render(<RegistrationForm />);
       // Boot is synchronous
       expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
       await act(async () => { await enterInput('sign-in'); });
       expect(await screen.findByText(/Enter email:/i)).toBeInTheDocument();
       await act(async () => { await enterInput('test@example.com'); });
       expect(await screen.findByText(/Enter password:/i)).toBeInTheDocument();
       // Check prompt with timeout
       expect(await screen.findByText(/\[auth]> /, {}, { timeout: 2000 })).toBeInTheDocument();
       const input = await screen.findByRole('textbox');
       expect(input).toHaveAttribute('type', 'password');
     });

     it('should call signInWithPassword action on submission', async () => {
       render(<RegistrationForm />);
       // Boot is synchronous
       expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
       await act(async () => { await enterInput('sign-in'); });
       await act(async () => { await enterInput('test@example.com'); });
       await act(async () => { await enterInput('password123'); });
       await waitFor(() => {
            expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
       });
     });

     it('should switch to Main Mode (authenticated) on successful sign-in', async () => {
       mockSignInWithPassword.mockResolvedValue({ success: true, message: 'Signed in' });
       render(<RegistrationForm />);
       // Boot is synchronous
       expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
       await act(async () => { await enterInput('sign-in'); });
       await act(async () => { await enterInput('test@example.com'); });
       await act(async () => { await enterInput('password123'); });
 
       expect(await screen.findByText(/\[test@example.com]\$/, {}, { timeout: 2000 })).toBeInTheDocument();
     });

     it('should show error and stay in Auth Mode on failed sign-in', async () => {
       mockSignInWithPassword.mockResolvedValue({ success: false, message: 'Invalid credentials' });
       render(<RegistrationForm />);
       // Boot is synchronous
       expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
       await act(async () => { await enterInput('sign-in'); });
       await act(async () => { await enterInput('test@example.com'); });
       await act(async () => { await enterInput('wrongpassword'); });
 
       expect(await screen.findByText(/Authentication failed: Invalid credentials/i)).toBeInTheDocument();
       expect(await screen.findByText(/\[auth]> /, {}, { timeout: 2000 })).toBeInTheDocument();
       expect(screen.getByText(/Enter email:/i)).toBeInTheDocument();
     });
  });

  // Add tests for Main Mode (Authenticated), Edit/Delete/View flows etc.
});