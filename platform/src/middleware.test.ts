import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { type NextRequest, NextResponse } from 'next/server';
import { type User } from '@supabase/supabase-js';
import { middleware, config } from '@/middleware'; // Import the middleware and config
import { updateSession } from '@/lib/supabase/middleware'; // Import the function to mock
import { fetchUserProfile } from '@/lib/data/profiles'; // Import the DAL function to mock
import type { Profile } from '@/lib/data/profiles'; // Import Profile type

// Mock the dependencies
vi.mock('@/lib/supabase/middleware');
vi.mock('@/lib/data/profiles');
vi.mock('next/server', () => ({ // Mock NextResponse methods needed
  NextResponse: class {
    static next = vi.fn();
    static redirect = vi.fn();
    // Add other static methods if needed
  }
}));

describe('Root Middleware (middleware.ts)', () => {
  let mockRequest: NextRequest;
  let mockResponse: NextResponse;
  const mockUser = { id: 'user-123', email: 'test@example.com' } as User;
  const mockAdminProfile: Profile = { id: mockUser.id, role: 'admin', full_name: 'Admin User', team_id: null, created_at: '', updated_at: '' };
  const mockParticipantProfile: Profile = { id: mockUser.id, role: 'participant', full_name: 'Participant User', team_id: null, created_at: '', updated_at: '' };

  // Define mocks using vi.fn() before casting
  const updateSessionMockFn = vi.fn();
  const fetchUserProfileMockFn = vi.fn();

  // Cast to MockedFunction after defining with vi.fn()
  const mockedUpdateSession = updateSession as MockedFunction<typeof updateSessionMockFn>;
  const mockedFetchUserProfile = fetchUserProfile as MockedFunction<typeof fetchUserProfileMockFn>;


  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variables (needed if real client is somehow called)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://mock-middleware-supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-middleware-anon-key';


    // Mock NextRequest
    mockRequest = {
      headers: new Headers(),
      nextUrl: {
        pathname: '/', // Default pathname
        origin: 'http://localhost:3000',
        clone: function() { return { ...this }; },
      },
    } as NextRequest;

    // Mock NextResponse and its methods
    mockResponse = new NextResponse();
    vi.mocked(NextResponse.next).mockReturnValue(mockResponse);
    vi.mocked(NextResponse.redirect).mockReturnValue(mockResponse); // Redirect returns a response

    // Default mocks for dependencies
    mockedUpdateSession.mockResolvedValue({ response: mockResponse, user: null });
    mockedFetchUserProfile.mockResolvedValue({ profile: null, error: new Error('Profile not found by default') });

  });

  afterEach(() => {
    // Clean up environment variables if necessary
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('should call updateSession with the request', async () => {
    await middleware(mockRequest);
    expect(mockedUpdateSession).toHaveBeenCalledTimes(1);
    expect(mockedUpdateSession).toHaveBeenCalledWith(mockRequest);
  });

  it('should return the response object from updateSession', async () => {
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
    mockRequest.nextUrl.pathname = '/admin/themes';
    // Default mock returns user: null

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
    expect(redirectArg.pathname).toBe('/admin/login');
    expect(redirectArg.origin).toBe(mockRequest.nextUrl.origin);
    expect(mockedFetchUserProfile).not.toHaveBeenCalled(); // Profile fetch shouldn't happen if no user
  });

   it('should allow authenticated admin users to access protected /admin routes', async () => {
    mockRequest.nextUrl.pathname = '/admin/themes';
    // Simulate updateSession returning an authenticated user
    mockedUpdateSession.mockResolvedValueOnce({ response: mockResponse, user: mockUser });
    // Mock fetchUserProfile to return an admin profile
    mockedFetchUserProfile.mockResolvedValue({ profile: mockAdminProfile, error: null });

    const result = await middleware(mockRequest);

    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(mockedFetchUserProfile).toHaveBeenCalledWith(mockUser.id);
    expect(result).toBe(mockResponse);
  });

  it('should redirect authenticated users from /admin/login to /admin', async () => {
    mockRequest.nextUrl.pathname = '/admin/login';
    // Simulate updateSession returning an authenticated user
    mockedUpdateSession.mockResolvedValueOnce({ response: mockResponse, user: mockUser });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
    expect(redirectArg.pathname).toBe('/admin');
    expect(redirectArg.origin).toBe(mockRequest.nextUrl.origin);
   });

   it('should allow unauthenticated users to access /admin/login', async () => {
    mockRequest.nextUrl.pathname = '/admin/login';
    // Default mock returns user: null

    const result = await middleware(mockRequest);

    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockResponse);
   });

  // --- RBAC Tests ---

  it('should redirect authenticated users to login if profile fetch fails', async () => {
    mockRequest.nextUrl.pathname = '/admin/dashboard';
    // Simulate updateSession returning an authenticated user
    mockedUpdateSession.mockResolvedValueOnce({ response: mockResponse, user: mockUser });
    // Arrange: Mock fetchUserProfile to return an error
    const fetchError = new Error('DB error fetching profile');
    mockedFetchUserProfile.mockResolvedValue({ profile: null, error: fetchError });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
    expect(redirectArg.pathname).toBe('/admin/login');
    expect(mockedFetchUserProfile).toHaveBeenCalledWith(mockUser.id);
  });

  it('should redirect authenticated users with incorrect role from /admin routes', async () => {
    mockRequest.nextUrl.pathname = '/admin/users';
    // Simulate updateSession returning an authenticated user
    mockedUpdateSession.mockResolvedValueOnce({ response: mockResponse, user: mockUser });
    // Arrange: Mock fetchUserProfile to return 'participant' role
    mockedFetchUserProfile.mockResolvedValue({ profile: mockParticipantProfile, error: null });

    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalledTimes(1);
    const redirectArg = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
    expect(redirectArg.pathname).toBe('/admin/login');
    expect(mockedFetchUserProfile).toHaveBeenCalledWith(mockUser.id);
  });
});
