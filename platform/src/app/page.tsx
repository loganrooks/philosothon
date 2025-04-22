import Hero from "@/components/Hero";
import Countdown from "@/components/Countdown";
import EventHighlights from "@/components/EventHighlights";
import ScheduleDisplay from "@/components/ScheduleDisplay";

import { fetchSchedule, type ScheduleItem } from '@/lib/data/schedule'; // Correct import name

export default async function Home() { // Make component async
  // Fetch schedule items with error handling
  const { scheduleItems, error } = await fetchSchedule();
  
  if (error) {
    console.error('Home page - Error fetching schedule:', error);
  }

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
