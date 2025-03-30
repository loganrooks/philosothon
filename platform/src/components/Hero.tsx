import Link from 'next/link';

const Hero = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-12 rounded-lg text-center mb-12 shadow-sm">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Philosothon: Where Philosophy Meets Hackathon Culture
      </h1>
      <p className="text-xl md:text-2xl text-purple-700 mb-6">
        An Experimental Event at the University of Toronto
      </p>
      <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
        While traditional hackathons gather programmers to build software in a limited timeframe, the Philosothon adapts this model for philosophical exploration. Small teams of students will work together to develop robust philosophical perspectives on contemporary technological issues—combining research, critical thinking, and argumentative rigor in a collaborative environment.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <p className="text-lg font-semibold text-gray-800">
          April 7-8, 2025
        </p>
        <Link
          href="/register"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out shadow-md"
        >
          Register Now
        </Link>
      </div>
    </div>
  );
};

export default Hero;