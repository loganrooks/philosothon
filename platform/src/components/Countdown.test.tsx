import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Countdown from '@/components/Countdown';

describe('Countdown Component', () => {
  const targetDate = new Date(2025, 3, 26, 9, 0, 0); // April 26, 2025 09:00:00 (Updated to match component)

  beforeEach(() => {
    // Use fake timers for controlling setInterval and Date
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
  });

  it('should render the initial countdown correctly when the target date is in the future', () => { // Removed async
    // Set system time to 1 day, 2 hours, 3 minutes, 4 seconds before the target
    const mockNow = new Date(targetDate.getTime() - (1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 3 * 60 * 1000 + 4 * 1000));
    vi.setSystemTime(mockNow);

    // Wrap render and advance timer by 1s in act
    act(() => {
      render(<Countdown />);
      vi.advanceTimersByTime(1000); // Trigger first interval and mount
    });

    // Assertions after mount and first interval
    expect(screen.getByRole('heading', { name: /Event Starts In/i })).toBeInTheDocument();
    expect(screen.getByTestId('countdown-days')).toHaveTextContent('01');
    expect(screen.getByTestId('countdown-hours')).toHaveTextContent('02');
    expect(screen.getByTestId('countdown-minutes')).toHaveTextContent('03');
    // Time has advanced 1s from mockNow, so seconds should be 03
    expect(screen.getByTestId('countdown-seconds')).toHaveTextContent('03');
    expect(screen.queryByText(/The event has started!/i)).not.toBeInTheDocument();
  });

  it('should update the countdown timer after one second', () => { // Removed async
    const mockNow = new Date(targetDate.getTime() - (1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 3 * 60 * 1000 + 4 * 1000));
    vi.setSystemTime(mockNow);

     // Wrap render and advance timer by 1s in act
    act(() => {
      render(<Countdown />);
      vi.advanceTimersByTime(1000); // Trigger first interval and mount
    });

    // Initial check (after 1s)
    expect(screen.getByTestId('countdown-seconds')).toHaveTextContent('03');

    // Advance time by another 1 second - Use act for state updates triggered by timer
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Check updated time (after 2s total)
    expect(screen.getByTestId('countdown-seconds')).toHaveTextContent('02'); // Seconds should decrease again
  });

   it('should display "The event has started!" message when the target date has passed', () => { // Removed async
    // Set system time to after the target date
    const mockNow = new Date(targetDate.getTime() + 5000); // 5 seconds after
    vi.setSystemTime(mockNow);

    // Wrap render and advance timer by 1s in act
    act(() => {
      render(<Countdown />);
      vi.advanceTimersByTime(1000); // Trigger first interval and mount/check
    });

    // Assertions after mount and interval check
    expect(screen.getByText(/The event has started!/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Event Starts In/i })).toBeInTheDocument(); // Title still shows
    expect(screen.queryByTestId('countdown-days')).not.toBeInTheDocument(); // Countdown numbers hide
  });

  it('should clear the interval on unmount', () => { // This test doesn't need async/findBy*
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const mockNow = new Date(targetDate.getTime() - 10000); // Before target
    vi.setSystemTime(mockNow);

    const { unmount } = render(<Countdown />);
    expect(clearIntervalSpy).not.toHaveBeenCalled(); // Not called yet

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1); // Should be called on unmount

    clearIntervalSpy.mockRestore(); // Clean up spy
  });
});