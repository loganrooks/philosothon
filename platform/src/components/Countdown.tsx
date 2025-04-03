'use client'; // This component uses client-side hooks (useState, useEffect)

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Countdown = () => {
  // Set the target date (adjust time if needed, e.g., 9:00 AM)
  // Note: Month is 0-indexed (0 = January, 3 = April)
  // Wrap targetDate in useMemo to ensure it's stable across renders
  const targetDate = useMemo(() => new Date(2025, 3, 26, 9, 0, 0), []); // Set to April 26, 2025, 9:00 AM

  const calculateTimeLeft = useCallback((): TimeLeft | null => {
    const difference = +targetDate - +new Date();
    let timeLeft: TimeLeft | null = null;

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }, [targetDate]); // Now depends on the memoized targetDate

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft());

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Update the countdown every second
    const timer = setInterval(() => {
    setHasMounted(true);

      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, [calculateTimeLeft]); // Add calculateTimeLeft to dependency array

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className="bg-medium-gray p-8 md:p-10 rounded-lg text-center mb-16 border border-dark-green"> {/* Updated bg, padding, margin, border */}
      <h2 className="text-2xl md:text-3xl font-semibold text-hacker-green mb-6 font-philosopher">Event Starts In:</h2> {/* Updated color, margin, font */}
      {/* Hydration Fix: Only render the dynamic content after mounting */}
      {hasMounted ? (
        timeLeft ? (
          <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-md mx-auto">
            <div className="bg-dark-base p-3 md:p-4 rounded-lg border border-dark-green">
              <div data-testid="countdown-days" className="text-3xl md:text-4xl font-bold text-hacker-green">{formatTime(timeLeft.days)}</div>
              <div className="text-xs md:text-sm text-light-text opacity-70 uppercase">Days</div>
            </div>
            <div className="bg-dark-base p-3 md:p-4 rounded-lg border border-dark-green">
              <div data-testid="countdown-hours" className="text-3xl md:text-4xl font-bold text-hacker-green">{formatTime(timeLeft.hours)}</div>
              <div className="text-xs md:text-sm text-light-text opacity-70 uppercase">Hours</div>
            </div>
            <div className="bg-dark-base p-3 md:p-4 rounded-lg border border-dark-green">
              <div data-testid="countdown-minutes" className="text-3xl md:text-4xl font-bold text-hacker-green">{formatTime(timeLeft.minutes)}</div>
              <div className="text-xs md:text-sm text-light-text opacity-70 uppercase">Minutes</div>
            </div>
            <div className="bg-dark-base p-3 md:p-4 rounded-lg border border-dark-green">
              <div data-testid="countdown-seconds" className="text-3xl md:text-4xl font-bold text-hacker-green">{formatTime(timeLeft.seconds)}</div>
              <div className="text-xs md:text-sm text-light-text opacity-70 uppercase">Seconds</div>
            </div>
          </div>
        ) : (
          <p className="text-xl text-hacker-green">The event has started!</p>
        )
      ) : (
        // Render null or a placeholder during server render/initial client render
        // to prevent hydration mismatch. A placeholder could be added here if needed.
        null
      )}
    </div>
  );
};

export default Countdown;