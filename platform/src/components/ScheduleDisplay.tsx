import React from 'react';

const ScheduleDisplay = () => {
  return (
    <div className="bg-medium-gray p-8 mb-16 border border-dark-green"> {/* Updated bg, padding, margin, border */}
      <h2 className="text-2xl font-semibold text-hacker-green mb-6 border-b border-dark-green pb-3 font-philosopher">Event Schedule</h2> {/* Updated color, margin, border, font */}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-hacker-green opacity-90 mb-4 font-philosopher">Saturday, April 26, 2025</h3> {/* Updated color, margin, added font */}
        <ul className="list-['>_'] list-inside space-y-3 text-light-text pl-4"> {/* Updated list style, spacing, color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">8:30 AM - 9:00 AM:</span> Sign-in and Welcome</li> {/* Updated color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">9:00 AM - 9:30 AM:</span> Opening Remarks & Theme Announcement</li> {/* Updated color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">9:30 AM - 11:30 AM:</span> Initial Team Meetings</li> {/* Updated color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">12:00 PM - 1:00 PM:</span> Philosophy of Technology Workshop (Lunch Provided)</li> {/* Updated color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">6:00 PM - 8:00 PM:</span> Pascal Quest Workshop (Limited Representation)</li> {/* Updated color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">11:59 PM:</span> Submission Deadline</li> {/* Updated color, added padding */}
        </ul>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-hacker-green opacity-90 mb-4 font-philosopher">Tuesday, April 8, 2025</h3> {/* Updated color, margin, added font */}
        <ul className="list-['>_'] list-inside space-y-3 text-light-text pl-4"> {/* Updated list style, spacing, color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">10:30 AM - 12:30 PM:</span> Team Presentations</li> {/* Updated color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">12:30 PM - 1:30 PM:</span> Feedback Collection & Discussion</li> {/* Updated color, added padding */}
          <li className="pl-2 pr-2"><span className="font-medium text-hacker-green opacity-70 mr-4">1:30 PM - 2:00 PM:</span> Closing Remarks</li> {/* Updated color, added padding */}
        </ul>
      </div>
    </div>
  );
};

export default ScheduleDisplay;