# P0 Feature Specification: Registration System

**Version:** 1.0
**Date:** 2025-04-19
**Status:** Draft

## 1. Overview

This document specifies the functional requirements and implementation details for the built-in Registration System for the Philosothon Platform V2, focusing on Priority 0 (P0) features. It replaces the previous Google Forms embed. It builds upon Requirement 3.2 in `docs/project_specifications_v2.md` and the decisions outlined in `memory-bank/adr/2025-04-19-v2-registration-system.md`.

## 2. Functional Requirements

### 2.1. Form Structure and Flow

*   **FR-REG-001:** The platform shall provide a built-in registration form accessible via the `/register` route.
*   **FR-REG-002:** The registration form shall be presented as a multi-step process to manage the number of fields and improve user experience.
    *   *Implementation Note:* The exact number and grouping of steps are TBD during UI design, but should logically group related fields (e.g., Personal Info, Philosophical Background, Team Preferences, Technical/Accessibility).
*   **FR-REG-003:** Client-side state management shall be used to maintain form data across steps before final submission.
*   **FR-REG-004:** The registration form shall be accessible to unauthenticated users. The process itself will handle user sign-up or association with an existing logged-in user.

### 2.2. Required Fields and Validation (Req 3.2.4)

*   **FR-REG-005:** The form must collect the following fields, with appropriate input types and basic validation:
    *   **Basic Info:** (From V1 spec, assumed still required)
        *   Full Name (Text, Required)
        *   Email (Email, Required, Readonly - prefilled from user session)
        *   University/Institution (Text, Required)
        *   Program/Major (Text, Required)
        *   Year of Study (Number/Select, Required)
    *   **Date Flexibility:**
        *   `can_attend_may_3_4`: "Would you be able to participate if the event were delayed to May 3-4, 2025?" (Radio/Select: Yes/No/Maybe, Required) - Maps to `attendance_option` ENUM.
        *   `may_3_4_comment`: Optional comment if "Maybe" selected (Textarea, Optional).
    *   **Philosophical Background:**
        *   `prior_courses`: Prior philosophy courses taken (Multi-select Checkbox/Tag Input, Optional) - Maps to `text[]`. Include common options + "Other".
        *   `familiarity_analytic`: Self-assessed familiarity - Analytic Tradition (Scale 1-5, Required) - Maps to `integer`.
        *   `familiarity_continental`: Self-assessed familiarity - Continental Tradition (Scale 1-5, Required) - Maps to `integer`.
        *   `familiarity_other`: Self-assessed familiarity - Other Traditions (Scale 1-5, Required) - Maps to `integer`.
        *   `areas_of_interest`: Areas of philosophical interest beyond themes (Textarea, Optional).
    *   **Team Formation Preferences:**
        *   `preferred_working_style`: Preferred working style (Radio/Select: Structured/Exploratory/Balanced, Required) - Maps to `working_style` ENUM.
        *   `skill_writing`: Self-assessment - Writing (Scale 1-5, Required) - Maps to `integer`.
        *   `skill_speaking`: Self-assessment - Speaking (Scale 1-5, Required) - Maps to `integer`.
        *   `skill_research`: Self-assessment - Research (Scale 1-5, Required) - Maps to `integer`.
        *   `skill_synthesis`: Self-assessment - Synthesis (Scale 1-5, Required) - Maps to `integer`.
        *   `skill_critique`: Self-assessment - Critique (Scale 1-5, Required) - Maps to `integer`.
        *   `preferred_teammates`: "Is there anyone you'd particularly like to work with?" (Textarea, Optional).
        *   `complementary_perspectives`: "Are there any perspectives you feel would complement yours on a team?" (Textarea, Optional).
    *   **Technical Experience:**
        *   `familiarity_tech_concepts`: Familiarity with technology concepts relevant to themes (Scale 1-5, Required) - Maps to `integer`.
        *   `prior_hackathon_experience`: Prior experience with hackathons/similar events (Radio/Select: Yes/No, Required) - Maps to `boolean`.
        *   `prior_hackathon_details`: Optional details if "Yes" (Textarea, Optional).
    *   **Accessibility Planning:**
        *   `accessibility_needs`: Expanded questions regarding specific accommodations needed (Textarea, Optional - prompt should clarify confidentiality and purpose).
*   **FR-REG-006:** Basic client-side validation (e.g., required fields, email format) should provide immediate feedback.
*   **FR-REG-007:** Comprehensive server-side validation must be performed within the Server Action before database insertion.

