import { z } from 'zod';

// Define abstract types for questions - V3.1 Spec
export type QuestionType =
  | 'text'
  | 'textarea' // Replaces 'paragraph'
  | 'email'
  | 'password' // Handled in UI flow, not schema array
  | 'confirmPassword' // Handled in UI flow, not schema array
  | 'number'
  | 'scale' // Maps to number input with min/max validation
  | 'boolean' // Single checkbox or Yes/No
  | 'single-select' // Radio buttons / Dropdown
  | 'multi-select-numbered' // Checkboxes with numbered selection
  | 'ranking-numbered'; // Numbered ranking input

// Define the structure for a single question definition - V3.1 Spec (Section 6.1)
export interface QuestionDefinition {
  id: string; // Unique identifier, maps to outline question, used as key/DB column
  section: string; // Section grouping from the outline
  order: number; // Overall order (1-36, from outline)
  label: string; // Text displayed to the user for the question (from outline)
  type: QuestionType;
  required: boolean;
  options?: string[]; // Options for select, multi-select, ranking
  hint: string; // Mandatory short hint/example text (displayed below question)
  description: string; // Mandatory longer description (for `help [question_id]`)
  validationRules?: { // Defines validation logic and specific error messages
    required?: boolean | string; // boolean=use default message, string=custom message
    minLength?: { value: number; message?: string };
    maxLength?: { value: number; message?: string };
    min?: { value: number; message?: string }; // For number/scale
    max?: { value: number; message?: string }; // For number/scale
    pattern?: { regex: string; flags?: string; message?: string }; // For regex validation
    isEmail?: boolean | string;
    isNumber?: boolean | string;
    // For multi-select
    minSelections?: { value: number; message?: string };
    maxSelections?: { value: number; message?: string };
    // For ranked-choice-numbered
    minRanked?: { value: number; message?: string }; // e.g., { value: 3, message: "Please rank at least 3 options." }
    uniqueSelections?: boolean | string; // Ensure ranked options are unique
    // Add other rules as needed
  };
  dependsOn?: string; // ID of question this depends on
  dependsValue?: any; // Value the dependent question must have (e.g., for partial availability details, or 'Other' ranking description)
  dbType: // Hint for the SQL migration generator
  | 'TEXT'
    | 'VARCHAR(255)'
    | 'INTEGER'
    | 'BOOLEAN'
    | 'TEXT[]' // For multi-select
    | 'JSONB' // For ranking or complex types
    | 'SKIP'; // Don't include in DB (e.g., password confirmation) - Though PW/Confirm removed from array
  otherField?: boolean; // Flag if this question has an 'Other: ___' option needing text input
}

