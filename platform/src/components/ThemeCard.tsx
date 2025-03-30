interface ThemeCardProps {
  title: string;
  description: string;
  analyticTradition?: string; // Expecting a comma-separated string or similar
  continentalTradition?: string; // Expecting a comma-separated string or similar
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  title,
  description,
  analyticTradition,
  continentalTradition,
}) => {
  // Helper to render list items from a comma-separated string (basic example)
  const renderList = (traditionString?: string) => {
    if (!traditionString) return null;
    // Basic split, assumes names are separated by ' (' - adjust if needed based on actual data format
    const items = traditionString.split('\n- ').map(item => item.trim()).filter(Boolean);
    return (
      <ul className="list-disc list-inside text-xs text-gray-500 mt-1">
        {items.map((item, index) => (
          <li key={index}>{item.replace(/\s*\(.*\)/, '')}</li> // Remove parenthetical descriptions for brevity
        ))}
      </ul>
    );
  };


  return (
    <div className="border rounded-lg p-4 mb-6 shadow-sm bg-white transition-shadow hover:shadow-md">
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>

      {(analyticTradition || continentalTradition) && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3 mt-3">
           {analyticTradition && (
             <div>
               <h4 className="font-medium text-sm text-gray-700 mb-1">Analytic Tradition</h4>
               {renderList(analyticTradition)}
             </div>
           )}
           {continentalTradition && (
             <div>
               <h4 className="font-medium text-sm text-gray-700 mb-1">Continental Tradition</h4>
               {renderList(continentalTradition)}
             </div>
           )}
         </div>
      )}
    </div>
  );
};

export default ThemeCard;