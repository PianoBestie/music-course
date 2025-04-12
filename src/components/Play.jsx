import React, { useCallback, useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";
import { note } from "@tonaljs/tonal";

const Play = () => {
  // Redux state
  const { tamilNotation } = useSelector((state) => state.music);

  // Refs and state
  const synth = useRef(new Tone.PolySynth(Tone.Synth).toDestination());
  const [activeKey, setActiveKey] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlay, setIsPlay] = useState(false);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [currentNotes, setCurrentNotes] = useState([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [nextExpectedNote, setNextExpectedNote] = useState(null);
  const [showNextExpected, setShowNextExpected] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("noteKnowledge");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [midiInput, setMidiInput] = useState(null);
  const [midiDevices, setMidiDevices] = useState([]);

  // Piano keys configuration
  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };

  // MIDI exercises mapping
  const exercises = {
    noteKnowledge: {
      "bgm/song1": "/duration.mid",
      "bgm/song2": "/midi/song2.mid",
      "bgm/song3": "/midi/song3.mid"
    },
    chordKnowledge: {
      "bgm/song4": "/midi/song4.mid",
      "bgm/song5": "/midi/song5.mid",
      "bgm/song6": "/midi/song6.mid"
    }
  };

  // Initialize MIDI input
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then((midiAccess) => {
          const inputs = Array.from(midiAccess.inputs.values());
          setMidiDevices(inputs);
          if (inputs.length > 0) {
            const input = inputs[0];
            setMidiInput(input);
            input.onmidimessage = handleMIDIMessage;
          }
        })
        .catch(console.error);
    }

    return () => {
      if (midiInput) midiInput.onmidimessage = null;
    };
  }, []);

  useEffect(() => {
    // Disable "Your Turn" button when dropdown state changes
    setIsPlay(false);
  }, [selectedCategory, selectedExercise]);

  // Highlight piano keys
// Handle piano key clicks




  // Handle MIDI input
  const handleMIDIMessage = useCallback((message) => {
    const [command, note, velocity] = message.data;
    if (command === 144 && velocity > 0) {
      Tone.start().then(() => {
        const noteName = Tone.Frequency(note, "midi").toNote();
        handlePianoKeyClick(noteName);
      });
    }
  }, []);

// Update highlightKey function
const highlightKey = useCallback((noteName, highlightType) => {
  const key = document.querySelector(`.key8[data-note="${noteName}"]`);
  if (!key) return;

  // Clear all highlight states
  key.classList.remove(
    "active", 
    "incorrect", 
    "correct", 
    "next-expected",
    "correct-and-expected"
  );

  // Add new state with slight delay
  setTimeout(() => {
    if (highlightType) {
      key.classList.add(highlightType);
    }
  }, 10);
}, []);

// Modify the handlePianoKeyClick function
const handlePianoKeyClick = useCallback(
  (noteName) => {
    if (!isYourTurn) return;

    const currentExpectedNote = currentNotes[currentNoteIndex];
    const nextNote = currentNotes[currentNoteIndex + 1];
    
    Tone.start().then(() => {
      synth.current.triggerAttackRelease(noteName, "8n");
    });

    if (currentExpectedNote === noteName) {
      // Special case: if next note is same as current, show pink
      if (nextNote === noteName) {
        highlightKey(noteName, "correct-and-expected");
      } else {
        highlightKey(noteName, "correct");
      }
      
      setActiveKey(noteName);
      const newIndex = currentNoteIndex + 1;
      setCurrentNoteIndex(newIndex);

      // Schedule to show next expected note after release
      const releaseTime = Tone.now() + 0.5;
      Tone.Draw.schedule(() => {
        if (newIndex < currentNotes.length) {
          setNextExpectedNote(currentNotes[newIndex]);
          highlightKey(currentNotes[newIndex], "next-expected");
        }
      }, releaseTime);

      if (newIndex >= currentNotes.length) {
        setTimeout(() => {
          toast.success("Finished! Great job!");
          setIsYourTurn(false);
          setCurrentNoteIndex(0);
          setActiveKey(null);
          setNextExpectedNote(null);
          document.querySelectorAll(".key8").forEach((key) =>
            key.classList.remove(
              "correct", 
              "active", 
              "incorrect", 
              "next-expected",
              "correct-and-expected"
            )
          );
        }, 1000);
      }
    } else {
      highlightKey(noteName, currentNotes.includes(noteName) ? "active" : "incorrect");
    }
  },
  [isYourTurn, currentNotes, currentNoteIndex, highlightKey]
);



  // Play MIDI exercise
  const playExercise = async () => {
    if (!selectedExercise) {
      toast.error("Please select an exercise first");
      return;
    }

    const midiUrl = exercises[selectedCategory][selectedExercise];
    
    try {
      setIsPlaying(true);
      const midi = await Midi.fromUrl(midiUrl);
      
      // Extract notes from MIDI
      const notes = [];
      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          notes.push(note.name);
        });
      });
      
      setCurrentNotes(notes);
      setCurrentNoteIndex(0);
  

      // Schedule playback with highlighting
      const now = Tone.now();
      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          // Schedule the note playback
          setIsPlay(true);
          synth.current.triggerAttackRelease(
            note.name,
            note.duration,
            now + note.time,
            note.velocity
          );
          
          // Schedule the key highlight
          Tone.Draw.schedule(() => {
            setActiveKey(note.name);
            highlightKey(note.name, "active");
          }, now + note.time);
          
          // Schedule the key unhighlight after the duration
          Tone.Draw.schedule(() => {
            setActiveKey(null);
          }, now + note.time + note.duration);
        });
      });

      // Calculate total duration
      const duration = midi.duration;
      setTimeout(() => {
        setIsPlaying(false);
      }, duration * 1000);

    } catch (error) {
      console.error("Error loading MIDI:", error);
      toast.error("Failed to load MIDI file");
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (nextExpectedNote && showNextExpected) {
      highlightKey(nextExpectedNote, "next-expected");
    }
  }, [nextExpectedNote, showNextExpected, highlightKey]);

