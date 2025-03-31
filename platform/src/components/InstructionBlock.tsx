import React from 'react';

/**
 * Renders a block of instructions for the registration form.
 * TODO: Add more specific instructions if needed, potentially fetch from CMS/DB
 */
const InstructionBlock: React.FC = () => {
  return (
    <div className="prose max-w-none text-gray-700 dark:text-gray-300 mt-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">Registration Instructions</h2>
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