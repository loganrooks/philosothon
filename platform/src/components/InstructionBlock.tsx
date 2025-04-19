import React from 'react';

/**
 * Renders a block of instructions for the registration form.
 * TODO: Add more specific instructions if needed, potentially fetch from CMS/DB
 */
const InstructionBlock: React.FC = () => {
  return (
    <div className="prose prose-invert max-w-none text-light-text mt-8 p-6 border border-dark-green bg-dark-base"> {/* Updated colors, added padding, border, bg, margin & prose-invert */}
      <h2 className="text-xl font-semibold mb-3 text-hacker-green font-philosopher">Registration Instructions</h2> {/* Updated color, added font */}
      <p>
        Please fill out the form below completely to register for the Philosothon event. Ensure all required fields are answered.
      </p>
      <p>
        Team assignments and final theme selection will be communicated via email after the registration deadline. Check your university email regularly.
      </p>
    </div>
  );
};

export default InstructionBlock;