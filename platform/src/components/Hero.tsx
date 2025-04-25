import Link from 'next/link';

const Hero = () => {
  return (
    // Added responsive padding
    <div className="bg-medium-gray p-8 md:p-16 text-center mb-16 border border-dark-green">
      <h1 className="text-4xl md:text-5xl font-bold text-hacker-green mb-4 font-philosopher"> {/* Updated color, added font */}
        Philosothon: Where Philosophy Meets Hackathon Culture
      </h1>
      <p className="text-xl md:text-2xl text-hacker-green opacity-80 mb-6"> {/* Updated color */}
        An Experimental Event at the University of Toronto
      </p>
      <p className="text-lg text-light-text max-w-3xl mx-auto mb-8"> {/* Updated color */}
        While traditional hackathons gather programmers to build software in a limited timeframe, the Philosothon adapts this model for philosophical exploration. Small teams of students will work together to develop robust philosophical perspectives on contemporary technological issues—combining research, critical thinking, and argumentative rigor in a collaborative environment.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <p className="text-lg font-semibold text-light-text"> {/* Updated color */}
          April 26-27, 2025
        </p>
        <Link
          href="/register"
          className="bg-hacker-green hover:bg-dark-green text-dark-base hover:text-hacker-green font-bold py-3 px-6 transition duration-300 ease-in-out border border-hacker-green hover:border-dark-green" /* Updated button style */
        >
          Register Now
        </Link>
      </div>
        <p className="text-sm text-light-text mt-4 text-center px-8">
          <span className="font-bold">UPDATE:</span> 
            {' '} 
        Extending online registrations until 8AM morning of. Try to get them in the night before, but we will try to find you a team if you come between 8:30-9:00AM.
      </p>
    </div>
  );
};

export default Hero;
