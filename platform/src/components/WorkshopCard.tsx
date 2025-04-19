interface WorkshopCardProps {
  title: string;
  description: string;
  speaker?: string; // Changed from facilitator
  relatedThemes?: string[]; // Changed from relevantThemes
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({ title, description, speaker, relatedThemes }) => {
  // TODO: Refine styling and add more details if necessary
  return (
    <div className="border border-medium-gray p-8 mb-6 bg-dark-base"> {/* Use subtle gray border, Increased padding */}
      <h3 className="text-xl font-semibold mb-2 text-hacker-green">{title}</h3> {/* Updated color */}
      {speaker && <p className="text-sm text-light-text opacity-70 mb-2">Speaker: {speaker}</p>} {/* Changed from facilitator */}
      <p className="text-light-text mb-3">{description}</p> {/* Updated color */}

      {/* Display Related Themes if available */}
      {relatedThemes && relatedThemes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-t-medium-gray"> {/* Use subtle gray border */}
          <h4 className="text-sm font-medium text-hacker-green opacity-80 mb-1">Related Themes:</h4> {/* Changed from Relevant */}
          <ul className="list-['>_'] list-inside text-sm text-light-text opacity-90"> {/* Updated list style & color */}
            {relatedThemes.map((theme, index) => (
              <li key={index}>{theme}</li>
            ))}
          </ul>
          {/* Alternative: Render as tags */}
          {/* <div className="flex flex-wrap gap-1">
            {relevantThemes.map((theme, index) => (
              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5">
                {theme}
              </span>
            ))}
          </div> */}
        </div>
      )}
    </div>
  );
};

export default WorkshopCard;
