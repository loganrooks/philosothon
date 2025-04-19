const FormEmbed = () => {
  // TODO: Replace with actual iframe embed code from Google Forms
  // Ensure the iframe is responsive and has appropriate height/width constraints
  return (
    <div className="bg-dark-base p-4 w-full max-w-4xl mx-auto">
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLSeP6uTZW8Loym5w_MjlVYpfsL6imKopvkMi4hYI2m6_Og4Plg/viewform?embedded=true"
        // Removed fixed width, added w-full class
        height="3138" // Kept original height
        frameBorder="0" // JSX syntax
        marginHeight={0} // JSX syntax - Changed to number
        marginWidth={0} // JSX syntax - Changed to number
        className="w-full" // Make iframe fill container width
        // Removed inline style and centering class
      >
        Loading…
      </iframe>
    </div>
  );
};

export default FormEmbed;