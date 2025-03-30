import React from 'react';

interface ContentBlockProps {
  title: string;
  children: React.ReactNode;
}

const ContentBlock: React.FC<ContentBlockProps> = ({ title, children }) => {
  // TODO: Refine styling as needed
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
      {/* Using prose for basic typography styling, adjust as needed */}
      <div className="prose max-w-none text-gray-700">{children}</div>
    </div>
  );
};

export default ContentBlock;