// Define the central registration schema - V3.1 based on spec and outline
// Order reflects the sequence 1-36 from the outline. Password/Confirm handled in UI flow.
export const registrationSchema: QuestionDefinition[] = [
  // --- Section: Personal Information ---
  {
    id: 'firstName', // Outline Q1a
    section: 'Personal Information',
    order: 1, // Correct order
    label: 'First Name',
    type: 'text',
    required: true,
    hint: 'Please enter your first name.',
    description: 'Your first name is required for registration and team assignments.',
    validationRules: {
      required: 'First name is required.',
      minLength: { value: 1, message: 'First name cannot be empty.' },
    },
    dbType: 'TEXT',
  },
  {
    id: 'lastName', // Outline Q1b
    section: 'Personal Information',
    order: 2, // Correct order
    label: 'Last Name',
    type: 'text',
    required: true,
    hint: 'Please enter your last name.',
    description: 'Your last name is required for registration and team assignments.',
    validationRules: {
      required: 'Last name is required.',
      minLength: { value: 1, message: 'Last name cannot be empty.' },
    },
    dbType: 'TEXT',
  },
  {
    id: 'email', // Outline Q2
    section: 'Personal Information',
    order: 3, // Correct order
    label: 'University Email Address',
    type: 'email',
    required: true,
    hint: 'We\'ll use this to communicate important information about the event.',
    description: 'Please provide your university email address. This will be used for login and important event communications.',
    validationRules: {
      required: 'University email is required.',
      isEmail: 'Please enter a valid email address.',
      // Potential future regex: pattern: { regex: '^.+@(?:utoronto\\.ca|mail\\.utoronto\\.ca)$', message: 'Must be a UofT email address.' }
    },
    dbType: 'VARCHAR(255)', // Stored in auth.users, but track here for generation
  },
  // Password & Confirm Password (order 4 & 5 conceptually) are handled by the UI flow and auth actions, not listed here.
  {
    id: 'academicYear', // Outline Q3
    section: 'Personal Information',
    order: 6, // Correct order (after conceptual PW steps)
    label: 'Year of Study',
    type: 'single-select',
    required: true,
    options: ['First year', 'Second year', 'Third year', 'Fourth year', 'Fifth year', 'Graduate student', 'Other'],
    hint: 'Select your current academic year.',
    description: 'Knowing your year of study helps us balance teams and understand participant demographics.',
    validationRules: {
      required: 'Please select your year of study.',
    },
    dbType: 'TEXT',
    otherField: true, // If 'Other' is selected
  },
  {
    id: 'academicYearOther', // Implicit field for Q3 'Other'
    section: 'Personal Information',
    order: 7, // Correct order
    label: 'Other Year of Study',
    type: 'text',
    required: false, // Required only if 'Other' selected in Q6
    hint: 'Specify your year if not listed.',
    description: 'If you selected "Other" for year of study, please specify here.',
    validationRules: {
      required: 'Please specify your year of study.', // Conditional validation handled client-side/server-side refinement
    },
    dbType: 'TEXT',
    dependsOn: 'academicYear',
    dependsValue: 'Other',
  },
  {
    id: 'universityInstitution',
    section: 'Personal Information',
    order: 8, // Insert here, pushing programOfStudy to 9
    label: 'University / Institution',
    type: 'text',
    required: true,
    hint: 'Please provide the full name of your current or most recent institution.',
    description: 'Your university or institution name is used for demographic purposes and team balancing.',
    validationRules: {
      required: 'University/Institution is required.',
      minLength: { value: 2, message: 'Please enter a valid institution name.' },
    },
    dbType: 'TEXT',
  },
  {
    id: 'programOfStudy', // Outline Q4
    section: 'Personal Information',
    order: 9, // Correct order
    label: 'Program/Major(s)',
    type: 'text',
    required: true,
    hint: 'Please list all applicable programs (e.g., Philosophy Specialist, CS Major).',
    description: 'List your current program(s) or major(s) of study.',
    validationRules: {
      required: 'Program/Major is required.',
      minLength: { value: 2, message: 'Please enter a valid program/major.' },
    },
    dbType: 'TEXT',
  },

  // --- Section: Philosophy Background ---
  {
    id: 'philosophyCoursework', // Outline Q5
    section: 'Philosophy Background',
    order: 10, // Correct order
    label: 'Philosophy courses completed',
    type: 'textarea',
    required: true, // Changed to required based on hint
    hint: 'List course codes (e.g PHL100, PHL200). If none, write "None yet".',
    description: 'Please list the course codes of any philosophy courses you\'ve completed or are currently taking. This helps us gauge the philosophical background of participants.',
    validationRules: {
      required: 'Please list completed courses or write "None yet".',
    },
    dbType: 'TEXT',
  },
  {
    id: 'philosophyConfidenceDiscussion', // Outline Q6
    section: 'Philosophy Background',
    order: 11, // Correct order
    label: 'How would you rate your confidence in philosophical discussion?',
    type: 'scale',
    required: true,
    hint: '1 = I prefer to listen, 10 = I enjoy active debate.',
    description: 'Rate your confidence level in participating in philosophical discussions (1=Low, 10=High).',
    validationRules: {
      required: 'Please rate your discussion confidence.',
      isNumber: 'Rating must be a number.',
      min: { value: 1, message: 'Rating must be between 1 and 10.' },
      max: { value: 10, message: 'Rating must be between 1 and 10.' },
    },
    dbType: 'INTEGER',
  },
  {
    id: 'philosophyConfidenceWriting', // Outline Q7
    section: 'Philosophy Background',
    order: 12, // Correct order
    label: 'How would you rate your confidence in philosophical writing?',
    type: 'scale',
    required: true,
    hint: '1 = Still developing, 10 = Confident.',
    description: 'Rate your confidence level in your philosophical writing abilities (1=Low, 10=High).',
    validationRules: {
      required: 'Please rate your writing confidence.',
      isNumber: 'Rating must be a number.',
      min: { value: 1, message: 'Rating must be between 1 and 10.' },
      max: { value: 10, message: 'Rating must be between 1 and 10.' },
    },
    dbType: 'INTEGER',
  },
  {
    id: 'philosophyTraditions', // Outline Q8
    section: 'Philosophy Background',
    order: 13, // Correct order
    label: 'Which philosophical traditions are you most familiar with?',
    type: 'multi-select-numbered',
    required: true,
    options: [
      'Analytic philosophy',
      'Continental philosophy',
      'Ancient philosophy',
      'Medieval philosophy',
      'Modern philosophy',
      'Non-Western philosophical traditions',
      'I\'m new to philosophy and still exploring',
      'Other',
    ],
    hint: 'Select all that apply by entering numbers separated by spaces (e.g., `1 3 7`).',
    description: 'Select the philosophical traditions you have some familiarity with. Choose all that apply.',
    validationRules: {
      required: 'Please select at least one option.',
      minSelections: { value: 1, message: 'Please select at least one option.' },
    },
    dbType: 'TEXT[]',
    otherField: true,
  },
  {
    id: 'philosophyTraditionsOther', // Implicit field for Q8 'Other'
    section: 'Philosophy Background',
    order: 14, // Correct order
    label: 'Other Philosophical Traditions',
    type: 'text',
    required: false,
    hint: 'Specify other traditions if selected.',
    description: 'If you selected "Other" for philosophical traditions, please specify here.',
    validationRules: {
      required: 'Please specify the other tradition.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'philosophyTraditions', // Depends on the multi-select containing the 'Other' option index/value
    dependsValue: 'Other', // Needs client-side logic to check if 'Other' is in the selected array
  },
  {
    id: 'philosophyInterests', // Outline Q9
    section: 'Philosophy Background',
    order: 15, // Correct order
    label: 'Areas of philosophical interest',
    type: 'multi-select-numbered',
    required: true,
    options: [
      'Metaphysics', 'Epistemology', 'Ethics', 'Political philosophy',
      'Philosophy of mind', 'Philosophy of language', 'Philosophy of technology',
      'Philosophy of science', 'Aesthetics', 'Phenomenology', 'Logic',
      'Existentialism', 'Pragmatism', 'Psychoanalysis', 'Post-structuralism',
      'Critical theory', 'Feminist philosophy', 'Environmental philosophy', 'Other',
    ],
    hint: 'Select all that apply by entering numbers separated by spaces.',
    description: 'Select your main areas of interest within philosophy. Choose all that apply.',
     validationRules: {
      required: 'Please select at least one area of interest.',
      minSelections: { value: 1, message: 'Please select at least one area of interest.' },
    },
    dbType: 'TEXT[]',
    otherField: true,
  },
  {
    id: 'philosophyInterestsOther', // Implicit field for Q9 'Other'
    section: 'Philosophy Background',
    order: 16, // Correct order
    label: 'Other Areas of Philosophical Interest',
    type: 'text',
    required: false,
    hint: 'Specify other interests if selected.',
    description: 'If you selected "Other" for philosophical interests, please specify here.',
     validationRules: {
      required: 'Please specify the other interest.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'philosophyInterests',
    dependsValue: 'Other', // Needs client-side logic
  },
  {
    id: 'philosophyInfluences', // Outline Q10
    section: 'Philosophy Background',
    order: 17, // Correct order
    label: 'Philosophical influences (Optional)',
    type: 'textarea',
    required: false,
    hint: 'Share 1-3 philosophers/thinkers who influence you, or skip if new.',
    description: 'If applicable, share 1-3 philosophers, theorists, or thinkers whose work has influenced your thinking. If you\'re new to philosophy, feel free to skip this question or mention any thinkers who interest you.',
    validationRules: {}, // Optional field
    dbType: 'TEXT',
  },

  // --- Section: Working Style & Preferences ---
  {
    id: 'workingStyle', // Outline Q11
    section: 'Working Style & Preferences',
    order: 18, // Correct order
    label: 'Working Style Preferences',
    type: 'multi-select-numbered',
    required: true,
     options: [
      'I prefer structured discussions with clear roles',
      'I prefer free-flowing, organic conversations',
      'I enjoy debating opposing viewpoints',
      'I like collaborative consensus-building',
      'Other',
    ],
    hint: 'Select all that apply by entering numbers separated by spaces.',
    description: 'Select the working styles you prefer in a collaborative setting.',
     validationRules: {
      required: 'Please select at least one working style preference.',
      minSelections: { value: 1, message: 'Please select at least one working style preference.' },
    },
    dbType: 'TEXT[]',
    otherField: true,
  },
  {
    id: 'workingStyleOther', // Implicit field for Q11 'Other'
    section: 'Working Style & Preferences',
    order: 19, // Correct order
    label: 'Other Working Style Preference',
    type: 'text',
    required: false,
    hint: 'Specify other style if selected.',
    description: 'If you selected "Other" for working style, please specify here.',
     validationRules: {
      required: 'Please specify the other working style.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'workingStyle',
    dependsValue: 'Other', // Needs client-side logic
  },
  {
    id: 'communicationStyle', // Outline Q12
    section: 'Working Style & Preferences',
    order: 20, // Correct order
    label: 'Communication Style',
    type: 'single-select',
    required: true,
    options: [
      'I tend to process ideas internally before speaking',
      'I think out loud and develop ideas through conversation',
      'I adapt my style depending on the group dynamic',
    ],
    hint: 'Select the option that best describes you.',
    description: 'Understanding communication styles helps in forming balanced teams.',
    validationRules: {
      required: 'Please select your communication style.',
    },
    dbType: 'TEXT',
  },
  {
    id: 'collaborationRole', // Outline Q13
    section: 'Working Style & Preferences',
    order: 21, // Correct order
    label: 'In collaborative philosophical work, I typically prefer to:',
    type: 'multi-select-numbered',
    required: true,
    options: [
      'Lead discussions and synthesize ideas',
      'Research sources and gather evidence',
      'Develop written arguments',
      'Present concepts to others',
      'Challenge assumptions and play devil\'s advocate',
      'Listen and provide feedback on others\' ideas',
      'Other',
    ],
    hint: 'Select all roles you prefer by entering numbers separated by spaces.',
    description: 'Select the roles you typically prefer to take on during collaborative philosophical work.',
    validationRules: {
      required: 'Please select at least one preferred role.',
      minSelections: { value: 1, message: 'Please select at least one preferred role.' },
    },
    dbType: 'TEXT[]',
    otherField: true,
  },
   {
    id: 'collaborationRoleOther', // Implicit field for Q13 'Other'
    section: 'Working Style & Preferences',
    order: 22, // Correct order
    label: 'Other Preferred Collaboration Role',
    type: 'text',
    required: false,
    hint: 'Specify other role if selected.',
    description: 'If you selected "Other" for preferred collaboration role, please specify here.',
     validationRules: {
      required: 'Please specify the other role.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'collaborationRole',
    dependsValue: 'Other', // Needs client-side logic
  },
  {
    id: 'presentationComfort', // Outline Q14
    section: 'Working Style & Preferences',
    order: 23, // Correct order
    label: 'How comfortable are you with presenting philosophical ideas to a group?',
    type: 'scale',
    required: true,
    hint: '1 = I prefer not to present, 10 = I enjoy presenting.',
    description: 'Rate your comfort level with presenting philosophical ideas to a group (1=Low, 10=High).',
    validationRules: {
      required: 'Please rate your presentation comfort.',
      isNumber: 'Rating must be a number.',
      min: { value: 1, message: 'Rating must be between 1 and 10.' },
      max: { value: 10, message: 'Rating must be between 1 and 10.' },
    },
    dbType: 'INTEGER',
  },
  {
    id: 'previousCollaborationExperience', // Outline Q15
    section: 'Working Style & Preferences',
    order: 24, // Correct order
    label: 'Have you previously participated in collaborative philosophical discussions?',
    type: 'single-select',
    required: true,
    options: [
      'Yes, frequently (e.g., philosophy clubs, reading groups)',
      'Yes, occasionally (e.g., class discussions, informal debates)',
      'Rarely or never',
      'Other',
    ],
    hint: 'Select your level of experience.',
    description: 'Indicate your previous experience with collaborative philosophical discussions.',
    validationRules: {
      required: 'Please select your experience level.',
    },
    dbType: 'TEXT',
    otherField: true,
  },
  {
    id: 'previousCollaborationExperienceOther', // Implicit field for Q15 'Other'
    section: 'Working Style & Preferences',
    order: 25, // Correct order
    label: 'Other Collaboration Experience',
    type: 'text',
    required: false,
    hint: 'Specify other experience if selected.',
    description: 'If you selected "Other" for collaboration experience, please specify here.',
     validationRules: {
      required: 'Please specify your other experience.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'previousCollaborationExperience',
    dependsValue: 'Other',
  },

  // --- Section: Technical Background ---
  {
    id: 'technicalFamiliarity', // Simplified from Outline Q16
    section: 'Technical Background',
    order: 26, // Correct order
    label: 'How familiar are you with technical concepts generally (e.g., programming, AI, digital culture)?',
    type: 'scale',
    required: true,
    hint: '1 = Unfamiliar, 5 = Very Familiar.',
    description: 'Rate your general familiarity with technical concepts relevant to the event themes (1=Low, 5=High).',
    validationRules: {
      required: 'Please rate your technical familiarity.',
      isNumber: 'Rating must be a number.',
      min: { value: 1, message: 'Rating must be between 1 and 5.' },
      max: { value: 5, message: 'Rating must be between 1 and 5.' },
    },
    dbType: 'INTEGER',
  },
  {
    id: 'technicalInterests', // Outline Q17
    section: 'Technical Background',
    order: 27, // Correct order
    label: 'Technical Interests (Optional)',
    type: 'textarea',
    required: false,
    hint: 'Any specific technologies you\'re curious about philosophically?',
    description: 'Are there specific technologies (e.g., AI models, VR, specific platforms) you\'re particularly interested in discussing from a philosophical perspective?',
    validationRules: {}, // Optional
    dbType: 'TEXT',
  },

  // --- Section: Theme Preferences ---
  {
    id: 'themeRanking', // Outline Q18
    section: 'Theme Preferences',
    order: 28, // Correct order
    label: 'Please rank your top 3 preferred themes',
    type: 'ranking-numbered',
    required: true,
    options: [ // Updated themes from outline Q18
      'Minds and Machines: Consciousness Beyond the Human',
      'Digital Commons: Rethinking Property in Information Space',
      'Algorithmic Governance: Authority Without Autonomy?',
      'Technological Singularity: Philosophical Implications of Superintelligence',
      'Extended Perception: Technology and Phenomenological Experience',
      'Digital Ethics: Beyond Utilitarian Frameworks',
      'Attention Economies: The Commodification of Consciousness',
      'Algorithmic Aesthetics: Beauty in the Age of Machine Creation',
      'Other',
    ],
    hint: 'Enter rank (1, 2, 3) for your top 3 choices (e.g., `5:1 2:2 8:3`).',
    description: 'Rank your top 3 preferred themes for discussion groups. Enter the option number followed by a colon and the rank (1, 2, or 3), separated by spaces or commas. Example: `5:1 2:2 8:3` means Option 5 is 1st choice, Option 2 is 2nd, Option 8 is 3rd.',
    validationRules: {
      required: 'Theme ranking is required.',
      minRanked: { value: 3, message: 'Please rank exactly 3 themes.' }, // Spec says "top 3"
      // Add pattern validation for format like "number:rank" and uniqueness checks in Zod generation/client-side
      // uniqueSelections: 'Each theme can only be ranked once.', // Handled by Zod refine
    },
    dbType: 'JSONB', // Store as [{ optionIndex: number, rank: number }, ...]
    otherField: true, // If 'Other' is ranked
  },
  {
    id: 'themeRankingOther', // Outline Q19
    section: 'Theme Preferences',
    order: 29, // Correct order
    label: 'If you ranked "Other" theme, please describe your idea',
    type: 'textarea',
    required: false, // Conditional
    hint: 'Describe your theme idea if you ranked "Other".',
    description: 'If you ranked the "Other" option for themes, please briefly describe your suggested theme topic here.',
    validationRules: {
       required: 'Please describe your "Other" theme idea.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'themeRanking', // Needs logic to check if 'Other' is in the ranked list
    dependsValue: 'Other', // Placeholder, actual check is complex
  },

  // --- Section: Workshop Preferences ---
  {
    id: 'workshopRanking', // Outline Q20
    section: 'Workshop Preferences',
    order: 30, // Correct order
    label: 'Please rank your top 3 preferred workshops',
    type: 'ranking-numbered',
    required: true,
    options: [ // Updated workshops from outline Q20
      'Language Models as Philosophical Objects',
      'Generative AI Art: Creativity, Authorship, and Aesthetics',
      'Reinforcement Learning: The Technical Foundations of AGI',
      'Technology as Tool vs Master: Beyond Instrumentalism',
      'Digital Commons and Information Capitalism',
      'The Attention Economy: Technical Mechanisms and Philosophical Implications',
      'Thinking Through Technical Systems: A Philosophical Approach',
      'Design Philosophy: From Metaphysics to Material Reality',
      'Other',
    ],
    hint: 'Enter rank (1, 2, 3) for your top 3 choices (e.g., `1:1 5:2 3:3`).',
    description: 'Rank your top 3 preferred workshops. Enter the option number followed by a colon and the rank (1, 2, or 3), separated by spaces or commas. Example: `1:1 5:2 3:3` means Option 1 is 1st choice, Option 5 is 2nd, Option 3 is 3rd.',
     validationRules: {
      required: 'Workshop ranking is required.',
      minRanked: { value: 3, message: 'Please rank exactly 3 workshops.' },
      // Add pattern validation for format like "number:rank" and uniqueness checks
      // uniqueSelections: 'Each workshop can only be ranked once.',
    },
    dbType: 'JSONB',
    otherField: true, // If 'Other' is ranked
  },
  {
    id: 'workshopRankingOther', // Outline Q21
    section: 'Workshop Preferences',
    order: 31, // Correct order
    label: 'If you ranked "Other" workshop, please describe your idea',
    type: 'textarea',
    required: false, // Conditional
    hint: 'Describe your workshop idea if you ranked "Other".',
    description: 'If you ranked the "Other" option for workshops, please briefly describe your suggested workshop topic here.',
    validationRules: {
       required: 'Please describe your "Other" workshop idea.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'workshopRanking', // Needs logic to check if 'Other' is in the ranked list
    dependsValue: 'Other', // Placeholder
  },

  // --- Section: Team Formation Preferences ---
  {
    id: 'teammateSimilarityPreference', // Outline Q22
    section: 'Team Formation Preferences',
    order: 32, // Correct order
    label: 'Teammate similarity preference',
    type: 'scale',
    required: true,
    hint: '1 = Prefer very different interests, 10 = Prefer very similar interests.',
    description: 'Rate your preference for teammates having similar or different philosophical interests to your own (1=Different, 10=Similar).',
     validationRules: {
      required: 'Please rate your teammate similarity preference.',
      isNumber: 'Rating must be a number.',
      min: { value: 1, message: 'Rating must be between 1 and 10.' },
      max: { value: 10, message: 'Rating must be between 1 and 10.' },
    },
    dbType: 'INTEGER',
  },
  {
    id: 'mentorshipPreference', // Outline Q23
    section: 'Team Formation Preferences',
    order: 33, // Correct order
    label: 'Experience level and mentorship preferences',
    type: 'single-select',
    required: true,
    options: [
      'I\'d like to serve as a mentor to newer philosophy students',
      'I\'d like to be paired with a more experienced student as a mentee',
      'I prefer to work with students of similar experience level to mine',
      'I don\'t have a strong preference',
    ],
    hint: 'Select your preference regarding mentorship.',
    description: 'Let us know your preference regarding mentorship roles within your team.',
    validationRules: {
      required: 'Please select your mentorship preference.',
    },
    dbType: 'TEXT',
  },
  {
    id: 'mentorComfortAreas', // Outline Q24
    section: 'Team Formation Preferences',
    order: 34, // Correct order
    label: 'If you selected that you\'d like to be a mentor, what aspects of philosophy are you comfortable mentoring in?',
    type: 'textarea',
    required: false, // Conditional
    hint: 'Specify areas you feel comfortable mentoring in (skip if not applicable).',
    description: 'If you indicated you\'d like to be a mentor, please list the philosophical areas or topics you feel comfortable providing guidance on.',
    validationRules: {
       required: 'Please specify mentoring areas.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'mentorshipPreference',
    dependsValue: 'I\'d like to serve as a mentor to newer philosophy students',
  },
  {
    id: 'preferredTeammates', // Outline Q25
    section: 'Team Formation Preferences',
    order: 35, // Correct order
    label: 'Do you have any specific people you\'d like to have as teammates? (Optional)',
    type: 'textarea',
    required: false,
    hint: 'List names. Requests accommodated if possible, but not guaranteed.',
    description: 'If you have specific individuals you\'d prefer to be teamed up with, please list their names here. We will try our best to accommodate requests but cannot guarantee team placements.',
    validationRules: {}, // Optional
    dbType: 'TEXT',
  },

  // --- Section: Communication & Community ---
  {
    id: 'discordMember', // Outline Q26
    section: 'Communication & Community',
    order: 36, // Correct order
    label: 'Are you a member of the Philosophy of Technology Group Discord?',
    type: 'single-select',
    required: true,
     options: [
      'Yes',
      'No, but I\'d like to join',
      'No, and I prefer not to join',
    ],
    hint: 'Select your Discord status. Invite: https://discord.gg/wuxnJG9XwW',
    description: 'Let us know if you\'re part of the Discord community. It\'s a primary channel for event communication. Invite link: https://discord.gg/wuxnJG9XwW',
    validationRules: {
      required: 'Please select your Discord membership status.',
    },
    dbType: 'TEXT',
  },
  // --- Section: Learning Goals ---
  {
    id: 'learningGoals', // Outline Q27
    section: 'Learning Goals',
    order: 37, // Correct order
    label: 'What do you hope to gain from the Philosothon experience?',
    type: 'multi-select-numbered',
    required: true,
    options: [
      'Deeper understanding of specific philosophical concepts',
      'Experience with collaborative philosophical inquiry',
      'New perspectives from peers with different backgrounds',
      'Practice articulating philosophical arguments',
      'Connections with other philosophy students',
      'Technical knowledge about emerging technologies',
      'Other',
    ],
    hint: 'Select all that apply by entering numbers separated by spaces.',
    description: 'Let us know what you hope to gain from participating in the Philosothon.',
    validationRules: {
      required: 'Please select at least one learning goal.',
      minSelections: { value: 1, message: 'Please select at least one learning goal.' },
    },
    dbType: 'TEXT[]',
    otherField: true,
  },
  {
    id: 'learningGoalsOther', // Implicit field for Q27 'Other'
    section: 'Learning Goals',
    order: 38, // Correct order
    label: 'Other Learning Goals',
    type: 'text',
    required: false,
    hint: 'Specify other goals if selected.',
    description: 'If you selected "Other" for learning goals, please specify here.',
     validationRules: {
      required: 'Please specify your other learning goals.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'learningGoals',
    dependsValue: 'Other', // Needs client-side logic
  },

  // --- Section: Availability and Scheduling ---
  {
    id: 'availabilityConfirmation', // Outline Q28
    section: 'Availability and Scheduling',
    order: 39, // Correct order
    label: 'Please confirm your availability for the full duration of the event (April 26-27, 2025)',
    type: 'single-select', // Changed from boolean in old schema to match outline MC
    required: true,
    options: [
        'Yes, I can attend the full event',
        'No, I have partial availability (please specify below)',
    ],
    hint: 'Confirm your availability for the event dates.',
    description: 'Please confirm if you can attend the entire event duration (April 26-27, 2025).',
    validationRules: {
      required: 'Please confirm your availability.',
    },
    dbType: 'TEXT', // Changed from BOOLEAN
  },
  {
    id: 'availabilityDetails', // Outline Q29
    section: 'Availability and Scheduling',
    order: 40, // Correct order
    label: 'If you have partial availability, please specify the times you CAN attend',
    type: 'textarea',
    required: false, // Conditional
    hint: 'Specify times you CAN attend if not fully available.',
    description: 'If you indicated partial availability, please specify the dates and times you are able to attend.',
    validationRules: {
       required: 'Please specify your availability details.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'availabilityConfirmation',
    dependsValue: 'No, I have partial availability (please specify below)',
  },
  {
    id: 'contingencyAvailability', // Outline Q30
    section: 'Availability and Scheduling',
    order: 41, // Correct order
    label: 'Contingency Planning: If we need to postpone the event, would you be available the following weekend (May 3-4, 2025)?',
    type: 'single-select',
    required: true,
    options: [
        'Yes, I would be fully available that weekend',
        'I would have partial availability that weekend (please specify below)',
        'No, I would not be available that weekend',
    ],
    hint: 'Select your availability for the backup dates (May 3-4).',
    description: 'Please indicate your availability for the contingency dates (May 3-4, 2025) in case the event needs to be postponed.',
    validationRules: {
      required: 'Please indicate your contingency availability.',
    },
    dbType: 'TEXT',
  },
  {
    id: 'contingencyAvailabilityDetails', // Outline Q31
    section: 'Availability and Scheduling',
    order: 42, // Correct order
    label: 'If you have partial availability for the contingency dates, please specify',
    type: 'textarea',
    required: false, // Conditional
    hint: 'Specify times you CAN attend on the backup dates.',
    description: 'If you indicated partial availability for the contingency dates (May 3-4), please specify the times you can attend.',
    validationRules: {
       required: 'Please specify your contingency availability details.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'contingencyAvailability',
    dependsValue: 'I would have partial availability that weekend (please specify below)',
  },

  // --- Section: Logistics ---
  {
    id: 'dietaryRestrictions', // Outline Q32
    section: 'Logistics',
    order: 43, // Correct order
    label: 'Do you have any dietary restrictions or preferences?',
    type: 'textarea',
    required: false,
    hint: 'e.g., Vegetarian, Gluten-Free, Peanut Allergy (Optional). Helps plan lunch.',
    description: 'Please list any dietary restrictions or preferences (e.g., vegetarian, vegan, gluten-free, allergies). This information helps us plan catering for the event.',
    validationRules: {}, // Optional
    dbType: 'TEXT',
  },
  {
    id: 'accessibilityNeeds', // Outline Q33
    section: 'Logistics',
    order: 44, // Correct order
    label: 'Do you require any accessibility accommodations?',
    type: 'textarea',
    required: false,
    hint: 'Let us know how we can make the event accessible for you (Optional).',
    description: 'Please describe any accessibility accommodations you may require to fully participate in the event.',
    validationRules: {}, // Optional
    dbType: 'TEXT',
  },
  {
    id: 'heardAboutSource', // Outline Q34
    section: 'Logistics',
    order: 45, // Correct order
    label: 'How did you hear about the Philosothon?',
    type: 'multi-select-numbered',
    required: true,
     options: [
      'Email announcement',
      'From a professor',
      'From a friend/classmate',
      'Philosophy department communication',
      'Social media',
      'Other',
    ],
    hint: 'Select all that apply by entering numbers separated by spaces.',
    description: 'Let us know how you found out about the Philosothon.',
    validationRules: {
      required: 'Please select how you heard about the event.',
      minSelections: { value: 1, message: 'Please select at least one source.' },
    },
    dbType: 'TEXT[]',
    otherField: true,
  },
  {
    id: 'heardAboutSourceOther', // Implicit field for Q34 'Other'
    section: 'Logistics',
    order: 46, // Correct order
    label: 'Other Source',
    type: 'text',
    required: false,
    hint: 'Specify other source if selected.',
    description: 'If you selected "Other" for how you heard about the event, please specify here.',
     validationRules: {
      required: 'Please specify the other source.', // Conditional
    },
    dbType: 'TEXT',
    dependsOn: 'heardAboutSource',
    dependsValue: 'Other', // Needs client-side logic
  },

  // --- Section: Additional Information ---
   {
    id: 'additionalInfo', // Outline Q35
    section: 'Additional Information',
    order: 47, // Correct order
    label: 'Is there anything else you\'d like us to know? (Optional)',
    type: 'textarea',
    required: false,
    hint: 'Any additional relevant information (Optional).',
    description: 'Use this space to provide any other information you think might be relevant for the organizers.',
    validationRules: {}, // Optional
    dbType: 'TEXT',
  },

  // --- Section: Consent & Agreement ---
  {
    id: 'finalConfirmationAgreement', // Outline Q36
    section: 'Consent & Agreement',
    order: 48, // Correct order - This is the 36th question in the flow
    label: 'By submitting this form, I confirm that I understand the time commitment required for the Philosothon (all day April 26 and morning of April 27) and will make arrangements to fully participate and provide feedback on my experience.',
    type: 'boolean', // Single checkbox
    required: true,
    hint: 'Please check this box to confirm your understanding and commitment.',
    description: 'Final confirmation: Please check this box to acknowledge the event\'s time commitment and your intent to fully participate.',
    validationRules: {
      // Booleans required=true needs refine in Zod to check for `true`
      required: 'You must confirm your understanding and commitment to participate.',
    },
    dbType: 'BOOLEAN',
  },
]; // End of registrationSchema array

// Function to generate the Zod schema dynamically (V3.1 - uses validationRules)
// TODO: Enhance this function in the generation script (scripts/generate-registration.ts)
// to fully parse validationRules and create complex Zod types (e.g., refine for ranking).
export function generateRegistrationSchema() {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  registrationSchema.forEach(q => {
    let zodType: z.ZodTypeAny | null = null;

    // Basic type mapping (expand in generation script)
    switch (q.type) {
      case 'text':
      case 'textarea':
      case 'email': // Specific validation handled by rules
      case 'single-select': // Assumes string options
        zodType = z.string();
        break;
      case 'number':
      case 'scale':
        zodType = z.number();
        break;
      case 'boolean':
        zodType = z.boolean();
        break;
      case 'multi-select-numbered':
        // Spec V3.1 implies TEXT[] dbType, suggesting storing selected option strings.
        // If storing numbers (indices), use z.array(z.number())
        zodType = z.array(z.string());
        break;
      case 'ranking-numbered':
        // Store as JSONB, e.g., [{ optionValue: string, rank: number }, ...] or [{ optionIndex: number, rank: number }, ...]
        // Basic validation here, complex refine in generator script
        zodType = z.array(z.object({
          // Assuming optionValue is stored based on TEXT[] convention
          optionValue: z.string(), // Or z.number() if storing index
          rank: z.number().int().min(1),
        }));
        break;
      // password/confirmPassword are not in the schema array
    }

    if (zodType && q.dbType !== 'SKIP') {
      const rules = q.validationRules;
      let currentType = zodType; // Use a temp variable for modifications

      // Apply basic rules (expand in generator script)
      if (rules) {
        if (rules.minLength && currentType instanceof z.ZodString) {
          currentType = currentType.min(rules.minLength.value, rules.minLength.message);
        }
        if (rules.maxLength && currentType instanceof z.ZodString) {
          currentType = currentType.max(rules.maxLength.value, rules.maxLength.message);
        }
        if (rules.min && currentType instanceof z.ZodNumber) {
          currentType = currentType.min(rules.min.value, rules.min.message);
        }
        if (rules.max && currentType instanceof z.ZodNumber) {
          currentType = currentType.max(rules.max.value, rules.max.message);
        }
        if (rules.isEmail && currentType instanceof z.ZodString) {
          currentType = currentType.email(typeof rules.isEmail === 'string' ? rules.isEmail : undefined);
        }
        if (rules.pattern && currentType instanceof z.ZodString) {
          currentType = currentType.regex(new RegExp(rules.pattern.regex, rules.pattern.flags), rules.pattern.message);
        }
        // Array validation (basic size checks)
        if (rules.minSelections && currentType instanceof z.ZodArray) {
           currentType = currentType.min(rules.minSelections.value, rules.minSelections.message);
        }
         if (rules.maxSelections && currentType instanceof z.ZodArray) {
           currentType = currentType.max(rules.maxSelections.value, rules.maxSelections.message);
        }
        // TODO: Add handling for ranking rules (minRanked, uniqueSelections, format) in generator script using .refine()
      }

      // Handle required status
      if (q.required) {
         if (q.type === 'boolean') {
           // Ensure the boolean is explicitly true if required
          currentType = currentType.refine((val: boolean) => val === true, {
            message: typeof rules?.required === 'string' ? rules.required : 'This field must be checked.'
          });
         } else if (currentType instanceof z.ZodString && !rules?.minLength) {
             // Add a general non-empty check for required strings if no specific minLength is set
             currentType = currentType.min(1, typeof rules?.required === 'string' ? rules.required : 'This field is required.');
         } else if (currentType instanceof z.ZodArray && !rules?.minSelections && !rules?.minRanked) {
             // Add a general non-empty check for required arrays if no specific min rule is set
             currentType = currentType.min(1, typeof rules?.required === 'string' ? rules.required : 'Please select at least one option.');
         }
         // For numbers/scales, the min/max rules usually cover the required aspect implicitly.
         // If a number can be 0 but is required, a specific check might be needed.
      } else {
        // If not required, make it optional and allow null/undefined
        currentType = currentType.optional().nullable();
      }

      schemaObject[q.id] = currentType;
    }
  });

  // TODO: Add server-side refinements in the generation script if needed,
  // e.g., cross-field validation like password confirmation (though better in action),
  // conditional requirements based on dependsOn/dependsValue using .refine() or .superRefine().
  return z.object(schemaObject);
}
