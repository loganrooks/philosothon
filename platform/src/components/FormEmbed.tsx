const FormEmbed = () => {
  // TODO: Replace with actual iframe embed code from Google Forms
  // Ensure the iframe is responsive and has appropriate height/width constraints
  return (
    <div className="bg-dark-base p-4 rounded-lg max-w-full overflow-hidden"> {/* Adjusted padding, added max-width and overflow handling */}
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLSeP6uTZW8Loym5w_MjlVYpfsL6imKopvkMi4hYI2m6_Og4Plg/viewform?embedded=true"
        width="640" // Kept original width, max-w-full on container handles smaller screens
        height="3138" // Kept original height
        frameBorder="0" // JSX syntax
        marginHeight={0} // JSX syntax - Changed to number
        marginWidth={0} // JSX syntax - Changed to number
        className="mx-auto" // Center the iframe if container is wider
        style={{ maxWidth: '100%' }} // Ensure iframe itself doesn't overflow container
      >
        Loading…
      </iframe>
    </div>
  );
};

export default FormEmbed;