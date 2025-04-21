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
    const key = 'philosothon-registration-v3'; // V3 Key
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

// Mock generated questions data (Using OUTDATED structure from registrationQuestions.ts to fix TS errors)
const mockQuestions: Question[] = [
  {
    id: 'email',
    label: `Email Address`,
    type: 'email',
    required: true,
    hint: 'Enter your university email.',
    description: 'Your university email address.',
  },
  {
    id: 'full_name',
    label: `Full Name`,
    type: 'text',
    required: true,
    hint: 'Enter your full name.',
    description: 'Your first and last name.',
  },
  {
    id: 'pronouns',
    label: `Pronouns`,
    type: 'text',
    required: false,
    hint: 'e.g., she/her, they/them',
    description: 'Your preferred pronouns.',
  },
  {
    id: 'student_id',
    label: `Student ID Number`,
    type: 'text',
    required: true,
    hint: 'e.g., 1001234567',
    description: 'Your student identification number.',
  },
  {
    id: 'university',
    label: `University/Institution`,
    type: 'text',
    required: true,
    hint: 'e.g., University of Toronto',
    description: 'The institution you attend.',
  },
  {
    id: 'academic_year',
    label: `Current Academic Year`,
    type: 'single-select',
    required: true,
    options: ["1st Year","2nd Year","3rd Year","4th Year","Graduate Student","Other"],
    hint: 'Select your current year.',
    description: 'Your current academic year level.',
  },
  {
    id: 'program',
    label: `Program of Study`,
    type: 'text',
    required: true,
    hint: 'e.g., Philosophy Specialist',
    description: 'Your primary program(s) of study.',
  },
  {
    id: 'philosophy_coursework',
    label: `Relevant Philosophy Coursework (Optional)`,
    type: 'textarea', // Changed from 'paragraph'
    required: false,
    hint: 'List relevant courses.',
    description: 'List any philosophy courses you have taken or are currently taking.',
  },
  {
    id: 'philosophy_interests',
    label: `Areas of Philosophical Interest (Optional)`,
    type: 'textarea', // Changed from 'paragraph'
    required: false,
    hint: 'e.g., ethics, metaphysics',
    description: 'Briefly describe your main interests in philosophy.',
  },
  {
    id: 'event_expectations',
    label: `What do you hope to gain from participating in the Philosothon?`,
    type: 'textarea', // Changed from 'paragraph'
    required: true,
    hint: 'e.g., Discuss ideas, meet peers...',
    description: 'Your goals for participating.',
  },
  {
    id: 'attendance_preference',
    label: `Attendance Preference`,
    type: 'single-select',
    required: true,
    options: ["In-Person","Online","Hybrid (Mix of Both)"],
    hint: 'Select your preference.',
    description: 'How you plan to attend the event.',
  },
  {
    id: 'workshop_preference',
    label: `Workshop Preference (Rank Top 3 if applicable)`,
    type: 'ranked-choice-numbered', // Changed from 'ranking-numbered'
    required: false,
    hint: 'Rank your top 3.',
    description: 'Indicate your preferred workshops.',
  },
  {
    id: 'dietary_restrictions',
    label: `Dietary Restrictions or Allergies (if attending in-person)`,
    type: 'textarea', // Changed from 'paragraph'
    required: false,
    hint: 'e.g., Vegetarian, Gluten-Free',
    description: 'Any dietary needs for in-person attendance.',
    dependsOn: 'attendance_preference',
    dependsValue: "In-Person",
  },
  {
    id: 'accessibility_needs',
    label: `Accessibility Needs (Optional)`,
    type: 'textarea', // Changed from 'paragraph'
    required: false,
    hint: 'Let us know any requirements.',
    description: 'Any accessibility requirements you may have.',
  },
  {
    id: 'code_of_conduct_agreement',
    label: `I agree to abide by the event\'s Code of Conduct.`,
    type: 'boolean',
    required: true,
    hint: 'Confirm agreement.',
    description: 'Agreement to the Code of Conduct.',
  },
  {
    id: 'photo_consent',
    label: `I consent to potentially being photographed or recorded during the event for promotional purposes.`,
    type: 'boolean',
    required: true,
    hint: 'Confirm consent.',
    description: 'Consent for photography/recording.',
  },
  {
    id: 'data_privacy_consent',
    label: `I consent to the storage and processing of my registration data as described in the Privacy Policy.`,
    type: 'boolean',
    required: true,
    hint: 'Confirm consent.',
    description: 'Consent for data processing.',
  }
  // NOTE: This mock uses the OUTDATED 17 questions from registrationQuestions.ts
  // It does NOT reflect the 31 questions or types from the V3 spec.
  // This is only to fix TS errors temporarily.
];
// REMOVED outdated mock for registrationQuestions
// vi.mock('../data/registrationQuestions', () => ({
//   questions: mockQuestions,
// }));

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


