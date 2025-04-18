import ContentBlock from '@/components/ContentBlock';
import { promises as fs } from 'fs';
import path from 'path';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

// Assuming the markdown file is read relative to the project root
// In a real scenario, consider a more robust way to locate/read files
// or fetch from a CMS/database.
async function getMarkdownContent(): Promise<string> {
  try {
    // Construct the correct path relative to the current working directory
    const filePath = path.join(process.cwd(), 'markdown', 'proposal_to_students.md');
    const fileContents = await fs.readFile(filePath, 'utf8');
    return fileContents;
  } catch (error) {
    console.error("Error reading markdown file:", error);
    return "Error loading content."; // Fallback content
  }
}

export const metadata: Metadata = {
  title: 'Proposal to Students | Philosothon',
  description: 'Read the proposal for students regarding the upcoming Philosothon event.',
};


export default async function ProposalPage() {
  const markdownContent = await getMarkdownContent();

  return (
    <div className="container mx-auto px-4 py-8">
      <ContentBlock title="Proposal to Students">
        <ReactMarkdown>{markdownContent}</ReactMarkdown>
      </ContentBlock>
    </div>
  );
}