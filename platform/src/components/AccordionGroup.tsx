interface AccordionItem {
  question: string;
  answer: string;
  // Add other potential fields like category if needed later
}

interface AccordionGroupProps {
  items: AccordionItem[];
}

const AccordionGroup: React.FC<AccordionGroupProps> = ({ items }) => {
  // TODO: Enhance styling, potentially add animation
  return (
    <div>
      {items.map((item, index) => (
        <div key={index} className="border rounded-lg mb-4 overflow-hidden shadow-sm bg-white">
          {/* Using native <details> element for basic accordion functionality */}
          <details className="group">
            <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-gray-800 group-open:bg-gray-50">
              {item.question}
              {/* Basic arrow indicator */}
              <span className="text-gray-500 group-open:rotate-180 transition-transform duration-300">▼</span>
            </summary>
            {/* Content revealed when open */}
            <div className="p-4 border-t text-gray-600">
              {/* Consider using a markdown renderer if answers contain markdown */}
              {item.answer}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
};

export default AccordionGroup;