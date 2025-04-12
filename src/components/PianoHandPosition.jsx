import React, { useRef, useEffect, useState } from "react";
import * as Tone from "tone";
import HAND from '../components/HAND.svg';

const Piano = () => {
  const synth = useRef(new Tone.Synth().toDestination());
  const [activeKey, setActiveKey] = useState(null);
  const [selectedScale, setSelectedScale] = useState("C");
  const [scaleType, setScaleType] = useState("major");
  const [scaleNotes, setScaleNotes] = useState([]);
  const [selectedHand, setSelectedHand] = useState("LH");
  const [fingerNumbers, setFingerNumbers] = useState([]);
  const [direction, setDirection] = useState("ascending");

  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };
  const tamilNotation = ["s", "r1", "r2", "g1", "g2", "m1", "m2", "p", "d1", "d2", "n1", "n2"];

  // Finger numbers mapping for all scales
  const fingerNumbersMap = {
    minor: {
      "A": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "E": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "B": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [4, 3, 2, 1, 3, 2, 1, 4] },
      "F#": { RH: [2, 3, 1, 2, 3, 4, 1, 2], LH: [4, 3, 2, 1, 3, 2, 1, 4] },
      "C#": { RH: [2, 3, 1, 2, 3, 4, 1, 2], LH: [3, 2, 1, 4, 3, 2, 1, 2] },
      "G#": { RH: [2, 3, 1, 2, 3, 4, 1, 2], LH: [3, 2, 1, 4, 3, 2, 1, 2] },
      "D#": { RH: [2, 3, 1, 2, 3, 4, 1, 2], LH: [3, 2, 1, 4, 3, 2, 1, 2] },
      "A#": { RH: [2, 3, 1, 2, 3, 4, 1, 2], LH: [3, 2, 1, 4, 3, 2, 1, 2] },
      "D": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "G": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "C": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "F": { RH: [1, 2, 3, 4, 1, 2, 3, 4], LH: [5, 4, 3, 2, 1, 4, 3, 2] },
   
    },
    major: {
      "C": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "G": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "D": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "A": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "E": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "B": { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "F#": { RH: [2, 3, 4, 1, 2, 3, 1, 3], LH: [4, 3, 2, 1, 3, 2, 1, 3] },
      "C#": { RH: [2, 3, 1, 2, 3, 4, 1, 3], LH: [3, 2, 1, 4, 3, 2, 1, 3] },
      "F": { RH: [1, 2, 3, 4, 1, 2, 3, 4], LH: [5, 4, 3, 2, 1, 3, 2, 1] },
      "A#": { RH: [2, 3, 1, 2, 3, 4, 1, 3], LH: [3, 2, 1, 4, 3, 2, 1, 3] },
      "D#": { RH: [2, 3, 1, 2, 3, 4, 1, 3], LH: [3, 2, 1, 4, 3, 2, 1, 3] },
      "G#": { RH: [2, 3, 1, 2, 3, 4, 1, 3], LH: [3, 2, 1, 4, 3, 2, 1, 3] },

    }
  };

  const scales = {
    major: {
      C: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
      "C#": ["C#4", "D#4", "F4", "F#4", "G#4", "A#4", "C5", "C#5"],
      D: ["D4", "E4", "F#4", "G4", "A4", "B4", "C#5", "D5"],
      "D#": ["D#4", "F4", "G4", "G#4", "A#4", "C5", "D5", "D#5"],
      E: ["E4", "F#4", "G#4", "A4", "B4", "C#5", "D#5", "E5"],
      F: ["F4", "G4", "A4", "A#4", "C5", "D5", "E5", "F5"],
      "F#": ["F#4", "G#4", "A#4", "B4", "C#5", "D#5", "F5", "F#5"],
      G: ["G4", "A4", "B4", "C5", "D5", "E5", "F#5", "G5"],
      "G#": ["G#4", "A#4", "C5", "C#5", "D#5", "F5", "G5", "G#5"],
      A: ["A4", "B4", "C#5", "D5", "E5", "F#5", "G#5", "A5"],
      "A#": ["A#4", "C5", "D5", "D#5", "F5", "G5", "A5", "A#5"],
      B: ["B4", "C#5", "D#5", "E5", "F#5", "G#5", "A#5", "B5"],
    },
    minor: {
      A: ["A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5"],
      "A#": ["A#4", "C5", "C#5", "D#5", "F5", "F#5", "G#5", "A#5"],
      B: ["B4", "C#5", "D5", "E5", "F#5", "G5", "A5", "B5"],
      C: ["C4", "D4", "D#4", "F4", "G4", "G#4", "A#4", "C5"],
      "C#": ["C#4", "D#4", "E4", "F#4", "G#4", "A4", "B4", "C#5"],
      D: ["D4", "E4", "F4", "G4", "A4", "A#4", "C5", "D5"],
      "D#": ["D#4", "F4", "F#4", "G#4", "A#4", "B4", "C#5", "D#5"],
      E: ["E4", "F#4", "G4", "A4", "B4", "C5", "D5", "E5"],
      F: ["F4", "G4", "G#4", "A#4", "C5", "C#5", "D#5", "F5"],
      "F#": ["F#4", "G#4", "A4", "B4", "C#5", "D5", "E5", "F#5"],
      G: ["G4", "A4", "A#4", "C5", "D5", "D#5", "F5", "G5"],
      "G#": ["G#4", "A#4", "B4", "C#5", "D#5", "E5", "F#5", "G#5"],
    },
  };

  const keyMap = {
    a: "C4",
    s: "D4",
    d: "E4",
    f: "F4",
    g: "G4",
    h: "A4",
    j: "B4",
    w: "C#4",
    e: "D#4",
    t: "F#4",
    y: "G#4",
    u: "A#4",
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (keyMap[e.key]) {
        playNote(keyMap[e.key]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const playNote = (note) => {
    setActiveKey(note);
    synth.current.triggerAttackRelease(note, "8n");
    setTimeout(() => setActiveKey(null), 200);
  };

  const getFingerNumbers = () => {
    const scaleData = fingerNumbersMap[scaleType]?.[selectedScale] || 
                     fingerNumbersMap[scaleType]?.default || 
                     { RH: [1, 2, 3, 1, 2, 3, 4, 5], LH: [5, 4, 3, 2, 1, 3, 2, 1] };
    
    return scaleData[selectedHand];
  };

  const updateFingerNumbers = () => {
    const fingerNumbers = getFingerNumbers();
    setFingerNumbers(fingerNumbers);
  };

  useEffect(() => {
    updateFingerNumbers();
  }, [selectedHand, selectedScale, scaleType]);

  const playScale = async () => {
    await Tone.start();

    let notes = [...scales[scaleType][selectedScale]];
    let fingerNumbers = getFingerNumbers();

    if (direction === "descending") {
      notes = notes.reverse();
      fingerNumbers = [...fingerNumbers].reverse();
    }

    setScaleNotes(notes);
    setFingerNumbers(fingerNumbers);

    let index = 0;

    const loop = new Tone.Loop((time) => {
      if (index < notes.length) {
        setActiveKey(notes[index]);
        synth.current.triggerAttackRelease(notes[index], "8n", time);
        index++;
      } else {
        setActiveKey(null);
        loop.stop();
      }
    }, "0.5s").start(0);

    Tone.Transport.start();
  };

  return (
    <div className="piano-container8 px-5">
      <div className="piano-container8">
        <div className="flex items-center justify-center w-full space-x-4 my-2">
          <div className="scale-type-selector flex items-center space-x-4">
            <label className="text-lg font-semibold">Scale Type:</label>
            <select
              value={scaleType}
              onChange={(e) => {
                setScaleType(e.target.value);
                setSelectedScale("C");
              }}
              className="border-2 border-black p-2 rounded-md font-montserrat"
            >
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>

          <div className="scale-selector flex items-center space-x-4">
            <label className="text-lg font-semibold">Select Scale:</label>
            <select
              value={selectedScale}
              onChange={(e) => setSelectedScale(e.target.value)}
              className="border-2 border-black p-2 rounded-md font-montserrat"
            >
              {Object.keys(scales[scaleType]).map((scale) => (
                <option key={scale} value={scale}>
                  {scale} {scaleType}
                </option>
              ))}
            </select>
          </div>

          <div className="hand-selector flex items-center space-x-4">
            <label className="text-lg font-semibold">Hand:</label>
            <select
              value={selectedHand}
              onChange={(e) => {
                setSelectedHand(e.target.value);
                updateFingerNumbers();
              }}
              className="border-2 border-black p-2 rounded-md font-montserrat"
            >
              <option value="LH">LH</option>
              <option value="RH">RH</option>
            </select>
          </div>

          <div className="direction-selector flex items-center space-x-4">
            <label className="text-lg font-semibold">Direction:</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="border-2 border-black p-2 rounded-md font-montserrat"
            >
              <option value="ascending">Ascending</option>
              <option value="descending">Descending</option>
            </select>
          </div>
        </div>

        <h2 className="title">
          {selectedScale} {scaleType} Scale ({direction})
        </h2>

        <div className="piano7">
          {["4", "5"].map((octave, octaveIndex) =>
            whiteKeys.map((key, i) => {
              const note = key + octave;
              const isActive = activeKey === note;
              const isScaleNote = scales[scaleType][selectedScale]?.includes(note);
              const fingerNumber = isScaleNote
                ? fingerNumbers[scales[scaleType][selectedScale].indexOf(note)]
                : null;

              return (
                <div
                  key={note}
                  className={`white-key7 key7 ${
                    isActive ? "active" : isScaleNote ? "activeorange" : ""
                  }`}
                  onClick={() => playNote(note)}
                  style={{
                    left: `${i * 50}px`,
                  }}
                >
                  {fingerNumber && (
                    <div className="absolute bottom-2 text-lg font-bold text-black bg-yellow-400 p-2 rounded-full">
                      {fingerNumber}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {["4", "5"].map((octave, octaveIndex) =>
            Object.entries(blackKeys).map(([key, pos]) => {
              const note = key + octave;
              const isActive = activeKey === note;
              const isScaleNote = scales[scaleType][selectedScale]?.includes(note);
              const fingerNumber = isScaleNote
                ? fingerNumbers[scales[scaleType][selectedScale].indexOf(note)]
                : null;

              return (
                <div
                  key={note}
                  className={`black-key7 key7 ${
                    isActive ? "active" : isScaleNote ? "activeorange" : ""
                  }`}
                  onClick={() => playNote(note)}
                  style={{
                    left: `${(pos + octaveIndex * 7) * (100 / 14) + 4}%`,
                  }}
                >
                  {fingerNumber && (
                    <div className="absolute bottom-2 text-black text-lg font-bold bg-yellow-400 p-2 rounded-full">
                      {fingerNumber}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          className="bg-[#110016] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#110016] hover:to-[#450159] transition duration-300 mt-2 font-merriweather"
          onClick={playScale}
        >
          ▶ Play {selectedScale} {scaleType} Scale ({direction})
        </button>
      </div>

      <div>
        <img src={HAND} alt="Hand Position" width={500} height={500} className="mx-auto" />
      </div>
      <style>
        {`
          .piano-container7 {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 20px;
          }
          .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .piano7 {
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
          .white-key7 {
            width: 14.28%;
            height: 200px;
            background: linear-gradient(145deg, #fff, #f0f0f0);
            border: 1px solid #ccc;
            border-radius: 0 0 6px 6px;
            color: #333;
            box-shadow: 2px 5px 10px rgba(0, 0, 0, 0.3);
            margin-right: -1px;
          }
          .black-key7 {
            width: 4.57%;
            height: 120px;
            background: linear-gradient(145deg, #222, #000);
            color: #fff;
            z-index: 1;
            position: absolute;
            border-radius: 0 0 4px 4px;
            box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.5);
          }
          .key7 {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            font-size: 12px;
            font-weight: bold;
            user-select: none;
            cursor: pointer;
            transition: background 0.1s, transform 0.1s;
          }
          .active {
            background: linear-gradient(135deg, #00b4db 0%, #0083b0 100%) !important;
            transform: scale(1.1);
          }
          .activeorange {
            background: linear-gradient(135deg, #00b4db 0%, #0083b0 100%);
            border: 1px solid black;
          }
        `}
      </style>
    </div>
  );
};

export default Piano;