import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server'; // Function to test
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@supabase/ssr');
vi.mock('next/headers');

describe('Supabase Server Client Utility (server.ts)', () => {
  const originalEnv = process.env;
  const mockSupabaseUrl = 'http://mock-server-supabase.co';
  const mockSupabaseAnonKey = 'mock-server-anon-key';

  // Use the imported type for the mock cookie store
  // Infer the type from the return type of the mocked function
  let mockCookieStore: Awaited<ReturnType<typeof cookies>>;
  // Define a type for the cookie handlers we expect to capture
  type CapturedCookieHandlers = {
    get: (name: string) => string | undefined;
    set: (name: string, value: string, options: CookieOptions) => void;
    remove: (name: string, options: CookieOptions) => void;
  };
  let capturedCookieHandlers: CapturedCookieHandlers;
  let mockReturnedSupabaseClient: Partial<SupabaseClient>;
  // Declare mock functions for cookie store methods here
  let mockGet: ReturnType<typeof vi.fn>;
  let mockSet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: mockSupabaseAnonKey,
    };

    // Mock cookieStore from next/headers
    // Create mock functions for the store methods
    // Initialize mock functions here
    mockGet = vi.fn((name: string) => ({ name, value: `mock-cookie-store-${name}` }));
    mockSet = vi.fn();
    // Assign to the mockCookieStore object, casting as the inferred type
    mockCookieStore = {
      get: mockGet,
      set: mockSet,
      has: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      getAll: vi.fn(() => []),
      [Symbol.iterator]: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      toString: vi.fn(() => ''),
      size: 0, // Add missing size property
      // Cast via unknown to handle potential type complexities
    } as unknown as Awaited<ReturnType<typeof cookies>>;
    // Mock the cookies() function to return our typed mock store
    vi.mocked(cookies).mockResolvedValue(mockCookieStore);

    // Create a simple mock client object
    mockReturnedSupabaseClient = {
       auth: {
         getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
       } // No need for complex partial type here if casting the whole object
    };
    vi.mocked(createServerClient).mockImplementation((url, key, options) => {
      capturedCookieHandlers = options?.cookies as unknown as CapturedCookieHandlers;
      // Cast the simplified mock via unknown
      return mockReturnedSupabaseClient as unknown as SupabaseClient;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should call cookies() to get cookie store', async () => {
    await createClient();
    expect(cookies).toHaveBeenCalledTimes(1);
  });

  it('should call createServerClient with correct args', async () => {
    await createClient();
    expect(createServerClient).toHaveBeenCalledTimes(1);
    expect(createServerClient).toHaveBeenCalledWith(
      mockSupabaseUrl,
      mockSupabaseAnonKey,
      expect.objectContaining({
        cookies: expect.objectContaining({
          get: expect.any(Function),
          set: expect.any(Function),
          remove: expect.any(Function),
        }),
      })
    );
  });

  it('should return the client created by createServerClient', async () => {
    const client = await createClient();
    expect(client).toBe(mockReturnedSupabaseClient);
  });

  it('cookie "get" handler should call cookieStore.get', async () => {
    await createClient(); // Run to capture handlers
    const cookieName = 'server-cookie-get';
    const value = capturedCookieHandlers.get(cookieName);

    expect(mockCookieStore.get).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.get).toHaveBeenCalledWith(cookieName);
    expect(value).toBe(`mock-cookie-store-${cookieName}`);
  });

  it('cookie "set" handler should call cookieStore.set', async () => {
    await createClient(); // Run to capture handlers
    const cookieName = 'server-cookie-set';
    const cookieValue = 'value-set';
    const cookieOptions: CookieOptions = { maxAge: 7200 };

    capturedCookieHandlers.set(cookieName, cookieValue, cookieOptions);

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith({
      name: cookieName,
      value: cookieValue,
      ...cookieOptions,
    });
  });

  it('cookie "remove" handler should call cookieStore.set with empty value', async () => {
    await createClient(); // Run to capture handlers
    const cookieName = 'server-cookie-remove';
    const cookieOptions: CookieOptions = { path: '/' }; // Changed from '/admin' to '/'
    capturedCookieHandlers.remove(cookieName, cookieOptions);

    expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
    expect(mockCookieStore.set).toHaveBeenCalledWith({
      name: cookieName,
      value: '',
      ...cookieOptions,
    });
  });

  it('cookie "set" handler should suppress errors', async () => {
    await createClient(); // Run to capture handlers
    const cookieName = 'server-cookie-set-error';
    const cookieValue = 'value-set-error';
    const cookieOptions: CookieOptions = {};

    // Make the mock cookieStore.set throw an error
    mockSet.mockImplementationOnce(() => { // Call on the mock function variable
      throw new Error('Cookie setting failed in Server Component');
    });

    // Expect no error to be thrown from the handler itself
    expect(() => {
      capturedCookieHandlers.set(cookieName, cookieValue, cookieOptions);
    }).not.toThrow();
    expect(mockCookieStore.set).toHaveBeenCalledTimes(1); // Ensure it was still called
  });

  it('cookie "remove" handler should suppress errors', async () => {
    await createClient(); // Run to capture handlers
    const cookieName = 'server-cookie-remove-error';
    const cookieOptions: CookieOptions = {};

     // Make the mock cookieStore.set throw an error
    mockSet.mockImplementationOnce(() => { // Call on the mock function variable
      throw new Error('Cookie removal failed in Server Component');
    });

     // Expect no error to be thrown from the handler itself
    expect(() => {
      capturedCookieHandlers.remove(cookieName, cookieOptions);
    }).not.toThrow();
    expect(mockCookieStore.set).toHaveBeenCalledTimes(1); // Ensure it was still called
  });

});