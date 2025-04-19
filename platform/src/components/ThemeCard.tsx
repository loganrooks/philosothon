import Link from 'next/link';

interface ThemeCardProps {
  id: string; // Added theme ID for linking
  title: string;
  description: string;
  analyticTradition?: string[]; // Updated for JSONB array
  continentalTradition?: string[]; // Updated for JSONB array
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  id, // Added id
  title,
  description,
  analyticTradition,
  continentalTradition,
}) => {
  // Helper to render list items from a string array
  const renderList = (traditionArray?: string[]) => {
    if (!traditionArray || traditionArray.length === 0) return null;
    return (
      <ul className="list-['>_'] list-inside text-xs text-light-text opacity-70 mt-1"> {/* Updated list style & color */}
        {traditionArray.map((item, index) => (
          <li key={index}>{item}</li> // Directly render items from the array
        ))}
      </ul>
    );
  };


  return (
    // Wrap the entire card structure in a Link
    <Link href={`/themes/${id}`} className="block mb-6 group"> {/* Added group for hover effects */}
      <div className="border border-medium-gray p-8 bg-dark-base group-hover:border-hacker-green transition-colors duration-200"> {/* Use subtle gray border, apply styling here, use group-hover */}
        <h3 className="text-xl font-semibold mb-2 text-hacker-green">{title}</h3> {/* Updated color */}
        <p className="text-light-text mb-4">{description}</p> {/* Updated color */}

        {/* Removed the separate empty Link div from previous attempts */}

        {(analyticTradition || continentalTradition) && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-t-medium-gray pt-3 mt-3"> {/* Use subtle gray border */}
             {analyticTradition && (
               <div>
                 <h4 className="font-medium text-sm text-hacker-green opacity-80 mb-1">Analytic Tradition</h4> {/* Updated color */}
                 {renderList(analyticTradition)}
               </div>
             )}
             {continentalTradition && (
               <div>
                 <h4 className="font-medium text-sm text-hacker-green opacity-80 mb-1">Continental Tradition</h4> {/* Updated color */}
                 {renderList(continentalTradition)}
               </div>
             )}
           </div>
        )}
      </div>
    </Link> // Close the Link wrapper
  );
};

export default ThemeCard;