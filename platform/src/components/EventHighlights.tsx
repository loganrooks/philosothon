const EventHighlights = () => {
  // TODO: Fetch or define actual event highlights (e.g., key speakers, workshops, unique features)
  const highlights = [
    { id: 1, title: "Keynote Speaker", description: "Hear from a leading philosopher in technology ethics." },
    { id: 2, title: "Interactive Workshops", description: "Engage in hands-on sessions exploring AI and philosophy." },
    { id: 3, title: "Collaborative Challenge", description: "Work in teams to develop unique philosophical perspectives." },
  ];

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">Event Highlights</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {highlights.map((highlight) => (
          <div key={highlight.id} className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h3 className="text-lg font-semibold text-blue-700 mb-2">{highlight.title}</h3>
            <p className="text-gray-600 text-sm">{highlight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventHighlights;