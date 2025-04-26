# Specification Writer Specific Memory

### Feature: RegistrationDialog Testing Strategy (Layered)
- Added: [2025-04-25 20:26:18]
- Description: Implement a layered testing strategy for the XState `RegistrationDialog` involving machine unit tests (`@xstate/test`), component integration tests (RTL/Vitest with mocked `useMachine`), SSOT for messages, and refactoring.
- Acceptance criteria: 1. Machine logic tested via `@xstate/test`. 2. Component integration tested via RTL/Vitest with mocks. 3. SSOT for messages implemented and used. 4. Machine/Component refactored for testability.
- Dependencies: `@xstate/test`, Vitest, RTL, `docs/adr/2025-04-25-registration-testing-strategy.md`.
- Status: Specified


### Pseudocode: SSOT Structure (`registrationMessages.ts`)
- Created: [2025-04-25 20:26:18]
```typescript
// platform/src/config/registrationMessages.ts
export const registrationMessages = {
  dialogHeader: "Registration Mode",
  prompts: { /* ... */ },
  intro: { /* ... */ },
  earlyAuth: { /* ... */ },
  awaitingConfirmation: { /* ... */ },
  questioning: { /* ... */ },
  commands: { /* ... */ },
  validationErrors: { /* ... */ },
  // ... other categories
} as const;
```
#### TDD Anchors:
- Test importability.
- Test specific key values.
- Test message formatting/interpolation.


### Pseudocode: Extracted Machine Logic (Example)
- Created: [2025-04-25 20:26:18]
```typescript
// Outside createMachine
function validateInput(input: string, question: Question): { isValid: boolean; errorKey?: string; context?: object } { /* ... */ }
function shouldSkipQuestion(question: Question, formData: object): boolean { /* ... */ }

// Inside createMachine actions/guards
validateAnswer: assign((ctx, event) => { /* ... call validateInput ... */ });
isNextQuestionSkippable: (ctx) => { /* ... call shouldSkipQuestion ... */ };
```
#### TDD Anchors:
- Test extracted validation functions independently.
- Test extracted skip logic function independently.


### Pseudocode: Machine Async Operation (`invoke` Example)
- Created: [2025-04-25 20:26:18]
```typescript
// Outside createMachine
async function signUpService(context, event) { /* ... call server action, handle results/errors ... */ }

// Inside createMachine state
signingUp: {
  invoke: {
    id: 'signUpServiceInvoke',
    src: signUpService,
    onDone: [ /* ... handle success states ... */ ],
    onError: { /* ... handle error state ... */ }
  }
}
```
#### TDD Anchors:
- (Covered by Machine Unit Tests)


### Pseudocode: Machine Unit Test (`@xstate/test` Example)
- Created: [2025-04-25 20:26:18]
```typescript
import { createTestMachine } from '@xstate/test';
import { registrationDialogMachine } from './registrationDialogMachine';

const mockSignUpService = vi.fn().mockResolvedValue({ status: 'success' });
const machineWithMocks = registrationDialogMachine.withConfig({ services: { signUpService: mockSignUpService } });
const testMachine = createTestMachine(machineWithMocks);

it('should transition correctly on EVENT', () => {
  const nextState = testMachine.transition('currentState', { type: 'EVENT' });
  expect(nextState.matches('expectedState')).toBe(true);
  expect(nextState.context.someValue).toBe('expected');
});

it('should call mocked service', () => {
  testMachine.transition('stateBeforeService', { type: 'TRIGGER_SERVICE' });
  expect(mockSignUpService).toHaveBeenCalled();
});
```
#### TDD Anchors:
- Test specific transitions.
- Test context updates.
- Test guard logic.
- Test action/service calls (mocked).
- Test path coverage (`testModel`).


### Pseudocode: Component Integration Test Helpers (RTL/Vitest)
- Created: [2025-04-25 20:26:18]
```typescript
import { render } from '@testing-library/react';
import { mocked } from 'vitest';
import { useMachine } from '@xstate/react';

vi.mock('@xstate/react');
const mockUseMachine = mocked(useMachine);
const mockSend = vi.fn();

interface MockState { /* ... value, context, matches ... */ }

const createMockState = (value, context = {}): MockState => { /* ... */ };

const renderWithMachineState = (initialState: MockState, props = {}) => {
  mockUseMachine.mockReturnValue([initialState, mockSend, undefined as any]);
  return render(<RegistrationDialog {...props} />);
};

const getMockSend = () => mockSend;

beforeEach(() => { vi.clearAllMocks(); });
```
#### TDD Anchors:
- (Helpers support component tests)


### Pseudocode: Component Integration Test (RTL/Vitest Example)
- Created: [2025-04-25 20:26:18]
```typescript
describe('when in state "some.state"', () => {
  it('should render the correct prompt', () => {
    const state = createMockState('some.state', { promptKey: 'somePrompt' });
    renderWithMachineState(state);
    expect(screen.getByText(registrationMessages.prompts[state.context.promptKey])).toBeInTheDocument();
  });

  it('should send EVENT on input submit', () => {
    const state = createMockState('some.state');
    renderWithMachineState(state);
    const input = screen.getByRole('textbox');
    const send = getMockSend();

    fireEvent.change(input, { target: { value: 'test input' } });
    fireEvent.submit(input);

    expect(send).toHaveBeenCalledWith({ type: 'EVENT', value: 'test input' });
  });
});
```
#### TDD Anchors:
- Test rendering based on specific mock states.
- Test event dispatch (`send` call) on user interactions.
- Test `addOutputLine` calls based on mock state (optional).


### Constraint: Testing Complex Terminal UI
- Added: [2025-04-24 16:17:03]
- Description: Testing complex, asynchronous terminal UI components (like RegistrationDialog) in Vitest/JSDOM has proven challenging, particularly regarding state updates and timing (e.g., REG-TEST-TIMING-001).
- Impact: Unit test reliability may be low; requires careful test design or alternative strategies (integration tests).
- Mitigation strategy: Use robust assertion methods, `act` wrapper, investigate timing issues, consider Playwright for end-to-end flow testing.


### Constraint: Philosophical Texts Management Strategy
- Added: [2025-04-24 16:17:03]
- Description: The strategy for managing philosophical texts (Markdown vs. DB) required for the Library and Gamification AI is TBD (Spec V3 Sec 3.3.4).
- Impact: Blocks implementation of P2 features requiring text access/processing.
- Mitigation strategy: Investigate options based on Vector DB choice and processing pipeline needs. Document decision in spec.


### Constraint: Terminal File Upload Mechanism
- Added: [2025-04-24 16:17:03]
- Description: The mechanism for handling file uploads initiated via the terminal UI (Spec V3 Req 3.8.1) is undefined.
- Impact: Blocks implementation of P3 submission feature.
- Mitigation strategy: Define a secure and user-friendly approach (e.g., trigger browser dialog, link to web form). Document decision in spec.


### Feature: Core Terminal UI (Update)
- Updated: [2025-04-24 16:17:03]
- Description: Styling implementation should explicitly reference and follow `docs/style_guide.md`.


### Pseudocode: Terminal Registration - Awaiting Confirmation Mode Logic
- Created: [2025-04-21 16:33:00]
- Updated: [2025-04-21 16:33:00]
```pseudocode
// Within Awaiting Confirmation Mode

DisplayHeader("Awaiting Confirmation")
DisplayMessage("Account created. Please check your email ([user_email]) for a confirmation link. Enter 'continue' here once confirmed, or 'resend' to request a new link.")
DisplayCommandHints(['continue', 'resend', 'exit', 'help'])

LOOP:
  DisplayPrompt("[awaiting_confirmation]>")
  Await UserInput() -> command

  SWITCH command:
    CASE 'continue':
      TRY
        status = AWAIT ServerAction.checkUserVerificationStatus()
        IF status == 'confirmed':
          DisplaySuccess("Email confirmed.")
          // Transition to Registration Mode, Q3 (Year of Study)
          SetMode('Registration')
          currentQuestionIndex = GetIndexForQuestion('yearOfStudy')
          DisplayQuestion(QuestionDefinitions[currentQuestionIndex])
          BREAK LOOP
        ELSE:
          DisplayError("Email not confirmed yet. Please check your email or use 'resend'.")
      CATCH (error):
        DisplayError("Failed to check status. Please try again later.")
    CASE 'resend':
      TRY
        AWAIT ServerAction.resendConfirmationEmail()
        DisplaySuccess("Confirmation email resent to [user_email].")
      CATCH (error):
        DisplayError("Failed to resend email. Please try again later.")
    CASE 'exit':
      SetMode('Main') // Return to anonymous main mode
      BREAK LOOP
    CASE 'help':
      DisplayHelpForMode('awaiting_confirmation')
    DEFAULT:
      DisplayError("Unknown command.")
```
#### TDD Anchors:
- Test mode header and initial message display.
- Test `continue` calls backend action.
- Test `continue` transitions on success.
- Test `continue` shows error on failure.
- Test `resend` calls backend action and shows confirmation.
- Test `exit` returns to Main Mode.


