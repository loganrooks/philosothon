import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type NextRequest, NextResponse } from 'next/server';
import { middleware, config } from '@/middleware'; // Import the middleware and config
import { updateSession } from '@/lib/supabase/middleware'; // Import the function to mock

// Mock the dependency
vi.mock('@/lib/supabase/middleware');

describe('Root Middleware (middleware.ts)', () => {
  let mockRequest: NextRequest;
  let mockResponse: NextResponse;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock NextRequest (can be simple for this test)
    mockRequest = {
      headers: new Headers(),
      // Add other properties if needed by updateSession mock or the function itself
    } as NextRequest;

    // Mock the expected response from updateSession
    mockResponse = new NextResponse(); // Or use a more specific mock if needed
    vi.mocked(updateSession).mockResolvedValue(mockResponse);
  });

  it('should call updateSession with the request', async () => {
    await middleware(mockRequest);
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith(mockRequest);
  });

  it('should return the response from updateSession', async () => {
    const result = await middleware(mockRequest);
    expect(result).toBe(mockResponse);
  });

  it('should export the correct config object', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher[0]).toContain('?!_next/static|_next/image|favicon.ico');
  });
});