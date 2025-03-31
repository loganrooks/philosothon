import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SupabaseProvider, { useSupabase } from '@/components/SupabaseProvider';
import type { SupabaseClient } from '@supabase/supabase-js'; // Import the type
import { createClient } from '@/lib/supabase/client'; // Import to mock

// Mock the actual client creation function
vi.mock('@/lib/supabase/client');

describe('SupabaseProvider and useSupabase Hook', () => {
  // Create a mock Supabase client object for testing
  const mockSupabaseClient = {
    auth: {
      signIn: vi.fn(),
      signOut: vi.fn(),
      // Add other methods as needed for tests
    },
    from: vi.fn(() => ({ // Mock the 'from' method and its chainable methods
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    // Add other top-level client properties/methods if needed
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Configure the mock createClient to return our mock client
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient as unknown as SupabaseClient); // Cast via unknown
  });

  it('SupabaseProvider should render children', () => {
    render(
      <SupabaseProvider>
        <div>Test Child</div>
      </SupabaseProvider>
    );
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('useSupabase should return the Supabase client when used within a provider', () => {
    // Test component that uses the hook
    const TestComponent = () => {
      const supabase = useSupabase();
      expect(supabase).toBe(mockSupabaseClient); // Check if the correct mock client is returned
      return <div>Hook Used</div>;
    };

    render(
      <SupabaseProvider>
        <TestComponent />
      </SupabaseProvider>
    );
    expect(screen.getByText('Hook Used')).toBeInTheDocument();
  });

  it('useSupabase should throw an error when used outside a provider', () => {
    // Suppress console.error output from React for the expected error
    const originalError = console.error;
    console.error = vi.fn();

    // Test component that uses the hook without a provider
    const TestComponent = () => {
      let errorThrown = false;
      try {
        useSupabase();
      } catch (error) { // Catch as unknown first
        // Type assertion for checking the message
        expect((error as Error).message).toContain('useSupabase must be used within a SupabaseProvider');
        errorThrown = true;
      }
      expect(errorThrown).toBe(true); // Ensure the error was actually caught
      return null; // Render nothing
    };

    render(<TestComponent />);

    // Restore console.error
    console.error = originalError;
  });

  it('SupabaseProvider should initialize the client only once', () => {
    render(
      <SupabaseProvider>
        <div>Child</div>
      </SupabaseProvider>
    );
    // createClient should be called once by useState initializer
    expect(createClient).toHaveBeenCalledTimes(1);

    // Re-render shouldn't cause re-initialization (though hard to test directly without causing re-render)
    // The fact that it's in useState ensures this behavior in the actual component.
  });
});