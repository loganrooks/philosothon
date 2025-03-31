import 'isomorphic-fetch'; // Add fetch polyfill for environments like JSDOM

// Import Jest DOM matchers for extended assertions
import '@testing-library/jest-dom/vitest';

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