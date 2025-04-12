import React, { useRef, useState } from "react";
import * as Tone from "tone";

const RootChords = () => {
  const synth = useRef(new Tone.PolySynth(Tone.Synth).toDestination());
  const [activeKey, setActiveKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState("C"); // Default key
  const [isPlaying, setIsPlaying] = useState(false);

  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };

  const chordFormulas = {
    Major: [0, 4, 7],
    Minor: [0, 3, 7],
    Diminished: [0, 3, 6],
  };

  const rootNotes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  // Family chords for a given key
  const getFamilyChords = (key) => {
    const notes = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const keyIndex = notes.indexOf(key);
    const familyChords = [
      { name: "I", type: "Major", intervals: [0, 4, 7], functionalName: "Tonic" }, // C Major
      { name: "ii", type: "Minor", intervals: [2, 5, 9], functionalName: "Supertonic" }, // D Minor
      { name: "ii7", type: "Minor 7th", intervals: [2, 5, 9, 0], functionalName: "Supertonic 7th" }, // Dm7
      { name: "iii", type: "Minor", intervals: [4, 7, 11], functionalName: "Mediant" }, // E Minor
      { name: "iii7", type: "Minor 7th", intervals: [4, 7, 11, 2], functionalName: "Mediant 7th" }, // Em7
      { name: "IV", type: "Major", intervals: [5, 9, 0], functionalName: "Subdominant" }, // F Major
      { name: "V", type: "Major", intervals: [7, 11, 2], functionalName: "Dominant" }, // G Major
      { name: "V7", type: "Dominant 7th", intervals: [7, 11, 2, 5], functionalName: "Dominant 7th" }, // G7
      { name: "vi", type: "Minor", intervals: [9, 0, 4], functionalName: "Submediant" }, // A Minor
      { name: "vi7", type: "Minor 7th", intervals: [9, 0, 4, 7], functionalName: "Submediant 7th" }, // Am7
      { name: "vii°", type: "Diminished", intervals: [11, 2, 5], functionalName: "Leading Tone" }, // B Diminished
      { name: "viiø7", type: "Half-Diminished 7th", intervals: [11, 2, 5, 9], functionalName: "Leading Tone 7th" }, // Bm7♭5 (B Half-Diminished)
    
      // Passing Chords
      { name: "III7", type: "Dominant 7th", intervals: [4, 8, 11, 2], functionalName: "Mediant (Passing)" }, // E7 (V7/vi)
      { name: "VI7", type: "Secondary Dominant 7th", intervals: [9, 1, 4, 7], functionalName: "Submediant 7th (V7/ii)" }, // A7 (V7/ii)
      { name: "I7", type: "Tonic 7th", intervals: [0, 4, 7, 10], functionalName: "Tonic 7th (Blues, Secondary Dominant)" }, // C7 (Not true dominant in C major)
      { name: "IVm6", type: "Minor 6th", intervals: [5, 8, 0, 2], functionalName: "Subdominant Minor 6th" }, // Fm6
      { name: "Vm6", type: "Minor 6th", intervals: [7, 10, 2, 4], functionalName: "Dominant Minor 6th" }, // Gm6
    ];
    
    // Generate chords based on the selected key
    return familyChords.map((chord) => {
      const chordNotes = chord.intervals.map((interval) => {
        // Handle negative indices by wrapping around the array
        const adjustedInterval = (keyIndex + interval + 12) % 12;
        const note = notes[adjustedInterval];
        const octave = Math.floor((keyIndex + interval) / 12) + 4; // Start in the 4th octave
        return note + octave;
      });
      return { ...chord, notes: chordNotes };
    });
  };

  const familyChords = getFamilyChords(selectedKey);

  // Split familyChords into two parts: first 6 and next 6
  const firstSixChords = familyChords.slice(0, 8);
  const nextSixChords = familyChords.slice(8, 16);

  const playChord = async (chordNotes) => {
    setIsPlaying(true);
    await Tone.start();

    setActiveKey(chordNotes);
    synth.current.triggerAttackRelease(chordNotes, "4n");

    setTimeout(() => {
      setActiveKey(null);
      setIsPlaying(false);
    }, 1000);
  };

  const handleKeyChange = (e) => {
    setSelectedKey(e.target.value);
  };

  return (
    <div className="root-chords-container px-4 w-full mx-auto">
      <h2 className="text-2xl font-mali my-2 bg-gradient-to-tr from-[#328ea3] to-[#32157F] p-3 text-white w-full text-center">
        Family & Passing Chords
      </h2>
      <div className="flex items-center justify-center w-full space-x-6">
        <div className="key-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Key:</label>
          <select
            value={selectedKey}
            onChange={handleKeyChange}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
            {rootNotes.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* First 6 Buttons Above the Piano */}
      <div className="buttons-above-piano mt-6">
        <h2 className="text-lg font-semibold mb-4">Primary Chords:</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-8 gap-2 text-xs">
          {firstSixChords.map((chord, index) => (
            <div key={index} className="relative group">
              <button
                className="bg-[#110016] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#110016] hover:to-[#450159] transition duration-300 mt-2 font-merriweather"
                onClick={() => playChord(chord.notes)}
                disabled={isPlaying}
              >
                ▶ {chord.name} ({chord.type})
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gradient-to-r from-[#6a11cb] to-[#2575fc] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  {chord.functionalName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Piano */}
      <div className="piano6 mt-6">
        {["3", "4", "5"].map((octave, octaveIndex) =>
          whiteKeys.map((key, i) => (
            <div
              key={key + octave}
              className={`white-key6 key6 ${
                activeKey?.includes(key + octave) ? "active" : ""
              } ${
                familyChords.some((chord) =>
                  chord.notes.includes(key + octave)
                ) && !activeKey
                  ? "activeorange2"
                  : ""
              }`}
              style={{
                left: `${i * 50 + octaveIndex * 350}px`,
              }}
            >
              {key + octave}
            </div>
          ))
        )}

        {["3", "4", "5"].map((octave, octaveIndex) =>
          Object.entries(blackKeys).map(([key, pos]) => (
            <div
              key={key + octave}
              className={`black-key6 key6 ${
                activeKey?.includes(key + octave) ? "active" : ""
              } ${
                familyChords.some((chord) =>
                  chord.notes.includes(key + octave)
                ) && !activeKey
                  ? "activeorange2"
                  : ""
              }`}
              style={{
                left: `${(pos + octaveIndex * 7) * (100 / 21) + 3}%`,
              }}
            >
              {key}
            </div>
          ))
        )}
      </div>

      {/* Next 6 Buttons Below the Piano */}
      <div className="buttons-below-piano mt-6">
        <h2 className="text-lg font-semibold mb-4">Extended Chords:</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-8 gap-2 text-xs">
          {nextSixChords.map((chord, index) => (
            <div key={index} className="relative group">
              <button
                className="bg-[#110016] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#110016] hover:to-[#450159] transition duration-300 mt-2 font-merriweather"
                onClick={() => playChord(chord.notes)}
                disabled={isPlaying}
              >
                ▶ {chord.name} ({chord.type})
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-gradient-to-r from-[#6a11cb] to-[#2575fc] text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  {chord.functionalName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>
        {`
          .root-chords-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 20px;
          }
          .piano6 {
            position: relative;
            display: flex;
            border: 3px solid #333;
            border-radius: 12px;
            background: linear-gradient(145deg, #444, #222);
            padding: 1px;
            width: 100%;
            height: 220px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
          }
          .white-key6 {
            width: 14.28%; /* Equal width for 7 white keys */
            height: 200px;
            background: linear-gradient(145deg, #fff, #f0f0f0);
            border: 1px solid #ccc;
            border-radius: 0 0 6px 6px;
            color: #333;
            box-shadow: 2px 5px 10px rgba(0, 0, 0, 0.3);
            margin-right: -1px;
          }
          .black-key6 {
            width: 3.17%; /* Equal width for 5 black keys */
            height: 120px;
            background: linear-gradient(145deg, #222, #000);
            color: #fff;
            z-index: 1;
            position: absolute;
            border-radius: 0 0 4px 4px;
            box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.5);
          }
          .key6 {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            font-size: 12px;
            font-weight: bold;
            user-select: none;
            cursor: pointer;
            transition: background 0.1s, transform 0.1s;
          }
          .black-key6:active {
            background: #444;
          }
          .active {
            background: linear-gradient(135deg, #00b4db 0%, #0083b0 100%) !important;
            transform: scale(1.1);
          }
   
        `}
      </style>
    </div>
  );
};

export default RootChords;