// Skip the old V2 tests for now
describe.skip('RegistrationForm (Outdated V2 Tests)', () => {

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
    // Add spy for fetchRegistration if needed for view/edit

    // Reset mock implementations and set default resolved values
    mockSubmitRegistration.mockResolvedValue({ success: true, message: 'Submitted' });
    mockUpdateRegistration.mockResolvedValue({ success: true, message: 'Updated' });
    mockDeleteRegistration.mockResolvedValue({ success: true, message: 'Deleted' });
    mockSignInWithPassword.mockResolvedValue({ success: true, message: 'Signed in' });
    mockSignUpUser.mockResolvedValue({ success: true, message: 'User created', userId: 'mock-user-id' });
    mockSignOut.mockResolvedValue({ success: true, message: 'Signed out' });
    mockRequestPasswordReset.mockResolvedValue({ success: true, message: 'Reset email sent' });
    mockFetchRegistration.mockResolvedValue({ /* mock registration data */ }); // Mock for view/edit

    // Reset other mocks
    mockGetUser.mockReset().mockResolvedValue({ data: { user: null }, error: null });
    mockGetSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  });

  afterEach(() => {
      vi.restoreAllMocks();
  });

  it('FAIL: should render boot sequence and transition to main mode (guest)', async () => {
    render(<RegistrationForm />);
    // This test might pass if the basic structure is there, but we need V3 specifics
    expect(screen.getByText(/Initializing Terminal v3.0.../i)).toBeInTheDocument(); // V3 Check
    expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
    expect(screen.getByText(/Type 'help' for available commands./i)).toBeInTheDocument();
    // Check for V3 specific commands in help hint
    expect(screen.getByText(/register/i)).toBeInTheDocument();
    expect(screen.getByText(/sign-in/i)).toBeInTheDocument();
  });

  describe('Main Mode (Anonymous)', () => {
    it('FAIL: should display guest prompt and initial commands via help', async () => {
      render(<RegistrationForm />);
      expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
      await enterInput('help');
      // Check V3 commands are listed
      expect(await screen.findByText(/register \[new\|continue]/i)).toBeInTheDocument(); // V3 format
      expect(screen.getByText(/sign-in/i)).toBeInTheDocument();
      expect(screen.getByText(/about/i)).toBeInTheDocument();
      expect(screen.queryByText(/continue/i)).not.toBeInTheDocument(); // Should not show continue initially
    });

    it('FAIL: should show "continue" command in help if local data exists', async () => {
       mockLocalStorageStore['philosothon-registration-v3'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 1, formData: { email: 'local@test.com' }})).toString('base64');
       render(<RegistrationForm />);
       expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
       await enterInput('help');
       expect(await screen.findByText(/register \[new\|continue]/i)).toBeInTheDocument();
       expect(screen.getByText(/continue/i)).toBeInTheDocument(); // Check continue is visible
    });

    it('FAIL: should show status line if local registration data exists', async () => {
       mockLocalStorageStore['philosothon-registration-v3'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 5, formData: { email: 'local@test.com' }})).toString('base64');
       render(<RegistrationForm />);
       expect(await screen.findByText(/Registration in progress found. Use 'register continue' to resume./i)).toBeInTheDocument();
    });

    it('FAIL: should switch to Auth Mode on "sign-in" command', async () => {
      render(<RegistrationForm />);
      expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
      await enterInput('sign-in');
      expect(await screen.findByText(/\[auth]>/)).toBeInTheDocument(); // V3 prompt
      expect(screen.getByText(/Enter email:/i)).toBeInTheDocument();
    });

    it('FAIL: should show register sub-menu on "register" command', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register');
        expect(await screen.findByText(/Usage: register \[new\|continue]/i)).toBeInTheDocument();
        expect(screen.getByText(/new\s+- Start a new registration/i)).toBeInTheDocument();
        expect(screen.queryByText(/continue\s+- Continue an existing registration/i)).not.toBeInTheDocument(); // No local data
        expect(screen.getByText(/back\s+- Return to main menu/i)).toBeInTheDocument();
    });

    it('FAIL: should start new registration, show intro, and prompt for Name on "register new"', async () => {
      render(<RegistrationForm />);
      expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
      await enterInput('register new');
      // Check for intro text
      expect(await screen.findByText(/Welcome to the Philosothon registration form!/i)).toBeInTheDocument();
      expect(await screen.findByText(/April 26-27, 2025/i)).toBeInTheDocument();
      // Check for first question prompt (Name - Q1)
      expect(await screen.findByText(/\[registration]>/)).toBeInTheDocument(); // V3 prompt
      expect(screen.getByText(/Full Name/i)).toBeInTheDocument(); // Q1
      expect(mockLocalStorageStore['philosothon-registration-v3']).toBeUndefined(); // Should clear storage
    });

     it('FAIL: should warn before overwriting local data on "register new"', async () => {
        mockLocalStorageStore['philosothon-registration-v3'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 1, formData: { email: 'old@test.com' }})).toString('base64');
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register new');
        expect(await screen.findByText(/Existing registration data found. Starting new will overwrite it. Proceed\? \(yes\/no\)/i)).toBeInTheDocument();
        // Should not proceed yet
        expect(screen.queryByText(/Full Name/i)).not.toBeInTheDocument();
        await enterInput('yes');
        // Now should proceed
        expect(await screen.findByText(/Full Name/i)).toBeInTheDocument();
        expect(mockLocalStorageStore['philosothon-registration-v3']).toBeUndefined(); // Storage cleared
     });

     it('FAIL: should resume registration from correct index on "register continue"', async () => {
        const initialData = { currentQuestionIndex: 5, formData: { fullName: 'Test', email: 'a@b.c', password: 'set', confirmPassword: 'set', yearOfStudy: 'Second year' } }; // Index 5 = Q5 (philosophyCourses)
        mockLocalStorageStore['philosothon-registration-v3'] = Buffer.from(JSON.stringify(initialData)).toString('base64');
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register continue');
        // Should show previous answers visually (hard to test precisely without seeing output structure)
        // Check it resumes at Q5
        expect(await screen.findByText(/Philosophy courses completed/i)).toBeInTheDocument(); // Q5
        expect(await screen.findByText(/\[registration]>/)).toBeInTheDocument();
     });

     it('FAIL: should show error on "register continue" if no local data exists', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register continue');
        expect(await screen.findByText(/No registration in progress found. Use 'register new'./i)).toBeInTheDocument();
        expect(screen.queryByText(/\[registration]>/)).not.toBeInTheDocument();
     });

  });

  describe('Registration Mode (V3 Flow)', () => {
     it('FAIL: should prompt for Name (Q1) first', async () => {
       render(<RegistrationForm />);
       await enterInput('register new');
       expect(await screen.findByText(/Full Name/i)).toBeInTheDocument(); // Q1
       expect(await screen.findByText(/\[registration]>/)).toBeInTheDocument();
     });

     it('FAIL: should prompt for Email (Q2) after Name', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Answer Q1
        expect(await screen.findByText(/University Email Address/i)).toBeInTheDocument(); // Q2
     });

     it('FAIL: should prompt for Password after Email', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Q1
        await enterInput('test@example.com'); // Q2
        expect(await screen.findByText(/^Password:/i)).toBeInTheDocument(); // Q2.1
        const input = await screen.findByRole('textbox');
        expect(input).toHaveAttribute('type', 'password');
     });

     it('FAIL: should prompt for Confirm Password after Password', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Q1
        await enterInput('test@example.com'); // Q2
        await enterInput('password123'); // Q2.1
        expect(await screen.findByText(/Confirm Password:/i)).toBeInTheDocument(); // Q2.2
        const input = await screen.findByRole('textbox');
        expect(input).toHaveAttribute('type', 'password');
     });

     it('FAIL: should show validation error for non-matching passwords', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Q1
        await enterInput('test@example.com'); // Q2
        await enterInput('password123'); // Q2.1
        await enterInput('password456'); // Q2.2 (Mismatch)
        expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
        // Should remain at confirm password step
        expect(screen.getByText(/Confirm Password:/i)).toBeInTheDocument();
     });

     it('FAIL: should show validation error for short password', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Q1
        await enterInput('test@example.com'); // Q2
        await enterInput('pass'); // Q2.1 (Too short)
        expect(await screen.findByText(/Password must be at least 8 characters long/i)).toBeInTheDocument();
        // Should remain at password step
        expect(screen.getByText(/^Password:/i)).toBeInTheDocument();
     });

     it('FAIL: should call signUpUser action after password confirmation', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Q1
        await enterInput('test@example.com'); // Q2
        await enterInput('password123'); // Q2.1
        await enterInput('password123'); // Q2.2
        await waitFor(() => {
            expect(mockSignUpUser).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
        });
     });

     it('FAIL: should proceed to Year of Study (Q3) after successful signUpUser', async () => {
        mockSignUpUser.mockResolvedValue({ success: true, userId: 'mock-id' });
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Q1
        await enterInput('test@example.com'); // Q2
        await enterInput('password123'); // Q2.1
        await enterInput('password123'); // Q2.2
        expect(await screen.findByText(/Year of Study/i)).toBeInTheDocument(); // Q3
        expect(await screen.findByText(/\[registration]>/)).toBeInTheDocument();
     });

     it('FAIL: should handle multi-select-numbered input (space-separated)', async () => {
        // Navigate to Q8 (familiarTraditions)
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Q1
        await enterInput('test@example.com'); // Q2
        await enterInput('password123'); // Q2.1
        await enterInput('password123'); // Q2.2 -> Q3
        await enterInput('1'); // Q3 -> Q4
        await enterInput('Comp Sci'); // Q4 -> Q5
        await enterInput('PHL100'); // Q5 -> Q6
        await enterInput('5'); // Q6 -> Q7
        await enterInput('6'); // Q7 -> Q8 (Familiar Traditions)

        expect(await screen.findByText(/Which philosophical traditions are you most familiar with\?/i)).toBeInTheDocument();
        expect(screen.getByText(/Enter numbers separated by spaces/i)).toBeInTheDocument(); // Hint
        expect(screen.getByText(/1: Analytic philosophy/i)).toBeInTheDocument();
        expect(screen.getByText(/2: Continental philosophy/i)).toBeInTheDocument();

        await enterInput('1 3 5'); // Select Analytic, Ancient, Modern

        // Check local storage (deobfuscated)
        await waitFor(() => {
            const storedData = JSON.parse(Buffer.from(mockLocalStorageStore['philosothon-registration-v3'], 'base64').toString('utf-8'));
            expect(storedData.formData.familiarTraditions).toEqual(['Analytic philosophy', 'Ancient philosophy', 'Modern philosophy']);
        });
        // Check it moved to next question (Q9)
        expect(await screen.findByText(/Areas of philosophical interest/i)).toBeInTheDocument();
     });

     it('FAIL: should handle ranking-numbered input (comma-separated, min 3)', async () => {
        // Navigate to Q18 (themeRanking)
        render(<RegistrationForm />);
        // ... sequence of inputs to reach Q18 ...
        await enterInput('register new');
        // ... (Q1-Q17 inputs) ...
        // Assume we are now at Q18
        // Need to mock the state to be at Q18 for a focused test
        const initialData = { currentQuestionIndex: 17, formData: { /* ... previous answers ... */ } }; // Index 17 = Q18
        mockLocalStorageStore['philosothon-registration-v3'] = Buffer.from(JSON.stringify(initialData)).toString('base64');
        render(<RegistrationForm />);


        expect(await screen.findByText(/Please rank the following potential themes/i)).toBeInTheDocument(); // Q18
        expect(screen.getByText(/Enter comma-separated numbers for your top ranks \(e.g., `3,1,4`\). Rank at least 3./i)).toBeInTheDocument(); // Hint
        expect(screen.getByText(/1: Minds and Machines/i)).toBeInTheDocument();
        expect(screen.getByText(/2: Digital Commons/i)).toBeInTheDocument();

        // Test validation: less than 3 ranks
        await enterInput('1,2');
        expect(await screen.findByText(/Please rank at least 3 options/i)).toBeInTheDocument();
        expect(screen.getByText(/Please rank the following potential themes/i)).toBeInTheDocument(); // Still at Q18

        // Test validation: non-unique ranks
        await enterInput('1,2,1');
        expect(await screen.findByText(/Please enter unique numbers/i)).toBeInTheDocument();
        expect(screen.getByText(/Please rank the following potential themes/i)).toBeInTheDocument(); // Still at Q18

        // Test valid input
        await enterInput('3,1,4'); // Rank Algo Gov, Minds, Singularity

        // Check local storage (deobfuscated)
        await waitFor(() => {
            const storedData = JSON.parse(Buffer.from(mockLocalStorageStore['philosothon-registration-v3'], 'base64').toString('utf-8'));
            // Stored as array of ranked option *values* (strings)
            expect(storedData.formData.themeRanking).toEqual([
                'Algorithmic Governance: Authority Without Autonomy?',
                'Minds and Machines: Consciousness Beyond the Human',
                'Technological Singularity: Philosophical Implications of Superintelligence'
            ]);
        });
        // Check it moved to next question (Q19 or Q20 if Q18 didn't select 'Other')
        expect(await screen.findByText(/If you wrote "Other" in the previous question/i)).toBeInTheDocument(); // Q19
     });

     it('FAIL: should handle "back" command correctly', async () => {
        // Navigate to Q4 (programMajors)
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test User'); // Q1 -> Q2
        await enterInput('test@example.com'); // Q2 -> Q2.1
        await enterInput('password123'); // Q2.1 -> Q2.2
        await enterInput('password123'); // Q2.2 -> Q3 (Year)
        await enterInput('1'); // Q3 -> Q4 (Program)

        expect(await screen.findByText(/Program\/Major\(s\)/i)).toBeInTheDocument(); // At Q4

        await enterInput('back');

        // Should be back at Q3 (Year of Study)
        expect(await screen.findByText(/Year of Study/i)).toBeInTheDocument();
        // Check local storage: Q3 answer should be removed
        await waitFor(() => {
            const storedData = JSON.parse(Buffer.from(mockLocalStorageStore['philosothon-registration-v3'], 'base64').toString('utf-8'));
            expect(storedData.formData.yearOfStudy).toBeUndefined();
            expect(storedData.currentQuestionIndex).toBe(2); // Index for Q3
        });
     });

     it('FAIL: should show message on "back" at first question (Name)', async () => {
        render(<RegistrationForm />);
        await enterInput('register new');
        expect(await screen.findByText(/Full Name/i)).toBeInTheDocument(); // At Q1
        await enterInput('back');
        expect(await screen.findByText(/Cannot go back further./i)).toBeInTheDocument();
        expect(screen.getByText(/Full Name/i)).toBeInTheDocument(); // Still at Q1
     });

     it('FAIL: should show completion options after last question (Q31)', async () => {
        // Navigate to Q31 (Confirmation)
        render(<RegistrationForm />);
        // ... sequence of inputs to reach Q31 ...
        const initialData = { currentQuestionIndex: 30, formData: { /* ... previous answers ... */ } }; // Index 30 = Q31
        mockLocalStorageStore['philosothon-registration-v3'] = Buffer.from(JSON.stringify(initialData)).toString('base64');
        render(<RegistrationForm />);

        expect(await screen.findByText(/By submitting this form, I confirm/i)).toBeInTheDocument(); // Q31
        await enterInput('1'); // Answer Q31 ('I confirm')

        expect(await screen.findByText(/Registration questions complete./i)).toBeInTheDocument();
        // Check for completion commands in help
        await enterInput('help');
        expect(await screen.findByText(/submit\s+- Submit your registration/i)).toBeInTheDocument();
        expect(screen.getByText(/review\s+- Review your answers/i)).toBeInTheDocument();
        expect(screen.getByText(/edit \[number]\s+- Edit answer for question number/i)).toBeInTheDocument();
        expect(screen.getByText(/back\s+- Go back to the last question/i)).toBeInTheDocument(); // Should allow going back from summary
     });

     it('FAIL: should call submitRegistration action on "submit" after completion', async () => {
        // Navigate to completion state
        render(<RegistrationForm />);
        // ... sequence of inputs to reach completion ...
        const completedData = { currentQuestionIndex: 31, formData: { /* ... all 31 answers ... */ fullName: 'Submit User' } }; // Index 31 = completed
        mockLocalStorageStore['philosothon-registration-v3'] = Buffer.from(JSON.stringify(completedData)).toString('base64');
        render(<RegistrationForm />);

        expect(await screen.findByText(/Registration questions complete./i)).toBeInTheDocument();
        await enterInput('submit');

        await waitFor(() => {
            // Check that the action was called with the formData
            expect(mockSubmitRegistration).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Submit User' }));
        });
        // Check for success message / transition back to main? (Depends on action result/redirect)
        // expect(await screen.findByText(/Registration submitted successfully!/i)).toBeInTheDocument();
     });

  });

  describe('Auth Mode (V3)', () => {
     it('FAIL: should prompt for email and password (masked)', async () => {
       render(<RegistrationForm />);
       await enterInput('sign-in');
       expect(await screen.findByText(/Enter email:/i)).toBeInTheDocument();
       await enterInput('test@example.com');
       expect(await screen.findByText(/Enter password:/i)).toBeInTheDocument();
       expect(await screen.findByText(/\[auth]>/)).toBeInTheDocument();
       const input = await screen.findByRole('textbox');
       expect(input).toHaveAttribute('type', 'password');
     });

     it('FAIL: should call signInWithPassword action on submission', async () => {
       render(<RegistrationForm />);
       await enterInput('sign-in');
       await enterInput('test@example.com');
       await enterInput('password123');
       await waitFor(() => {
            expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
       });
     });

     it('FAIL: should switch to Main Mode (authenticated) on successful sign-in', async () => {
       mockSignInWithPassword.mockResolvedValue({ success: true, message: 'Signed in' });
       // Mock session/user data retrieval after successful sign-in
       mockGetSession.mockResolvedValue({ data: { session: { user: { email: 'test@example.com', id: 'user-id' } } }, error: null });
       mockGetUser.mockResolvedValue({ data: { user: { email: 'test@example.com', id: 'user-id' } }, error: null });

       render(<RegistrationForm />);
       await enterInput('sign-in');
       await enterInput('test@example.com');
       await enterInput('password123');

       // Check for authenticated prompt
       expect(await screen.findByText(/\[test@example.com@philosothon]\$/)).toBeInTheDocument(); // V3 authenticated prompt
       // Check status line update
       expect(await screen.findByText(/Signed in as test@example.com./i)).toBeInTheDocument();
     });

     it('FAIL: should show error and stay in Auth Mode on failed sign-in', async () => {
       mockSignInWithPassword.mockResolvedValue({ success: false, message: 'Invalid credentials' });
       render(<RegistrationForm />);
       await enterInput('sign-in');
       await enterInput('test@example.com');
       await enterInput('wrongpassword');

       expect(await screen.findByText(/Authentication failed: Invalid credentials/i)).toBeInTheDocument();
       expect(await screen.findByText(/\[auth]>/)).toBeInTheDocument(); // Still in Auth mode
       expect(screen.getByText(/Enter email:/i)).toBeInTheDocument(); // Ready for next attempt
     });

     // Add tests for magiclink, reset-password, exit commands in Auth Mode
  });

  describe('Main Mode (Authenticated)', () => {
      beforeEach(() => {
          // Mock authenticated state
          mockGetSession.mockResolvedValue({ data: { session: { user: { email: 'auth@example.com', id: 'auth-user-id' } } }, error: null });
          mockGetUser.mockResolvedValue({ data: { user: { email: 'auth@example.com', id: 'auth-user-id' } }, error: null });
          // Mock registration status (e.g., complete)
          // This might require mocking a fetch call or assuming status is passed via props/context
          // For now, assume complete for testing commands
      });

      it('FAIL: should display authenticated prompt and commands via help', async () => {
          render(<RegistrationForm />);
          expect(await screen.findByText(/\[auth@example.com@philosothon]\$/)).toBeInTheDocument();
          await enterInput('help');
          // Check V3 authenticated commands
          expect(await screen.findByText(/view\s+- View your registration/i)).toBeInTheDocument();
          expect(screen.getByText(/edit\s+- Edit your registration/i)).toBeInTheDocument();
          expect(screen.getByText(/delete\s+- Delete your registration/i)).toBeInTheDocument();
          expect(screen.getByText(/sign-out/i)).toBeInTheDocument();
          expect(screen.getByText(/about/i)).toBeInTheDocument();
      });

      it('FAIL: should call signOut action and return to guest mode on "sign-out"', async () => {
          render(<RegistrationForm />);
          expect(await screen.findByText(/\[auth@example.com@philosothon]\$/)).toBeInTheDocument();
          await enterInput('sign-out');
          await waitFor(() => {
              expect(mockSignOut).toHaveBeenCalled();
          });
          // Check for guest prompt
          expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
      });

      it('FAIL: should enter Registration Mode for editing on "edit" command', async () => {
          // Mock fetching existing registration data
          mockFetchRegistration.mockResolvedValue({ data: [{ id: 'reg-id', user_id: 'auth-user-id', full_name: 'Existing User', /* other fields */ }], error: null });
          render(<RegistrationForm />);
          expect(await screen.findByText(/\[auth@example.com@philosothon]\$/)).toBeInTheDocument();
          await enterInput('edit');
          // Should fetch data, then enter registration mode
          // await waitFor(() => expect(mockFetchRegistration).toHaveBeenCalled()); // Need to refine mock setup
          expect(await screen.findByText(/\[registration]>/)).toBeInTheDocument();
          // Should likely start in a review state or at the first question for editing
          expect(await screen.findByText(/Review your answers or use 'edit \[number]' to change one./i)).toBeInTheDocument();
      });

       it('FAIL: should call deleteRegistration action after confirmations on "delete" command', async () => {
          render(<RegistrationForm />);
          expect(await screen.findByText(/\[auth@example.com@philosothon]\$/)).toBeInTheDocument();
          await enterInput('delete');
          expect(await screen.findByText(/Are you sure\? This cannot be undone./i)).toBeInTheDocument();
          await enterInput('yes'); // First confirmation
          expect(await screen.findByText(/Type 'DELETE' to confirm./i)).toBeInTheDocument();
          await enterInput('DELETE'); // Final confirmation
          await waitFor(() => {
              expect(mockDeleteRegistration).toHaveBeenCalled();
          });
          // Check for confirmation message or state change
          expect(await screen.findByText(/Registration deleted./i)).toBeInTheDocument();
       });

      // Add tests for 'view' command
  });

  // Add tests for SSOT script generation (separate file: generate-registration.test.ts)
  // Add tests for Auth actions (separate file: auth/actions.test.ts)
  // Add tests for Registration actions (separate file: register/actions.test.ts)

});

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

    it('SUBSET 1: should render initial V3 boot sequence and guest prompt', async () => {
        render(<RegistrationForm />);
        // Check for V3 boot text if applicable, or just the final prompt
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        expect(screen.getByText(/Type 'help' for available commands./i)).toBeInTheDocument();
    });

    it('SUBSET 1: should display correct commands in help for anonymous user', async () => {
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

    it('SUBSET 1: should display "about" information', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('about');
        expect(await screen.findByText(/Philosothon Event Platform v2/i)).toBeInTheDocument(); // Basic check
    });

    it('SUBSET 1: should show status line indicating no local data initially', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        // Check the status line element if it has a specific role or test id
        // For now, check it doesn't show the "in progress" message
        expect(screen.queryByText(/Registration in progress found/i)).not.toBeInTheDocument();
    });

    it('SUBSET 1: should show status line indicating local data exists', async () => {
       mockLocalStorageStore['philosothon-registration-v3.1'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 5, formData: { email: 'local@test.com' }})).toString('base64');
       render(<RegistrationForm />);
       expect(await screen.findByText(/Registration in progress found. Use 'register continue' to resume./i)).toBeInTheDocument();
    });

    it('SUBSET 1: should show register sub-menu on "register" command', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register');
        expect(await screen.findByText(/Usage: register \[new\|continue]/i)).toBeInTheDocument();
        expect(screen.getByText(/new\s+- Start a new registration/i)).toBeInTheDocument();
        expect(screen.queryByText(/continue\s+- Continue an existing registration/i)).not.toBeInTheDocument(); // No local data
        expect(screen.getByText(/back\s+- Return to main menu/i)).toBeInTheDocument();
    });

    it('SUBSET 1: should show "continue" in register sub-menu if local data exists', async () => {
       mockLocalStorageStore['philosothon-registration-v3.1'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 1, formData: { email: 'local@test.com' }})).toString('base64');
       render(<RegistrationForm />);
       expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
       await enterInput('register');
       expect(await screen.findByText(/Usage: register \[new\|continue]/i)).toBeInTheDocument();
       expect(screen.getByText(/continue\s+- Continue an existing registration/i)).toBeInTheDocument(); // Should be visible now
    });

    it('SUBSET 1: should show V3.1 intro and prompt for First Name (Q1a) on "register new"', async () => {
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

    it('SUBSET 1: should warn before overwriting local data on "register new"', async () => {
        mockLocalStorageStore['philosothon-registration-v3.1'] = Buffer.from(JSON.stringify({ currentQuestionIndex: 1, formData: { email: 'old@test.com' }})).toString('base64');
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

    it('SUBSET 1: should show error on "register continue" if no local data exists', async () => {
        render(<RegistrationForm />);
        expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
        await enterInput('register continue');
        expect(await screen.findByText(/No registration in progress found. Use 'register new'./i)).toBeInTheDocument();
        expect(screen.queryByText(/^> $/)).not.toBeInTheDocument(); // Should not enter registration mode
     });

    it('SUBSET 1: should resume registration from correct index on "register continue"', async () => {
        // Assume Q1a, Q1b, Q2, PW, ConfirmPW are done. Next is Q3 (Pronouns). Index = 5 (0-based)
        const initialData = { currentQuestionIndex: 5, formData: { firstName: 'Test', lastName: 'User', email: 'a@b.c', password: 'set', confirmPassword: 'set' } };
        mockLocalStorageStore['philosothon-registration-v3.1'] = Buffer.from(JSON.stringify(initialData)).toString('base64');
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

    it('SUBSET 1: should proceed through early auth flow (Q1a -> Q1b -> Q2 -> PW -> Confirm -> signUpUser -> Q3)', async () => {
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
            const storedData = JSON.parse(Buffer.from(mockLocalStorageStore['philosothon-registration-v3.1'], 'base64').toString('utf-8'));
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

    it('SUBSET 1: should show validation error for invalid email format', async () => {
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

    it('SUBSET 1: should show validation error for non-matching passwords', async () => {
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

    it('SUBSET 1: should show validation error for short password', async () => {
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

    it('SUBSET 1: should show error and stay at password step if signUpUser fails', async () => {
        mockSignUpUser.mockResolvedValue({ success: false, message: 'User already exists' });
        render(<RegistrationForm />);
        await enterInput('register new');
        await enterInput('Test'); // Q1a
        await enterInput('User'); // Q1b
        await enterInput('existing@test.com'); // Q2
        await enterInput('password123'); // Q2.1
        await enterInput('password123'); // Q2.2

        // Check signUpUser was called
        await waitFor(() => {
            expect(mockSignUpUser).toHaveBeenCalledWith({ email: 'existing@test.com', password: 'password123' });
        });

        // Check error message is displayed
        expect(await screen.findByText(/Error: User already exists/i)).toBeInTheDocument();
        // Should remain at confirm password step (or maybe password step?) - Let's assume confirm PW
        expect(screen.getByText(/Confirm Password:/i)).toBeInTheDocument();
     });

    it('SUBSET 1: should switch to Auth Mode on "sign-in" command', async () => {
      render(<RegistrationForm />);
      expect(await screen.findByText(/\[guest@philosothon]\$/)).toBeInTheDocument();
      await enterInput('sign-in');
      expect(await screen.findByText(/\[auth]>/)).toBeInTheDocument(); // V3.1 prompt
      expect(screen.getByText(/Enter email:/i)).toBeInTheDocument();
    });

    // --- End Subset 1 Tests ---

});
