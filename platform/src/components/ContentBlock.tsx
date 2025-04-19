import React from 'react';

interface ContentBlockProps {
  title: string;
  children: React.ReactNode;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ title, children }) => {
  // TODO: Refine styling as needed
  return (
    // Added responsive padding and title font size
    <div className="mb-12 p-4 sm:p-6 md:p-8 border border-medium-gray bg-dark-base"> {/* Use subtle gray border */}
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-hacker-green font-philosopher">{title}</h2>
      {/* Using prose for basic typography styling, adjust as needed */}
      <div className="prose prose-invert max-w-none">{children}</div>
    </div>
  );
};

export default ContentBlock;