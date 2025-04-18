import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type NextRequest, NextResponse } from 'next/server';
import { type User } from '@supabase/supabase-js';
import { middleware, config } from '@/middleware'; // Import the middleware and config
import { updateSession } from '@/lib/supabase/middleware'; // Import the function to mock

// Mock the dependency
vi.mock('@/lib/supabase/middleware');

// NOTE: Explicitly mocking 'next/server' caused issues ("NextResponse is not a constructor").
// Using vi.spyOn for specific methods instead.

describe('Root Middleware (middleware.ts)', () => {
  let mockRequest: NextRequest;
  let mockResponse: NextResponse;
  const mockUser = { id: 'user-123' } as User; // Define a mock user

  beforeEach(() => {
    vi.clearAllMocks();

    // Spy on and mock implementations for NextResponse methods
    vi.spyOn(NextResponse, 'redirect').mockReturnValue(new NextResponse()); // Return a simple response for redirect
    vi.spyOn(NextResponse, 'next').mockReturnValue(new NextResponse()); // Mock .next() as well

    // Mock NextRequest
    mockRequest = {
      headers: new Headers(),
      nextUrl: {
        pathname: '/', // Default pathname
        origin: 'http://localhost:3000', // Add origin for redirect construction
        clone: function() { return { ...this }; }, // Simple clone mock
      },
      // Add other properties if needed
    } as NextRequest;

    // Mock NextResponse.next() return value for updateSession mock
    mockResponse = new NextResponse();
    vi.mocked(NextResponse.next).mockReturnValue(mockResponse); // Ensure .next() returns our mockResponse

    // Default mock for updateSession (unauthenticated)
    vi.mocked(updateSession).mockResolvedValue({ response: mockResponse, user: null });
  });

  it('should call updateSession with the request', async () => {
    await middleware(mockRequest);
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith(mockRequest);
  });

  it('should return the response object from updateSession', async () => {
    // The middleware itself should return the response *part* of the object
    const result = await middleware(mockRequest);
    expect(result).toBe(mockResponse);
  });

  it('should export the correct config object', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher[0]).toContain('?!_next/static|_next/image|favicon.ico');
  });


  it('should redirect unauthenticated users from protected /admin routes to /admin/login', async () => {
    // Arrange: Simulate request to a protected admin route
    mockRequest.nextUrl.pathname = '/admin/themes';
    // updateSession mock already returns user: null in beforeEach

    // Act
    await middleware(mockRequest);

    // Assert
    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    // Check the properties of the URL object passed to redirect
    const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
    expect(redirectArg.pathname).toBe('/admin/login');
    expect(redirectArg.origin).toBe(mockRequest.nextUrl.origin);
  });

   it('should allow authenticated users to access protected /admin routes', async () => {
    // Arrange: Simulate request to a protected admin route
    mockRequest.nextUrl.pathname = '/admin/themes';
    // Override updateSession mock to return an authenticated user
    vi.mocked(updateSession).mockResolvedValue({ response: mockResponse, user: mockUser });

    // Act
    const result = await middleware(mockRequest);

    // Assert: Should not redirect, should return the original response from updateSession
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockResponse);
  });

  it('should redirect authenticated users from /admin/login to /admin', async () => {
    // Arrange: Simulate request to login page when already logged in
    mockRequest.nextUrl.pathname = '/admin/login';
    // Override updateSession mock to return an authenticated user
    vi.mocked(updateSession).mockResolvedValue({ response: mockResponse, user: mockUser });

    // Act
    await middleware(mockRequest);

    // Assert
    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    // Check the properties of the URL object passed to redirect
    const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
    expect(redirectArg.pathname).toBe('/admin');
    expect(redirectArg.origin).toBe(mockRequest.nextUrl.origin);
   });

   it('should allow unauthenticated users to access /admin/login', async () => {
     // Arrange: Simulate request to login page when not logged in
    mockRequest.nextUrl.pathname = '/admin/login';
    // updateSession mock already returns user: null in beforeEach

    // Act
    const result = await middleware(mockRequest);

    // Assert: Should not redirect, should return the original response
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockResponse);
   });
});