import Hero from "@/components/Hero";
import Countdown from "@/components/Countdown";
import EventHighlights from "@/components/EventHighlights";
import ScheduleDisplay from "@/components/ScheduleDisplay";

export default function Home() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8"> {/* Added padding */}
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
