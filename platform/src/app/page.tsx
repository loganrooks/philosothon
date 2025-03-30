import Hero from "@/components/Hero";
import Countdown from "@/components/Countdown";
import EventHighlights from "@/components/EventHighlights";

export default function Home() {
  return (
    <div>
      {/* Hero Section with Event Overview */}
      <Hero />

      {/* Countdown Timer */}
      <Countdown />

      {/* Event Highlights Section */}
      <EventHighlights />

      {/* TODO: Add actual content and styling based on design */}
    </div>
  );
}