### Pseudocode: Terminal Registration - Early Auth Flow (Updated for Existing User)
- Created: [2025-04-20 1:49:00]
- Updated: [2025-04-21 16:33:00]
```pseudocode
// Within Registration Mode, after 'register new' or 'register continue' (if needed)

// Step 1: Collect Name (First, Last)
// ... (as before)

// Step 2: Collect Email
// ... (as before)

// Step 3: Collect Password
// ... (as before)

// Step 4: Validate & Create/Verify User
ClientValidatePassword(password, confirmPassword) // Length >= 8, match
IF (!isValid) DisplayError("Passwords do not match or are too short."); GOTO Step 3;

TRY
  result = AWAIT ServerAction.signUpUser(email, password, firstName, lastName)

  IF (result.error == 'user_already_exists'):
    DisplayError("An account with this email already exists. Please use 'sign-in' or 'reset-password'.")
    SetMode('Main') // Return to Main Mode (anonymous)
    RETURN // Exit registration flow

  ELSE IF (result.error):
    DisplayError(result.error) // Other signup error
    GOTO Step 3 // Retry password

  ELSE IF (result.requiresConfirmation):
    // User created, needs email confirmation
    SaveToLocalStorage('userVerified', false) // Indicate confirmation needed
    SaveToLocalStorage('formData.email', email) // Store email for display
    SetMode('AwaitingConfirmation')
    // Awaiting Confirmation Mode handles the rest
    RETURN // Exit current flow step

  ELSE:
    // User created AND auto-confirmed (or confirmation not needed)
    SaveToLocalStorage('userVerified', true)
    DisplaySuccess("Account verified/created.")
    // Proceed directly to next registration question
    currentQuestionIndex = GetIndexForQuestion('yearOfStudy')
    DisplayQuestion(QuestionDefinitions[currentQuestionIndex]) // Start main question loop

CATCH (error):
  DisplayError("Failed to verify/create account. Please try again."); GOTO Step 3;

// Step 5: Proceed to next registration question (Handled within Step 4 logic now)

```
#### TDD Anchors:
- Test name collection and saving.
- Test email collection, validation, and saving.
- Test password masking and validation (length, match).
- Test `signUpUser` action call on valid password.
- **Test `signUpUser` detecting existing user displays error and returns to Main Mode.**
- Test `signUpUser` handling other errors (retry password step).
- **Test `signUpUser` requiring confirmation transitions to AwaitingConfirmation Mode.**
- **Test `signUpUser` *not* requiring confirmation proceeds directly to Q3.**
- Test local storage indicates user verification status.


### Edge Case: Registration - `signUpUser` Detects Existing User
- Identified: [2025-04-21 16:33:00]
- Scenario: During the `register new` flow, after entering email and password, the `signUpUser` backend action determines the email address already belongs to an existing user.
- Expected behavior: The action should return a specific indicator (e.g., error code 'user_already_exists'). The frontend should display an error message ("An account with this email already exists. Please use 'sign-in' or 'reset-password'."), abort the registration flow, and return the user to the Main Terminal Mode (anonymous state).
- Testing approach: Mock `signUpUser` action to return the 'user_already_exists' indicator. Verify error message display and transition back to Main Mode.



### Feature: Responsive Google Form Embed
- Added: [2025-04-18 19:20:37]
- Description: Ensure the embedded Google Form (`FormEmbed.tsx`) displays correctly across various screen sizes.
- Acceptance criteria: 1. Iframe width scales with its container (100%). 2. Container is centered (`mx-auto`). 3. Container has a max-width (`max-w-2xl`). 4. Fixed iframe height is maintained, allowing vertical page scrolling on smaller screens. 5. No horizontal scrolling *of the page* is introduced by the embed itself (iframe content might scroll internally).
- Dependencies: `platform/src/components/FormEmbed.tsx`, Tailwind CSS.
- Status: Specified


    ### Feature: Enhanced Admin Security
    - Added: [2025-04-19 03:20:00]
    - Description: Review and enhance/replace the current admin authentication mechanism (Magic Link) for improved security.
    - Acceptance criteria: 1. Chosen mechanism implemented. 2. Mechanism provides security level appropriate for admin access.
    - Dependencies: Authentication provider (e.g., Supabase Auth), potentially MFA service.
    - Status: Specified (Method TBD)

    ### Feature: Role-Based Access Control (RBAC)
    - Added: [2025-04-19 03:20:00]
    - Description: Implement distinct user roles (Admin, Judge, Applicant/Registrant, Accepted Team Member) with specific permissions controlling access to different platform sections and functionalities.
    - Acceptance criteria: 1. Roles defined in the system. 2. Permissions correctly enforced for each role (e.g., Admins manage all, Judges view submissions, Members submit, Applicants register). 3. Role assignment mechanism exists.
    - Dependencies: User management system, Authentication system, potentially middleware for route protection.
    - Status: Specified (Assignment Mechanism TBD)

    ### Feature: Built-in Registration Form
    - Added: [2025-04-19 03:20:00]
    - Description: Replace the embedded Google Form with a native platform registration form. Successful submission creates an "Applicant/Registrant" user account.
    - Acceptance criteria: 1. Registration form exists on the platform. 2. Form collects all required fields (based on v1.1 spec + TBD additions). 3. Basic validation applied (TBD specifics). 4. Successful submission creates a user account with the correct role.
    - Dependencies: UI framework, User management system, Database (for storing registration data).
    - Status: Specified (Fields/Validation TBD)

    ### Feature: Team Formation Support
    - Added: [2025-04-19 03:20:00]
    - Description: Provide functionality to sort accepted applicants into teams and notify them upon acceptance.
    - Acceptance criteria: 1. System allows grouping accepted applicants into teams. 2. Accepted applicants receive a notification (e.g., email).
    - Dependencies: User data (registration status), Notification service (e.g., email).
    - Status: Specified (Formation Method TBD, Notification Details TBD)

    ### Feature: Automated Team Introduction Email
    - Added: [2025-04-19 03:20:00]
    - Description: Automatically send an introductory email to members of a newly formed team, including member blurbs.
    - Acceptance criteria: 1. Email is triggered upon team finalization. 2. Email includes blurbs for each team member. 3. Email sent to all team members.
    - Dependencies: Team data, User data (for blurbs - source TBD), Email service.
    - Status: Specified (Blurb Source TBD)

    ### Feature: Team Naming
    - Added: [2025-04-19 03:20:00]
    - Description: Allow accepted teams to register or set their team name.
    - Acceptance criteria: 1. Mechanism exists for teams to set their name. 2. Team name is stored and associated with the team.
    - Dependencies: Team data structure, UI for name input.
    - Status: Specified (Mechanism/Timing TBD)

    ### Feature: Submission Portal
    - Added: [2025-04-19 03:20:00]
    - Description: Provide a portal accessible only to "Accepted Team Members" for uploading deliverables. Supports multiple submissions per team and sends email receipts to the whole team.
    - Acceptance criteria: 1. Portal accessible only by team members. 2. Allows file uploads (types/size TBD). 3. Handles multiple submissions (versioning/grouping TBD). 4. Any team member can submit. 5. Email receipt sent to all team members upon submission (incl. timestamp, submitter, team, filenames).
    - Dependencies: RBAC system, File storage service, Database (to track submissions), Email service.
    - Status: Specified (File Types/Size TBD, Multi-submission Handling TBD)

    ### Feature: Judge Portal
    - Added: [2025-04-19 03:20:00]
    - Description: Provide a dedicated portal for Judges to access and view/download assigned submissions.
    - Acceptance criteria: 1. Portal accessible only by Judges. 2. Displays list of assigned submissions. 3. Allows viewing/downloading submission files.
    - Dependencies: RBAC system, Submission data, File storage service.
    - Status: Specified (Filtering/Scoring/Export TBD)

    ### Feature: Gamification (Puzzle Element)
    - Added: [2025-04-19 03:20:00]
    - Description: Integrate a Cicada 3301-style puzzle element involving hidden clues and challenges within the platform.
    - Acceptance criteria: 1. Puzzle concept implemented at a high level.
    - Dependencies: TBD based on specific puzzle design.
    - Status: Specified (High-Level Concept; Access, Delivery, Location, Tracking, Goal TBD)

    ### Feature: Theme Description Expansion (AI Generation)
    - Added: [2025-04-19 03:20:00]
    - Description: Expand theme descriptions using AI generation guided by philosophy documents (via `vectorize` tool), followed by human review.
    - Acceptance criteria: 1. Process uses `vectorize` tool for draft generation. 2. Generated drafts are reviewed/edited by humans. 3. Expanded descriptions are stored (location TBD).
    - Dependencies: `vectorize` MCP tool, Philosophy documents source, Content storage mechanism, Admin review workflow.
    - Status: Specified (Method Clarified)

    ### Feature: Theme Content Storage & Management
    - Added: [2025-04-19 03:20:00]
    - Description: Provide a way for Admins to manage theme content (e.g., descriptions, associated philosophers).
    - Acceptance criteria: 1. Admin interface allows managing theme content. 2. Content is stored persistently.
    - Dependencies: Admin UI, Content storage mechanism (Markdown files or DB - TBD).
    - Status: Specified (Storage Preference TBD)

    ### Feature: Date/Schedule Management
    - Added: [2025-04-19 03:20:00]
    - Description: Provide an easy way for Admins to update key event dates and schedules displayed site-wide.
    - Acceptance criteria: 1. Mechanism exists for updating dates/schedules. 2. Updates are reflected across the site.
    - Dependencies: Admin UI or Configuration file (TBD), Frontend components displaying dates/schedules.
    - Status: Specified (Mechanism TBD)


### Feature: Terminal Registration UI V2
- Added: [2025-04-19 20:09:00]
- Description: Redesigned terminal-style UI for user registration with distinct modes (Main, Registration, Auth), command-driven interaction, local storage for progress saving, and site-wide password-based authentication (replacing Magic Link). Incorporates SSOT + Code Generation for question synchronization.
- Acceptance criteria: 1. UI implements specified modes and commands. 2. Registration flow collects email/password early, then remaining questions. 3. SSOT strategy implemented for question definition and generation. 4. Password auth works site-wide (sign-up, sign-in, reset via email link, sign-out). 5. Authenticated users can view/edit/delete their registration. 6. Local storage uses basic obfuscation.
- Dependencies: Supabase Auth (Password), Supabase DB (`registrations`, `profiles`), SSOT generation script, Frontend UI framework.
- Status: Specified (Final Draft)


