import Hero from "@/components/Hero";
import Countdown from "@/components/Countdown";
import EventHighlights from "@/components/EventHighlights";
import ScheduleDisplay from "@/components/ScheduleDisplay";

export default function Home() {
  return (
    // Removed redundant padding, handled by layout container
    <div>
      {/* Hero Section with Event Overview */}
      <Hero />

      {/* Countdown Timer */}
      <Countdown />

      {/* Event Highlights Section */}
      <EventHighlights />


      {/* Schedule Section */}
      <ScheduleDisplay />

      {/* TODO: Add actual content and styling based on design */}
    </div>
  );
}