### 2.3. Data Submission and Storage

*   **FR-REG-008:** Final form submission shall be handled by a Server Action (`createRegistration`).
*   **FR-REG-009:** The Server Action must validate all submitted data against defined rules (using Zod or similar).
*   **FR-REG-010:** Upon successful validation, the Server Action shall insert/update the registration data into the Supabase `registrations` table (or related `registration_details` table).
    *   *Data Model Reference:* See `memory-bank/mode-specific/architect.md` for `registrations` table structure and ENUM types.
*   **FR-REG-011:** The registration data must be linked to a user account. The Server Action will handle associating the data with an existing logged-in user OR initiating a sign-up process (e.g., Magic Link OTP) for a new user based on the provided email, linking the registration upon successful sign-up/sign-in. The Server Action should prevent duplicate registrations for the same email/user.
*   **FR-REG-012:** The Server Action shall return appropriate success or error states (including validation errors) to the client form using `useFormState`.
*   **FR-REG-013:** Upon successful submission and initiation of sign-up (if applicable) or successful data saving for a logged-in user, the user should be redirected to an appropriate next step page (e.g., "Check your email for login link", "Registration complete").

### 2.4. Confirmation

*   **FR-REG-014:** Upon successful registration submission, a confirmation email shall be triggered and sent to the user's registered email address.
    *   *Implementation Note:* This can be achieved via a Supabase Edge Function triggered by an insert/update on the `registrations` table, or directly within the `createRegistration` Server Action if an email service API is called. Triggering via Edge Function is generally preferred for decoupling.
*   **FR-REG-015:** The confirmation email content should acknowledge receipt of the registration and provide basic next steps or information. (Exact content TBD).

## 3. Implementation Details & Pseudocode

### 3.1. Data Models

*   Refer to `memory-bank/mode-specific/architect.md` for the detailed SQL definitions of the extended `registrations` table and related ENUM types (`attendance_option`, `working_style`).

### 3.2. Multi-Step Form Component (`src/app/register/components/RegistrationForm.tsx`)

```typescript
// src/app/register/components/RegistrationForm.tsx (Conceptual Pseudocode)
'use client';

import React, { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createRegistration } from '../actions'; // Server Action

// Define structure for form data state
type FormData = {
  // ... fields for step 1 (e.g., name, university)
  // ... fields for step 2 (e.g., date_flexibility, comments)
  // ... fields for step 3 (e.g., philosophical background)
  // ... etc.
  can_attend_may_3_4: 'yes' | 'no' | 'maybe' | null;
  may_3_4_comment: string;
  prior_courses: string[];
  // ... add all other fields from FR-REG-005
};

const initialState = { // For useFormState
  message: null,
  errors: {},
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? 'Submitting...' : 'Submit Registration'}</button>;
}

export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({}); // Store data across steps
  const [state, formAction] = useFormState(createRegistration, initialState);

  const totalSteps = 4; // Example: Adjust based on final step count

  const handleNext = () => {
    // Optional: Add client-side validation for the current step's fields here
    // if (!validateStep(currentStep, formData)) return;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
        // Handle multi-select checkbox for prior_courses
        const checkbox = e.target as HTMLInputElement;
        const currentCourses = formData.prior_courses || [];
        if (checkbox.checked) {
            setFormData(prev => ({ ...prev, prior_courses: [...currentCourses, value] }));
        } else {
            setFormData(prev => ({ ...prev, prior_courses: currentCourses.filter(course => course !== value) }));
        }
    } else if (type === 'radio') {
         // Ensure correct handling for radio buttons if used for single select enums
         setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Add handling for scale ratings (likely number input or custom component)
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // TDD: Test handleChange updates formData correctly for various input types.
  };

  // Render different form sections based on currentStep
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2>Step 1: Basic Information</h2>
            {/* Input fields for name, university, program, year */}
            {/* Example: */}
            <label htmlFor="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" onChange={handleChange} value={formData.full_name || ''} required />
            {/* Display validation errors from server: state.errors?.full_name */}
            {state.errors?.full_name && <p className="text-red-500">{state.errors.full_name[0]}</p>}
            {/* ... other fields for step 1 */}
          </div>
        );
      case 2:
        return (
          <div>
            <h2>Step 2: Availability & Background</h2>
             {/* Fields for date flexibility, prior courses, familiarity scales, interests */}
             <label>Attend May 3-4?</label>
             <select name="can_attend_may_3_4" onChange={handleChange} value={formData.can_attend_may_3_4 || ''} required>
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="maybe">Maybe</option>
             </select>
             {/* ... other fields ... */}
          </div>
        );
      case 3:
         return (
           <div>
             <h2>Step 3: Team Preferences</h2>
             {/* Fields for working style, skill self-assessment, teammate preferences */}
           </div>
         );
      case 4:
         return (
           <div>
             <h2>Step 4: Technical & Accessibility</h2>
             {/* Fields for tech familiarity, hackathon experience, accessibility needs */}
           </div>
         );
      default:
        return null;
    }
     // TDD: Test renderStepContent shows correct fields for each step.
  };

  return (
    <form action={formAction}>
      {/* Display overall form messages */}
      {state.message && !state.success && <p className="text-red-500">{state.message}</p>}
      {/* Consider success message display if not redirecting immediately */}

      {renderStepContent()}

      {/* Hidden fields to pass accumulated data if needed, or rely on Server Action closure */}
      {/* Example: <input type="hidden" name="allData" value={JSON.stringify(formData)} /> */}
      {/* Note: Passing all data on final step is simpler if Server Action handles merging */}
       {Object.entries(formData).map(([key, value]) => {
           // Render hidden inputs for all collected data on the final step
           // This ensures all data is submitted with the final form action
           if (currentStep === totalSteps) {
               if (Array.isArray(value)) {
                   // Handle array values (like prior_courses)
                   return value.map((item, index) => (
                       <input key={`${key}-${index}`} type="hidden" name={`${key}[${index}]`} value={item} />
                   ));
               } else if (value !== null && value !== undefined) {
                   return <input key={key} type="hidden" name={key} value={String(value)} />;
               }
           }
           return null;
       })}


      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        {currentStep > 1 && (
          <button type="button" onClick={handlePrevious}>Previous</button>
        )}
        {currentStep < totalSteps && (
          <button type="button" onClick={handleNext}>Next</button>
        )}
        {currentStep === totalSteps && (
          <SubmitButton />
        )}
      </div>
       {/* TDD: Test navigation buttons enable/disable correctly based on step. */}
       {/* TDD: Test Previous/Next buttons change the currentStep state. */}
    </form>
  );
}
```

