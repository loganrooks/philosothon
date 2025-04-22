import 'isomorphic-fetch'; // Add fetch polyfill for environments like JSDOM
import 'react-dom'; // Attempt to make react-dom exports available

// Import Jest DOM matchers for extended assertions
import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

// Mock react-dom specifically for useFormState
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>(); // Get the actual module
  return {
    ...actual, // Keep other exports
    // Provide a basic mock for useFormState: returns initial state and the action
    useFormState: (action: any, initialState: any) => [initialState, (_formData: FormData) => action(initialState, _formData)],
    // Provide a basic mock for useFormStatus
    useFormStatus: () => ({ pending: false, data: null, method: null, action: null }),
  };
});

// Mock scrollIntoView for JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Optional: Add any other global setup needed for tests here
// For example, mocking global objects or setting up mocks for external services

// Example: Mocking matchMedia (often needed for responsive components)
// Object.defineProperty(window, 'matchMedia', {
//   writable: true,
//   value: vi.fn().mockImplementation(query => ({
//     matches: false,
//     media: query,
//     onchange: null,
//     addListener: vi.fn(), // deprecated
//     removeListener: vi.fn(), // deprecated
//     addEventListener: vi.fn(),
//     removeEventListener: vi.fn(),
//     dispatchEvent: vi.fn(),
//   })),
// });