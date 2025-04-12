import React, { useRef, useState, useEffect } from "react";
import * as Tone from "tone";

const ChordsPiano = () => {
  const synth = useRef(new Tone.PolySynth(Tone.Synth).toDestination());
  const [activeKey, setActiveKey] = useState(null);
  const [rootNote, setRootNote] = useState("C");
  const [chordType, setChordType] = useState("Major");
  const [inversion, setInversion] = useState("Root Position");
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNote, setSelectedNote] = useState("C");

  // Reset inversion to "Root Position" when chordType changes
  useEffect(() => {
    setInversion("Root Position");
  }, [chordType]);

  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };

  const chordFormulas = {
    Major: [0, 4, 7],
    Minor: [0, 3, 7],
    Augmented: [0, 4, 8],
    Diminished: [0, 3, 6],
    Sus2: [0, 2, 7],
    Sus4: [0, 5, 7],
    "Major 6th": [0, 4, 7, 9],
    "Minor 6th": [0, 3, 7, 9],
    "7th": [0, 4, 7, 10],
    "Major 7th": [0, 4, 7, 11],
    "Minor 7th": [0, 3, 7, 10],
    "Major 9th": [0, 4, 7, 11, 14],
    "Minor 9th": [0, 3, 7, 10, 14],
    "9th": [0, 4, 7, 10, 14],
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

  const inversions = [
    "Root Position",
    "1st Inversion",
    "2nd Inversion",
    "3rd Inversion",
    "4th Inversion",
  ];

  const generateChordNotes = (root, type, inversion) => {
    const formula = chordFormulas[type];
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
    const rootIndex = notes.indexOf(root);

    // Generate the base chord notes in the 4th octave
    let chordNotes = formula.map((interval) => {
      const note = notes[(rootIndex + interval) % 12];
      const octave = Math.floor((rootIndex + interval) / 12) + 4; // Start in the 4th octave
      return note + octave;
    });

    // Apply inversion only if it's valid for the current chord type
    const maxInversionIndex = formula.length - 1; // Maximum inversion index based on chord length
    const inversionIndex = inversions.indexOf(inversion);

    if (inversionIndex > 0 && inversionIndex <= maxInversionIndex) {
      // Move the first `inversionIndex` notes up an octave
      const movedNotes = chordNotes.slice(0, inversionIndex).map((note) => {
        const newOctave = parseInt(note.slice(-1)) + 1; // Increment the octave
        return note.slice(0, -1) + newOctave;
      });

      chordNotes = [...chordNotes.slice(inversionIndex), ...movedNotes];
    }

    return chordNotes;
  };

  const chordNotes = generateChordNotes(rootNote, chordType, inversion);

  const playChord = async () => {
    setIsPlaying(true);
    await Tone.start();

    setActiveKey(chordNotes);
    synth.current.triggerAttackRelease(chordNotes, "2n");

    setTimeout(() => {
      setActiveKey(null);
      setIsPlaying(false);
    }, 1000);
  };

  const handleRootNoteChange = (e) => {
    const selectedNote = e.target.value;
    setRootNote(selectedNote);
    setSelectedNote(selectedNote);
  };

  return (
    <div className="chords-piano-container px-4 w-[700px mx-auto]">
      <h2 className="text-2xl font-mali my-2 bg-gradient-to-tr from-[#328ea3] to-[#32157F] p-3 text-white w-full text-center">
        Types of Chords
      </h2>
      <div className="flex items-center justify-center w-full space-x-6">
        <div className="root-note-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Root Note:</label>
          <select
            value={rootNote}
            onChange={handleRootNoteChange}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
            {rootNotes.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </div>

        <div className="chord-type-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Chord Type:</label>
          <select
            value={chordType}
            onChange={(e) => setChordType(e.target.value)}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
            {Object.keys(chordFormulas).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="inversion-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Inversion:</label>
          <select
            value={inversion}
            onChange={(e) => setInversion(e.target.value)}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
            {inversions
              .slice(0, chordFormulas[chordType].length) // Limit inversions based on chord length
              .map((inv) => (
                <option key={inv} value={inv}>
                  {inv}
                </option>
              ))}
          </select>
        </div>
      </div>

      <h2 className="title">
        {rootNote} {chordType} Chord ({inversion})
      </h2>

      <div className="piano5">
        {["4", "5", "6"].map((octave, octaveIndex) =>
          whiteKeys.map((key, i) => (
            <div
              key={key + octave}
              className={`white-key5 key5 ${
                activeKey?.includes(key + octave) ? "active" : ""
              } ${
                chordNotes?.includes(key + octave) && !activeKey
                  ? "activeorange"
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

        {["4", "5", "6"].map((octave, octaveIndex) =>
          Object.entries(blackKeys).map(([key, pos]) => (
            <div
              key={key + octave}
              className={`black-key5 key5 ${
                activeKey?.includes(key + octave) ? "active" : ""
              } ${
                chordNotes?.includes(key + octave) && !activeKey
                  ? "activeorange"
                  : ""
              }`}
              style={{
                left: `${(pos + octaveIndex * 7) * (100 / 21) + 3}%`,
                width: "3.07%",
              }}
            >
              {key + octave}
            </div>
          ))
        )}
      </div>

      <button
        className="bg-[#110016] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#110016] hover:to-[#450159] transition duration-300 mt-2 font-merriweather"
        onClick={playChord}
        disabled={isPlaying}
      >
        {`▶ Play ${rootNote} ${chordType} (${inversion})`}
      </button>

      <style>
        {`
          .chords-piano-container {
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

          .piano5 {
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

          .white-key5 {
            width: 14.28%; /* Equal width for 7 white keys */
            height: 200px;
            background: linear-gradient(145deg, #fff, #f0f0f0);
            border: 1px solid #ccc;
            border-radius: 0 0 6px 6px;
            color: #333;
            box-shadow: 2px 5px 10px rgba(0, 0, 0, 0.3);
            margin-right: -1px;
          }

          .black-key5 {
            height: 120px;
            background: linear-gradient(145deg, #222, #000);
            color: #fff;
            z-index: 1;
            position: absolute;
            border-radius: 0 0 4px 4px;
            box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.5);
          }

          .key5 {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            font-size: 12px;
            font-weight: bold;
            user-select: none;
            cursor: pointer;
            transition: background 0.1s, transform 0.1s, box-shadow 0.1s;
          }

          .active {
            background: linear-gradient(135deg, #00b4db 0%, #0083b0 100%) !important;
            transform: scale(1.05);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
          }

          .activeorange {
            background: linear-gradient(135deg, #00b4db 0%, #0083b0 100%) !important;
            border: 1px solid #333;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
          }
        `}
      </style>
    </div>
  );
};

export default ChordsPiano;