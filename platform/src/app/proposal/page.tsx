import ContentBlock from '@/components/ContentBlock';
import ScheduleDisplay from '@/components/ScheduleDisplay'; // Import ScheduleDisplay
import { promises as fs } from 'fs';
import path from 'path';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

// Import DAL functions and types
import { fetchSchedule, type ScheduleItem } from '@/lib/data/schedule';
import { fetchThemes, type Theme } from '@/lib/data/themes'; // Assuming path and type
import { fetchWorkshops, type Workshop } from '@/lib/data/workshops'; // Assuming path and type

async function getMarkdownContent(): Promise<string> {
  try {
    // Construct the path relative to the project root (assuming cwd is /platform)
    const filePath = path.join(process.cwd(), 'markdown', 'proposal_to_students.md');
    const fileContents = await fs.readFile(filePath, 'utf8');
    // --- Modification: Remove hardcoded sections from Markdown ---
    // This is a simplified approach. Ideally, the Markdown would only contain the core text.
    // For now, we'll crudely split and take the parts we want.
    const scheduleHeader = "## **Event Details**";
    const themesHeader = "## **Philosophical Themes**";
    const applyHeader = "## **How to Apply**";

    const beforeSchedule = fileContents.split(scheduleHeader)[0];
    // Find content between themes header and apply header, excluding the workshop list
    const themesSectionAndBeyond = fileContents.split(themesHeader)[1] ?? '';
    const afterWorkshops = themesSectionAndBeyond.split(applyHeader)[1] ?? ''; // Get content after workshop list until apply section

    const mainText = (beforeSchedule + applyHeader + afterWorkshops).trim(); // Reconstruct without schedule/themes/workshops

    return mainText;
    // --- End Modification ---
  } catch (error) {
    console.error("Error reading markdown file:", error);
    return "Error loading proposal content."; // Fallback content
  }
}

export const metadata: Metadata = {
  title: 'Proposal to Students | Philosothon',
  description: 'Read the proposal for students regarding the upcoming Philosothon event.',
};


export default async function ProposalPage() {
  // Fetch all data concurrently
  const [
    markdownContent,
    scheduleResult,
    themesResult,
    workshopsResult
  ] = await Promise.all([
    getMarkdownContent(),
    fetchSchedule(),
    fetchThemes(),
    fetchWorkshops()
  ]);

  // Extract data and handle potential errors from DAL functions
  const scheduleItems = scheduleResult.error ? [] : scheduleResult.scheduleItems ?? [];
  const themes = themesResult.error ? null : themesResult.themes;
  const workshops = workshopsResult.error ? null : workshopsResult.workshops;

  // Log errors if any
  if (scheduleResult.error) {
    console.error("Error fetching schedule:", scheduleResult.error);
  }
  if (themesResult.error) {
    console.error("Error fetching themes:", themesResult.error);
  }
  if (workshopsResult.error) {
    console.error("Error fetching workshops:", workshopsResult.error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Render Main Proposal Text from Markdown */}
      <ContentBlock title="Proposal to Students">
        <ReactMarkdown>{markdownContent}</ReactMarkdown>
      </ContentBlock>

      {/* Dynamically Rendered Schedule */}
      <ContentBlock title="Event Details">
        <ScheduleDisplay items={scheduleItems ?? []} />
      </ContentBlock>

      {/* Dynamically Rendered Themes */}
      <ContentBlock title="Philosophical Themes">
        {themes && themes.length > 0 ? (
          <ul className="list-disc pl-6 space-y-1">
            {themes.map((theme: Theme) => ( // Added type annotation
              <li key={theme.id}>{theme.title}</li>
            ))}
          </ul>
        ) : (
          <p>Themes will be announced soon.</p>
        )}
      </ContentBlock>

      {/* Dynamically Rendered Workshops */}
      <ContentBlock title="Potential Workshops">
         {workshops && workshops.length > 0 ? (
          <ul className="list-disc pl-6 space-y-1">
            {workshops.map((workshop: Workshop) => ( // Added type annotation
              <li key={workshop.id}>{workshop.title}</li>
            ))}
          </ul>
        ) : (
          <p>Workshop details will be announced soon.</p>
        )}
      </ContentBlock>

    </div>
  );
}