'use client'; // This component uses client-side hooks (useState, useEffect)

import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const Countdown = () => {
  // Set the target date (adjust time if needed, e.g., 9:00 AM)
  // Note: Month is 0-indexed (0 = January, 3 = April)
  const targetDate = new Date(2025, 3, 7, 0, 0, 0);

  const calculateTimeLeft = (): TimeLeft | null => {
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
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft());

  useEffect(() => {
    // Update the countdown every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, []); // Empty dependency array means this effect runs once on mount

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 md:p-8 rounded-lg text-center mb-12 shadow-sm">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4">Event Starts In:</h2>
      {timeLeft ? (
        <div className="grid grid-cols-4 gap-2 md:gap-4 max-w-md mx-auto">
          <div className="bg-white/70 backdrop-blur-sm p-3 md:p-4 rounded-lg shadow">
            <div data-testid="countdown-days" className="text-3xl md:text-4xl font-bold text-purple-700">{formatTime(timeLeft.days)}</div>
            <div className="text-xs md:text-sm text-gray-600 uppercase">Days</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-3 md:p-4 rounded-lg shadow">
            <div data-testid="countdown-hours" className="text-3xl md:text-4xl font-bold text-purple-700">{formatTime(timeLeft.hours)}</div>
            <div className="text-xs md:text-sm text-gray-600 uppercase">Hours</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-3 md:p-4 rounded-lg shadow">
            <div data-testid="countdown-minutes" className="text-3xl md:text-4xl font-bold text-purple-700">{formatTime(timeLeft.minutes)}</div>
            <div className="text-xs md:text-sm text-gray-600 uppercase">Minutes</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm p-3 md:p-4 rounded-lg shadow">
            <div data-testid="countdown-seconds" className="text-3xl md:text-4xl font-bold text-purple-700">{formatTime(timeLeft.seconds)}</div>
            <div className="text-xs md:text-sm text-gray-600 uppercase">Seconds</div>
          </div>
        </div>
      ) : (
        <p className="text-xl text-gray-700">The event has started!</p>
      )}
    </div>
  );
};

export default Countdown;