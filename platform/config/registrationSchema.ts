import { z } from 'zod';

// Define abstract types for questions - Updated for V3
export type QuestionType =
  | 'text'
  | 'textarea' // Renamed from 'paragraph' in spec for clarity? Using textarea.
  | 'email'
  | 'password'
  | 'confirmPassword' // Specific type for client-side check pairing
  | 'number'
  | 'scale' // Assuming scale maps to number with min/max validation
  | 'boolean'
  | 'single-select'
  | 'multi-select-numbered' // V3 New Type
  | 'ranking-numbered'; // V3 New Type

// Define the structure for a single question definition - Updated for V3
export interface QuestionDefinition {
  id: string; // Unique identifier, used as key in data and potentially DB column name
  section: string; // Section grouping from the outline
  order: number; // Overall order (1-34, incl PW/Confirm)
  label: string; // Text displayed to the user for the question
  type: QuestionType;
  required: boolean;
  placeholder?: string; // Placeholder text for input fields
  options?: string[]; // Options for select, multi-select, ranking
  hint?: string; // Optional hint/example text
  validation?: z.ZodTypeAny; // Zod schema for validation (used for generating backend schema)
  clientValidation?: (value: any, allValues?: Record<string, any>) => string | undefined; // Simple client-side validation function (optional)
  dependsOn?: string; // ID of another question this one depends on
  dependsValue?: any; // Value the dependent question must have for this one to show
  dbType: // Hint for the SQL migration generator
  | 'TEXT'
    | 'VARCHAR(255)'
    | 'INTEGER'
    | 'BOOLEAN'
    | 'TEXT[]' // For multi-select
    | 'JSONB' // For ranking or complex types
    | 'SKIP'; // Don't include in DB (e.g., password confirmation)
  otherField?: boolean; // Flag if this question has an 'Other: ___' option needing text input
}

