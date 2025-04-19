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
    <div className="mt-8 border-l-2 border-hacker-green pl-6"> {/* Updated border color */}
      <h3 className="text-lg font-semibold text-hacker-green mb-4">A Brief History</h3> {/* Updated text color */}
      <div className="space-y-6">
        {timelineEvents.map((item) => (
          <div key={item.year} className="relative">
            <div className="absolute -left-[30px] top-1 h-4 w-4 rounded-full bg-hacker-green border-2 border-dark-base"></div> {/* Updated dot colors */}
            <p className="text-sm font-semibold text-hacker-green opacity-80">{item.year}</p> {/* Updated year color */}
            <p className="">{item.event}</p> {/* Removed explicit text color to inherit */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;