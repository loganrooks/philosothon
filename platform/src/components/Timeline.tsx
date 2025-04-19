const Timeline = () => {
  // Data populated from docs/event_info/philosothon_landscape.md
  const timelineEvents = [
    { year: 2007, event: "First Philosothon held at Hale School, Perth, Western Australia, by Matthew Wills and Leanne Rucks." },
    { year: 2011, event: "First national Australasian Philosothon hosted by FAPSA at Cranbrook School, Sydney." },
    { year: 2012, event: "First UK Philosothon held at King's College, Taunton, led by Mark Smith and Julie Arliss." },
    { year: 2017, event: "Templeton Religion Trust awards funding to the Australasian Philosothon project." },
    { year: 2019, event: "Templeton funding awarded to Ian Ramsey Centre, Oxford, to support new Philosothons." },
    { year: 2020, event: "Australasian Association of Philosophy runs the first online Philosothon." },
  ];

  return (
    <div className="mt-8 border-l-2 border-purple-300 pl-6">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">A Brief History</h3>
      <div className="space-y-6">
        {timelineEvents.map((item) => (
          <div key={item.year} className="relative">
            <div className="absolute -left-[30px] top-1 h-4 w-4 rounded-full bg-purple-500 border-2 border-white"></div>
            <p className="text-sm font-semibold text-purple-700">{item.year}</p>
            <p className="text-gray-300">{item.event}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;