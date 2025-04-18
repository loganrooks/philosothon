import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@supabase/ssr');
vi.mock('next/server');

describe('Supabase Middleware Utility (middleware.ts)', () => {
  const originalEnv = process.env;
  const mockSupabaseUrl = 'http://mock-middleware-supabase.co';
  const mockSupabaseAnonKey = 'mock-middleware-anon-key';

  let mockRequest: NextRequest;
  let mockResponse: NextResponse;
  let mockGetUser: ReturnType<typeof vi.fn>;
  // Define a type for the cookie handlers we expect to capture
  type CapturedCookieHandlers = {
    get: (name: string) => string | undefined;
    set: (name: string, value: string, options: CookieOptions) => void;
    remove: (name: string, options: CookieOptions) => void;
  };
  let capturedCookieHandlers: CapturedCookieHandlers;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: mockSupabaseAnonKey,
    };

    // Mock NextRequest
    mockRequest = {
      headers: new Headers(),
      cookies: {
        get: vi.fn((name: string) => ({ name, value: `mock-request-cookie-${name}` })),
        set: vi.fn(),
        // Add other methods if needed by tests
      },
      // Add other NextRequest properties if needed
    } as unknown as NextRequest;

    // Mock NextResponse
    mockResponse = {
      cookies: {
        set: vi.fn(),
        // Add other methods if needed
      },
      // Add other NextResponse properties if needed
    } as unknown as NextResponse;

    // Mock NextResponse.next to return our mock response
    vi.mocked(NextResponse.next).mockReturnValue(mockResponse);

    // Mock Supabase client and capture cookie handlers
    mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null });
    vi.mocked(createServerClient).mockImplementation((url, key, options) => {
      capturedCookieHandlers = options?.cookies as unknown as CapturedCookieHandlers; // Cast via unknown
      return {
        auth: {
          getUser: mockGetUser,
        },
        // Add other client methods if needed
      } as unknown as SupabaseClient;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should call createServerClient with correct args and call getUser', async () => {
    await updateSession(mockRequest);

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
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it('should return an object containing the NextResponse', async () => {
    const result = await updateSession(mockRequest);
    expect(result.response).toBe(mockResponse); // Check the response property
    expect(result).toHaveProperty('user'); // Also check that the user property exists
  });

  it('cookie "get" handler should call request.cookies.get', async () => {
    await updateSession(mockRequest); // Run to capture handlers
    const cookieName = 'my-test-cookie';
    const value = capturedCookieHandlers.get(cookieName);

    expect(mockRequest.cookies.get).toHaveBeenCalledTimes(1);
    expect(mockRequest.cookies.get).toHaveBeenCalledWith(cookieName);
    expect(value).toBe(`mock-request-cookie-${cookieName}`);
  });

  it('cookie "set" handler should update request and response cookies and create new response', async () => {
    await updateSession(mockRequest); // Run to capture handlers

    const cookieName = 'session-token';
    const cookieValue = 'abc-123';
    const cookieOptions: CookieOptions = { maxAge: 3600, path: '/' };

    // Reset NextResponse mock count before calling handler
    vi.mocked(NextResponse.next).mockClear();
    // Create a new mock response for the second NextResponse.next call
    const newMockResponse = { cookies: { set: vi.fn() } } as unknown as NextResponse;
    vi.mocked(NextResponse.next).mockReturnValueOnce(newMockResponse); // Return new one on next call

    capturedCookieHandlers.set(cookieName, cookieValue, cookieOptions);

    // Check request cookies update
    expect(mockRequest.cookies.set).toHaveBeenCalledTimes(1);
    expect(mockRequest.cookies.set).toHaveBeenCalledWith({
      name: cookieName,
      value: cookieValue,
      ...cookieOptions,
    });

    // Check response cookies update (on the *new* response)
    expect(newMockResponse.cookies.set).toHaveBeenCalledTimes(1);
    expect(newMockResponse.cookies.set).toHaveBeenCalledWith({
      name: cookieName,
      value: cookieValue,
      ...cookieOptions,
    });

    // Check that NextResponse.next was called again
    expect(NextResponse.next).toHaveBeenCalledTimes(1);
  });

   it('cookie "remove" handler should update request and response cookies (empty value) and create new response', async () => {
    await updateSession(mockRequest); // Run to capture handlers

    const cookieName = 'session-token';
    const cookieOptions: CookieOptions = { path: '/' };

    // Reset NextResponse mock count before calling handler
    vi.mocked(NextResponse.next).mockClear();
    // Create a new mock response for the second NextResponse.next call
    const newMockResponse = { cookies: { set: vi.fn() } } as unknown as NextResponse;
    vi.mocked(NextResponse.next).mockReturnValueOnce(newMockResponse); // Return new one on next call

    capturedCookieHandlers.remove(cookieName, cookieOptions);

    // Check request cookies update (set with empty value)
    expect(mockRequest.cookies.set).toHaveBeenCalledTimes(1);
    expect(mockRequest.cookies.set).toHaveBeenCalledWith({
      name: cookieName,
      value: '',
      ...cookieOptions,
    });

    // Check response cookies update (set with empty value on the *new* response)
    expect(newMockResponse.cookies.set).toHaveBeenCalledTimes(1);
    expect(newMockResponse.cookies.set).toHaveBeenCalledWith({
      name: cookieName,
      value: '',
      ...cookieOptions,
    });

     // Check that NextResponse.next was called again
    expect(NextResponse.next).toHaveBeenCalledTimes(1);
  });

});