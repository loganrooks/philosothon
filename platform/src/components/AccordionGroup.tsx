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
        <div key={index} className="border border-medium-gray mb-4 overflow-hidden bg-dark-base"> {/* Use subtle gray border, Updated bg */}
          {/* Using native <details> element for basic accordion functionality */}
          <details className="group">
            <summary className="flex justify-between items-center p-5 cursor-pointer font-semibold text-hacker-green"> {/* Updated padding, color, removed group-open bg */}
              {item.question}
              {/* Basic arrow indicator */}
              <span className="text-hacker-green opacity-70 group-open:rotate-180 transition-transform duration-300">▼</span> {/* Updated color */}
            </summary>
            {/* Content revealed when open */}
            <div className="p-5 border-t border-t-medium-gray text-light-text"> {/* Use subtle gray border, Updated padding, text color */}
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