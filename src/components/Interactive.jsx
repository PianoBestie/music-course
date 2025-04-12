import React, { useEffect, useCallback, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import * as Tone from "tone";

const Piano = () => {
  // Access Redux state
  const { tamilNotation, scales, keyMap } = useSelector((state) => state.music);

  const synth = useRef(new Tone.Synth().toDestination());
  const [isPlay, setIsPlay] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [selectedScale, setSelectedScale] = useState("C");
  const [scaleType, setScaleType] = useState("major");
  const [scaleDirection, setScaleDirection] = useState("ascending");
  const [showModal, setShowModal] = useState(false);
  const [scaleNotes, setScaleNotes] = useState([]);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [midiInput, setMidiInput] = useState(null);
  const [midiDevices, setMidiDevices] = useState([]);
  const [nextExpectedNote, setNextExpectedNote] = useState(null);
  const [showNextExpected, setShowNextExpected] = useState(true);
  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };

  // Initialize MIDI access
  useEffect(() => {
    const initializeMIDI = async () => {
      if (navigator.requestMIDIAccess) {
        try {
          const midiAccess = await navigator.requestMIDIAccess({ sysex: false });
          onMIDISuccess(midiAccess);
          
          // Listen for device changes
          midiAccess.onstatechange = (event) => {
            console.log('MIDI device state changed:', event);
            const inputs = Array.from(midiAccess.inputs.values());
            setMidiDevices(inputs);
            if (inputs.length > 0 && !midiInput) {
              setMidiInput(inputs[0]);
            }
          };
        } catch (error) {
          console.error("MIDI Access Denied:", error);
          onMIDIFailure(error);
        }
      } else {
        console.error("Web MIDI API not supported in this browser.");
      }
    };

    initializeMIDI();

    return () => {
      if (midiInput) {
        midiInput.onmidimessage = null;
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  // Update MIDI message handler when input changes
  useEffect(() => {
    if (midiInput) {
      midiInput.onmidimessage = handleMIDIMessage;
      console.log("MIDI input set to:", midiInput.name);
    }
    return () => {
      if (midiInput) {
        midiInput.onmidimessage = null;
      }
    };
  }, [midiInput, isYourTurn, scaleNotes, currentNoteIndex]);

  const onMIDISuccess = (midiAccess) => {
    const inputs = Array.from(midiAccess.inputs.values());
    setMidiDevices(inputs);
    if (inputs.length > 0) {
      setMidiInput(inputs[0]);
    }
  };

  const onMIDIFailure = (error) => {
    console.error("Failed to access MIDI devices:", error);
    toast.error("Failed to access MIDI devices. Please check browser permissions.");
  };

  const handleMIDIMessage = (message) => {
    const [command, note, velocity] = message.data;
    
    // Note on (144) or note off (128)
    if ((command === 144 || command === 153) && velocity > 0) { // Note on with velocity > 0
      const noteName = Tone.Frequency(note, "midi").toNote();
      console.log("MIDI Note Detected:", noteName, "Velocity:", velocity);
      handlePianoKeyClick(noteName);
    } else if (command === 128 || (command === 144 && velocity === 0)) { // Note off
      // Handle note off if needed
      console.log("MIDI Note Released:", Tone.Frequency(note, "midi").toNote());
    }
  };

  const handleMidiDeviceChange = (deviceId) => {
    if (midiInput) {
      midiInput.onmidimessage = null; // Remove old listener
    }
    const device = midiDevices.find((d) => d.id === deviceId);
    if (device) {
      setMidiInput(device);
      toast.success(`MIDI device selected: ${device.name}`);
      console.log("MIDI Device Selected:", device.name);
    }
  };

  const highlightKey = (noteName, highlightType) => {
    const key = document.querySelector(`.key8[data-note="${noteName}"]`);
    if (key) {
      // Remove all existing highlight classes except 'correct'
      if (highlightType !== "correct") {
        key.classList.remove(
          "active",
          "incorrect",
          "activeorange",
          "next-expected"
        );
      }

      // Add the specified highlight class
      if (highlightType === "active") {
        key.classList.add("active");
        setTimeout(() => key.classList.remove("active"), 500);
      } else if (highlightType === "correct") {
        key.classList.add("correct");
        key.classList.remove("next-expected");
      } else if (highlightType === "incorrect") {
        key.classList.add("incorrect");
        setTimeout(() => key.classList.remove("incorrect"), 500);
      } else if (highlightType === "next-expected" && showNextExpected) {
        if (!key.classList.contains("correct")) {
          key.classList.add("next-expected");
        }
      }
    }
  };

  const handlePianoKeyClick = useCallback(
    (noteName) => {
      if (!isYourTurn) return;
  
      setCurrentNoteIndex((prevIndex) => {
        const currentNote = scaleNotes[prevIndex];
  
        if (currentNote === noteName) {
          Tone.start();
          synth.current.triggerAttackRelease(noteName, "8n");
  
          setActiveKey(noteName);
          highlightKey(noteName, "correct");
  
          const newIndex = prevIndex + 1;
          if (newIndex < scaleNotes.length) {
            setNextExpectedNote(scaleNotes[newIndex]);
          } else {
            setNextExpectedNote(null);
          }
  
          if (newIndex === scaleNotes.length) {
            setTimeout(() => {
              toast.success("Finished! Great job!");
              setIsYourTurn(false);
              setCurrentNoteIndex(0);
              setActiveKey(null);
              setNextExpectedNote(null);
  
              document.querySelectorAll(".key8").forEach((key) =>
                key.classList.remove("correct", "active", "incorrect", "next-expected")
              );
            }, 1000);
          }
  
          return newIndex;
        } else if (scaleNotes.includes(noteName)) {
          Tone.start();
          synth.current.triggerAttackRelease(noteName, "8n");
  
          const key = document.querySelector(`.key8[data-note="${noteName}"]`);
          if (!key.classList.contains("correct")) {
            highlightKey(noteName, "active");
          }
        } else {
          Tone.start();
          synth.current.triggerAttackRelease(noteName, "8n");
          highlightKey(noteName, "incorrect");
        }
  
        return prevIndex;
      });
    },
    [isYourTurn, scaleNotes, synth]
  );

  const playNote = (note) => {
    setActiveKey(note);
    synth.current.triggerAttackRelease(note, "8n");
    setTimeout(() => setActiveKey(null), 20);
  };

  const getTamilNotation = (notes, rootNote) => {
    const chromaticScale = [
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
    const rootIndex = chromaticScale.indexOf(rootNote.replace(/\d/, ""));
    return notes.map((note) => {
      const noteName = note.replace(/\d/, "");
      const noteIndex = chromaticScale.indexOf(noteName);
      const tamilIndex = (noteIndex - rootIndex + 12) % 12;
      return tamilNotation[tamilIndex];
    });
  };

  useEffect(() => {
    setIsPlay(false);
  }, [selectedScale, scaleType, scaleDirection]);

  const playScale = async () => {
    await Tone.start();

    let notes = [...scales[scaleType][selectedScale]];

    if (scaleDirection === "descending") {
      notes = notes.reverse();
    }

    setScaleNotes(notes);
    setCurrentNoteIndex(0);

    let index = 0;

    const loop = new Tone.Loop((time) => {
      if (index < notes.length) {
        setActiveKey(notes[index]);
        synth.current.triggerAttackRelease(notes[index], "8n", time);
        index++;
      } else {
        setActiveKey(null);
        setIsPlay(true);
        loop.stop();

        Tone.Transport.scheduleOnce(() => {
          const tamilNotes = getTamilNotation(notes, selectedScale);
          setShowModal(true);
        }, "+0.1");
      }
    }, "0.5s").start(0);

    Tone.Transport.start();
  };

  useEffect(() => {
    if (activeKey) {
      highlightKey(activeKey, "active");
    }
  }, [activeKey]);

  useEffect(() => {
    if (nextExpectedNote && showNextExpected) {
      highlightKey(nextExpectedNote, "next-expected");
    }
  }, [nextExpectedNote, showNextExpected]);

  return (
    <div className="piano-container8">
      <h2 className="text-2xl font-mali my-2 bg-gradient-to-tr from-[#328ea3] to-[#32157F] p-3 text-white w-full text-center">
        Scales
      </h2>
      <div className="flex items-center justify-center w-full gap-5 my-2">
        {/* Scale Type Dropdown */}
        <div className="scale-type-selector flex items-center space-x-4 my-4">
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
            <option value="mayamalava">Maya</option>
            <option value="harmonicMinor">Harmonic minor</option>
            <option value="chromatic">Chromatic</option>
            <option value="blues">Blues</option>
            <option value="pentatonic">Pentatonic</option>
          </select>
        </div>

        {/* Scale Dropdown */}
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

        {/* Scale Direction Dropdown */}
        <div className="scale-direction-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Direction:</label>
          <select
            value={scaleDirection}
            onChange={(e) => setScaleDirection(e.target.value)}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
            <option value="ascending">Ascending</option>
            <option value="descending">Descending</option>
          </select>
        </div>

        {/* Modern Toggle Switch for Next Expected Note */}
        <div className="toggle-next-expected flex items-center space-x-4">
          <label className="text-sm font-semibold font-mali">Guide me <span className="font-thin text-xs">(Show Next Note):</span></label>
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
        {/* White Keys */}
        {["4", "5"].map((octave, octaveIndex) =>
          whiteKeys.map((key, i) => (
            <div
              key={key + octave}
              className={`white-key8 key8 ${
                !isYourTurn && activeKey === key + octave ? "active" : ""
              } ${
                !isYourTurn &&
                scales[scaleType][selectedScale]?.includes(key + octave) &&
                !activeKey
                  ? "activeorange"
                  : ""
              }`}
              onClick={() => handlePianoKeyClick(key + octave)}
              data-note={key + octave}
            >
              {key + octave}
            </div>
          ))
        )}

        {/* Black Keys */}
        {["4", "5"].map((octave, octaveIndex) =>
          Object.entries(blackKeys).map(([key, pos]) => (
            <div
              key={key + octave}
              className={`black-key8 key8 ${
                !isYourTurn && activeKey === key + octave ? "active" : ""
              } ${
                !isYourTurn &&
                scales[scaleType][selectedScale]?.includes(key + octave) &&
                !activeKey
                  ? "activeorange"
                  : ""
              }`}
              onClick={() => handlePianoKeyClick(key + octave)}
              data-note={key + octave}
              style={{
                left: `${(pos + octaveIndex * 7) * (100 / 14) + 4}%`,
              }}
            >
              {key}
            </div>
          ))
        )}
      </div>

      {/* Play and Other Buttons */}
      <div className="flex mt-2 gap-5">
        <button
          className="bg-[#110016] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#110016] hover:to-[#450159] transition duration-300 font-merriweather"
          onClick={playScale}
        >
          ▶ Play {selectedScale} {scaleType} Scale ({scaleDirection})
        </button>
        <button
          onClick={() => {
            setIsYourTurn(true);
            setCurrentNoteIndex(0);
            if (showNextExpected) {
              setNextExpectedNote(scaleNotes[0]);
            }
            const keys = document.querySelectorAll(".key8.activeorange");
            keys.forEach((key) => key.classList.remove("activeorange"));
          }}
          className={`bg-[#008c7a] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#00d2b4] hover:to-[#008c7a] transition duration-300 font-mali ${
            !isPlay ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isPlay}
        >
          ✋ Your Turn
        </button>

        {/* MIDI Device Selector */}
        <div className="midi-device-selector flex items-center gap-2">
          <label className="font-semibold text-xs">MIDI Device:</label>
          {midiDevices.length > 0 ? (
            <select
              onChange={(e) => handleMidiDeviceChange(e.target.value)}
              className="border-2 border-black p-2 rounded-md font-montserrat text-xs"
              value={midiInput?.id || ""}
            >
              {midiDevices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.manufacturer})
                </option>
              ))}
            </select>
          ) : (
            <p className="text-red-500 text-xs">
              No MIDI devices detected. Connect a device and refresh.
            </p>
          )}
        </div>
      </div>

      {/* Modal for Scale Notes */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold">🎼 Played Scale Notes</h2>
            <p className="text-xl mt-2">{scaleNotes.join(" ,  ")}</p>
            <p className="text-xl mt-2">
              {getTamilNotation(scaleNotes, selectedScale).join(", ")}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded mx-auto w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>
        {`
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

          .activeorange {
            background: linear-gradient(135deg, #00b4db 0%, #0083b0 100%) !important;
            border: 1px solid #333;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
          }

          .next-expected {
            background: linear-gradient(135deg, #8a2be2 0%, #4b0082 100%) !important;
            transform: scale(1.05);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
            z-index: 1;
          }

          .toggle-next-expected button {
            transition: background-color 0.3s ease;
          }

          .toggle-next-expected button:active {
            transform: scale(0.95);
          }

          /* Toggle Switch Container */
          .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
          }

          /* Hide the default checkbox */
          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          /* Slider (the toggle background) */
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

          /* Slider circle (the toggle button) */
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

          /* When the toggle is ON (checked) */
          input:checked + .slider {
            background-color: #8a2be2;
          }

          input:checked + .slider:before {
            transform: translateX(26px);
          }

          /* Rounded sliders */
          .slider.round {
            border-radius: 34px;
          }

          .slider.round:before {
            border-radius: 50%;
          }
        `}
      </style>
    </div>
  );
};

export default Piano;