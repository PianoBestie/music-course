import React from "react";
import Arp from "../components/Arp";
import ChordsPiano from "../components/ChordsPiano";
import ExercisePiano from "../components/ExercisePiano";
import Interactive from "../components/Interactive";
import PianoHandPosition from "../components/PianoHandPosition";
import RootChords from "../components/RootChords";
import Timesign from "../components/Timesign";
const Course = () => {
  return (
    <div className="bg-gray-50 min-h-screen w-full px-5">
      <Interactive />
      <ChordsPiano />
      <Arp />
      <RootChords />
      <Timesign />
      <PianoHandPosition />
      <ExercisePiano />
      <div className="border-2 w-full my-3 border-black"></div>
      {/* Interactive Learning Section */}
      <div className="p-10 bg-[#446fbf] text-white text-center">
        <h2 className="text-3xl font-semibold font-pacifico">
          Interactive Piano Learning Experience 🎹
        </h2>
        <p className="mt-2 text-lg font-lexend">
          Learn interactively with **MIDI play-alongs**, **step-by-step video
          tutorials**, and **real-time feedback** from instructors. Practice
          piano at your own pace, with immediate results.
        </p>
        <button className="mt-6 px-6 py-3 bg-yellow-300 text-[#446fbf] font-semibold text-lg font-urbanist rounded-full shadow-lg hover:bg-yellow-400 transition">
          Start Your Piano Journey Now
        </button>
      </div>
    </div>
  );
};

export default Course;
