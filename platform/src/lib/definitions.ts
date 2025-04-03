// Central type definitions

export type FormState = {
  message: string | null;
  success: boolean; // Indicate success/failure
  errors?: Record<string, string[]>; // Optional field-specific errors
};

// Add other shared types here as needed
// e.g., export type Theme = { ... };
// export type Workshop = { ... };

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number | null;
  created_at: string;
};