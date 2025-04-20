import { z } from 'zod';

// Define abstract types for questions
type QuestionType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'password' // Note: Password won't be stored directly in registration data
  | 'number'
  | 'boolean'
  | 'single-select'
  | 'multi-select';
// | 'ranking'; // Ranking type deferred

// Define the structure for a single question definition
export interface QuestionDefinition {
  id: string; // Unique identifier, used as key in data and potentially DB column name
  label: string; // Text displayed to the user for the question
  type: QuestionType;
  required: boolean;
  placeholder?: string; // Placeholder text for input fields
  options?: string[]; // Options for select types
  validation?: z.ZodTypeAny; // Zod schema for validation (used for generating backend schema)
  clientValidation?: (value: any, allValues?: Record<string, any>) => string | undefined; // Simple client-side validation function (optional)
  dependsOn?: string; // ID of another question this one depends on
  dependsValue?: any; // Value the dependent question must have for this one to show
  dbType: // Hint for the SQL migration generator
  | 'TEXT'
    | 'VARCHAR(255)' // Example specific varchar
    | 'INTEGER'
    | 'BOOLEAN'
    | 'TEXT[]' // For multi-select
    | 'JSONB' // For complex types or future use
    | 'SKIP'; // Don't include in DB (e.g., password confirmation)
  order: number; // Explicit order for sequential display
}