### 3.3. Server Action (`src/app/register/actions.ts`)

```typescript
// src/app/register/actions.ts (Conceptual Pseudocode)
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod'; // For validation

// Define Zod schema matching FR-REG-005 and data model
const RegistrationSchema = z.object({
  // Basic Info (Assuming email/user_id comes from session)
  full_name: z.string().min(1, 'Full name is required'),
  university: z.string().min(1, 'University is required'),
  program: z.string().min(1, 'Program/Major is required'),
  year_of_study: z.coerce.number().int().min(1, 'Year of study is required'), // Coerce to number

  // Date Flexibility
  can_attend_may_3_4: z.enum(['yes', 'no', 'maybe']),
  may_3_4_comment: z.string().optional(),

  // Philosophical Background
  prior_courses: z.array(z.string()).optional(), // Assuming submitted as array
  familiarity_analytic: z.coerce.number().int().min(1).max(5),
  familiarity_continental: z.coerce.number().int().min(1).max(5),
  familiarity_other: z.coerce.number().int().min(1).max(5),
  areas_of_interest: z.string().optional(),

  // Team Formation Preferences
  preferred_working_style: z.enum(['structured', 'exploratory', 'balanced']),
  skill_writing: z.coerce.number().int().min(1).max(5),
  skill_speaking: z.coerce.number().int().min(1).max(5),
  skill_research: z.coerce.number().int().min(1).max(5),
  skill_synthesis: z.coerce.number().int().min(1).max(5),
  skill_critique: z.coerce.number().int().min(1).max(5),
  preferred_teammates: z.string().optional(),
  complementary_perspectives: z.string().optional(),

  // Technical Experience
  familiarity_tech_concepts: z.coerce.number().int().min(1).max(5),
  prior_hackathon_experience: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()), // Handle string 'true'/'false'
  prior_hackathon_details: z.string().optional(),

  // Accessibility
  accessibility_needs: z.string().optional(), // Marked as optional per user clarification
});

// Type for state used by useFormState
export type RegistrationState = {
  errors?: {
    // Add specific field errors + general error
    [key: string]: string[] | undefined;
     _form?: string[];
  };
  message?: string | null;
  success: boolean;
};

export async function createRegistration(
  previousState: RegistrationState,
  formData: FormData // Built-in FormData type
): Promise<RegistrationState> {
  const supabase = createServerClient();
  const headersList = headers(); // Need headers for origin in sign-up flow
  const origin = headersList.get('origin');

  // Extract email early for user check/sign-up
  const email = formData.get('email');
  if (!email || typeof email !== 'string' || !email.includes('@')) {
      // TDD: Test invalid email submitted.
      return { success: false, message: 'Invalid email address provided.' };
  }

  // --- User Handling ---
  let userId: string | null = null;
  let userJustSignedUp = false;

  // Check if user is already logged in
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (session) {
      userId = session.user.id;
      // Verify submitted email matches logged-in user's email? Optional, but good practice.
      if (session.user.email !== email) {
          // TDD: Test logged-in user submitting with different email.
          return { success: false, message: 'Email does not match logged-in user.' };
      }
  } else {
      // No active session, attempt sign-up with OTP (Magic Link)
      // This assumes we create the user account *during* registration submission
      const { data: signUpData, error: signUpError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
              shouldCreateUser: true, // Create user if they don't exist
              emailRedirectTo: `${origin}/api/auth/callback?next=/register/pending`, // Redirect back to a pending page after login
              // We might need to pass registration data through the callback or store temporarily
              // data: { registration_data: validatedFields.data } // Supabase data option (check if supported/secure)
          },
      });

      if (signUpError) {
          // TDD: Test sign-up error handling (e.g., network, Supabase issue).
          console.error("Sign Up Error:", signUpError);
          return { success: false, message: `Could not initiate sign-up: ${signUpError.message}` };
      }
      // If signUpData.user exists, they might have been logged in immediately (unlikely with OTP)
      // or already existed. If signUpData.user is null, OTP email was sent.
      // We cannot get the userId *yet* if a new user was created via OTP.
      // We need to handle saving registration data potentially *before* user confirms email.
      // Option A: Save registration data temporarily (e.g., another table with token) and link on callback.
      // Option B: Save registration data with only email, link user_id later via trigger/manual process.
      // Option C (Simpler for now, but less ideal): Save registration data *without* user_id initially, rely on email matching later.
      // Let's proceed with Option C for this draft, noting its limitations.
      userJustSignedUp = true; // Flag that OTP was sent
      // TDD: Test new user sign-up path (OTP sent).
  }

  // If we have a userId (logged-in user), check for existing registration
  if (userId) {
      const { data: existingReg, error: checkError } = await supabase
          .from('registrations')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

      if (checkError) {
          // TDD: Test handling of database error during existing registration check (logged-in).
          console.error("Registration Check Error:", checkError);
          return { success: false, message: 'Database error checking registration status.' };
      }
      if (existingReg) {
          // TDD: Test handling when logged-in user has already registered.
          return { success: false, message: 'You have already registered.' };
      }
  } else if (!userJustSignedUp) {
      // This case shouldn't be reachable if logic above is correct, but acts as a safeguard.
      return { success: false, message: 'User identification failed.' };
  }

  // --- Data Validation & Processing ---
  // Extract and structure data from FormData (as before)
  const rawData = Object.fromEntries(formData.entries());
  const processedData = {
      ...rawData,
      year_of_study: rawData.year_of_study ? parseInt(String(rawData.year_of_study), 10) : undefined,
      prior_courses: formData.getAll('prior_courses'), // Use getAll for array fields
      familiarity_analytic: rawData.familiarity_analytic ? parseInt(String(rawData.familiarity_analytic), 10) : undefined,
      familiarity_continental: rawData.familiarity_continental ? parseInt(String(rawData.familiarity_continental), 10) : undefined,
      familiarity_other: rawData.familiarity_other ? parseInt(String(rawData.familiarity_other), 10) : undefined,
      skill_writing: rawData.skill_writing ? parseInt(String(rawData.skill_writing), 10) : undefined,
      skill_speaking: rawData.skill_speaking ? parseInt(String(rawData.skill_speaking), 10) : undefined,
      skill_research: rawData.skill_research ? parseInt(String(rawData.skill_research), 10) : undefined,
      skill_synthesis: rawData.skill_synthesis ? parseInt(String(rawData.skill_synthesis), 10) : undefined,
      skill_critique: rawData.skill_critique ? parseInt(String(rawData.skill_critique), 10) : undefined,
      familiarity_tech_concepts: rawData.familiarity_tech_concepts ? parseInt(String(rawData.familiarity_tech_concepts), 10) : undefined,
      prior_hackathon_experience: String(rawData.prior_hackathon_experience).toLowerCase() === 'true',
  };


  // Validate data using Zod
  const validatedFields = RegistrationSchema.safeParse(processedData);

  if (!validatedFields.success) {
    console.log("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    // TDD: Test validation failure returns correct error structure.
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  // Prepare data for Supabase (conditionally add user_id)
  const registrationData: any = { // Use 'any' temporarily, define proper type later
    ...validatedFields.data,
    email: email, // Store email directly in registration for matching if user_id is missing initially
  };
  if (userId) {
    registrationData.user_id = userId;
  }

  // Insert data into Supabase
  try {
    const { error } = await supabase.from('registrations').insert(registrationData);

    if (error) throw error;

    // Revalidate relevant paths if needed (e.g., admin view)
    revalidatePath('/admin/registrations'); // Example

    // TDD: Test successful insertion.
    // No need to return state if redirecting immediately
    // return { success: true, message: 'Registration successful!' };

  } catch (e: any) {
    console.error('Registration Insert Error:', e);
    // TDD: Test database insertion error handling.
    return { success: false, message: `Database Error: Failed to save registration. ${e.message}` };
  }

  // Redirect based on whether user just signed up or was already logged in
  if (userJustSignedUp) {
      // TDD: Test redirect for new user sign-up (pending email confirmation).
      redirect('/register/pending'); // Redirect to a page saying "Check your email"
  } else {
      // TDD: Test redirect for already logged-in user.
      redirect('/register/success'); // Redirect to a success page (e.g., dashboard)
  }
}

```

