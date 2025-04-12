import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Home = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.currentUser);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 shadow-2xl font-sans border border-white/20 backdrop-blur-sm">
      {/* Header with animated gradient text */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
            Piano Bestie's Interactive Music Course
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Transform your piano skills with our <span className="font-semibold text-indigo-600">interactive</span> learning system blending Western & Carnatic traditions
        </p>
      </div>
      
      {/* Features Grid with icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Feature 1 */}
        <div className="bg-white/90 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-white/20 group">
          <div className="w-16 h-16 mb-5 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
            🎹
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Smart MIDI Play-Along</h3>
          <p className="text-gray-600 leading-relaxed">
            Real-time feedback with our AI-powered "Your Turn" mode that adapts to your skill level
          </p>
        </div>
        
        {/* Feature 2 */}
        <div className="bg-white/90 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-white/20 group">
          <div className="w-16 h-16 mb-5 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-3xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
            🌐
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Dual Music System</h3>
          <p className="text-gray-600 leading-relaxed">
            Master both Western classical and Carnatic styles with specialized curriculum
          </p>
        </div>
        
        {/* Feature 3 */}
        <div className="bg-white/90 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-white/20 group">
          <div className="w-16 h-16 mb-5 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            🎓
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Theory Mastery</h3>
          <p className="text-gray-600 leading-relaxed">
            From chords to complex ragas, structured learning for all levels
          </p>
        </div>
      </div>
      
      {/* Animated CTA Button */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
        <button 
          onClick={() => navigate(currentUser ? '/dashboard' : '/signup')} 
          className="relative w-full py-4 px-8 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
        >
          {currentUser ? 'Continue Learning' : 'Get started'}
        </button>
      </div>
      
      {/* Highlights with animated hover */}
      <div className="flex flex-wrap justify-center gap-4 mt-12">
        {[
          { icon: '🎼', text: '500+ Interactive Lessons' },
          { icon: '📊', text: 'Progress Analytics' },
          { icon: '🏆', text: 'Certification Program' },
          { icon: '👨‍🏫', text: 'Expert Instructors' }
        ].map((item, index) => (
          <div 
            key={index}
            className="flex items-center bg-white/80 px-5 py-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100"
          >
            <span className="text-xl mr-2">{item.icon}</span>
            <span className="font-medium text-gray-700">{item.text}</span>
          </div>
        ))}
      </div>
      
      {/* Trust indicators */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Trusted by 10,000+ students worldwide • 4.9/5 ⭐⭐⭐⭐⭐</p>
      </div>
    </div>
  );
};

export default Home;