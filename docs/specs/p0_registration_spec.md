# P0 Feature Specification: Registration System (Revised)

**Version:** 1.1
**Date:** 2025-04-20
**Status:** Draft

## 1. Overview

This document specifies the functional requirements and implementation details for the built-in Registration System for the Philosothon Platform V2, focusing on Priority 0 (P0) features. It replaces the previous Google Forms embed. It builds upon Requirement 3.2 in project_specifications_v2.md and the decisions outlined in 2025-04-19-v2-registration-system.md.

## 2. Functional Requirements

### 2.1. Form Structure and Flow

*   **FR-REG-001:** The platform shall provide a built-in registration form accessible via the `/register` route.
*   **FR-REG-002:** The registration form shall be presented as a multi-step process to manage the number of fields and improve user experience.
    *   *Implementation Note:* Organize into logical steps: Personal Info, Philosophical Background, Theme & Workshop Preferences, Team Formation Preferences, Accessibility/Additional Info.
*   **FR-REG-003:** Client-side state management shall be used to maintain form data across steps before final submission.
*   **FR-REG-004:** The registration form shall be accessible to unauthenticated users. The process itself will handle user sign-up or association with an existing logged-in user.

### 2.2. Required Fields and Validation (Req 3.2.4)

*   **FR-REG-005:** The form must collect the following fields, with appropriate input types and basic validation:
    *   **Basic Info:**
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
        *   `discussion_confidence`: Self-assessed confidence in philosophical discussion (Scale 1-10, Required) - Maps to `integer`
          * *Implementation Note:* Include descriptive tooltips:
            * 1 = "I have achieved Socratic wisdom (knowing I know nothing)"
            * 5 = "I can hold my own unless someone brings up Kripke semantics"
            * 10 = "I am prepared to argue that this scale itself is metaphysically suspect"
        *   `writing_confidence`: Self-assessed confidence in philosophical writing (Scale 1-10, Required) - Maps to `integer`
          * *Implementation Note:* Include descriptive tooltips:
            * 1 = "My prose style is best described as 'early Wittgenstein'"
            * 5 = "I can construct a coherent argument, provided sufficient caffeine"
            * 10 = "My footnotes have footnotes"
        *   `familiarity_analytic`: Self-assessed familiarity - Analytic Tradition (Scale 1-5, Required) - Maps to `integer`.
        *   `familiarity_continental`: Self-assessed familiarity - Continental Tradition (Scale 1-5, Required) - Maps to `integer`.
        *   `familiarity_other`: Self-assessed familiarity - Other Traditions (Scale 1-5, Required) - Maps to `integer`.
        *   `philosophical_traditions`: Philosophical traditions familiar with (Checkbox array, Required) - Maps to `text[]`
          * Options: analytic, continental, ancient, medieval, modern, non_western, new_to_philosophy, other
        *   `philosophical_interests`: Areas of philosophical interest (Checkbox array, Required) - Maps to `text[]`
          * Options: metaphysics, epistemology, ethics, political_philosophy, philosophy_of_mind, philosophy_of_language, philosophy_of_technology, philosophy_of_science, aesthetics, phenomenology, logic, existentialism, post_structuralism, critical_theory, feminist_philosophy, environmental_philosophy, other
        *   `areas_of_interest`: Areas of philosophical interest beyond themes (Textarea, Optional).
        
    *   **Theme and Workshop Preferences:**
        * `theme_rankings`: Ranked preferences for themes (JSON Array, Required)
          * *Implementation Note:* Implement as a drag-and-drop interface or numeric selection for 8 predefined themes
          * Structure: `[{"rank": 1, "theme_id": "minds_machines"}, {"rank": 2, "theme_id": "digital_commons"}, ...]`
        * `theme_suggestion`: Suggested alternative theme (Textarea, Optional)
        * `workshop_rankings`: Ranked preferences for workshops (JSON Array, Required)
          * *Implementation Note:* Implement as a drag-and-drop interface or numeric selection; user must rank at least 3 workshops
          * Validation should ensure at least 3 workshops receive rankings
          * Structure: Similar to theme_rankings
        
    *   **Team Formation Preferences:**
        *   `preferred_working_style`: Preferred working style (Radio/Select: Structured/Exploratory/Balanced, Required) - Maps to `working_style` ENUM.
        *   `teammate_similarity`: Preference for teammate similarity (Scale 1-10, Required) - Maps to `integer`
          * 1 = Prefer teammates with different interests
          * 10 = Prefer teammates with similar interests
        *   `skill_writing`: Self-assessment - Writing (Scale 1-5, Required) - Maps to `integer`.
        *   `skill_speaking`: Self-assessment - Speaking (Scale 1-5, Required) - Maps to `integer`.
        *   `skill_research`: Self-assessment - Research (Scale 1-5, Required) - Maps to `integer`.
        *   `skill_synthesis`: Self-assessment - Synthesis (Scale 1-5, Required) - Maps to `integer`.
        *   `skill_critique`: Self-assessment - Critique (Scale 1-5, Required) - Maps to `integer`.
        *   `mentorship_preference`: Mentorship role preference (Select: mentor/mentee/no_preference, Optional) - Maps to `mentorship_role` ENUM
        *   `mentorship_areas`: Areas comfortable mentoring in (Textarea, Optional)
          * *Implementation Note:* Only display if mentorship_preference = 'mentor'
        *   `preferred_teammates`: "Is there anyone you'd particularly like to work with?" (Textarea, Optional).
        *   `complementary_perspectives`: "Are there any perspectives you feel would complement yours on a team?" (Textarea, Optional).
        
    *   **Technical Experience & Accessibility:**
        *   `familiarity_tech_concepts`: Familiarity with technology concepts relevant to themes (Scale 1-5, Required) - Maps to `integer`.
        *   `prior_hackathon_experience`: Prior experience with hackathons/similar events (Radio/Select: Yes/No, Required) - Maps to `boolean`.
        *   `prior_hackathon_details`: Optional details if "Yes" (Textarea, Optional).
        *   `dietary_restrictions`: Dietary needs or preferences (Textarea, Optional)
        *   `accessibility_needs`: Expanded questions regarding specific accommodations needed (Textarea, Optional - prompt should clarify confidentiality and purpose).
        *   `additional_notes`: Any other information to share (Textarea, Optional)
        *   `how_heard`: How participant heard about the event (Select + Other option, Required) - Maps to `referral_source` ENUM
          * Options: email, professor, friend, department, social_media, other
          
