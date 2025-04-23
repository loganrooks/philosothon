// Manual mock for registrationQuestions
// Vitest will automatically use this file when the module is imported in tests.

export const questions = [
  { id: 'firstName', label: 'First Name', type: 'text', validation: { required: true } },
  // Add more questions if needed for other tests,
  // though only the first one is needed for the current test case.
];