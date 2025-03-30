import ContentBlock from "@/components/ContentBlock";
import Timeline from "@/components/Timeline";

export default function AboutPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900 border-b pb-2">About Philosothon</h1>

      <ContentBlock title="Concept">
        <p>
          Placeholder text explaining the Philosothon concept. A Philosothon adapts the hackathon format for philosophical inquiry...
          {/* TODO: Populate with actual content from docs/event_info/general_information.md or similar */}
        </p>
      </ContentBlock>

      <ContentBlock title="History">
        <p>
          Placeholder text detailing the history of Philosothons, starting from Hale School in 2007...
          {/* TODO: Populate with actual content from docs/event_info/philosothon_landscape.md or similar */}
        </p>
        <Timeline />
      </ContentBlock>

      {/* TODO: Add more content sections as needed */}
    </div>
  );
}