// Start "Your Turn" mode
const startYourTurn = useCallback(() => {
  if (currentNotes.length === 0) {
    toast.error("No exercise loaded");
    return;
  }
  
  setIsYourTurn(true);
  setCurrentNoteIndex(0);
  
  // Clear all highlights first
  document.querySelectorAll(".key8").forEach(key => {
    key.classList.remove("correct", "active", "incorrect", "next-expected");
  });
  
  // Set and highlight the first expected note
  const firstNote = currentNotes[0];
  setNextExpectedNote(firstNote);
  highlightKey(firstNote, "next-expected");
  
}, [currentNotes, highlightKey]);

  return (
    <div className="piano-container8">
      <h2 className="text-2xl font-mali my-2 bg-gradient-to-tr from-[#328ea3] to-[#32157F] p-3 text-white w-full text-center">
        Practice Exercises
      </h2>

      <div className="flex items-center justify-center w-full gap-5 my-2">
        {/* Category Selector */}
        <div className="category-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedExercise("");
              setCurrentNotes([]);
            }}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
            <option value="noteKnowledge">Note Knowledge</option>
            <option value="chordKnowledge">Chord Knowledge</option>
          </select>
        </div>

        {/* Exercise Selector */}
        <div className="exercise-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Exercise:</label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
            <option value="">Select an exercise</option>
            {Object.keys(exercises[selectedCategory]).map((exercise) => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>
        </div>

        {/* Next Expected Note Toggle */}
        <div className="toggle-next-expected flex items-center space-x-4">
          <label className="text-sm font-semibold font-mali">Guide me</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={showNextExpected}
              onChange={() => setShowNextExpected((prev) => !prev)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      {/* Piano UI */}
      <div className="piano8">
        {["4", "5"].map((octave) =>
          whiteKeys.map((key) => (
            <div
              key={key + octave}
              className={`white-key8 key8 ${activeKey === key + octave ? "active" : ""}`}
              onClick={() => handlePianoKeyClick(key + octave)}
              data-note={key + octave}
            >
              {key + octave}
            </div>
          ))
        )}

        {["4", "5"].map((octave) =>
          Object.entries(blackKeys).map(([key, pos]) => (
            <div
              key={key + octave}
              className={`black-key8 key8 ${activeKey === key + octave ? "active" : ""}`}
              onClick={() => handlePianoKeyClick(key + octave)}
              data-note={key + octave}
              style={{
                left: `${(pos + (octave === "5" ? 7 : 0)) * (100 / 14) + 4}%`,
              }}
            >
              {key}
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex mt-2 gap-5 justify-center">
        <button
          className="bg-[#110016] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#110016] hover:to-[#450159] transition duration-300 font-merriweather"
          onClick={playExercise}
          disabled={isPlaying}
        >
          {isPlaying ? "Playing..." : `▶ Play ${selectedExercise || "Exercise"}`}
        </button>

<button
  onClick={startYourTurn}
  className={`bg-[#008c7a] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#00d2b4] hover:to-[#008c7a] transition duration-300 font-mali ${
    !isPlay ? "opacity-50 cursor-not-allowed" : ""
  }`}
  disabled={!isPlay}
>
  ✋ Your Turn
</button>
      </div>

      {/* MIDI Device Selector */}
      <div className="midi-device-selector mt-4 text-center">
        <label className="font-semibold text-xs">MIDI Device:</label>
        {midiDevices.length > 0 ? (
          <select
            onChange={(e) => {
              const device = midiDevices.find(d => d.id === e.target.value);
              if (device) {
                if (midiInput) midiInput.onmidimessage = null;
                setMidiInput(device);
                device.onmidimessage = handleMIDIMessage;
              }
            }}
            className="border-2 border-black p-2 rounded-md font-montserrat mx-2"
          >
            {midiDevices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-red-500 text-xs">
            No MIDI devices detected. Please connect a MIDI device.
          </p>
        )}
      </div>

      {/* Styles */}
      <style>{`
        .piano-container8 {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px;
          width: 100%;
        }
        .piano8 {
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
        .white-key8 {
          width: 14.28%;
          height: 200px;
          background: linear-gradient(145deg, #fff, #f0f0f0);
          border: 1px solid #ccc;
          border-radius: 0 0 6px 6px;
          color: #333;
          box-shadow: 2px 5px 10px rgba(0, 0, 0, 0.3);
          margin-right: -1px;
        }
        .black-key8 {
          width: 4.57%;
          height: 120px;
          background: linear-gradient(145deg, #222, #000);
          color: #fff;
          z-index: 1;
          position: absolute;
          border-radius: 0 0 4px 4px;
          box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.5);
        }
        .key8 {
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
        .correct {
          background: linear-gradient(135deg, #00d2b4 0%, #008c7a 100%) !important;
          transform: scale(1.05);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
          z-index: 1;
        }
        .incorrect {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%) !important;
          transform: scale(1.05);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
        }
        .next-expected {
          background: linear-gradient(135deg, #8a2be2 0%, #4b0082 100%) !important;
          transform: scale(1.05);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
          z-index: 1;
        }
           .correct-and-expected {
background: linear-gradient(135deg, #ff7eb9 0%, #ff65a3 100%) !important;
    transform: scale(1.05);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
    z-index: 1;
        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #8a2be2;
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        .slider.round {
          border-radius: 34px;
        }
      `}</style>
    </div>
  );
};

export default Play;