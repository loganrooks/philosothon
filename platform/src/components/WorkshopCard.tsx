interface WorkshopCardProps {
  title: string;
  description: string;
  facilitator?: string;
  relevantThemes?: string[]; // Updated for JSONB array
}

const WorkshopCard: React.FC<WorkshopCardProps> = ({ title, description, facilitator, relevantThemes }) => {
  // TODO: Refine styling and add more details if necessary
  return (
    <div className="border border-dark-green rounded-lg p-6 mb-6 bg-dark-base"> {/* Updated bg, border, padding */}
      <h3 className="text-xl font-semibold mb-2 text-hacker-green">{title}</h3> {/* Updated color */}
      {facilitator && <p className="text-sm text-light-text opacity-70 mb-2">Facilitator: {facilitator}</p>} {/* Updated color */}
      <p className="text-light-text mb-3">{description}</p> {/* Updated color */}
      
      {/* Display Relevant Themes if available */}
      {relevantThemes && relevantThemes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-t-dark-green"> {/* Updated border color */}
          <h4 className="text-sm font-medium text-hacker-green opacity-80 mb-1">Relevant Themes:</h4> {/* Updated color */}
          <ul className="list-['>_'] list-inside text-sm text-light-text opacity-90"> {/* Updated list style & color */}
            {relevantThemes.map((theme, index) => (
              <li key={index}>{theme}</li>
            ))}
          </ul>
          {/* Alternative: Render as tags */}
          {/* <div className="flex flex-wrap gap-1">
            {relevantThemes.map((theme, index) => (
              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
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