*   **FR-REG-006:** Basic client-side validation (e.g., required fields, email format) should provide immediate feedback.
*   **FR-REG-007:** Comprehensive server-side validation must be performed within the Server Action before database insertion.

### 2.3. Data Submission and Storage

*   **FR-REG-008:** Final form submission shall be handled by a Server Action (`createRegistration`).
*   **FR-REG-009:** The Server Action must validate all submitted data against defined rules (using Zod or similar).
*   **FR-REG-010:** Upon successful validation, the Server Action shall insert/update the registration data into the Supabase `registrations` table (or related `registration_details` table).
    *   *Data Model Reference:* See architect.md for `registrations` table structure and ENUM types.
    *   *Implementation Note:* Additional ENUM types required:
      ```sql
      CREATE TYPE mentorship_role AS ENUM ('mentor', 'mentee', 'no_preference');
      CREATE TYPE referral_source AS ENUM ('email', 'professor', 'friend', 'department', 'social_media', 'other');
      ```
*   **FR-REG-011:** The registration data must be linked to a user account. The Server Action will handle associating the data with an existing logged-in user OR initiating a sign-up process (e.g., Magic Link OTP) for a new user based on the provided email, linking the registration upon successful sign-up/sign-in. The Server Action should prevent duplicate registrations for the same email/user.
*   **FR-REG-012:** The Server Action shall return appropriate success or error states (including validation errors) to the client form using `useFormState`.
*   **FR-REG-013:** Upon successful submission and initiation of sign-up (if applicable) or successful data saving for a logged-in user, the user should be redirected to an appropriate next step page (e.g., "Check your email for login link", "Registration complete").

### 2.4. Confirmation

*   **FR-REG-014:** Upon successful registration submission, a confirmation email shall be triggered and sent to the user's registered email address.
    *   *Implementation Note:* This can be achieved via a Supabase Edge Function triggered by an insert/update on the `registrations` table, or directly within the `createRegistration` Server Action if an email service API is called. Triggering via Edge Function is generally preferred for decoupling.
*   **FR-REG-015:** The confirmation email content should acknowledge receipt of the registration and provide basic next steps or information. (Exact content TBD).

## 3. Implementation Details & Pseudocode

### 3.1. Data Models

*   Refer to architect.md for the detailed SQL definitions of the extended `registrations` table and related ENUM types.
*   Additional table modifications needed:
    ```sql
    ALTER TABLE registrations ADD COLUMN discussion_confidence INTEGER NOT NULL;
    ALTER TABLE registrations ADD COLUMN writing_confidence INTEGER NOT NULL;
    ALTER TABLE registrations ADD COLUMN philosophical_traditions TEXT[] NOT NULL;
    ALTER TABLE registrations ADD COLUMN philosophical_interests TEXT[] NOT NULL;
    ALTER TABLE registrations ADD COLUMN theme_rankings JSONB NOT NULL;
    ALTER TABLE registrations ADD COLUMN theme_suggestion TEXT;
    ALTER TABLE registrations ADD COLUMN workshop_rankings JSONB NOT NULL;
    ALTER TABLE registrations ADD COLUMN teammate_similarity INTEGER NOT NULL;
    ALTER TABLE registrations ADD COLUMN mentorship_preference mentorship_role;
    ALTER TABLE registrations ADD COLUMN mentorship_areas TEXT;
    ALTER TABLE registrations ADD COLUMN dietary_restrictions TEXT;
    ALTER TABLE registrations ADD COLUMN how_heard referral_source NOT NULL;
    ALTER TABLE registrations ADD COLUMN how_heard_other TEXT;
    ```

### 3.2. Multi-Step Form Component (`src/app/register/components/RegistrationForm.tsx`)