### Feature: Terminal Registration UI V3.1 (Revised)
- Added: [2025-04-20 17:33:00]
- Updated: [2025-04-21 16:33:00]
- Description: Redesigned terminal-style UI for user registration incorporating structure from the latest `registration_outline.md` (36 questions, including Discord/Availability). Features distinct modes (Main, Registration, Auth, **Awaiting Confirmation**), command-driven interaction, SSOT for questions (with enhanced metadata and validation rules), site-wide password-based authentication (early First/Last Name/Email/Password collection, **handling existing users**, **email confirmation step**), local storage for progress saving (obfuscated), `back` command for corrections, conditional command visibility, flexible input handling (y/n, partial match), specific input methods for multi-select (space-separated numbers) and ranked-choice (numbered top-N), hints, and enhanced validation/error recovery.
- Acceptance criteria: 1. UI implements specified modes, commands, prompts, and colors (#39FF14 text, #FFA500 highlights). 2. Registration flow follows outline structure (Q1-36). 3. Early auth flow (FirstName->LastName->Email->Password->signUpUser) implemented, **correctly handles existing users**. 4. **Awaiting Confirmation mode functions as specified (displays message, handles `continue`/`resend`).** 5. SSOT strategy implemented (incl. outline checks, metadata warnings, `minRanked` validation). 6. Password auth works site-wide. 7. Authenticated users can view/edit/delete registration. 8. Local storage uses basic obfuscation. 9. `back` command correctly undoes last answer. 10. Flexible input and specific multi-select/ranking inputs function as specified. 11. Conditional commands display correctly. 12. Hints and validation messages (with error recovery) displayed.
- Dependencies: Supabase Auth (Password), Supabase DB (`registrations`, `profiles`), SSOT generation script, Frontend UI framework, Backend actions (`checkUserVerificationStatus`, `resendConfirmationEmail`).
- Status: Specified (Draft V3.1 Revised + Confirmation/Existing User Flow)



### Feature: Terminal Registration UI V3.1 (Revised)
- Added: [2025-04-20 17:33:00]
- Description: Redesigned terminal-style UI for user registration incorporating structure from the latest `registration_outline.md` (36 questions, including Discord/Availability). Features distinct modes (Main, Registration, Auth), command-driven interaction, SSOT for questions (with enhanced metadata and validation rules), site-wide password-based authentication (early First/Last Name/Email/Password collection), local storage for progress saving (obfuscated), `back` command for corrections, conditional command visibility, flexible input handling (y/n, partial match), specific input methods for multi-select (space-separated numbers) and ranked-choice (numbered top-N), hints, and enhanced validation/error recovery.
- Acceptance criteria: 1. UI implements specified modes, commands, prompts, and colors (#39FF14 text, #FFA500 highlights). 2. Registration flow follows outline structure (Q1-36). 3. Early auth flow (FirstName->LastName->Email->Password->signUpUser) implemented. 4. SSOT strategy implemented (incl. outline checks, metadata warnings, `minRanked` validation). 5. Password auth works site-wide. 6. Authenticated users can view/edit/delete registration. 7. Local storage uses basic obfuscation. 8. `back` command correctly undoes last answer. 9. Flexible input and specific multi-select/ranking inputs function as specified. 10. Conditional commands display correctly. 11. Hints and validation messages (with error recovery) displayed.
- Dependencies: Supabase Auth (Password), Supabase DB (`registrations`, `profiles`), SSOT generation script, Frontend UI framework.
- Status: Specified (Draft V3.1 Revised)

## Functional Requirements
### Feature: P0 Content Management (Event Info, Expanded Themes)
- Added: [2025-04-19 05:16:00]
- Description: Manage core event info (dates, schedule) via new Supabase tables (`event_details`, `schedule_items`) and admin CRUD. Manage expanded theme descriptions (Markdown) via new `description_expanded` column in `themes` table and updated admin form. Render expanded descriptions on frontend using `react-markdown`.
- Acceptance criteria: 1. New tables exist. 2. Admin UI allows CRUD for event info/schedule. 3. Admin theme form includes textarea for expanded description. 4. Theme detail page fetches and renders Markdown from `description_expanded` using `react-markdown` and `prose` styling.
- Dependencies: Supabase DB, Admin UI framework, Server Actions, `react-markdown`.
- Status: Specified (Draft)

### Feature: P0 Registration System (Built-in)
- Added: [2025-04-19 05:16:00]
- Description: Implement a multi-step registration form at `/register` for authenticated users, collecting enhanced V2 fields (Req 3.2.4). Use Server Action (`createRegistration`) for validation and saving data to extended `registrations` table in Supabase. Trigger confirmation email.
- Acceptance criteria: 1. Multi-step form exists at `/register`. 2. Form collects all specified fields with basic validation. 3. Requires authentication. 4. Server Action validates and saves data, preventing duplicates. 5. User redirected on success. 6. Confirmation email triggered.
- Dependencies: Supabase DB (`registrations` table), Supabase Auth, Server Actions, Client Components (form state), Email service.
- Status: Specified (Draft)

### Feature: P0 Authentication & RBAC
- Added: [2025-04-19 05:16:00]
- Description: Implement authentication using Supabase Magic Link and Role-Based Access Control (RBAC) using a `profiles` table linked to `auth.users` with a `role` enum (`admin`, `participant`, `judge`, `team_member`). Enforce access via Next.js Middleware and Supabase RLS.
- Acceptance criteria: 1. Magic Link login flow works. 2. Roles defined in `profiles` table (default 'participant'). 3. P0 role assignment is manual (Supabase Studio). 4. Middleware protects routes (e.g., `/admin`). 5. RLS policies restrict data access (e.g., `submissions`, `profiles`).
- Dependencies: Supabase Auth, Supabase DB (`profiles` table, RLS), Next.js Middleware.
- Status: Specified (Draft)


### Feature: Admin Section Rebuild (CRUD for Themes, Workshops, FAQs)
- Added: [2025-04-18 07:35:00]
- Description: Rebuild the admin section (/admin) to allow authenticated users (via Supabase Magic Link) to perform Create, Read, Update, and Delete operations on Themes, Workshops, and FAQ items stored in the Supabase database.
- Acceptance criteria: 1. Login via Magic Link works. 2. /admin routes are protected. 3. List views display data correctly. 4. Add forms create new items. 5. Edit forms update existing items. 6. Delete actions remove items (with confirmation). 7. Routing uses single edit pages + Server Actions.
- Dependencies: Supabase DB (themes, workshops, faq_items tables), @supabase/ssr, Next.js App Router, React.
- Status: Specified


<!-- Append new requirements using the format below -->
### Feature: RAG Markdown Optimization Script
- Added: 2025-04-17 22:57:00
- Description: A Python script that optimizes Markdown files in a specified directory for RAG (Retrieval-Augmented Generation) by simplifying citations and footnotes while preserving the references section.
- Acceptance criteria: 1. Script accepts a directory path. 2. Recursively finds all .md files. 3. Replaces `(Author, [Year](URL "Full Citation"))` with `(Author, Year)`. 4. Replaces `[Footnote N](#FnN)` with `[Footnote N]`. 5. Identifies and preserves content from "## References" (or similar heading) onwards. 6. Modifies files in-place. 7. Provides logging of processed files and errors. 8. Outputs a summary report.
- Dependencies: Python 3.x, standard libraries (os, re, logging, argparse).
- Status: Specified

### Feature: Dynamic Theme Detail Pages
- Added: 2025-04-02 12:13:26
- Description: Create dynamic pages for each theme at `/themes/[themeId]` displaying detailed information including title, description, philosopher lists (parsed from markdown), and suggested readings (from DB).
- Acceptance criteria: 1. Page exists for each theme ID. 2. Displays correct title, description, philosopher lists (Analytic/Continental), and suggested readings. 3. Handles missing themes (404). 4. Handles missing suggested readings gracefully. 5. Uses SSG (`getStaticPaths`/`getStaticProps`).
- Dependencies: `themes` table in DB (id, title, description, suggested_readings), `docs/event_info/theme_descriptions.md` file, `parseThemeMarkdown` utility.
- Status: Draft

### Feature: Theme Description Revamp
- Added: 2025-04-02 12:13:26
- Updated: 2025-04-02 12:15:44
- Description: Outline and potentially execute a process to improve theme descriptions stored in the database, ensuring the new descriptions are informed by the broader event context.
- Acceptance criteria: 1. Process documented. 2. Process includes reading relevant context docs (`docs/event_info/*.md`, `docs/project_specifications.md`), fetching current data, generating new descriptions (external step), formulating SQL UPDATEs, and executing them.
- Dependencies: Access to Supabase DB, `docs/event_info/*.md` files, `docs/project_specifications.md`, external process/tool for description generation.
- Status: Draft

### Feature: Theme Card Enhancement
- Added: 2025-04-02 12:13:26
- Description: Add a "See More Details" link to each `ThemeCard` component, pointing to the corresponding dynamic theme detail page.
- Acceptance criteria: 1. Link exists on each card. 2. Link points to the correct `/themes/[themeId]` URL.
- Dependencies: `ThemeCard.tsx` component, `theme.id` property.
- Status: Draft

### Constraint: Google Form Iframe Height
- Added: [2025-04-18 19:20:37]
- Description: The embedded Google Form iframe has a large, fixed height determined by Google. This height cannot be reliably controlled or dynamically adjusted from the parent page due to cross-origin restrictions.
- Impact: The embedding page must accommodate this fixed height, typically resulting in vertical scrolling. CSS aspect-ratio techniques are not suitable.
- Mitigation strategy: Use a container with appropriate width constraints (`w-full`, `max-w-2xl`, `mx-auto`) and allow the natural vertical scrolling of the page or a designated scrollable parent element.


    ### Constraint: AI Generation Quality (Theme Expansion)
    - Added: [2025-04-19 03:20:00]
    - Description: The quality and relevance of AI-generated theme description drafts depend heavily on the `vectorize` tool's capabilities and the quality of the source documents/prompts.
    - Impact: Generated drafts may require significant human editing or be unsuitable.
    - Mitigation strategy: Implement a robust human review and editing workflow. Refine prompts/queries used with the `vectorize` tool.

    ### Constraint: File Upload Handling (Submissions)
    - Added: [2025-04-19 03:20:00]
    - Description: Implementing file uploads requires handling storage, security (scanning, access control), potential large file sizes, and associating uploads with the correct team/submission version.
    - Impact: Complexity in backend implementation, potential storage costs, security risks if not handled properly.
    - Mitigation strategy: Use a managed file storage service (e.g., Supabase Storage, S3). Implement strict validation, security scanning, and access controls. Define clear limits (file types, size).

    ### Constraint: RBAC Implementation Complexity
    - Added: [2025-04-19 03:20:00]
    - Description: Implementing multiple roles with distinct permissions across various platform features requires careful design and consistent enforcement (e.g., in UI, API routes, database policies).
    - Impact: Potential for security vulnerabilities or incorrect access if not implemented correctly. Increased development effort.
    - Mitigation strategy: Clearly define permissions for each role. Use middleware and database Row Level Security (RLS) where appropriate. Implement thorough testing of access controls.


### Constraint: P0 Content Mgmt - Admin UI Effort
- Added: [2025-04-19 05:16:00]
- Description: Building new admin interfaces for `event_details` and `schedule_items` requires frontend development effort (forms, tables, actions).
### Constraint: Site-Wide Auth Change Impact
- Added: [2025-04-19 20:09:00]
- Description: Replacing Magic Link/OTP with password authentication site-wide requires updating not only the new registration flow but also the existing Admin login mechanism.
- Impact: Requires coordinated changes across different parts of the application (Terminal UI, Admin UI, backend actions, middleware).
- Mitigation strategy: Update Admin login flow in a separate task/branch after implementing the core password auth actions.

### Constraint: Local Storage Security (Basic Obfuscation)
- Added: [2025-04-19 20:09:00]
- Description: In-progress registration data stored in local storage requires basic obfuscation (e.g., Base64) as per P0 requirements. Sensitive data like plain text passwords should not be stored locally after initial use.
- Impact: Adds minor complexity to local storage read/write operations.
- Mitigation strategy: Implement simple reversible obfuscation function within `useLocalStorage` or wrapper.


- Impact: Increases P0 implementation time.
- Mitigation strategy: Reuse existing admin CRUD patterns and components where possible.

### Constraint: P0 Registration - Auth Requirement
- Added: [2025-04-19 05:16:00]
- Description: The specified registration flow requires users to be authenticated *before* accessing the form.
- Impact: If anonymous registration is desired later, this flow needs significant changes.
- Mitigation strategy: Confirm requirement. If anonymous needed, redesign flow (e.g., create user during registration).

### Constraint: P0 RBAC - Manual Role Assignment
- Added: [2025-04-19 05:16:00]
- Description: Assigning `admin` and `judge` roles in P0 requires manual intervention via Supabase Studio.
- Impact: Operational overhead for administrators.
- Mitigation strategy: Accept for P0. Plan for automated role assignment or admin UI for role management in future phases.


### Constraint: Terminal Input Complexity (Ranking/Multi-select)
- Added: [2025-04-20 1:49:00]
- Description: Implementing robust parsing and validation for space-separated (multi-select) and comma-separated (ranking, min 3) numeric input requires careful client-side logic.
- Impact: Increased frontend complexity, potential for user input errors if hints/validation are unclear.
- Mitigation strategy: Provide clear hints. Implement thorough validation logic (regex, range checks, uniqueness for ranking, min count for ranking). Add specific TDD anchors.

### Constraint: `back` Command State Management
- Added: [2025-04-20 1:49:00]
- Description: The `back` command needs to reliably remove the *last* saved answer from local storage and correctly identify the *previous* question, considering potential skipped questions due to dependency logic.
- Impact: Incorrect implementation could lead to data loss or incorrect navigation.
- Mitigation strategy: Maintain a history stack or carefully manage the `currentQuestionIndex` and `formData` state updates. Add specific TDD anchors for various scenarios (first question, after skipped question).

### Constraint: Conditional Command Logic
- Added: [2025-04-20 1:49:00]
- Description: Displaying commands conditionally (e.g., `continue`, `view`, `edit`, `delete`) based on local storage state or server-side authentication/registration status requires accurate state checking.
- Impact: Incorrect state checks could lead to unavailable commands or commands shown inappropriately.
- Mitigation strategy: Implement clear state checks before rendering command hints/parsing commands. Add TDD anchors for different state combinations.


## System Constraints
### Constraint: Admin Edit Page Data Fetching
- Added: [2025-04-18 07:35:00]
- Description: Single edit pages (e.g., /admin/themes/edit) rely on a query parameter (`?id=...`) passed from the list view. The page component must correctly parse this ID and fetch the corresponding data.
- Impact: Incorrect ID parsing or missing parameter will prevent editing. Requires careful linking from list views and robust handling in the edit page component.
- Mitigation strategy: Ensure list views generate correct links. Edit page Server Component should validate the ID and handle cases where data isn't found (e.g., redirect, show error).

### Constraint: Server Action State Management
- Added: [2025-04-18 07:35:00]
- Description: Client components using Server Actions rely on mechanisms like `useFormState` to receive feedback (validation errors, success/failure status).
- Impact: Without proper state handling, users won't get feedback on form submissions.
- Mitigation strategy: Consistently use `useFormState` in forms calling Server Actions. Ensure Server Actions return clear status/error objects.


<!-- Append new constraints using the format below -->
### Constraint: RAG Optimizer - References Identifier
- Added: 2025-04-17 22:57:00
- Description: The script relies on specific heading patterns (e.g., `## References`, `References\n----------`, case-insensitive) to identify the start of the references section.
- Impact: Files with differently formatted reference sections might have their references incorrectly modified.
- Mitigation strategy: Clearly document the expected patterns. Consider adding more patterns or a configuration option if needed.

### Constraint: RAG Optimizer - File Encoding
- Added: 2025-04-17 22:57:00
- Description: The script assumes UTF-8 encoding for Markdown files.
- Impact: Processing files with different encodings might lead to errors or corrupted output.
- Mitigation strategy: Default to UTF-8, log errors if decoding fails. Could add an encoding parameter as an enhancement.

### Constraint: RAG Optimizer - Performance
- Added: 2025-04-17 22:57:00
- Description: Initial pseudocode reads the entire file content into memory, which might be inefficient for very large files.
- Impact: Potential high memory usage for large files.
- Mitigation strategy: Implement line-by-line or chunked processing if performance becomes a bottleneck in practice.

### Constraint: Theme Detail Page Data Sources
- Added: 2025-04-02 12:13:26
- Description: Theme detail pages require data from both the database (title, description, suggested readings) and a static markdown file (`theme_descriptions.md` for philosopher lists).
- Impact: Requires combining data sources in `getStaticProps`. Parsing logic for markdown is needed. Suggested readings must be added to the DB.
- Mitigation strategy: Implement robust markdown parsing (`parseThemeMarkdown`). Add `suggested_readings` column to `themes` table.

### Edge Case: Form Embed - Loading Failure
- Identified: [2025-04-18 19:20:37]
- Scenario: The Google Form URL is invalid, network issues prevent loading, or Google Forms service is down.
- Expected behavior: The iframe shows a browser-specific error or the "Loading..." fallback text. The container still renders correctly centered and width-constrained.
- Testing approach: Manual test with invalid URL. Simulate network error in dev tools.

### Edge Case: Form Embed - Very Small Screens
- Identified: [2025-04-18 19:20:37]
- Scenario: Screen width is significantly smaller than the form's inherent minimum usable width (though the iframe itself scales down).
- Expected behavior: The iframe content might require horizontal scrolling *within the iframe itself* (handled by Google Forms), while the page scrolls vertically. The container respects `max-w-2xl` but shrinks below that on small screens due to `w-full`.
- Testing approach: Manual testing on various small device emulators/physical devices.


    ### Edge Case: Registration - Duplicate Email
    - Identified: [2025-04-19 03:20:00]
    - Scenario: A user attempts to register with an email address that already exists in the system.
    - Expected behavior: Prevent duplicate registration. Inform the user that the email is already registered. Potentially offer a login link or password reset if applicable (depends on auth flow).
    - Testing approach: Attempt registration with an existing email.

    ### Edge Case: Submission - Concurrent Submissions (Same Team)
    - Identified: [2025-04-19 03:20:00]
    - Scenario: Two members of the same team attempt to upload a submission simultaneously.
    - Expected behavior: Depends on multi-submission handling (TBD). If replacing, the last successful upload wins. If versioning, both might be accepted as separate versions. The system should handle this gracefully without data corruption. Email receipts should reflect the final state.
    - Testing approach: Difficult to automate reliably. Manual test consideration.

    ### Edge Case: Gamification - Clue Access Race Condition
    - Identified: [2025-04-19 03:20:00]
    - Scenario: If puzzle progress unlocks content or features, ensure that access control updates correctly and prevents users from accessing clues out of order or before meeting prerequisites.
### Edge Case: Terminal Auth - Magic Link Fallback Failure
- Identified: [2025-04-19 20:09:00]
- Scenario: User attempts `magiclink` command during sign-in, but the backend fails to send the email (e.g., email service down, invalid email format missed by client validation).
- Expected behavior: Display an error message ("Failed to send sign-in link. Please try again later or use password."). Remain in Auth Mode.
- Testing approach: Mock backend email sending failure.

### Edge Case: Terminal Registration - User Creation Failure
- Identified: [2025-04-19 20:09:00]
- Scenario: Backend `signUpUser` action fails after email/password collection (e.g., temporary DB issue, unexpected Supabase error).
- Expected behavior: Display an error message ("Failed to create account. Please try again."). Remain at the password creation step, allowing retry.
- Testing approach: Mock `signUpUser` action failure.

### Edge Case: Terminal Registration - Resume After Auth Change
- Identified: [2025-04-19 20:09:00]
- Scenario: User starts registration anonymously, exits, then signs in using an existing account (created previously or via another method) with the same email.
- Expected behavior: The `register continue` command should ideally detect the existing *server-side* registration status for the logged-in user and prompt appropriately (e.g., "Existing registration found. View/Edit?"), rather than just relying on potentially outdated local storage.
- Testing approach: Manual test flow: start anonymous, exit, sign in, attempt continue.


    - Expected behavior: Access control is strictly enforced based on puzzle progress state.
    - Testing approach: Test accessing clues/features directly via URL manipulation without meeting prerequisites.

    ### Edge Case: AI Generation Failure (Theme Expansion)
    - Identified: [2025-04-19 03:20:00]
    - Scenario: The `vectorize` tool fails to generate a draft description (e.g., API error, no relevant context found).
    - Expected behavior: Log the error. The system should gracefully handle the missing draft (e.g., notify admin, allow manual creation).
    - Testing approach: Simulate failure from the `vectorize` tool during testing.


### Edge Case: P0 Content Mgmt - Markdown Rendering Issues
- Identified: [2025-04-19 05:16:00]
- Scenario: Invalid Markdown syntax in `description_expanded` or conflicts between `react-markdown` and Tailwind `prose` styles.
- Expected behavior: `react-markdown` should handle invalid syntax gracefully (render as text or skip). Style conflicts should be resolved via CSS specificity or configuration.
- Testing approach: Test with invalid Markdown. Inspect rendered HTML/CSS for style conflicts.

### Edge Case: P0 Registration - Duplicate Submission Attempt
- Identified: [2025-04-19 05:16:00]
- Scenario: User attempts to submit the registration form after already having a registration record associated with their user ID.
- Expected behavior: Server Action detects existing registration and returns an error message to the user, preventing duplicate insertion.
- Testing approach: Test `createRegistration` action with a user ID that already has a registration record.

### Edge Case: P0 RBAC - Middleware Profile Fetch Failure
- Identified: [2025-04-19 05:16:00]
- Scenario: The middleware fails to fetch the user's profile (e.g., network error, temporary DB issue, profile doesn't exist yet for a new user).
- Expected behavior: Middleware should handle the error gracefully, likely redirecting the user to login or an error page, and log the error.
- Testing approach: Mock Supabase client in middleware tests to simulate profile fetch errors.


### Edge Case: `back` Command - First Question
- Identified: [2025-04-20 1:49:00]
- Scenario: User types `back` when on the first question of the registration flow (after Name/Email/Password).
- Expected behavior: Display message "Cannot go back further." State remains unchanged.
- Testing approach: Execute `back` command at the first question step.

### Edge Case: `back` Command - After `edit [number]`
- Identified: [2025-04-20 1:49:00]
- Scenario: User uses `edit [number]` to jump to a question, changes the answer, then types `back`.
- Expected behavior: The `back` command should undo the *just entered* answer for the edited question and return focus to re-ask that same question (effectively cancelling the edit attempt for that specific answer), rather than going to the numerically previous question.
- Testing approach: Use `edit [number]`, enter new answer, type `back`, verify state/question.

### Edge Case: Ranking Input - Invalid Format
- Identified: [2025-04-20 1:49:00]
- Scenario: User enters non-numeric characters, duplicate numbers, or numbers outside the valid range for a ranking question (e.g., `1,a,3` or `1,1,2` or `1,99,2`).
- Expected behavior: Display specific validation error message (e.g., "Invalid input. Enter comma-separated numbers corresponding to options.", "Duplicate rank detected.", "Invalid option number."). Remain on the current question.
- Testing approach: Input various invalid formats.

### Edge Case: Ranking Input - Insufficient Ranks
- Identified: [2025-04-20 1:49:00]
- Scenario: User enters fewer than the required minimum (3) ranks for a ranking question (e.g., `1,2`).
- Expected behavior: Display validation error message ("Please rank at least 3 options."). Remain on the current question.
- Testing approach: Input fewer than 3 ranks.

### Edge Case: Multi-Select Input - Invalid Format
- Identified: [2025-04-20 1:49:00]
- Scenario: User enters non-numeric characters or numbers outside the valid range for a multi-select question (e.g., `1 a 3` or `1 99 2`).
- Expected behavior: Display specific validation error message (e.g., "Invalid input. Enter space-separated numbers corresponding to options.", "Invalid option number."). Remain on the current question.
- Testing approach: Input various invalid formats.

### Edge Case: Conditional Command - State Mismatch
- Identified: [2025-04-20 1:49:00]
- Scenario: Local storage indicates data exists, but server state shows no registration (or vice-versa), leading to incorrect conditional command display (e.g., `continue` shown when it shouldn't be).
- Expected behavior: Command availability should prioritize server state post-authentication. Pre-authentication relies on local state. Logic should handle potential discrepancies gracefully.
- Testing approach: Manipulate local storage and server mock state to test command visibility.


## Edge Cases
### Edge Case: Admin Edit - Invalid/Missing ID
- Identified: [2025-04-18 07:35:00]
- Scenario: User navigates directly to an edit URL (e.g., /admin/themes/edit) without an ID, or with an ID that doesn't exist in the database.
- Expected behavior: The edit page Server Component should detect the missing/invalid ID, handle the error gracefully (e.g., redirect to the list view, show a 'Not Found' message).
- Testing approach: Manual navigation test. Unit test the edit page's data fetching logic with invalid/missing IDs.

### Edge Case: Admin Delete - Race Condition/Stale Data
- Identified: [2025-04-18 07:35:00]
- Scenario: Two admins attempt to delete the same item simultaneously, or an admin tries to delete an item that was just modified.
- Expected behavior: The database operation should handle this (e.g., first delete succeeds, second fails). The UI should reflect the final state after revalidation.
- Testing approach: Difficult to automate reliably. Manual testing consideration. Ensure `revalidatePath` is used correctly.

### Edge Case: Admin Form Submission - Network Error
- Identified: [2025-04-18 07:35:00]
- Scenario: Network connection is lost while submitting a form via a Server Action.
- Expected behavior: The Server Action won't complete. The client form should ideally handle this (e.g., maintain input state, allow retry). `useFormState` might show a pending state indefinitely.
- Testing approach: Simulate network interruption in browser dev tools during manual testing.


<!-- Append new edge cases using the format below -->
### Edge Case: RAG Optimizer - Directory Not Found
- Identified: 2025-04-17 22:57:00
- Scenario: The input directory path provided to the script does not exist or is inaccessible.
- Expected behavior: Log a critical error and exit gracefully.
- Testing approach: Run script with an invalid path.

### Edge Case: RAG Optimizer - No Markdown Files
- Identified: 2025-04-17 22:57:00
- Scenario: The input directory exists but contains no .md files.
- Expected behavior: Log an informational message and exit gracefully.
- Testing approach: Run script on a directory without .md files.

### Edge Case: RAG Optimizer - File I/O Errors
- Identified: 2025-04-17 22:57:00
- Scenario: Script lacks read or write permissions for a specific .md file.
- Expected behavior: Log an error for that file, skip it, continue with others, report in summary.
- Testing approach: Modify file permissions in a test directory and run the script.

### Edge Case: RAG Optimizer - Malformed Patterns
- Identified: 2025-04-17 22:57:00
- Scenario: File contains text resembling citations or footnotes but not matching the exact regex.
- Expected behavior: Malformed patterns are ignored and left untouched.
- Testing approach: Create test files with near-miss patterns.

### Edge Case: RAG Optimizer - No References Section
- Identified: 2025-04-17 22:57:00
- Scenario: An .md file lacks a recognizable "References" section heading.
- Expected behavior: Process the entire file content, log a warning.
- Testing approach: Create a test file without a references heading.

### Edge Case: Theme Detail Page - Theme Not Found
- Identified: 2025-04-02 12:13:26
- Scenario: User navigates to `/themes/[invalidId]` or `getStaticProps` receives an ID not in the database.
- Expected behavior: Return a 404 page (`notFound: true` from `getStaticProps`).
- Testing approach: Unit test `getStaticProps` with invalid ID. Manual test navigation.

### Edge Case: Theme Detail Page - Markdown Parsing Failure
- Identified: 2025-04-02 12:13:26
- Scenario: `theme_descriptions.md` is missing, structure changes, or theme title mismatch prevents finding the correct section.
- Expected behavior: Log a warning, return empty philosopher lists to the component, page still renders with DB data.
- Testing approach: Unit test `parseThemeMarkdown` with malformed input/missing sections. Modify markdown temporarily for manual test.

### Edge Case: Theme Detail Page - Missing Suggested Readings
- Identified: 2025-04-02 12:13:26
- Scenario: `suggested_readings` column in DB is NULL or an empty array for a specific theme.
- Expected behavior: The "Suggested Readings" section is not rendered on the page. No errors occur.
- Testing approach: Ensure DB has themes with null/empty readings. Unit test component rendering logic. Manual test.

### Pseudocode: FormEmbed Component - Responsive Styling
- Created: [2025-04-18 19:20:37]
- Updated: [2025-04-18 19:20:37]
```typescript
// platform/src/components/FormEmbed.tsx
// (Conceptual Pseudocode/JSX Structure)

import React from 'react';

const FormEmbed = () => {
  // Replace with the actual Google Form URL
  const formUrl = "YOUR_GOOGLE_FORM_EMBED_URL";
  // Replace with the actual height provided by Google Forms embed code
  const formHeight = "3000"; // Example height, use the real value

  return (
    // Container Div: Controls width and centering
    <div className="w-full max-w-2xl mx-auto">
      {/* TDD: Test that container div has max-width computed style (e.g., 672px for max-w-2xl). */}
      {/* TDD: Test that container div has margin-left/right: auto computed style. */}

      {/* Iframe: Takes full width of container, maintains fixed height */}
      <iframe
        src={formUrl}
        // width="100%" // Can be set to 100% or removed entirely, as container controls width
        height={formHeight} // Keep the fixed height from Google
        frameBorder="0"
        marginHeight={0} // Use numbers or strings as appropriate for JSX
        marginWidth={0}
        className="w-full" // Ensure iframe tries to fill container width
        title="Google Form Embed"
      >
        Loading…
        {/* TDD: Test that iframe has width: 100% computed style. */}
        {/* TDD (Optional/Difficult): Test iframe height/scrolling behavior at small viewport width. */}
      </iframe>
    </div>
  );
};

export default FormEmbed;
```
#### TDD Anchors:
- Test that iframe has width: 100% computed style.
- Test that container div has max-width computed style (e.g., 672px for max-w-2xl).
- Test that container div has margin-left/right: auto computed style.
- Test (Optional/Difficult): iframe height/scrolling behavior at small viewport width.


### Pseudocode: P0 Content Mgmt - Theme Detail Page Rendering (`/themes/[id]/page.tsx` Snippet)
- Created: [2025-04-19 05:16:00]
- Updated: [2025-04-19 05:16:00]
```typescript
// Conceptual rendering part in ThemeDetailPage component
import ReactMarkdown from 'react-markdown';

// ... inside component, assuming `theme.description_expanded` contains Markdown string ...
{theme.description_expanded &amp;&amp; (
  <div className="prose prose-invert max-w-none"> {/* Apply Tailwind Typography */}
    <ReactMarkdown>{theme.description_expanded}</ReactMarkdown>
  </div>
)}
```
#### TDD Anchors:
- Test ReactMarkdown renders when description_expanded exists.
- Test container div has 'prose' classes.
- Test nothing renders if description_expanded is null/empty.

### Pseudocode: P0 Content Mgmt - Admin Theme Form Modification (`ThemeForm.tsx` Snippet)
- Created: [2025-04-19 05:16:00]
- Updated: [2025-04-19 05:16:00]
```typescript
// Conceptual addition to ThemeForm.tsx
<div>
  <label htmlFor="description_expanded">Expanded Description (Markdown)</label>
  <textarea
    id="description_expanded"
    name="description_expanded"
    rows={10}
    defaultValue={theme?.description_expanded || ''} // Populate if editing
  />
  {/* Display validation errors: state.errors?.description_expanded */}
</div>
```
#### TDD Anchors:
- Test textarea renders with default value.
- Test Server Actions handle the new field.

### Pseudocode: P0 Registration - Server Action (`src/app/register/actions.ts`)
- Created: [2025-04-19 05:16:00]
- Updated: [2025-04-19 05:16:00]
```typescript
// src/app/register/actions.ts (Conceptual Pseudocode)
'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Define Zod schema matching FR-REG-005...
const RegistrationSchema = z.object({ /* ... fields ... */ });

export type RegistrationState = { /* ... errors, message, success ... */ };

export async function createRegistration(
  previousState: RegistrationState,
  formData: FormData
): Promise<RegistrationState> {
  const supabase = createServerClient();
  // 1. Get user session
  // 2. Check if user already registered (return error if yes)
  // 3. Extract/process data from formData (handle arrays)
  // 4. Validate data using RegistrationSchema (return errors if invalid)
  // 5. Prepare data for DB (add user_id)
  // 6. Insert into 'registrations' table
  // 7. Handle DB errors
  // 8. Revalidate paths if needed
  // 9. Redirect on success
}
```
#### TDD Anchors:
- Test auth check.
- Test duplicate registration check.
- Test validation failure/success.
- Test data processing (arrays).
- Test DB insertion success/error.
- Test redirect.

### Pseudocode: P0 Registration - Multi-Step Form Component (`RegistrationForm.tsx`)
- Created: [2025-04-19 05:16:00]
- Updated: [2025-04-19 05:16:00]
```typescript
// src/app/register/components/RegistrationForm.tsx (Conceptual Pseudocode)
'use client';
import React, { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createRegistration } from '../actions';

type FormData = { /* ... all fields ... */ };
const initialState = { /* ... message, errors, success ... */ };

function SubmitButton() { /* ... uses useFormStatus ... */ }

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [state, formAction] = useFormState(createRegistration, initialState);
  const totalSteps = 4; // Example

  const handleNext = () => { /* ... increment step ... */ };
  const handlePrevious = () => { /* ... decrement step ... */ };
  const handleChange = (e) => { /* ... update formData state, handle checkboxes/arrays ... */ };
  const renderStepContent = () => { /* ... switch(currentStep) to render field sections ... */ };

  return (
    <form action={formAction}>
      {/* Display messages */} 
      {renderStepContent()}
      {/* Render hidden inputs for all formData on final step */} 
      {/* Navigation buttons (Previous, Next, Submit) */} 
    </form>
  );
}
```
#### TDD Anchors:
- Test handleChange updates state correctly.
- Test renderStepContent shows correct fields per step.
- Test navigation buttons enable/disable/function correctly.
- Test display of server errors.

### Pseudocode: P0 RBAC - Middleware (`src/middleware.ts`)
- Created: [2025-04-19 05:16:00]
- Updated: [2025-04-19 05:16:00]
```typescript
// src/middleware.ts (Conceptual Pseudocode)
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/middleware';

const protectedPaths = { '/admin': ['admin'], /* ... other paths ... */ };

export async function middleware(request: NextRequest) {
  const { supabase, response } = createServerClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  const pathname = request.nextUrl.pathname;

  // Check if path is protected
  const requiredRoles = /* ... find required roles for pathname ... */;

  if (requiredRoles) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    // Fetch profile role for session.user.id
    const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (error || !profile || !requiredRoles.includes(profile.role)) {
       console.warn(/* ... log details ... */);
       return NextResponse.redirect(new URL('/admin/login', request.url)); // Or /unauthorized
    }
  }
  // Optional: Redirect logged-in from /admin/login
  // ...
  return response;
}

export const config = { matcher: [ /* ... paths to include/exclude ... */ ] };
```
#### TDD Anchors:
- Test redirect if no session.
- Test redirect if role mismatch.
- Test redirect if profile fetch fails.
- Test successful access with correct role.
- Test redirect from login if session exists.


### Pseudocode: Terminal Registration - Early Auth Flow
- Created: [2025-04-20 1:49:00]
- Updated: [2025-04-20 1:49:00]
```pseudocode
// Within Registration Mode, after 'register new' or 'register continue' (if needed)

// Step 1: Collect Name
DisplayQuestion(QuestionDefinitions['fullName'])
Await UserInput() -> name
SaveToLocalStorage('formData.fullName', name)

// Step 2: Collect Email
DisplayQuestion(QuestionDefinitions['email'])
Await UserInput() -> email
ClientValidateEmail(email) // Basic format check
IF (!isValid) DisplayError("Invalid email format."); GOTO Step 2;
SaveToLocalStorage('formData.email', email)

// Step 3: Collect Password
DisplayPrompt("Password:")
Await UserInput(masked=true) -> password
DisplayPrompt("Confirm Password:")
Await UserInput(masked=true) -> confirmPassword

// Step 4: Validate & Create User
ClientValidatePassword(password, confirmPassword) // Length >= 8, match
IF (!isValid) DisplayError("Passwords do not match or are too short."); GOTO Step 3;

TRY
  result = AWAIT ServerAction.signUpUser(email, password)
  IF (result.error) DisplayError(result.error); GOTO Step 3;
  // User created or verified successfully
  SaveToLocalStorage('userVerified', true)
  DisplaySuccess("Account verified/created.")
CATCH (error)
  DisplayError("Failed to verify/create account. Please try again."); GOTO Step 3;

// Step 5: Proceed to next registration question (e.g., Year of Study)
currentQuestionIndex = GetIndexForQuestion('yearOfStudy')
DisplayQuestion(...) // Start main question loop

```
#### TDD Anchors:
- Test name collection and saving.
- Test email collection, validation, and saving.
- Test password masking and validation (length, match).
- Test `signUpUser` action call on valid password.
- Test handling of `signUpUser` success and error.
- Test transition to the next appropriate question.

### Pseudocode: Terminal Registration - Multi-Select Input Handling
- Created: [2025-04-20 1:49:00]
- Updated: [2025-04-20 1:49:00]
```pseudocode
// Within Registration Mode, when currentQuestion.type === 'multi-select-numbered'

DisplayQuestionLabel(currentQuestion.label)
DisplayQuestionHint(currentQuestion.hint) // e.g., "Enter numbers separated by spaces."
FOR index, option IN enumerate(currentQuestion.options):
  DisplayLine(f"{index + 1}) {option}")

DisplayPrompt("[registration]>")
Await UserInput() -> rawInput

// Validation
rawSelections = rawInput.trim().split(' ')
selectedIndices = []
isValid = true
FOR selection IN rawSelections:
  IF selection is empty: CONTINUE
  IF NOT selection.isdigit(): isValid = false; BREAK;
  index = int(selection) - 1
  IF index < 0 OR index >= len(currentQuestion.options):
    isValid = false; BREAK;
  IF index IN selectedIndices: // Check for duplicates
    isValid = false; DisplayError("Duplicate selection detected."); BREAK;
  selectedIndices.append(index)

IF NOT isValid:
  DisplayError("Invalid input. Enter space-separated numbers corresponding to options.")
  // Re-ask the same question
ELSE:
  // Convert indices back to option values if needed for storage
  selectedValues = [currentQuestion.options[i] for i in selectedIndices]
  SaveToLocalStorage(f"formData.{currentQuestion.id}", selectedValues) // Save as array
  // Proceed to next question

```
#### TDD Anchors:
- Test option display with numbers.
- Test parsing of space-separated numbers.
- Test validation: non-numeric input, out-of-range numbers, empty input, duplicates.
- Test successful saving of selected values as an array.

### Pseudocode: Terminal Registration - Ranking Input Handling
- Created: [2025-04-20 1:49:00]
- Updated: [2025-04-20 1:49:00]
```pseudocode
// Within Registration Mode, when currentQuestion.type === 'ranking-numbered'
MIN_RANKS = currentQuestion.validation?.minSelections || 3

DisplayQuestionLabel(currentQuestion.label)
DisplayQuestionHint(currentQuestion.hint) // e.g., "Enter comma-separated numbers for your top ranks (e.g., `3,1,4`). Rank at least {MIN_RANKS}."
FOR index, option IN enumerate(currentQuestion.options):
  DisplayLine(f"{index + 1}) {option}")

DisplayPrompt("[registration]>")
Await UserInput() -> rawInput

// Validation
rawRanks = rawInput.trim().split(',')
rankedIndices = []
seenIndices = set()
isValid = true
FOR rankStr IN rawRanks:
  IF rankStr is empty: isValid = false; BREAK; // No empty ranks allowed
  IF NOT rankStr.isdigit(): isValid = false; BREAK;
  index = int(rankStr) - 1
  IF index < 0 OR index >= len(currentQuestion.options):
    isValid = false; BREAK; // Invalid option number
  IF index IN seenIndices:
    isValid = false; DisplayError("Duplicate rank detected."); BREAK;
  rankedIndices.append(index)
  seenIndices.add(index)

IF NOT isValid:
  DisplayError("Invalid input. Enter unique, comma-separated numbers corresponding to options.")
  // Re-ask the same question
ELSE IF len(rankedIndices) < MIN_RANKS:
  DisplayError(f"Please rank at least {MIN_RANKS} options.")
  // Re-ask the same question
ELSE:
  // Convert indices to values if needed, store ordered list
  rankedValues = [currentQuestion.options[i] for i in rankedIndices]
  SaveToLocalStorage(f"formData.{currentQuestion.id}", rankedValues) // Save ordered array
  // Proceed to next question

```
#### TDD Anchors:
- Test option display with numbers.
- Test parsing of comma-separated numbers.
- Test validation: non-numeric, out-of-range, duplicates, empty input.
- Test validation: minimum number of ranks (>= 3).
- Test successful saving of ranked values as an ordered array.

### Pseudocode: Terminal Registration - `back` Command Logic
- Created: [2025-04-20 1:49:00]
- Updated: [2025-04-20 1:49:00]
```pseudocode
// Within Registration Mode, when user enters 'back' command

// 1. Determine the actual previous question index, considering dependencies
previousQuestionIndex = FindPreviousQuestionIndex(currentQuestionIndex, formData, QuestionDefinitions)

IF previousQuestionIndex < GetIndexForQuestion('yearOfStudy'): // Cannot go back before first real question
  DisplayError("Cannot go back further.")
  RETURN

// 2. Get the ID of the question answered *at* previousQuestionIndex
previousQuestionId = QuestionDefinitions[previousQuestionIndex].id

// 3. Remove the answer for that question from local storage
RemoveFromLocalStorage(f"formData.{previousQuestionId}")
// Optional: Update history stack if used

// 4. Set the current question index to the previous one
currentQuestionIndex = previousQuestionIndex

// 5. Re-display the previous question
DisplayQuestion(QuestionDefinitions[currentQuestionIndex])

// Helper Function (Conceptual)
FUNCTION FindPreviousQuestionIndex(currentIndex, currentFormData, allQuestions):
  targetIndex = currentIndex - 1
  WHILE targetIndex >= GetIndexForQuestion('yearOfStudy'):
    prevQuestion = allQuestions[targetIndex]
    // Check if this question should have been skipped based on *current* answers
    IF prevQuestion.dependsOn AND currentFormData[prevQuestion.dependsOn] != prevQuestion.dependsValue:
      targetIndex -= 1 // Skip this one, check the one before it
    ELSE:
      RETURN targetIndex // Found the actual previous question
  RETURN -1 // Indicate cannot go back further

```
#### TDD Anchors:
- Test removing last answer from local storage.
- Test setting current index to previous question index.
- Test handling of first question boundary.
- Test correct identification of previous question when dependencies caused skips.

### Pseudocode: Terminal - Conditional Command Display Logic
- Created: [2025-04-20 1:49:00]
- Updated: [2025-04-20 1:49:00]
```pseudocode
// Conceptual logic for determining available commands in Main Mode

FUNCTION GetAvailableMainCommands(isAuthenticated, hasLocalData, serverRegistrationStatus):
  commands = ['help', 'about']

  IF isAuthenticated:
    commands.append('sign-out')
    IF serverRegistrationStatus == 'complete':
      commands.extend(['view', 'edit', 'delete'])
    ELSE:
      // Allow starting/continuing even if logged in but incomplete
      commands.append('register')
  ELSE: // Anonymous
    commands.append('sign-in')
    commands.append('register')
    IF hasLocalData:
      // Only add 'continue' to the 'register' sub-menu, not here directly
      pass

  RETURN commands

// Conceptual logic for 'register' sub-menu
FUNCTION GetRegisterSubCommands(hasLocalData):
  subCommands = ['new', 'back']
  IF hasLocalData:
    subCommands.append('continue')
  RETURN subCommands

// Usage:
// available = GetAvailableMainCommands(session != null, CheckLocalStorage(), fetchServerStatus())
// DisplayHints(available)
// IF input == 'register':
//   registerCmds = GetRegisterSubCommands(CheckLocalStorage())
//   DisplaySubMenu(registerCmds)
//   ... handle sub-command input ...

```
#### TDD Anchors:
- Test command list for anonymous user without local data.
- Test command list for anonymous user with local data.
- Test command list for authenticated user, registration not started.
- Test command list for authenticated user, registration incomplete.
- Test command list for authenticated user, registration complete.
- Test `register` sub-menu commands with/without local data.


## Pseudocode Library
### Pseudocode: Admin Authentication - `signInWithOtp`, `signOut`, Route Protection
- Created: [2025-04-18 07:35:00]
- Updated: [2025-04-18 07:35:00]
```pseudocode
// src/app/admin/auth/actions.ts
'use server';
import { createServerClient } from '@/lib/supabase/server'; // Assumed utility
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

ASYNC FUNCTION signInWithOtp(previousState, formData) {
  origin = headers().get('origin'); // Get base URL for redirect
  email = formData.get('email');

  // Basic validation
  IF (!email || typeof email !== 'string' || !email.includes('@')) {
    RETURN { error: 'Invalid email address provided.' };
  }

  supabase = createServerClient();
  { data, error } = AWAIT supabase.auth.signInWithOtp({
    email: email,
    options: {
      // shouldCreateUser: false, // Optional: prevent creating new users
      emailRedirectTo: `${origin}/api/auth/callback`, // Supabase callback URL
    },
  });

  IF (error) {
    console.error('OTP Sign In Error:', error);
    RETURN { error: `Could not authenticate user: ${error.message}` };
  }

  RETURN { success: true, message: 'Check your email for the magic link!' };
}

ASYNC FUNCTION signOut() {
  supabase = createServerClient();
  AWAIT supabase.auth.signOut();
  redirect('/admin/login');
}

// src/app/admin/layout.tsx (Conceptual)
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
// ... other imports (NavBar, LogoutButton etc)

ASYNC FUNCTION AdminLayout({ children }) {
  supabase = createServerClient();
  { data: { user } } = AWAIT supabase.auth.getUser();

  IF (!user) {
    redirect('/admin/login');
  }

  RETURN (
    <div className="admin-layout">
      <AdminSidebar /> // Contains navigation and LogoutButton
      <main>{children}</main>
    </div>
  );
}
```
#### TDD Anchors:
- Test `signInWithOtp` validation.
- Test `signInWithOtp` Supabase call success/error.
- Test `signOut` Supabase call and redirect.
- Test `AdminLayout` redirect when no user.
- Test `AdminLayout` renders children when user exists.

### Pseudocode: Admin CRUD Server Actions (Example: Themes) - `src/app/admin/themes/actions.ts`
- Created: [2025-04-18 07:35:00]
- Updated: [2025-04-18 07:35:00]
```pseudocode
// src/app/admin/themes/actions.ts
'use server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod'; // Example using Zod for validation

// Define schema for validation
const ThemeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  analytic_tradition: z.string().optional(),
  continental_tradition: z.string().optional(),
});

// --- Create Action --- (Used with useFormState)
ASYNC FUNCTION createTheme(previousState, formData) {
  // Validate form data
  validatedFields = ThemeSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    analytic_tradition: formData.get('analytic_tradition'),
    continental_tradition: formData.get('continental_tradition'),
  });

  IF (!validatedFields.success) {
    RETURN {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  // Prepare data for Supabase
  themeData = validatedFields.data;

  TRY {
    supabase = createServerClient();
    { error } = AWAIT supabase.from('themes').insert(themeData);

    IF (error) throw error;

    // Revalidate cache and redirect on success
    revalidatePath('/admin/themes');
    // No need to return state on success if redirecting immediately
    // RETURN { message: 'Theme created successfully.', success: true };
  } CATCH (e) {
    console.error('Create Theme Error:', e);
    RETURN { message: `Database Error: Failed to create theme. ${e.message}` };
  }

  // Redirect after successful insert (outside try-catch)
  redirect('/admin/themes');
}

// --- Update Action --- (Used with useFormState)
ASYNC FUNCTION updateTheme(id, previousState, formData) {
  IF (!id) RETURN { message: 'Error: Missing theme ID.' };

  validatedFields = ThemeSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    analytic_tradition: formData.get('analytic_tradition'),
    continental_tradition: formData.get('continental_tradition'),
  });

  IF (!validatedFields.success) {
    RETURN {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  themeData = validatedFields.data;

  TRY {
    supabase = createServerClient();
    { error } = AWAIT supabase.from('themes').update(themeData).eq('id', id);

    IF (error) throw error;

    revalidatePath('/admin/themes');
    revalidatePath(`/admin/themes/edit?id=${id}`); // Revalidate edit page too
    // RETURN { message: 'Theme updated successfully.', success: true };
  } CATCH (e) {
    console.error('Update Theme Error:', e);
    RETURN { message: `Database Error: Failed to update theme. ${e.message}` };
  }

  redirect('/admin/themes');
}

// --- Delete Action --- (Called directly, not usually with useFormState)
ASYNC FUNCTION deleteTheme(id) {
  IF (!id) throw new Error('Missing theme ID for deletion.');

  TRY {
    supabase = createServerClient();
    { error } = AWAIT supabase.from('themes').delete().eq('id', id);

    IF (error) throw error;

    revalidatePath('/admin/themes');
    RETURN { success: true, message: 'Theme deleted.' }; // Return status for client feedback

  } CATCH (e) {
    console.error('Delete Theme Error:', e);
    // Re-throw or return error structure
    throw new Error(`Database Error: Failed to delete theme. ${e.message}`);
    // OR: return { success: false, message: `Database Error: Failed to delete theme. ${e.message}` };
  }
}

// Similar actions for Workshops and FAQs would follow this pattern
// adapting the schema and table names.
```
#### TDD Anchors:
- Test `createTheme` validation (Zod schema).
- Test `createTheme` success path (Supabase insert call, revalidate, redirect).
- Test `createTheme` DB error handling.
- Test `updateTheme` validation.
- Test `updateTheme` success path (Supabase update call, revalidate, redirect).
- Test `updateTheme` DB error handling.
- Test `deleteTheme` success path (Supabase delete call, revalidate).
- Test `deleteTheme` DB error handling.
- Test `deleteTheme` missing ID handling.


<!-- Append new pseudocode blocks using the format below -->
### Pseudocode: RAG Markdown Optimizer Script - rag_markdown_optimizer.py
- Created: 2025-04-17 22:57:00
- Updated: 2025-04-17 22:57:00
```pseudocode
// rag_markdown_optimizer.py

IMPORT os
IMPORT re
IMPORT logging
IMPORT argparse

// --- Configuration ---
DEFINE REFERENCE_SECTION_PATTERNS: [
    r"^\s*##\s+References\s*$", // ## References
    r"^\s*References\s*\n-{3,}\s*$" // References\n---
]
DEFINE CITATION_PATTERN: r"\(([^,]+),\s*\[(\d{4})\]\([^)]+\s+\"[^\"]+\"\)\)" // (Author, [Year](URL "Full Citation")) -> Captures Author, Year
DEFINE FOOTNOTE_PATTERN: r"(\[Footnote\s+\d+\])\(\#[^)]+\)" // [Footnote N](#...) -> Captures [Footnote N] (Corrected from #FnN to general #...)

// --- Setup ---
FUNCTION setup_logging():
    // Configure logging (level, format, output - e.g., console and/or file)
    // Example: Log INFO level messages to console
END FUNCTION

FUNCTION parse_arguments():
    // Use argparse to get the input directory path from command line
    // Add argument for '--directory' or positional argument
    // RETURN parsed arguments (e.g., args.directory)
END FUNCTION

// --- Core Logic ---

FUNCTION find_markdown_files(directory_path):
    // Initialize empty list: markdown_files
    // FOR root, dirs, files IN os.walk(directory_path):
    //   FOR file IN files:
    //     IF file ends with ".md":
    //       ADD os.path.join(root, file) TO markdown_files
    // RETURN markdown_files
END FUNCTION

FUNCTION find_references_start(lines):
    // Iterate through lines with index
    // FOR index, line IN enumerate(lines):
    //   FOR pattern IN REFERENCE_SECTION_PATTERNS:
    //     IF re.match(pattern, line, re.IGNORECASE):
    //       RETURN index // Return the line number where references start
    // RETURN -1 // Indicate not found
END FUNCTION

FUNCTION process_markdown_file(file_path):
    TRY
        // Log processing start for file_path
        logging.info(f"Processing file: {file_path}")

        // Read file content
        WITH open(file_path, 'r', encoding='utf-8') AS f:
            lines = f.readlines() // Read as lines to easily find reference start

        // Find where the main content ends (start of references)
        references_start_index = find_references_start(lines)

        // Separate main content and references
        IF references_start_index != -1:
            main_content_lines = lines[:references_start_index]
            reference_content_lines = lines[references_start_index:]
            main_content = "".join(main_content_lines)
            logging.debug(f"References section found at line {references_start_index} in {file_path}")
        ELSE:
            main_content = "".join(lines)
            reference_content_lines = [] // No references section
            logging.warning(f"No references section found in {file_path}. Processing entire file.")

        // Perform replacements on main content only
        // 1. Simplify citations
        modified_content = re.sub(CITATION_PATTERN, r"(\1, \2)", main_content) // Replace with (Author, Year)

        // 2. Simplify footnotes
        modified_content = re.sub(FOOTNOTE_PATTERN, r"\1", modified_content) // Replace with [Footnote N]

        // Combine modified main content with original references
        final_content = modified_content + "".join(reference_content_lines)

        // Write modified content back to the file (in-place)
        WITH open(file_path, 'w', encoding='utf-8') AS f:
            f.write(final_content)

        logging.info(f"Successfully processed and updated: {file_path}")
        RETURN True // Indicate success

    EXCEPT FileNotFoundError:
        logging.error(f"Error: File not found - {file_path}")
        RETURN False
    EXCEPT PermissionError:
        logging.error(f"Error: Permission denied for file - {file_path}")
        RETURN False
    EXCEPT Exception as e:
        logging.error(f"Error processing file {file_path}: {e}")
        RETURN False
END FUNCTION

// --- Main Execution ---
FUNCTION main():
    setup_logging()
    args = parse_arguments()
    directory = args.directory // Assuming 'directory' is the argument name

    IF NOT os.path.isdir(directory):
        logging.critical(f"Error: Input path is not a valid directory: {directory}")
        EXIT // Or raise error

    markdown_files = find_markdown_files(directory)

    IF NOT markdown_files:
        logging.info(f"No Markdown files found in directory: {directory}")
        EXIT

    logging.info(f"Found {len(markdown_files)} Markdown files to process.")

    success_count = 0
    error_count = 0

    FOR file_path IN markdown_files:
        IF process_markdown_file(file_path):
            success_count += 1
        ELSE:
            error_count += 1

    // Log summary
    logging.info("--- Processing Summary ---")
    logging.info(f"Total files processed: {success_count}")
    logging.info(f"Total errors: {error_count}")
    logging.info("--------------------------")

END FUNCTION

// --- Entry Point ---
IF __name__ == "__main__":
    main()
```
#### TDD Anchors:
- Test `find_markdown_files`: Various directory structures, file types.
- Test `find_references_start`: Different header patterns, positions, absence.
- Test `process_markdown_file` (Mock I/O): Valid/invalid citations/footnotes, presence/absence of references section, content before/after references.
- Test `process_markdown_file` (Real I/O): Success case, FileNotFoundError, PermissionError.
- Test `main`: Arg parsing, directory validation, summary reporting.

### Pseudocode: Theme Detail Page - `platform/src/app/themes/[themeId]/page.tsx`
- Created: 2025-04-02 12:13:26
- Updated: 2025-04-02 12:13:26
```pseudocode
// platform/src/app/themes/[themeId]/page.tsx
// (Conceptual Pseudocode)

import { getThemeById, getAllThemeIds } from '@/lib/data/themes'; // Assumed data fetching functions
import { parseThemeMarkdown } from '@/lib/markdownUtils'; // Assumed markdown parsing utility
import { Theme } from '@/lib/types'; // Assumed Theme type definition
import { notFound } from 'next/navigation';
import fs from 'fs/promises'; // For reading markdown file
import path from 'path';

// Define structure for props, including parsed philosophers
type ThemeDetailPageProps = {
  params: { themeId: string };
};

type ParsedPhilosophers = {
  analytic: string[];
  continental: string[];
};

// --- Data Fetching ---

// Generate static paths for all themes
FUNCTION getStaticPaths():
  // Fetch all theme IDs (or slugs if using slugs) from the database
  allThemeIds = CALL getAllThemeIds() // Returns array like [{ id: 'minds-and-machines' }, ...]

  // Map IDs to the format Next.js expects
  paths = allThemeIds.map(theme => ({
    params: { themeId: theme.id }
  }))

  RETURN {
    paths: paths,
    fallback: false // Or 'blocking'/'true' if needed, but false is typical for fully static
  }
END FUNCTION

// Fetch data for a specific theme page
ASYNC FUNCTION getStaticProps(context):
  themeId = context.params.themeId

  // 1. Fetch theme data from DB
  themeData: Theme | null = AWAIT getThemeById(themeId)

  // Handle theme not found
  IF themeData IS NULL THEN
    RETURN { notFound: true }
  END IF

  // 2. Read markdown content
  markdownFilePath = path.join(process.cwd(), 'docs/event_info/theme_descriptions.md')
  markdownContent = AWAIT fs.readFile(markdownFilePath, 'utf-8')

  // 3. Parse markdown for philosophers related to this theme
  // parseThemeMarkdown needs to find the section by themeData.title
  // and extract bullet points under specific subheadings.
  philosophers: ParsedPhilosophers = parseThemeMarkdown(markdownContent, themeData.title)

  // 4. Return props
  RETURN {
    props: {
      theme: themeData,
      philosophers: philosophers
    },
    // Optional: Add revalidate period for ISR if needed
    // revalidate: 3600 // Revalidate every hour
  }
END FUNCTION

// --- Page Component ---

COMPONENT ThemeDetailPage(props: { theme: Theme, philosophers: ParsedPhilosophers }):
  theme = props.theme
  philosophers = props.philosophers

  // Basic structure - apply actual styling and layout components
  RETURN (
    DIV container // Apply layout styles
      H1 {theme.title}

      P {theme.description} // Render the (revamped) description

      // Display Philosopher Lists
      IF philosophers.analytic.length > 0 THEN
        DIV section
          H2 "Analytic Tradition"
          UL
            FOR philosopher IN philosophers.analytic:
              LI {philosopher}
            END FOR
          END UL
        END DIV
      END IF

      IF philosophers.continental.length > 0 THEN
        DIV section
          H2 "Continental Tradition"
          UL
            FOR philosopher IN philosophers.continental:
              LI {philosopher}
            END FOR
          END UL
        END DIV
      END IF

      // Display Suggested Readings (if available)
      IF theme.suggested_readings AND theme.suggested_readings.length > 0 THEN
        DIV section
          H2 "Suggested Readings"
          UL
            FOR reading IN theme.suggested_readings:
              LI {reading} // Assuming readings are simple strings for now
            END FOR
          END UL
        END DIV
      END IF
    END DIV
  )
END COMPONENT
```
#### TDD Anchors:
- Test case 1 (getStaticPaths): Should return an array of objects with `params: { themeId: string }` for all themes in the DB.
- Test case 2 (getStaticProps - Success): Given a valid themeId, should return props containing correct theme data and parsed philosopher lists.
- Test case 3 (getStaticProps - Not Found): Given an invalid themeId, should return `{ notFound: true }`.
- Test case 4 (getStaticProps - Markdown Parse): Should handle missing theme section or malformed markdown gracefully (e.g., empty philosopher lists).
- Test case 5 (Component Rendering): Should correctly render title, description, philosopher lists (analytic/continental), and suggested readings when provided.
- Test case 6 (Component Rendering - No Readings): Should not render the "Suggested Readings" section if the data is null or empty.

### Pseudocode: Theme Card Modification - `platform/src/components/ThemeCard.tsx`
- Created: 2025-04-02 12:13:26
- Updated: 2025-04-02 12:13:26
```pseudocode
// platform/src/components/ThemeCard.tsx
// (Conceptual Pseudocode - Showing modification)

import { Theme } from '@/lib/types';
import Link from 'next/link'; // Import Next.js Link

COMPONENT ThemeCard(props: { theme: Theme }):
  theme = props.theme

  RETURN (
    DIV card // Existing card structure and styling
      H3 {theme.title}
      P {theme.description} // Display the short/original description

      // --- ADDED ---
      // Add a link to the dynamic theme page
      // Use theme.id (or slug if available) for the href
      Link href={`/themes/${theme.id}`}
        A className="text-accent hover:underline" // Style as needed
          "See More Details"
        END A
      END Link
      // --- END ADDED ---

      // Existing display of philosopher lists (analytic/continental) might remain here
      // or be removed if the detail page is sufficient. User decision needed.
      // ... existing rendering of philosopher lists ...

    END DIV
  )
END COMPONENT
```
#### TDD Anchors:
- Test case 1 (Link Presence): The rendered card should include a Next.js Link component.
- Test case 2 (Link Destination): The Link's `href` attribute should correctly point to `/themes/[theme.id]`.
- Test case 3 (Link Text): The link should contain visible text like "See More Details".