// Define the central registration schema
// Order matters for the sequential flow.
export const registrationSchema: QuestionDefinition[] = [
  // --- Step 1: Basic Info ---
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'your.email@example.com',
    validation: z.string().email({ message: 'Invalid email address' }),
    dbType: 'VARCHAR(255)', // Stored in auth.users, but good to track here
    order: 1,
  },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    placeholder: 'Enter a secure password',
    validation: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    dbType: 'SKIP', // Handled by Supabase Auth, not stored in registrations table
    order: 2,
  },
  {
    id: 'confirmPassword',
    label: 'Confirm Password',
    type: 'password',
    required: true,
    placeholder: 'Re-enter your password',
    validation: z.string(), // Server-side will compare with password
    clientValidation: (value, allValues) => value === allValues?.password ? undefined : 'Passwords do not match',
    dbType: 'SKIP',
    order: 3,
    dependsOn: 'password', // Only show after password is entered
  },
  {
    id: 'full_name', // snake_case
    label: 'Full Name',
    type: 'text',
    required: true,
    placeholder: 'First Last',
    validation: z.string().min(2, { message: 'Name is required' }),
    dbType: 'TEXT',
    order: 4,
  },
  {
    id: 'pronouns',
    label: 'Pronouns',
    type: 'text',
    required: false,
    placeholder: 'e.g., she/her, they/them, he/him',
    validation: z.string().optional(),
    dbType: 'TEXT',
    order: 5,
  },
  {
    id: 'student_id', // snake_case
    label: 'Student ID Number',
    type: 'text', // Keep as text to handle potential leading zeros or non-numeric chars
    required: true,
    placeholder: 'e.g., 1001234567',
    validation: z.string().min(5, { message: 'Valid Student ID required' }), // Basic length check
    dbType: 'TEXT',
    order: 6,
  },
  {
    id: 'university',
    label: 'University/Institution',
    type: 'text',
    required: true,
    placeholder: 'e.g., University of Toronto',
    validation: z.string().min(2, { message: 'Institution is required' }),
    dbType: 'TEXT',
    order: 7,
  },
  {
    id: 'academic_year', // snake_case
    label: 'Current Academic Year',
    type: 'single-select',
    required: true,
    options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate Student', 'Other'],
    validation: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate Student', 'Other']),
    dbType: 'TEXT', // Could use ENUM type in DB if preferred
    order: 8,
  },
  {
    id: 'program',
    label: 'Program of Study',
    type: 'text',
    required: true,
    placeholder: 'e.g., Philosophy Specialist, Computer Science Major',
    validation: z.string().min(2, { message: 'Program is required' }),
    dbType: 'TEXT',
    order: 9,
  },

  // --- Step 2: Philosophical Interests ---
  {
    id: 'philosophy_coursework', // snake_case
    label: 'Relevant Philosophy Coursework (Optional)',
    type: 'textarea',
    required: false,
    placeholder: 'List any philosophy courses you have taken or are currently taking.',
    validation: z.string().optional(),
    dbType: 'TEXT',
    order: 10,
  },
  {
    id: 'philosophy_interests', // snake_case
    label: 'Areas of Philosophical Interest (Optional)',
    type: 'textarea',
    required: false,
    placeholder: 'Briefly describe your main interests in philosophy (e.g., ethics, metaphysics, AI, specific philosophers).',
    validation: z.string().optional(),
    dbType: 'TEXT',
    order: 11,
  },
  {
    id: 'event_expectations', // snake_case
    label: 'What do you hope to gain from participating in the Philosothon?',
    type: 'textarea',
    required: true,
    placeholder: 'e.g., Discuss ideas, meet peers, learn about specific topics...',
    validation: z.string().min(10, { message: 'Please share your expectations' }),
    dbType: 'TEXT',
    order: 12,
  },

  // --- Step 3: Event Logistics ---
  {
    id: 'attendance_preference', // snake_case
    label: 'Attendance Preference',
    type: 'single-select',
    required: true,
    options: ['In-Person', 'Online', 'Hybrid (Mix of Both)'],
    validation: z.enum(['In-Person', 'Online', 'Hybrid (Mix of Both)']),
    dbType: 'TEXT',
    order: 13,
  },
  {
    id: 'workshop_preference', // snake_case
    label: 'Workshop Preference (Rank Top 3 if applicable)',
    type: 'textarea', // Simple text for now, could be more structured later
    required: false, // Assuming workshops are optional or ranking is optional
    placeholder: 'List your preferred workshops in order, if any.',
    validation: z.string().optional(),
    dbType: 'TEXT',
    order: 14,
  },
  {
    id: 'dietary_restrictions', // snake_case
    label: 'Dietary Restrictions or Allergies (if attending in-person)',
    type: 'textarea',
    required: false,
    placeholder: 'e.g., Vegetarian, Gluten-Free, Peanut Allergy',
    validation: z.string().optional(),
    dbType: 'TEXT',
    order: 15,
    dependsOn: 'attendance_preference', // snake_case
    dependsValue: 'In-Person', // Only show if attending in person
  },
  {
    id: 'accessibility_needs', // snake_case
    label: 'Accessibility Needs (Optional)',
    type: 'textarea',
    required: false,
    placeholder: 'Please let us know if you have any accessibility requirements.',
    validation: z.string().optional(),
    dbType: 'TEXT',
    order: 16,
  },

  // --- Step 4: Consent & Agreement ---
  {
    id: 'code_of_conduct_agreement', // snake_case
    label: 'I agree to abide by the event\'s Code of Conduct.',
    type: 'boolean',
    required: true,
    validation: z.boolean().refine(val => val === true, { message: 'You must agree to the Code of Conduct' }),
    dbType: 'BOOLEAN',
    order: 17,
  },
  {
    id: 'photo_consent', // snake_case
    label: 'I consent to potentially being photographed or recorded during the event for promotional purposes.',
    type: 'boolean',
    required: true, // Or false if opt-out is default
    validation: z.boolean(),
    dbType: 'BOOLEAN',
    order: 18,
  },
  {
    id: 'data_privacy_consent', // snake_case
    label: 'I consent to the storage and processing of my registration data as described in the Privacy Policy.',
    type: 'boolean',
    required: true,
    validation: z.boolean().refine(val => val === true, { message: 'You must agree to the Privacy Policy' }),
    dbType: 'BOOLEAN',
    order: 19,
  },
];

// Helper type for the shape of the form data
// We need to generate the Zod schema first to infer this type correctly.
// The generation script will handle creating a similar type or exporting the generated schema.
// export type RegistrationFormData = z.infer<ReturnType<typeof generateRegistrationSchema>>;


// Function to generate the Zod schema dynamically (example, will be used by the script)
// The actual generation logic will be in the script itself.
export function generateRegistrationSchema() {
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  registrationSchema.forEach(q => {
    // Include validation only for fields that should be part of the submitted data
    if (q.validation && q.dbType !== 'SKIP') {
      schemaObject[q.id] = q.validation;
    }
  });

  // Add refinement for password confirmation if needed (server-side check is better)
  // return z.object(schemaObject).refine(data => data.password === data.confirmPassword, {
  //   message: "Passwords don't match",
  //   path: ["confirmPassword"], // path of error
  // });
  return z.object(schemaObject);
}