```typescript
// src/app/register/components/RegistrationForm.tsx (Conceptual Pseudocode)
'use client';

import React, { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createRegistration } from '../actions'; // Server Action

// Define structure for form data state
type FormData = {
  // Basic Info
  full_name: string;
  university: string;
  program: string;
  year_of_study: number;
  
  // Date Flexibility
  can_attend_may_3_4: 'yes' | 'no' | 'maybe' | null;
  may_3_4_comment: string;
  
  // Philosophical Background
  prior_courses: string[];
  discussion_confidence: number;
  writing_confidence: number;
  familiarity_analytic: number;
  familiarity_continental: number;
  familiarity_other: number;
  philosophical_traditions: string[];
  philosophical_interests: string[];
  areas_of_interest: string;
  
  // Theme and Workshop Preferences
  theme_rankings: Array<{rank: number, theme_id: string}>;
  theme_suggestion: string;
  workshop_rankings: Array<{rank: number, workshop_id: string}>;
  
  // Team Formation Preferences
  preferred_working_style: 'structured' | 'exploratory' | 'balanced';
  teammate_similarity: number;
  skill_writing: number;
  skill_speaking: number;
  skill_research: number;
  skill_synthesis: number;
  skill_critique: number;
  mentorship_preference?: 'mentor' | 'mentee' | 'no_preference';
  mentorship_areas?: string;
  preferred_teammates: string;
  complementary_perspectives: string;
  
  // Technical Experience & Accessibility
  familiarity_tech_concepts: number;
  prior_hackathon_experience: boolean;
  prior_hackathon_details: string;
  dietary_restrictions: string;
  accessibility_needs: string;
  additional_notes: string;
  how_heard: 'email' | 'professor' | 'friend' | 'department' | 'social_media' | 'other';
  how_heard_other: string;
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

  const totalSteps = 5; // Adjust based on final step count

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
        // Handle multi-select checkbox for array fields like prior_courses, philosophical_traditions, etc.
        const checkbox = e.target as HTMLInputElement;
        const currentValues = formData[name as keyof typeof formData] as string[] || [];
        if (checkbox.checked) {
            setFormData(prev => ({ ...prev, [name]: [...currentValues, value] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: currentValues.filter(val => val !== value) }));
        }
    } else if (type === 'radio') {
         // Ensure correct handling for radio buttons if used for single select enums
         setFormData(prev => ({ ...prev, [name]: value }));
    } else if (type === 'number' || name.includes('confidence') || name.includes('familiarity') || name.includes('skill')) {
        // Handle numeric inputs including scales
        setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // TDD: Test handleChange updates formData correctly for various input types.
  };

  // Special handler for theme and workshop rankings
  const handleRankingChange = (type: 'theme' | 'workshop', id: string, rank: number) => {
    const rankingField = `${type}_rankings` as const;
    const currentRankings = formData[rankingField] || [];
    
    // Find if this id already has a ranking
    const existingIndex = currentRankings.findIndex(item => item.theme_id === id || item.workshop_id === id);
    
    if (existingIndex >= 0) {
      // Update existing ranking
      const updatedRankings = [...currentRankings];
      updatedRankings[existingIndex] = { 
        rank, 
        [`${type}_id`]: id
      };
      setFormData(prev => ({ ...prev, [rankingField]: updatedRankings }));
    } else {
      // Add new ranking
      setFormData(prev => ({ 
        ...prev, 
        [rankingField]: [...currentRankings, { rank, [`${type}_id`]: id }]
      }));
    }
  };

  // Render different form sections based on currentStep
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2>Step 1: Basic Information</h2>
            <label htmlFor="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" onChange={handleChange} value={formData.full_name || ''} required />
            {state.errors?.full_name && <p className="text-red-500">{state.errors.full_name[0]}</p>}
            
            <label htmlFor="university">University/Institution</label>
            <input type="text" id="university" name="university" onChange={handleChange} value={formData.university || ''} required />
            {state.errors?.university && <p className="text-red-500">{state.errors.university[0]}</p>}
            
            <label htmlFor="program">Program/Major</label>
            <input type="text" id="program" name="program" onChange={handleChange} value={formData.program || ''} required />
            {state.errors?.program && <p className="text-red-500">{state.errors.program[0]}</p>}
            
            <label htmlFor="year_of_study">Year of Study</label>
            <select id="year_of_study" name="year_of_study" onChange={handleChange} value={formData.year_of_study || ''} required>
              <option value="">Select Year...</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
              <option value="3">Third Year</option>
              <option value="4">Fourth Year</option>
              <option value="5">Graduate Student</option>
            </select>
            {state.errors?.year_of_study && <p className="text-red-500">{state.errors.year_of_study[0]}</p>}
            
            <h3>Date Flexibility</h3>
            <label>Would you be able to participate if the event were delayed to May 3-4, 2025?</label>
            <select name="can_attend_may_3_4" onChange={handleChange} value={formData.can_attend_may_3_4 || ''} required>
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="maybe">Maybe</option>
            </select>
            {state.errors?.can_attend_may_3_4 && <p className="text-red-500">{state.errors.can_attend_may_3_4[0]}</p>}
            
            {formData.can_attend_may_3_4 === 'maybe' && (
              <>
                <label htmlFor="may_3_4_comment">Please explain:</label>
                <textarea id="may_3_4_comment" name="may_3_4_comment" onChange={handleChange} value={formData.may_3_4_comment || ''} />
              </>
            )}
          </div>
        );
        
      case 2:
        return (
          <div>
            <h2>Step 2: Philosophical Background</h2>
            
            <label>Prior philosophy courses taken:</label>
            <div className="checkbox-group">
              {/* Common courses as checkboxes */}
              <label><input type="checkbox" name="prior_courses" value="intro_philosophy" onChange={handleChange} checked={formData.prior_courses?.includes('intro_philosophy')} /> Introduction to Philosophy</label>
              <label><input type="checkbox" name="prior_courses" value="ethics" onChange={handleChange} checked={formData.prior_courses?.includes('ethics')} /> Ethics</label>
              {/* Add more common course options */}
              <label><input type="checkbox" name="prior_courses" value="other" onChange={handleChange} checked={formData.prior_courses?.includes('other')} /> Other</label>
            </div>
            
            <label htmlFor="discussion_confidence">Confidence in philosophical discussion (1-10):</label>
            <div className="scale-description">
              <span className="scale-min">1 = I have achieved Socratic wisdom (knowing I know nothing)</span>
              <span className="scale-max">10 = I am prepared to argue that this scale itself is metaphysically suspect</span>
            </div>
            <input 
              type="range" 
              id="discussion_confidence" 
              name="discussion_confidence" 
              min="1" 
              max="10" 
              onChange={handleChange} 
              value={formData.discussion_confidence || 5} 
              required 
            />
            <output>{formData.discussion_confidence || 5}</output>
            
            <label htmlFor="writing_confidence">Confidence in philosophical writing (1-10):</label>
            <div className="scale-description">
              <span className="scale-min">1 = My prose style is best described as 'early Wittgenstein'</span>
              <span className="scale-max">10 = My footnotes have footnotes</span>
            </div>
            <input 
              type="range" 
              id="writing_confidence" 
              name="writing_confidence" 
              min="1" 
              max="10" 
              onChange={handleChange} 
              value={formData.writing_confidence || 5} 
              required 
            />
            <output>{formData.writing_confidence || 5}</output>
            
            <label htmlFor="familiarity_analytic">Familiarity with Analytic Tradition (1-5):</label>
            <input 
              type="range" 
              id="familiarity_analytic" 
              name="familiarity_analytic" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.familiarity_analytic || 3} 
              required 
            />
            <output>{formData.familiarity_analytic || 3}</output>
            
            <label htmlFor="familiarity_continental">Familiarity with Continental Tradition (1-5):</label>
            <input 
              type="range" 
              id="familiarity_continental" 
              name="familiarity_continental" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.familiarity_continental || 3} 
              required 
            />
            <output>{formData.familiarity_continental || 3}</output>
            
            <label htmlFor="familiarity_other">Familiarity with Other Traditions (1-5):</label>
            <input 
              type="range" 
              id="familiarity_other" 
              name="familiarity_other" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.familiarity_other || 3} 
              required 
            />
            <output>{formData.familiarity_other || 3}</output>
            
            <label>Philosophical traditions you're familiar with:</label>
            <div className="checkbox-group">
              <label><input type="checkbox" name="philosophical_traditions" value="analytic" onChange={handleChange} checked={formData.philosophical_traditions?.includes('analytic')} /> Analytic</label>
              <label><input type="checkbox" name="philosophical_traditions" value="continental" onChange={handleChange} checked={formData.philosophical_traditions?.includes('continental')} /> Continental</label>
              <label><input type="checkbox" name="philosophical_traditions" value="ancient" onChange={handleChange} checked={formData.philosophical_traditions?.includes('ancient')} /> Ancient</label>
              <label><input type="checkbox" name="philosophical_traditions" value="medieval" onChange={handleChange} checked={formData.philosophical_traditions?.includes('medieval')} /> Medieval</label>
              <label><input type="checkbox" name="philosophical_traditions" value="modern" onChange={handleChange} checked={formData.philosophical_traditions?.includes('modern')} /> Modern</label>
              <label><input type="checkbox" name="philosophical_traditions" value="non_western" onChange={handleChange} checked={formData.philosophical_traditions?.includes('non_western')} /> Non-Western</label>
              <label><input type="checkbox" name="philosophical_traditions" value="new_to_philosophy" onChange={handleChange} checked={formData.philosophical_traditions?.includes('new_to_philosophy')} /> New to philosophy</label>
              <label><input type="checkbox" name="philosophical_traditions" value="other" onChange={handleChange} checked={formData.philosophical_traditions?.includes('other')} /> Other</label>
            </div>
            
            <label>Areas of philosophical interest:</label>
            <div className="checkbox-group">
              {/* Add philosophical interest checkboxes similar to traditions */}
              <label><input type="checkbox" name="philosophical_interests" value="metaphysics" onChange={handleChange} checked={formData.philosophical_interests?.includes('metaphysics')} /> Metaphysics</label>
              <label><input type="checkbox" name="philosophical_interests" value="epistemology" onChange={handleChange} checked={formData.philosophical_interests?.includes('epistemology')} /> Epistemology</label>
              {/* Add more options for all interests listed in FR-REG-005 */}
            </div>
            
            <label htmlFor="areas_of_interest">Other areas of philosophical interest:</label>
            <textarea 
              id="areas_of_interest" 
              name="areas_of_interest" 
              onChange={handleChange} 
              value={formData.areas_of_interest || ''} 
            />
          </div>
        );
        
      case 3:
        return (
          <div>
            <h2>Step 3: Theme & Workshop Preferences</h2>
            
            <h3>Theme Rankings</h3>
            <p>Please rank your preferred themes:</p>
            
            {/* Simplified representation - actual implementation would use a drag-and-drop library or custom ranking UI */}
            <div className="theme-ranking">
              {THEMES.map(theme => (
                <div key={theme.id} className="theme-item">
                  <span>{theme.title}</span>
                  <select 
                    onChange={(e) => handleRankingChange('theme', theme.id, parseInt(e.target.value, 10))}
                    value={formData.theme_rankings?.find(t => t.theme_id === theme.id)?.rank || ''}
                  >
                    <option value="">--</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {state.errors?.theme_rankings && <p className="text-red-500">{state.errors.theme_rankings[0]}</p>}
            
            <label htmlFor="theme_suggestion">Suggest an alternative theme:</label>
            <textarea 
              id="theme_suggestion" 
              name="theme_suggestion" 
              onChange={handleChange} 
              value={formData.theme_suggestion || ''} 
            />
            
            <h3>Workshop Rankings</h3>
            <p>Please rank at least 3 workshops you're interested in:</p>
            
            {/* Similar ranking UI for workshops */}
            <div className="workshop-ranking">
              {WORKSHOPS.map(workshop => (
                <div key={workshop.id} className="workshop-item">
                  <span>{workshop.title}</span>
                  <select 
                    onChange={(e) => handleRankingChange('workshop', workshop.id, parseInt(e.target.value, 10))}
                    value={formData.workshop_rankings?.find(w => w.workshop_id === workshop.id)?.rank || ''}
                  >
                    <option value="">--</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {state.errors?.workshop_rankings && <p className="text-red-500">{state.errors.workshop_rankings[0]}</p>}
          </div>
        );
        
      case 4:
        return (
          <div>
            <h2>Step 4: Team Formation Preferences</h2>
            
            <label>Preferred working style:</label>
            <select name="preferred_working_style" onChange={handleChange} value={formData.preferred_working_style || ''} required>
              <option value="">Select...</option>
              <option value="structured">Structured (Clear plan, defined roles)</option>
              <option value="exploratory">Exploratory (Flexible, evolving approach)</option>
              <option value="balanced">Balanced (Mix of structure and exploration)</option>
            </select>
            {state.errors?.preferred_working_style && <p className="text-red-500">{state.errors.preferred_working_style[0]}</p>}
            
            <label htmlFor="teammate_similarity">Teammate similarity preference (1-10):</label>
            <div className="scale-description">
              <span className="scale-min">1 = Prefer teammates with very different interests</span>
              <span className="scale-max">10 = Prefer teammates with very similar interests</span>
            </div>
            <input 
              type="range" 
              id="teammate_similarity" 
              name="teammate_similarity" 
              min="1" 
              max="10" 
              onChange={handleChange} 
              value={formData.teammate_similarity || 5} 
              required 
            />
            <output>{formData.teammate_similarity || 5}</output>
            
            <h3>Self-Assessment of Skills (1-5)</h3>
            
            <label htmlFor="skill_writing">Writing:</label>
            <input 
              type="range" 
              id="skill_writing" 
              name="skill_writing" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.skill_writing || 3} 
              required 
            />
            <output>{formData.skill_writing || 3}</output>
            
            <label htmlFor="skill_speaking">Speaking:</label>
            <input 
              type="range" 
              id="skill_speaking" 
              name="skill_speaking" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.skill_speaking || 3} 
              required 
            />
            <output>{formData.skill_speaking || 3}</output>
            
            <label htmlFor="skill_research">Research:</label>
            <input 
              type="range" 
              id="skill_research" 
              name="skill_research" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.skill_research || 3} 
              required 
            />
            <output>{formData.skill_research || 3}</output>
            
            <label htmlFor="skill_synthesis">Synthesis:</label>
            <input 
              type="range" 
              id="skill_synthesis" 
              name="skill_synthesis" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.skill_synthesis || 3} 
              required 
            />
            <output>{formData.skill_synthesis || 3}</output>
            
            <label htmlFor="skill_critique">Critique:</label>
            <input 
              type="range" 
              id="skill_critique" 
              name="skill_critique" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.skill_critique || 3} 
              required 
            />
            <output>{formData.skill_critique || 3}</output>
            
            <h3>Mentorship Program (Optional)</h3>
            <p>Would you be interested in our optional mentorship program?</p>
            <select name="mentorship_preference" onChange={handleChange} value={formData.mentorship_preference || ''}>
              <option value="">Not interested</option>
              <option value="mentor">I'd like to be a mentor</option>
              <option value="mentee">I'd like to be a mentee</option>
              <option value="no_preference">Interested, no specific preference</option>
            </select>
            
            {formData.mentorship_preference === 'mentor' && (
              <>
                <label htmlFor="mentorship_areas">Areas you're comfortable mentoring in:</label>
                <textarea 
                  id="mentorship_areas" 
                  name="mentorship_areas" 
                  onChange={handleChange} 
                  value={formData.mentorship_areas || ''} 
                />
              </>
            )}
            
            <label htmlFor="preferred_teammates">Is there anyone you'd particularly like to work with?</label>
            <textarea 
              id="preferred_teammates" 
              name="preferred_teammates" 
              onChange={handleChange} 
              value={formData.preferred_teammates || ''} 
            />
            
            <label htmlFor="complementary_perspectives">Are there any perspectives you feel would complement yours on a team?</label>
            <textarea 
              id="complementary_perspectives" 
              name="complementary_perspectives" 
              onChange={handleChange} 
              value={formData.complementary_perspectives || ''} 
            />
          </div>
        );
        
      case 5:
        return (
          <div>
            <h2>Step 5: Technical Experience & Accessibility</h2>
            
            <label htmlFor="familiarity_tech_concepts">Familiarity with technology concepts (1-5):</label>
            <input 
              type="range" 
              id="familiarity_tech_concepts" 
              name="familiarity_tech_concepts" 
              min="1" 
              max="5" 
              onChange={handleChange} 
              value={formData.familiarity_tech_concepts || 3} 
              required 
            />
            <output>{formData.familiarity_tech_concepts || 3}</output>
            
            <label>Prior hackathon experience:</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="prior_hackathon_experience" 
                  value="true" 
                  onChange={handleChange} 
                  checked={formData.prior_hackathon_experience === true} 
                  required 
                /> Yes
              </label>
              <label>
                <input 
                  type="radio" 
                  name="prior_hackathon_experience" 
                  value="false" 
                  onChange={handleChange} 
                  checked={formData.prior_hackathon_experience === false} 
                  required 
                /> No
              </label>
            </div>
            
            {formData.prior_hackathon_experience === true && (
              <>
                <label htmlFor="prior_hackathon_details">Please describe your hackathon experience:</label>
                <textarea 
                  id="prior_hackathon_details" 
                  name="prior_hackathon_details" 
                  onChange={handleChange} 
                  value={formData.prior_hackathon_details || ''} 
                />
              </>
            )}
            
            <label htmlFor="dietary_restrictions">Dietary restrictions or preferences:</label>
            <textarea 
              id="dietary_restrictions" 
              name="dietary_restrictions" 
              onChange={handleChange} 
              value={formData.dietary_restrictions || ''} 
            />
            
            <label htmlFor="accessibility_needs">Do you require any accessibility accommodations?</label>
            <p className="help-text">This information will be kept confidential and used only to ensure your full participation in the event.</p>
            <textarea 
              id="accessibility_needs" 
              name="accessibility_needs" 
              onChange={handleChange} 
              value={formData.accessibility_needs || ''} 
            />
            
            <label htmlFor="additional_notes">Anything else you'd like us to know?</label>
            <textarea 
              id="additional_notes" 
              name="additional_notes" 
              onChange={handleChange} 
              value={formData.additional_notes || ''} 
            />
            
            <label>How did you hear about the Philosothon?</label>
            <select name="how_heard" onChange={handleChange} value={formData.how_heard || ''} required>
              <option value="">Select...</option>
              <option value="email">Email announcement</option>
              <option value="professor">From a professor</option>
              <option value="friend">From a friend/classmate</option>
              <option value="department">Philosophy department communication</option>
              <option value="social_media">Social media</option>
              <option value="other">Other</option>
            </select>
            
            {formData.how_heard === 'other' && (
              <>
                <label htmlFor="how_heard_other">Please specify:</label>
                <input 
                  type="text" 
                  id="how_heard_other" 
                  name="how_heard_other" 
                  onChange={handleChange} 
                  value={formData.how_heard_other || ''} 
                  required 
                />
              </>
            )}
          </div>
        );
      default:
        return null;
    }
     // TDD: Test renderStepContent shows correct fields for each step.
  };

  // Add variables for theme/workshop data that would come from server or context
  const THEMES = [
    { id: 'minds_machines', title: 'Minds and Machines: Consciousness Beyond the Human' },
    { id: 'digital_commons', title: 'Digital Commons: Rethinking Property in Information Space' },
    // Add all 8 themes...
  ];
  
  const WORKSHOPS = [
    { id: 'language_models', title: 'Language Models as Philosophical Objects' },
    { id: 'generative_ai', title: 'Generative AI Art: Creativity, Authorship, and Aesthetics' },
    // Add all 8 workshops...
  ];

  return (
    <form action={formAction}>
      {/* Display overall form messages */}
      {state.message && !state.success && <p className="text-red-500">{state.message}</p>}
      
      {/* Progress indicator */}
      <div className="progress-indicator">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className={`progress-step ${currentStep > i ? 'completed' : ''} ${currentStep === i + 1 ? 'active' : ''}`}>
            {i + 1}
          </div>
        ))}
      </div>

      {renderStepContent()}

      {/* Hidden fields on final submission */}
      {currentStep === totalSteps && (
        Object.entries(formData).map(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((item, index) => (
              <input key={`${key}-${index}`} type="hidden" name={`${key}[${index}]`} value={item} />
            ));
          } else if (typeof value === 'object' && value !== null) {
            // Handle nested objects like theme_rankings and workshop_rankings
            return <input key={key} type="hidden" name={key} value={JSON.stringify(value)} />;
          } else if (value !== null && value !== undefined) {
            return <input key={key} type="hidden" name={key} value={String(value)} />;
          }
          return null;
        })
      )}

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
  // Basic Info
  full_name: z.string().min(1, 'Full name is required'),
  university: z.string().min(1, 'University is required'),
  program: z.string().min(1, 'Program/Major is required'),
  year_of_study: z.coerce.number().int().min(1, 'Year of study is required'),

  // Date Flexibility
  can_attend_may_3_4: z.enum(['yes', 'no', 'maybe']),
  may_3_4_comment: z.string().optional(),

  // Philosophical Background
  prior_courses: z.array(z.string()).optional(),
  discussion_confidence: z.coerce.number().int().min(1).max(10),
  writing_confidence: z.coerce.number().int().min(1).max(10),
  familiarity_analytic: z.coerce.number().int().min(1).max(5),
  familiarity_continental: z.coerce.number().int().min(1).max(5),
  familiarity_other: z.coerce.number().int().min(1).max(5),
  philosophical_traditions: z.array(z.string()).min(1, 'Select at least one tradition'),
  philosophical_interests: z.array(z.string()).min(1, 'Select at least one area of interest'),
  areas_of_interest: z.string().optional(),

  // Theme and Workshop Preferences
  theme_rankings: z.array(z.object({
    rank: z.number().int().min(1).max(8),
    theme_id: z.string()
  })).min(8, 'Please rank all themes'),
  theme_suggestion: z.string().optional(),
  workshop_rankings: z.array(z.object({
    rank: z.number().int().min(1).max(8),
    workshop_id: z.string()
  })).refine(
    workshops => workshops.length >= 3,
    {
      message: 'Please rank at least 3 workshops'
    }
  ),

  // Team Formation Preferences
  preferred_working_style: z.enum(['structured', 'exploratory', 'balanced']),
  teammate_similarity: z.coerce.number().int().min(1).max(10),
  skill_writing: z.coerce.number().int().min(1).max(5),
  skill_speaking: z.coerce.number().int().min(1).max(5),
  skill_research: z.coerce.number().int().min(1).max(5),
  skill_synthesis: z.coerce.number().int().min(1).max(5),
  skill_critique: z.coerce.number().int().min(1).max(5),
  mentorship_preference: z.enum(['mentor', 'mentee', 'no_preference']).optional(),
  mentorship_areas: z.string().optional(),
  preferred_teammates: z.string().optional(),
  complementary_perspectives: z.string().optional(),

  // Technical Experience & Accessibility
  familiarity_tech_concepts: z.coerce.number().int().min(1).max(5),
  prior_hackathon_experience: z.boolean(),
  prior_hackathon_details: z.string().optional(),
  dietary_restrictions: z.string().optional(),
  accessibility_needs: z.string().optional(),
  additional_notes: z.string().optional(),
  how_heard: z.enum(['email', 'professor', 'friend', 'department', 'social_media', 'other']),
  how_heard_other: z.string().optional()
    .refine(val => val !== undefined && val !== '' || formData.get('how_heard') !== 'other', {
      message: 'Please specify how you heard about the event'
    }),
});

// Type for state used by useFormState
export type RegistrationState = {
  errors?: {
    [key: string]: string[] | undefined;
    _form?: string[];
  };
  message?: string | null;
  success: boolean;
};

export async function createRegistration(
  previousState: RegistrationState,
  formData: FormData
): Promise<RegistrationState> {
  const supabase = createServerClient();
  const headersList = headers();
  const origin = headersList.get('origin');

  // Extract email early for user check/sign-up
  const email = formData.get('email');
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { success: false, message: 'Invalid email address provided.' };
  }

  // --- User Handling ---
  let userId: string | null = null;
  let userJustSignedUp = false;

  // Check if user is already logged in
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (session) {
    userId = session.user.id;
    if (session.user.email !== email) {
      return { success: false, message: 'Email does not match logged-in user.' };
    }
  } else {
    // No active session, attempt sign-up with OTP (Magic Link)
    const { data: signUpData, error: signUpError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/api/auth/callback?next=/register/pending`,
      },
    });

    if (signUpError) {
      console.error("Sign Up Error:", signUpError);
      return { success: false, message: `Could not initiate sign-up: ${signUpError.message}` };
    }
    
    userJustSignedUp = true;
  }

  // If logged in, check for existing registration
  if (userId) {
    const { data: existingReg, error: checkError } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error("Registration Check Error:", checkError);
      return { success: false, message: 'Database error checking registration status.' };
    }
    if (existingReg) {
      return { success: false, message: 'You have already registered.' };
    }
  } else if (!userJustSignedUp) {
    return { success: false, message: 'User identification failed.' };
  }

  // --- Data Processing ---
  // Process form data, handling arrays and special types
  const processedData: Record<string, any> = {};
  
  // Handle basic fields
  for (const [key, value] of formData.entries()) {
    if (!key.includes('[') && !processedData[key]) {
      processedData[key] = value;
    }
  }

  // Handle array fields (like prior_courses, philosophical_traditions)
  const arrayFields = ['prior_courses', 'philosophical_traditions', 'philosophical_interests'];
  for (const field of arrayFields) {
    processedData[field] = formData.getAll(field);
  }
  
  // Handle numeric fields
  const numericFields = [
    'year_of_study', 'discussion_confidence', 'writing_confidence',
    'familiarity_analytic', 'familiarity_continental', 'familiarity_other',
    'teammate_similarity', 'skill_writing', 'skill_speaking', 
    'skill_research', 'skill_synthesis', 'skill_critique',
    'familiarity_tech_concepts'
  ];
  
  for (const field of numericFields) {
    if (processedData[field]) {
      processedData[field] = parseInt(processedData[field], 10);
    }
  }
  
  // Handle boolean fields
  processedData.prior_hackathon_experience = processedData.prior_hackathon_experience === 'true';
  
  // Handle JSON fields (theme_rankings, workshop_rankings)
  try {
    if (processedData.theme_rankings) {
      processedData.theme_rankings = JSON.parse(processedData.theme_rankings);
    }
    if (processedData.workshop_rankings) {
      processedData.workshop_rankings = JSON.parse(processedData.workshop_rankings);
    }
  } catch (e) {
    return { 
      success: false, 
      message: 'Error processing rankings data. Please try again.' 
    };
  }

  // Validate with Zod
  const validatedFields = RegistrationSchema.safeParse(processedData);

  if (!validatedFields.success) {
    console.log("Validation Errors:", validatedFields.error.flatten().fieldErrors);
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
    };
  }

  // Prepare data for Supabase
  const registrationData: any = {
    ...validatedFields.data,
    email: email,
  };
  
  if (userId) {
    registrationData.user_id = userId;
  }

  // Insert data into Supabase
  try {
    const { error } = await supabase.from('registrations').insert(registrationData);

    if (error) throw error;
    revalidatePath('/admin/registrations');

  } catch (e: any) {
    console.error('Registration Insert Error:', e);
    return { success: false, message: `Database Error: Failed to save registration. ${e.message}` };
  }

  // Redirect based on user status
  if (userJustSignedUp) {
    redirect('/register/pending');
  } else {
    redirect('/register/success');
  }
}
```

### 3.4. Confirmation Email Trigger

*   **Option 1 (Preferred): Supabase Edge Function**
    ```typescript
    // supabase/functions/send-registration-confirmation/index.ts
    import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
    
    serve(async (req) => {
      // Handle CORS preflight requests
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
      }
      
      try {
        // Create Supabase client
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        // Get request payload
        const payload = await req.json();
        const registration = payload.record;
        
        // Get user email - either directly from registration or via user_id lookup
        let email = registration.email;
        if (!email && registration.user_id) {
          const { data: userData, error: userError } = await supabaseAdmin
            .from('auth.users')
            .select('email')
            .eq('id', registration.user_id)
            .single();
            
          if (userError) throw userError;
          email = userData.email;
        }
        
        if (!email) {
          throw new Error('Could not determine recipient email');
        }
        
        // Send email using chosen email service (example with generic API)
        const emailApiKey = Deno.env.get('EMAIL_API_KEY');
        const response = await fetch('https://api.emailservice.com/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${emailApiKey}`,
          },
          body: JSON.stringify({
            from: 'Philosothon <registration@philosothon.org>',
            to: email,
            subject: 'Philosothon Registration Confirmation',
            html: `
              <h1>Registration Confirmed</h1>
              <p>Dear ${registration.full_name},</p>
              <p>Thank you for registering for the Philosothon event on April 26-27, 2025.</p>
              <p>Your registration has been received and is being processed. You will receive further details, including team assignments, by April 24th.</p>
              <p>If you have any questions in the meantime, please contact us at info@philosothon.org.</p>
              <p>Looking forward to exploring philosophical ideas with you!</p>
              <p>- The Philosothon Team</p>
            `,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Email API error: ${JSON.stringify(errorData)}`);
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Confirmation email sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (error) {
        console.error('Error sending confirmation email:', error);
        
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    });
    ```

*   **Database Trigger to Call Edge Function**
    ```sql
    -- SQL to create database trigger
    CREATE OR REPLACE FUNCTION public.handle_new_registration()
    RETURNS TRIGGER AS $$
    BEGIN
      PERFORM http_post(
        'https://your-project-ref.functions.supabase.co/send-registration-confirmation',
        json_build_object('record', row_to_json(NEW)),
        'application/json'
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER on_registration_created
      AFTER INSERT ON public.registrations
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_registration();
    ```

## 4. TDD Anchors Summary

*   **Registration Form Component:**
    *   Test `handleChange` updates `formData` correctly for various input types.
    *   Test `handleRankingChange` correctly updates theme and workshop rankings.
    *   Test `renderStepContent` shows the correct fields for each step number.
    *   Test navigation buttons enable/disable correctly based on the current step.
    *   Test `Previous`/`Next` button clicks update the `currentStep` state.
    *   Test special display logic (e.g., mentorship_areas only when mentorship_preference is 'mentor').
    *   Test display of server-side validation errors.
    *   Test display of general success/error messages.

*   **`createRegistration` Server Action:**
    *   Test invalid email submission.
    *   Test handling when an existing logged-in user submits (success path, duplicate check).
    *   Test handling when a new user submits (OTP initiated).
    *   Test handling sign-up errors from Supabase.
    *   Test handling of database error during existing registration check.
    *   Test validation failure for missing required fields.
    *   Test validation failure for workshop_rankings with fewer than 3 ranked items.
    *   Test validation failure for invalid enum values.
    *   Test successful validation and database insertion.
    *   Test correct redirect path based on user status.

*   **Confirmation Email Trigger:**
    *   Test function triggers on new registration insert.
    *   Test fetching the correct user email.
    *   Test email service API call with correct parameters.
    *   Test handling of errors from the email service API.

## 5. Open Questions / TBD

*   Final grouping and number of steps for the multi-step form UI.
*   Specific wording and options for multi-select/scale fields.
*   Exact content of the confirmation email.
*   Decision on email service provider (e.g., Resend, SendGrid).
*   Handling of potential updates to registration data. P0 assumes insert-only.
*   Refinement of user sign-up flow within registration (e.g., how to link user_id if sign-up happens via OTP after initial data save). Option C (email matching) is a temporary simplification.
*   Final list of themes and workshops to be included in ranking options.