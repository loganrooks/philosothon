import React from 'react';

interface ContentBlockProps {
  title: string;
  children: React.ReactNode;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ title, children }) => {
  // TODO: Refine styling as needed
  return (
    <div className="mb-12 p-8 border border-dark-green rounded-lg bg-dark-base"> {/* Increased padding */}
      <h2 className="text-2xl font-bold mb-4 text-hacker-green font-philosopher">{title}</h2> {/* Updated color, added font */}
      {/* Using prose for basic typography styling, adjust as needed */}
      <div className="prose prose-invert max-w-none text-light-text">{children}</div> {/* Updated text color & added prose-invert */}
    </div>
  );
};

export default ContentBlock;