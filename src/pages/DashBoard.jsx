import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import GestureIcon from "@mui/icons-material/Gesture";
import LayersIcon from "@mui/icons-material/Layers";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import RepeatIcon from "@mui/icons-material/Repeat";
import SpeedIcon from "@mui/icons-material/Speed";

const DashBoard = () => {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const paymentStatus = currentUser?.paymentStatus || "pending"; // Assume you store this in user document

  const highlights = [
    { title: "Hand Position", icon: <GestureIcon />, route: "/piano-hand-position" },
    { title: "Time Signature", icon: <AccessTimeIcon />, route: "/time-sign" },
    { title: "Scales", icon: <LinearScaleIcon />, route: "/interactive" },
    { title: "Exercises", icon: <SpeedIcon />, route: "/exercise-piano" },
    { title: "Arpeggios", icon: <AccountTreeIcon />, route: "/arp" },
    { title: "Family Chords", icon: <FamilyRestroomIcon />, route: "/root-chords" },
    { title: "Types of Chords", icon: <LayersIcon />, route: "/chords-piano" },
    { 
      title: "Practice", 
      icon: <RepeatIcon />, 
      route: "/practice",
      premium:true,
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="p-12 bg-gradient-to-tr from-[#81479a] to-[#446fbf] text-white text-center">
  <h1 className="text-3xl md:text-4xl font-poppins font-bold tracking-wide">
    Welcome to{" "}
    <span className="text-[#efed53] text-5xl font-montserrat">
      Piano Bestie's Music Course
    </span>
  </h1>
  <p className="mt-2 md:text-xl text-md font-montserrat leading-relaxed">
    Elevate your music journey with{" "}
    <span className="font-bold">
      interactive MIDI play-along, Western & Classical piano training,
    </span>
  </p>
  
  {/* Added unlocked course message */}
  <div className="mt-6 p-4 max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl border-2 border-[#efed53]/50 shadow-lg ">
    <div className="flex items-center justify-center space-x-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#54BE52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-2xl font-montserrat font-bold text-[#54BE52]">
      Course Access Granted
      </span>
    </div>
    <p className="mt-2 text-lg font-poppins">
    Your musical transformation begins now - let's make beautiful music together!
    </p>

  </div>
</div>

      {/* Course Highlights Section */}
      <div className="p-8 md:p-12">
        <h2 className="font-spacegrotesk text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-6">
          Course Highlights
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {highlights.map((item, index) => {
            // Hide premium item if user is not verified

            return (
              <Link key={index} to={item.route} className="no-underline">
                <div
                  className={`flex flex-col items-center justify-center shadow-lg rounded-xl p-6 text-lg font-semibold transition-all duration-300 cursor-pointer border group
                    ${
                      item.premium
                        ? "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-400 text-white hover:shadow-yellow-400 hover:scale-105 "
                        : "bg-white text-gray-700 border-indigo-600 hover:scale-105 hover:bg-gradient-to-r from-[#81479a] to-[#446fbf] hover:text-white"
                    }
                  `}
                >
                  <div
                    className={`text-4xl mb-2 group-hover:text-white flex items-center
                      ${item.premium ? "text-white" : "text-indigo-600"}
                    `}
                  >
                    {item.icon}
                  </div>
                  <div className="font-urbanist">{item.title}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
