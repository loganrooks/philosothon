import ContentBlock from "@/components/ContentBlock";
import Timeline from "@/components/Timeline";

export default function AboutPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-hacker-green border-b border-medium-gray pb-2 font-philosopher">About Philosothon</h1> {/* Added subtle border color */}

      <ContentBlock title="What is a Philosothon?">
        <p className="mb-4">
          While traditional hackathons gather programmers to build software in a limited timeframe, the Philosothon adapts this model for philosophical exploration. Small teams of students will work together to develop robust philosophical perspectives on contemporary technological issues—combining research, critical thinking, and argumentative rigor in a collaborative environment.
        </p>
        <p className="mb-4">
          Philosophy has traditionally been practiced as a solitary pursuit—reading, writing, and thinking in isolation. The Philosothon challenges this norm by creating a space where philosophical ideas can emerge through dialogue and collaboration, mirroring how many other disciplines approach complex problems.
        </p>
        <blockquote className="border-l-4 border-purple-300 pl-10 italic text-gray-300 my-4">
          &quot;Philosophy students rarely get structured opportunities for extended collaborative thinking,&quot; notes the event organizer. &quot;We&apos;re testing whether the hackathon format can bring new energy to philosophical inquiry while building intellectual community.&quot;
        </blockquote>
      </ContentBlock>

      <ContentBlock title="History & Origins">
        <p className="mb-4">
          The groundwork for the Philosothon was laid in 2007 at Hale School in Perth, Western Australia, by Matthew Wills and Leanne Rucks. The concept quickly gained traction, leading to the first national Australasian Philosothon at Cranbrook School in Sydney in 2011, and the first UK Philosothon at King&apos;s College, Taunton, in 2012.
        </p>
        <p className="mb-4">
          Supported by organizations like the Templeton Religion Trust, the movement has expanded globally, adapting to include primary school events and even online formats, demonstrating its resilience and broad appeal in promoting collaborative philosophical inquiry.
        </p>
        <Timeline />
      </ContentBlock>

      {/* TODO: Add more content sections as needed */}
    </div>
  );
}