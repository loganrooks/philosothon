const Timeline = () => {
  const timelineEvents = [
    { year: 2007, event: "First Philosothon held at Hale School, Perth, Western Australia." },
    { year: 2011, event: "First national Australasian Philosothon hosted at Cranbrook School, Sydney." },
    { year: 2012, event: "First UK Philosothon held at King's College, Taunton." },
    { year: 2017, event: "Templeton Religion Trust provides funding for Australasian Philosothon project." },
    { year: 2019, event: "Templeton funding awarded to Ian Ramsey Centre, Oxford, to support new Philosothons." },
    { year: 2020, event: "First online Australasian Philosothon run due to COVID-19 pandemic." },
    // Add more events as needed
  ];

  return (
    <div className="mt-8 border-l-2 border-purple-300 pl-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">A Brief History</h3>
      <div className="space-y-6">
        {timelineEvents.map((item) => (
          <div key={item.year} className="relative">
            <div className="absolute -left-[30px] top-1 h-4 w-4 rounded-full bg-purple-500 border-2 border-white"></div>
            <p className="text-sm font-semibold text-purple-700">{item.year}</p>
            <p className="text-gray-600">{item.event}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;