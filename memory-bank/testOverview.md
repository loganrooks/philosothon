# Test Suite Overview (as of 2025-03-31)

This document summarizes the status and coverage of the automated tests (using Vitest and React Testing Library) for the `platform` application.

## Overall Status

The test suite provides good coverage for most implemented components and utilities. Tests generally follow best practices, including mocking dependencies (`next/link`, `next/navigation`, Supabase client/hooks, child components) and testing various states (rendering, success, error, empty data, conditional logic).

## Coverage Details

Tests exist for the following areas:

*   **Pages (`src/app/`):**
    *   `Home`: Mocks children, verifies component rendering.
    *   `About`: Mocks children, verifies content blocks and timeline rendering.
    *   `Themes`: Mocks Supabase/children, tests data fetching (success, error, empty), verifies props passed to `ThemeCard`.
    *   `FAQ`: Mocks `AccordionGroup`, verifies heading and mock rendering.
    *   `Register`: Mocks children, verifies heading and mock rendering.
    *   `Admin`: Mocks Supabase/redirect/children, tests auth redirection and dashboard rendering.
    *   `Admin Login`: Mocks Supabase/hooks, tests form input, success/error states for magic link.
    *   `Layout`: Mocks children/fonts/providers, tests structure, font classes, child rendering.
    *   `Workshops`: Mocks data fetching function (`fetchWorkshops`), tests success/error/empty states. **Note:** Significant issues were encountered trying to test this async Server Component reliably in the `jsdom` environment, leading to the decision to skip further attempts on this specific test suite for now after refactoring the component.

*   **Components (`src/components/`):**
    *   `AccordionGroup`: Tests item rendering, question/answer presence, toggle functionality, empty state.
    *   `ContentBlock`: Tests title and children rendering.
    *   `Countdown`: Uses fake timers, tests initial state, timer updates, expiration message, interval cleanup.
    *   `EventHighlights`: Tests heading, item count, title/description rendering per item.
    *   `Footer`: Tests copyright notice and dynamic year.
    *   `FormEmbed`: Tests placeholder rendering (implementation pending).
    *   `Hero`: Mocks `next/link`, tests heading, subheading, text, date, register link.
    *   `InstructionBlock`: Tests heading and paragraph rendering.
    *   `LogoutButton`: Mocks Supabase/hooks, tests initial state, success/failure scenarios, router calls.
    *   `NavBar`: Mocks `next/link`, tests brand link, navigation item rendering and `hrefs`.
    *   `SupabaseProvider`: Mocks client creation, tests provider rendering, hook usage (inside/outside provider), client initialization count.
    *   `ThemeCard`: Tests title/description, conditional rendering of traditions, list parsing.
    *   `Timeline`: Tests heading, item count, year/event rendering per item.
    *   `WorkshopCard`: Tests title/description, conditional rendering of facilitator.

*   **Utilities (`src/lib/`):**
    *   `Supabase Client (client.ts)`: Mocks dependency, tests correct function call and return value.
    *   `Supabase Middleware (middleware.ts)`: Mocks dependency, tests function call, return value, cookie handler logic.
    *   `Supabase Server Client (server.ts)`: Mocks dependencies, tests function calls, return value, cookie handler logic (including error suppression).
    *   `Root Middleware (middleware.ts)`: Mocks dependency, tests function call, return value, config export.

## Key Issues / Gaps

*   **Async Server Component Testing:** Significant difficulty was encountered testing the `WorkshopsPage` component due to its `async` nature interacting unpredictably with the `jsdom` test environment, even after refactoring and trying various strategies (`act`, `Suspense`, polyfills, explicit awaits). Further investigation into environment setup or alternative testing strategies (e.g., integration/E2E tests) might be needed for reliable testing of such components.
*   **Placeholder Components:** Tests for components like `FormEmbed` are basic and need expansion once the actual implementation (e.g., iframe rendering) is complete.
*   **Content Population:** Tests currently verify component rendering structure but often rely on mocked data or hardcoded text within the test/component. Tests verifying content fetched from Supabase (e.g., in `ThemesPage`, `WorkshopsPage`) mock the fetching layer.

## Conclusion

The test suite provides a solid foundation, covering most synchronous components and utility functions effectively. The primary challenge lies in unit testing async Server Components within the current Vitest/RTL/jsdom setup.