// Define the central registration schema - V3 based on spec
// Order reflects the sequence 1-31 from the spec/outline, plus PW/Confirm.
export const registrationSchema: QuestionDefinition[] = [
  // --- Section 1: Personal Information ---
  {
    id: 'fullName', // Q1
    section: 'Personal Information',
    order: 1,
    label: 'Full Name',
    type: 'text',
    required: true,
    hint: 'Please enter your full name.',
    validation: z.string().min(2, { message: 'Full name is required' }),
    dbType: 'TEXT',
  },
  {
    id: 'email', // Q2
    section: 'Personal Information',
    order: 2,
    label: 'University Email Address',
    type: 'email',
    required: true,
    hint: 'Please use your university email address.',
    validation: z.string().email({ message: 'Invalid university email address' }),
    dbType: 'VARCHAR(255)', // Stored in auth.users, but track here
  },
  {
    id: 'password', // Implicit step after Q2
    section: 'Personal Information',
    order: 3, // Sequential order
    label: 'Password',
    type: 'password',
    required: true,
    hint: 'Minimum 8 characters.',
    validation: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    dbType: 'SKIP', // Handled by Supabase Auth
  },
  {
    id: 'confirmPassword', // Implicit step after password
    section: 'Personal Information',
    order: 4, // Sequential order
    label: 'Confirm Password',
    type: 'confirmPassword', // Use specific type for client check
    required: true,
    hint: 'Re-enter your password.',
    validation: z.string(), // Server-side will compare with password in action
    clientValidation: (value, allValues) => value === allValues?.password ? undefined : 'Passwords do not match',
    dbType: 'SKIP',
    dependsOn: 'password', // Only show after password is entered
  },
  {
    id: 'pronouns', // Q3
    section: 'Personal Information',
    order: 5,
    label: 'Pronouns',
    type: 'text',
    required: false,
    hint: 'e.g., she/her, they/them, he/him (Optional)',
    validation: z.string().optional(),
    dbType: 'TEXT',
  },
  {
    id: 'studentId', // Q4
    section: 'Personal Information',
    order: 6,
    label: 'Student ID Number',
    type: 'text',
    required: true,
    hint: 'e.g., 1001234567',
    validation: z.string().min(5, { message: 'Valid Student ID required' }), // Basic length check
    dbType: 'TEXT',
  },
  {
    id: 'university', // Q5
    section: 'Personal Information',
    order: 7,
    label: 'University/Institution',
    type: 'text',
    required: true,
    hint: 'e.g., University of Toronto',
    validation: z.string().min(2, { message: 'Institution is required' }),
    dbType: 'TEXT',
  },
  {
    id: 'academicYear', // Q6
    section: 'Personal Information',
    order: 8,
    label: 'Current Academic Year',
    type: 'single-select',
    required: true,
    options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate Student', 'Other'],
    validation: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate Student', 'Other']),
    dbType: 'TEXT',
  },
  {
    id: 'programOfStudy', // Q7
    section: 'Personal Information',
    order: 9,
    label: 'Program of Study',
    type: 'text',
    required: true,
    hint: 'e.g., Philosophy Specialist, Computer Science Major',
    validation: z.string().min(2, { message: 'Program is required' }),
    dbType: 'TEXT',
  },

  // --- Section 2: Philosophy Background ---
  {
    id: 'philosophyCoursework', // Q8
    section: 'Philosophy Background',
    order: 10,
    label: 'Relevant Philosophy Coursework (Optional)',
    type: 'textarea',
    required: false,
    hint: 'List any philosophy courses you have taken or are currently taking.',
    validation: z.string().optional(),
    dbType: 'TEXT',
  },
  {
    id: 'philosophyInterests', // Q9
    section: 'Philosophy Background',
    order: 11,
    label: 'Areas of Philosophical Interest (Optional)',
    type: 'textarea',
    required: false,
    hint: 'Briefly describe your main interests in philosophy (e.g., ethics, metaphysics, AI, specific philosophers).',
    validation: z.string().optional(),
    dbType: 'TEXT',
  },
  {
    id: 'philosophyExpertise', // Q10
    section: 'Philosophy Background',
    order: 12,
    label: 'Self-Assessed Philosophy Expertise Level',
    type: 'scale', // Use scale type, maps to number input
    required: true,
    hint: 'Rate your expertise from 1 (Beginner) to 5 (Expert).',
    validation: z.number().int().min(1).max(5, { message: 'Please select a rating between 1 and 5' }),
    dbType: 'INTEGER',
  },
  {
    id: 'attendedPhilosothonBefore', // Q11
    section: 'Philosophy Background',
    order: 13,
    label: 'Have you attended a Philosothon before?',
    type: 'boolean', // Simple Yes/No
    required: true,
    options: ['Yes', 'No'], // Frontend can map boolean to Yes/No display
    validation: z.boolean(),
    dbType: 'BOOLEAN',
  },
  {
    id: 'previousPhilosothonDetails', // Q12
    section: 'Philosophy Background',
    order: 14,
    label: 'If yes, which one(s) and what was your experience like? (Optional)',
    type: 'textarea',
    required: false,
    validation: z.string().optional(),
    dbType: 'TEXT',
    dependsOn: 'attendedPhilosothonBefore',
    dependsValue: true, // Show only if Q11 is Yes (true)
  },

  // --- Section 3: Event Preferences ---
  {
    id: 'themeRanking', // Q13
    section: 'Event Preferences',
    order: 15,
    label: 'Rank the Event Themes by Preference',
    type: 'ranking-numbered', // V3 New Type
    required: true,
    options: [ // Assuming these are the 8 themes
      'Algorithmic Aesthetics: Beauty in the Age of Machine Creation',
      'Digital Doppelgangers: Identity and Authenticity Online',
      'The Algorithmic Panopticon: Surveillance, Privacy, and Power',
      'Cyborg Futures: Enhancement, Embodiment, and Posthumanism',
      'AI Ethics: Bias, Fairness, and Accountability in Code',
      'Virtual Worlds, Real Connections: Community and Belonging Online',
      'The Meaning of Tech Work: Labor, Alienation, and Purpose',
      'Ecological Entanglements: Technology, Nature, and Sustainable Futures',
    ],
    hint: 'Enter comma-separated numbers for your top ranks (e.g., `3,1,4`). Rank at least 3.',
    validation: z.array(z.number().int().positive()).min(3, { message: 'Please rank at least 3 themes' })
      .refine(items => new Set(items).size === items.length, { message: 'Each theme can only be ranked once' }),
    dbType: 'JSONB', // Store ordered array of theme indices or full strings
  },
  {
    id: 'workshopPreference', // Q14
    section: 'Event Preferences',
    order: 16,
    label: 'Workshop Preference (Select up to 2)',
    type: 'multi-select-numbered', // V3 New Type
    required: true, // Spec implies required, though outline doesn't explicitly state
    options: [ // Assuming these are the workshops - Placeholder names
        'Workshop A: Intro to AI Ethics',
        'Workshop B: Philosophy of Social Media',
        'Workshop C: Technology and Well-being',
        'Workshop D: Exploring Posthumanism',
        // Add other workshops as defined
    ],
    hint: 'Enter numbers separated by spaces (e.g., `1 3`). Select up to 2.',
    validation: z.array(z.number().int().positive()).max(2, { message: 'Please select no more than 2 workshops' })
      .refine(items => new Set(items).size === items.length, { message: 'Each workshop can only be selected once' }),
    dbType: 'TEXT[]', // Store array of selected workshop indices or strings
  },
  {
    id: 'teamFormationPreference', // Q15
    section: 'Event Preferences',
    order: 17,
    label: 'Team Formation Preference',
    type: 'single-select',
    required: true,
    options: ['Assign me to a team', 'I have a pre-formed team', 'I prefer to work individually (if allowed)'],
    validation: z.enum(['Assign me to a team', 'I have a pre-formed team', 'I prefer to work individually (if allowed)']),
    dbType: 'TEXT',
  },
  {
    id: 'preformedTeamMembers', // Q16
    section: 'Event Preferences',
    order: 18,
    label: 'If you have a pre-formed team, please list the names/emails of your team members.',
    type: 'textarea',
    required: false, // Required only if 'I have a pre-formed team' is selected
    validation: z.string().optional(),
    dbType: 'TEXT',
    dependsOn: 'teamFormationPreference',
    dependsValue: 'I have a pre-formed team',
    clientValidation: (value, allValues) => { // Example client-side conditional required check
        if (allValues?.teamFormationPreference === 'I have a pre-formed team' && !value) {
            return 'Please list your team members.';
        }
        return undefined;
    },
  },
  {
    id: 'availability', // Q17
    section: 'Event Preferences',
    order: 19,
    label: 'Please confirm your availability for the full duration of the event (April 26-27, 2025).',
    type: 'boolean',
    required: true,
    options: ['Yes, I can attend the full event', 'No, I have partial availability (please specify below)'],
    validation: z.boolean(),
    dbType: 'BOOLEAN',
  },
  {
    id: 'availabilityDetails', // Q18
    section: 'Event Preferences',
    order: 20,
    label: 'If you have partial availability, please specify the times you CAN attend.',
    type: 'textarea',
    required: false, // Required only if 'No' selected for Q17
    validation: z.string().optional(),
    dbType: 'TEXT',
    dependsOn: 'availability',
    dependsValue: false, // Show only if Q17 is No (false)
    clientValidation: (value, allValues) => {
        if (allValues?.availability === false && !value) {
            return 'Please specify your availability details.';
        }
        return undefined;
    },
  },

  // --- Section 4: Technical Skills & Experience ---
  {
    id: 'technicalSkills', // Q19
    section: 'Technical Skills & Experience',
    order: 21,
    label: 'Rate your technical skills/comfort level with technology',
    type: 'scale',
    required: true,
    hint: '1 (Beginner) to 5 (Expert)',
    validation: z.number().int().min(1).max(5),
    dbType: 'INTEGER',
  },
  {
    id: 'codingExperience', // Q20
    section: 'Technical Skills & Experience',
    order: 22,
    label: 'Do you have any coding/programming experience?',
    type: 'boolean',
    required: true,
    options: ['Yes', 'No'],
    validation: z.boolean(),
    dbType: 'BOOLEAN',
  },
  {
    id: 'codingLanguages', // Q21
    section: 'Technical Skills & Experience',
    order: 23,
    label: 'If yes, which languages/technologies are you familiar with? (Optional)',
    type: 'textarea',
    required: false,
    validation: z.string().optional(),
    dbType: 'TEXT',
    dependsOn: 'codingExperience',
    dependsValue: true,
  },
  {
    id: 'specificTools', // Q22
    section: 'Technical Skills & Experience',
    order: 24,
    label: 'Are there any specific software/tools you are proficient in that might be relevant? (e.g., design tools, data analysis software) (Optional)',
    type: 'textarea',
    required: false,
    validation: z.string().optional(),
    dbType: 'TEXT',
  },

  // --- Section 5: Logistics & Communication ---
  {
    id: 'dietaryRestrictions', // Q23 (Outline)
    section: 'Logistics & Communication',
    order: 25, // Following outline numbering
    label: 'Dietary Restrictions or Allergies',
    type: 'textarea',
    required: false,
    hint: 'e.g., Vegetarian, Gluten-Free, Peanut Allergy (Optional)',
    validation: z.string().optional(),
    dbType: 'TEXT',
    // dependsOn: 'attendance_preference', // Dependency removed as attendance pref is complex/potentially removed
  },
  {
    id: 'accessibilityNeeds', // Q24 (Outline)
    section: 'Logistics & Communication',
    order: 26,
    label: 'Accessibility Needs (Optional)',
    type: 'textarea',
    required: false,
    hint: 'Please let us know if you have any accessibility requirements.',
    validation: z.string().optional(),
    dbType: 'TEXT',
  },
  {
    id: 'emergencyContactName', // Q25 (Outline)
    section: 'Logistics & Communication',
    order: 27,
    label: 'Emergency Contact Name (Optional)',
    type: 'text',
    required: false,
    validation: z.string().optional(),
    dbType: 'TEXT',
  },
  {
    id: 'emergencyContactPhone', // Q26 (Outline)
    section: 'Logistics & Communication',
    order: 28,
    label: 'Emergency Contact Phone Number (Optional)',
    type: 'text', // Keep as text for formatting flexibility
    required: false,
    validation: z.string().optional(), // Could add regex for basic phone format
    dbType: 'TEXT',
  },
  {
    id: 'preferredCommunication', // Q27 (Outline)
    section: 'Logistics & Communication',
    order: 29,
    label: 'Preferred Method of Communication for Event Updates',
    type: 'single-select',
    required: true,
    options: ['Email', 'Discord (if applicable)', 'Other (please specify)'],
    validation: z.enum(['Email', 'Discord (if applicable)', 'Other (please specify)']),
    dbType: 'TEXT',
    otherField: true, // Indicates 'Other' needs a text field
  },
  {
    id: 'preferredCommunicationOther', // Implicit field for Q27 'Other'
    section: 'Logistics & Communication',
    order: 30, // Immediately follows parent
    label: 'Other Communication Method',
    type: 'text',
    required: false, // Required only if 'Other' selected in Q27
    validation: z.string().optional(),
    dbType: 'TEXT',
    dependsOn: 'preferredCommunication',
    dependsValue: 'Other (please specify)',
    clientValidation: (value, allValues) => {
        if (allValues?.preferredCommunication === 'Other (please specify)' && !value) {
            return 'Please specify your preferred communication method.';
        }
        return undefined;
    },
  },

  // --- Section 6: Consent & Agreement ---
  {
    id: 'codeOfConductAgreement', // Q28 (Outline)
    section: 'Consent & Agreement',
    order: 31,
    label: 'I have read and agree to abide by the event\'s Code of Conduct.',
    type: 'boolean',
    required: true,
    hint: 'Link to Code of Conduct [TODO: Add Link]', // Add link in frontend display
    validation: z.boolean().refine(val => val === true, { message: 'You must agree to the Code of Conduct' }),
    dbType: 'BOOLEAN',
  },
  {
    id: 'photoConsent', // Q29 (Outline)
    section: 'Consent & Agreement',
    order: 32,
    label: 'I consent to potentially being photographed or recorded during the event for promotional purposes.',
    type: 'boolean',
    required: true, // Assuming opt-in required
    options: ['Yes, I consent', 'No, I do not consent'],
    validation: z.boolean(),
    dbType: 'BOOLEAN',
  },
  {
    id: 'dataPrivacyConsent', // Q30 (Outline)
    section: 'Consent & Agreement',
    order: 33,
    label: 'I consent to the storage and processing of my registration data as described in the Privacy Policy.',
    type: 'boolean',
    required: true,
    hint: 'Link to Privacy Policy [TODO: Add Link]', // Add link in frontend display
    validation: z.boolean().refine(val => val === true, { message: 'You must agree to the Privacy Policy' }),
    dbType: 'BOOLEAN',
  },
  {
    id: 'finalConfirmation', // Q31 (Outline)
    section: 'Consent & Agreement',
    order: 34, // Final item
    label: 'I confirm that all the information provided is accurate to the best of my knowledge.',
    type: 'boolean',
    required: true,
    validation: z.boolean().refine(val => val === true, { message: 'Please confirm your submission' }),
    dbType: 'BOOLEAN',
  },
];

// Function to generate the Zod schema dynamically (used by the script)
export function generateRegistrationSchema() {
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  registrationSchema.forEach(q => {
    // Include validation only for fields that should be part of the submitted data
    if (q.validation && q.dbType !== 'SKIP') {
      // Apply optional() to non-required fields for Zod schema
      schemaObject[q.id] = q.required ? q.validation : q.validation.optional();
    }
  });

  // Add refinement for password confirmation if needed (server-side check is better)
  // The actual comparison should happen within the server action using the raw form data.
  // return z.object(schemaObject).refine(data => data.password === data.confirmPassword, {
  //   message: "Passwords don't match",
  //   path: ["confirmPassword"], // path of error
  // });
  return z.object(schemaObject);
}