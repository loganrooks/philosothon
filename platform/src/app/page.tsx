import Hero from "@/components/Hero";
import Countdown from "@/components/Countdown";
import EventHighlights from "@/components/EventHighlights";
import ScheduleDisplay from "@/components/ScheduleDisplay";

import { fetchSchedule, type ScheduleItem } from '@/lib/data/schedule'; // Correct import name

export default async function Home() { // Make component async
  // Fetch schedule items
  // fetchSchedule returns ScheduleItem[] directly, or [] on error (error logged in DAL)
  const scheduleItems = await fetchSchedule();

  return (
    // Removed redundant padding, handled by layout container
    <div>
      {/* Hero Section with Event Overview */}
      <Hero />

      {/* Countdown Timer */}
      <Countdown />

      {/* Event Highlights Section */}
      <EventHighlights />


      {/* Schedule Section - Pass fetched items */}
      <ScheduleDisplay items={scheduleItems ?? []} />

    </div>
  );
}
