const InstructionBlock = () => {
  // TODO: Add more specific instructions if needed, potentially fetch from CMS/DB
  return (
    <div className="prose max-w-none text-gray-700 mt-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">Registration Instructions</h2>
      <p>
        Please fill out the form above completely to register for the Philosothon event. Ensure all required fields are answered.
      </p>
      <p>
        Team assignments and final theme selection will be communicated via email after the registration deadline.
      </p>
    </div>
  );
};

export default InstructionBlock;