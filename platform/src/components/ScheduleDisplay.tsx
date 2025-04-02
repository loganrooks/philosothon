import React from 'react';

const ScheduleDisplay = () => {
  return (
    <div className="bg-medium-gray rounded-lg p-8 mb-16 border border-dark-green"> {/* Updated bg, padding, margin, border */}
      <h2 className="text-2xl font-semibold text-hacker-green mb-6 border-b border-dark-green pb-3 font-philosopher">Event Schedule</h2> {/* Updated color, margin, border, font */}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-hacker-green opacity-90 mb-4">Monday, April 7, 2025</h3> {/* Updated color, margin */}
        <ul className="list-['>_'] list-inside space-y-3 text-light-text"> {/* Updated list style, spacing, color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">8:30 AM - 9:00 AM:</span> Sign-in and Welcome</li> {/* Updated color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">9:00 AM - 9:30 AM:</span> Opening Remarks & Theme Announcement</li> {/* Updated color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">9:30 AM - 11:30 AM:</span> Initial Team Meetings</li> {/* Updated color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">12:00 PM - 1:00 PM:</span> Philosophy of Technology Workshop (Lunch Provided)</li> {/* Updated color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">6:00 PM - 8:00 PM:</span> Pascal Quest Workshop (Limited Representation)</li> {/* Updated color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">11:59 PM:</span> Submission Deadline</li> {/* Updated color */}
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-hacker-green opacity-90 mb-4">Tuesday, April 8, 2025</h3> {/* Updated color, margin */}
        <ul className="list-['>_'] list-inside space-y-3 text-light-text"> {/* Updated list style, spacing, color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">10:30 AM - 12:30 PM:</span> Team Presentations</li> {/* Updated color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">12:30 PM - 1:30 PM:</span> Feedback Collection & Discussion</li> {/* Updated color */}
          <li><span className="font-medium text-hacker-green opacity-70 mr-2">1:30 PM - 2:00 PM:</span> Closing Remarks</li> {/* Updated color */}
        </ul>
      </div>
    </div>
  );
};

export default ScheduleDisplay;