### 3.4. Confirmation Email Trigger

*   **Option 1 (Preferred): Supabase Edge Function**
    *   Create an Edge Function triggered on `INSERT` into the `registrations` table.
    *   The function receives the new registration record.
    *   It fetches the user's email from `auth.users` using the `user_id`.
    *   It calls an email service API (e.g., Resend, SendGrid) to send the confirmation email.
    *   *Pseudocode TBD - Requires Deno/TypeScript for Edge Functions.*
    *   *TDD Anchors:* Test function trigger, email fetching, email service API call success/error.
*   **Option 2: Within Server Action**
    *   After successful database insertion in `createRegistration`, call the email service API directly.
    *   *Pro:* Simpler setup initially.
    *   *Con:* Tightly couples email sending to the registration action, less resilient if email service fails.

## 4. TDD Anchors Summary

*   **Registration Form Component:**
    *   Test `handleChange` updates `formData` correctly for various input types (text, select, textarea, checkbox array, radio, number).
    *   Test `renderStepContent` shows the correct fields for each step number.
    *   Test navigation buttons (`Previous`, `Next`, `Submit`) enable/disable correctly based on the current step.
    *   Test `Previous`/`Next` button clicks update the `currentStep` state.
    *   Test display of server-side validation errors passed via `useFormState`.
    *   Test display of general success/error messages from `useFormState`.
