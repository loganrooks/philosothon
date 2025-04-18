const EventHighlights = () => {
  // TODO: Fetch or define actual event highlights (e.g., key speakers, workshops, unique features)
  const highlights = [
    { id: 2, title: "Interactive Workshops", description: "Engage in hands-on sessions exploring AI and philosophy." },
    { id: 3, title: "Collaborative Challenge", description: "Work in teams to develop unique philosophical perspectives." },
  ];

  return (
    <div className="bg-medium-gray p-8 md:p-10 rounded-lg border border-dark-green mb-16"> {/* Updated bg, padding, border, margin */}
      <h2 className="text-2xl md:text-3xl font-semibold text-hacker-green mb-8 text-center font-philosopher">Event Highlights</h2> {/* Updated color, margin, font */}
      <div className="grid md:grid-cols-3 gap-6">
        {highlights.map((highlight) => (
          <div key={highlight.id} className="bg-dark-base p-6 rounded-md border border-dark-green"> {/* Updated bg, padding, border */}
            <h3 className="text-lg font-semibold text-hacker-green mb-2 font-philosopher">{highlight.title}</h3> {/* Updated color, added font */}
            <p className="text-light-text opacity-90 text-sm">{highlight.description}</p> {/* Updated color */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventHighlights;