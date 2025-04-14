import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.currentUser);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-10 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 shadow-2xl font-sans border border-white/20 backdrop-blur-sm">
      {/* Header with animated gradient text */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
            Piano Bestie's Interactive Music Course
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Transform your piano skills with our <span className="font-semibold text-indigo-600">interactive</span> learning system blending Western & Carnatic traditions
        </p>
      </div>
      
      {/* Features Grid with icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
        {/* Feature 1 */}
        <div className="bg-white/90 p-5 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 border border-white/20 group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-5 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl sm:text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            🎹
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Dynamic Scales & Technique Builder</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Master major, minor, pentatonic, blues, and harmonic minor scales across all keys with our interactive finger position exercises and "Your Turn" practice mode
          </p>
        </div>
        
        {/* Feature 2 */}
        <div className="bg-white/90 p-5 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 border border-white/20 group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-5 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-2xl sm:text-3xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
            🎼
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Comprehensive Music Theory</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Progressive curriculum covering time signatures, chord families, passing chords, arpeggios, and Western notation - all reinforced through practical application
          </p>
        </div>
        
        {/* Feature 3 */}
        <div className="bg-white/90 p-5 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 border border-white/20 group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 sm:mb-5 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-2xl sm:text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            📚
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">500+ Song Repository</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Growing library of play-along MIDI tracks with accompanying notation (ABC and Western sheet music) - new content added weekly through the Year
          </p>
        </div>
      </div>
 
      
      {/* Pricing Section */}
      <div className="mt-12 sm:mt-16 mb-8 sm:mb-12">
        <div className="relative max-w-md mx-auto bg-white/90 rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl border border-white/20">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-blue-100 opacity-30"></div>
          
  {/* Popular badge */}
<div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
  <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-[0.7em]  font-bold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-lg transform rotate-6">
    MOST POPULAR
  </div>
</div>

          <div className="relative z-10 p-6 sm:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">Premium Access</h3>
              <p className="text-sm sm:text-base text-gray-600">Unlock all features with one simple payment</p>
            </div>
            
        {/* Price with decorative elements */}
<div className="mb-6 sm:mb-8 flex justify-center items-end gap-2">
  <span className="text-3xl sm:text-4xl font-extrabold text-gray-800">₹599</span>
  <span className="text-sm sm:text-base text-gray-500 line-through">₹1999</span>
  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">70% OFF</span>
  <span className=" text-gray-800 font-outfit">/ year</span>
</div>

            
            {/* Feature list */}
            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              <li className="flex items-start">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-sm sm:text-base text-gray-700">Full access to all courses</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-sm sm:text-base text-gray-700">500+ song library</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-sm sm:text-base text-gray-700">Interactive MIDI exercises</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-sm sm:text-base text-gray-700">New content added weekly</span>
              </li>
            </ul>
            
            {/* Requirements note */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <p className="text-xs sm:text-sm text-blue-800 font-medium">For best experience, we recommend:</p>
                  <p className="text-xs text-blue-600">An electric piano (Casio, Yamaha, etc.) with USB port for MIDI connectivity</p>
                </div>
              </div>
            </div>
            

          </div>
        </div>
      </div>
           
      {/* Animated CTA Button */}
      <div className="relative group mb-8 sm:mb-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
        <button 
          onClick={() => navigate(currentUser ? '/dashboard' : '/signup')} 
          className="relative w-full py-3 sm:py-4 px-6 sm:px-8 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-bold text-base sm:text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
        >
          {currentUser ? 'Continue Learning' : 'Get Started for ₹599 / year'}
        </button>
      </div>
    </div>
  );
};

export default Home;