*   **`createRegistration` Server Action:**
    *   Test invalid email submission.
    *   Test handling when an existing logged-in user submits (success path, duplicate check).
    *   Test handling when a new user submits (OTP initiated, data saved potentially without user_id).
    *   Test handling sign-up errors from Supabase.
    *   Test handling of database error during existing registration check (logged-in user).
    *   Test handling when a logged-in user has already registered (returns error).
    *   Test validation failure returns the correct error structure (`success: false`, `errors` object).
    *   Test successful validation and data preparation.
    *   Test successful insertion into the `registrations` table (with or without user_id).
    *   Test database insertion error handling (returns `success: false`, `message`).
    *   Test correct redirect path based on new user vs. logged-in user (mock `redirect`).
*   **Confirmation Email Trigger (Edge Function or Action):**
    *   Test that the trigger fires on new registration insert (if using Edge Function).
    *   Test fetching the correct user email.
    *   Test calling the email service API with correct parameters.
    *   Test handling of errors from the email service API.

## 5. Open Questions / TBD

*   Final grouping and number of steps for the multi-step form UI.
*   Specific wording and options for multi-select/scale fields (e.g., list of common courses).
*   Exact content of the confirmation email.
*   Decision on trigger mechanism for confirmation email (Edge Function vs. Server Action).
*   Handling of potential updates to registration data (allow users to edit after submission?). P0 assumes insert-only.
*   Refinement of user sign-up flow within registration (e.g., how to link user_id if sign-up happens via OTP after initial data save). Option C (email matching) is a temporary simplification.