import React, { useState, useEffect, useRef } from "react";
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";

const Musicsheet = () => {
  const [midiData, setMidiData] = useState(null);
  const [midiFile, setMidiFile] = useState(null);
  const [fileName2, setFileName2] = useState("");
  const pianoRef2 = useRef(null);
  const sheetRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [bpm, setBpm] = useState(120); // Default BPM
  const [customBpm, setCustomBpm] = useState(120); // Custom BPM for user input
  const [bars, setBars] = useState([]); // Array to hold bar positions

  useEffect(() => {
    if (midiFile) {
      const fetchMidi = async () => {
        try {
          const midi = new Midi(await midiFile.arrayBuffer());
          setMidiData(midi);
          setBpm(midi.header.tempos[0].bpm); // Set BPM from MIDI header
          setCustomBpm(midi.header.tempos[0].bpm); // Initialize custom BPM with MIDI BPM
        } catch (error) {
          console.error("Error loading MIDI file:", error);
        }
      };
      fetchMidi();
    }
  }, [midiFile]);

  useEffect(() => {
    if (midiData) {
      calculateBars();
    }
  }, [midiData]);

  const calculateBars = () => {
    const beatsPerBar = 4; // Assuming 4/4 time signature
    const secondsPerBeat = 60 / bpm;
    const totalBeats = midiData.duration / secondsPerBeat;
    const totalBars = Math.ceil(totalBeats / beatsPerBar);

    const barPositions = [];
    for (let i = 0; i < totalBars; i++) {
      const barTime = i * beatsPerBar * secondsPerBeat;
      barPositions.push(barTime);
    }

    setBars(barPositions);
  };

  const handleFileChange2 = (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".mid")) {
      alert("Please upload a valid .mid file.");
      return;
    }
    setFileName2(file.name);
    setMidiFile(file);
  };

  const handleTempoChange = (e) => {
    const newBpm = parseFloat(e.target.value);
    if (!isNaN(newBpm) && newBpm > 0) {
      setCustomBpm(newBpm);
      Tone.Transport.bpm.value = newBpm; // Update Transport BPM in real-time
    }
  };

  const playMidi = async () => {
    if (!midiData) return;

    try {
      await Tone.start();
      console.log("AudioContext started");

      const synth = new Tone.Synth().toDestination();
      Tone.Transport.stop(); // Stop any previous playback
      Tone.Transport.cancel(); // Clear previous schedules
      Tone.Transport.bpm.value = customBpm; // Set custom BPM

      let noteData = [];

      midiData.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          // Schedule note playback
          Tone.Transport.scheduleOnce((time) => {
            synth.triggerAttackRelease(note.name, note.duration, time);
            highlightKey(note.name); // Highlight key when note plays
          }, note.time);

          // Schedule key highlight removal
          Tone.Transport.scheduleOnce((time) => {
            removeHighlightKey(note.name); // Remove highlight when note ends
          }, note.time + note.duration);

          noteData.push({
            name: note.name,
            time: note.time,
            duration: note.duration,
            midi: note.midi,
          });
        });
      });

      setNotes(noteData);

      // Start the playback bar movement
      Tone.Transport.scheduleRepeat((time) => {
        const scalingFactor = (bpm / customBpm) * 240; // Adjust scaling based on custom BPM
        setPlaybackPosition(Tone.Transport.seconds * scalingFactor); // Move bar in sync
      }, 0.05);

      // Schedule a callback to reset playback and scrollbar when MIDI ends
      Tone.Transport.scheduleOnce(() => {
        resetPlayback();
      }, midiData.duration);

      Tone.Transport.start(); // Start Transport
    } catch (error) {
      console.error("Error starting Tone.js:", error);
    }
  };

  const resetPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setPlaybackPosition(0);
    if (sheetRef.current) {
      sheetRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const highlightKey = (noteName) => {
    const key = pianoRef2.current?.querySelector(
      `.key[data-note="${noteName}"]`
    );
    if (key) key.classList.add("active");
  };

  const removeHighlightKey = (noteName) => {
    const key = pianoRef2.current?.querySelector(
      `.key[data-note="${noteName}"]`
    );
    if (key) key.classList.remove("active");
  };

  // Automatically scroll the music sheet based on playback position
  useEffect(() => {
    if (sheetRef.current) {
      const scrollPosition = playbackPosition - sheetRef.current.clientWidth / 4;
      sheetRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [playbackPosition]);

  return (
    <div className="songplay-container bg-gray-900 text-white p-6">
      <h2 className="text-xl font-semibold">MIDI Song Player</h2>
      <div className="my-3">
        <input type="file" accept=".mid" onChange={handleFileChange2} />
        <p>{fileName2 || "No file selected"}</p>
      </div>

      {/* Tempo Adjustment */}
      <div className="my-3">
        <label htmlFor="tempo" className="mr-2">
          Tempo (BPM):
        </label>
        <input
          type="number"
          id="tempo"
          value={customBpm}
          onChange={handleTempoChange}
          min="1"
          step="1"
          className="text-black p-1 rounded"
        />
      </div>

      {/* Music Sheet with Notes */}
      <div
        ref={sheetRef}
        className="music-sheet overflow-auto border border-gray-500 relative"
      >
        {/* Music Lines (Staff) */}
        <div className="h-[0.5px] bg-black w-[800%] top-[59.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[53.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[47.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[41.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[35.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[29.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[23.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[17.5%] absolute"></div>

        {/* Playback Position Bar */}
        <div
          className="playback-bar"
          style={{
            position: "absolute",
            left: `${playbackPosition}px`,
            top: "0px",
            bottom: "0px",
            width: "3px",
            backgroundColor: "skyblue",
            zIndex: 2,
          }}
        ></div>

        {/* Dynamic Bars */}
        {bars.map((barTime, index) => (
          <div
            key={index}
            className="bar"
            style={{
              position: "absolute",
              left: `${barTime * 240}px`,
              top: "0px",
              bottom: "0px",
              width: "2px",
              backgroundColor: "black",
              zIndex: 1,
            }}
          ></div>
        ))}

        {/* Notes */}
        {notes.map((note, index) => {
          let noteClass = "thirty-second-note";
          if (note.duration >= 2) noteClass = "whole-note";
          else if (note.duration >= 1) noteClass = "half-note";
          else if (note.duration >= 0.5) noteClass = "quarter-note";
          else if (note.duration >= 0.25) noteClass = "eighth-note";
          else if (note.duration >= 0.125) noteClass = "sixteenth-note";

          let noteName = note.name.replace(/[0-9]/g, "");
          let octave = parseInt(note.name.match(/\d+/), 10) || 4;

          const notePositions = {
            C: 0,
            "C#": 0,
            D: 2,
            "D#": 2,
            E: 4,
            F: 6,
            "F#": 6,
            G: 8,
            "G#": 8,
            A: 10,
            "A#": 10,
            B: 12,
          };

          let baseMidi = octave * 14 + notePositions[noteName];

          return (
            <div key={index}>
              <div
                className={`note absolute ${noteClass} text-black font-bold font-montserrat px-2`}
                style={{
                  left: `${note.time * 240}px`,
                  top: `${(100 - baseMidi) * 1.5}%`,
                }}
              >
                {note.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Piano Keys */}
      <div className="piano" ref={pianoRef2}>
        {[...Array(4)].map((_, octave) =>
          ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
            (note, index) => {
              const noteName = note + (octave + 3);
              return (
                <div key={noteName} className="relative text-sm mx-auto">
                  {note.includes("#") ? (
                    <div
                      className="black-key key flex justify-center items-center"
                      data-note={noteName}
                    >
                      {noteName}
                    </div>
                  ) : (
                    <div
                      className="white-key key text-black flex justify-center items-end"
                      data-note={noteName}
                    >
                      {noteName}
                    </div>
                  )}
                </div>
              );
            }
          )
        )}
      </div>

      <button onClick={playMidi} className="play-button">
        Play MIDI
      </button>

      <style>
        {`
          .piano { display: flex; }
          .key { padding: 10px; margin: 2px; text-align: center; }
          .white-key { width: 40px; height: 140px; background: white; border: 1px solid black; }
          .black-key { width: 30px; height: 90px; background: black; color: white; position: absolute; margin-left: -15px; z-index: 1; }
          .active { background: #68C6FB !important; }
          .play-button { margin-top: 20px; padding: 10px 20px; background-color: #446fbf; color: white; border: none; border-radius: 5px; cursor: pointer; }
          .music-sheet { position: relative; height: 400px; width: 100%; background: white; overflow-x: auto; white-space: nowrap; }
          .note { position: absolute; height: 20px; font-size: 14px; border-radius: 5px; }
          .whole-note { background: red; padding: 0px 80px; }
          .half-note { background: orange; padding: 0px 40px; }
          .quarter-note { background: yellow; padding: 0px 20px; }
          .eighth-note { background: green; padding:0px 10px; }
          .sixteenth-note { background: skyblue; padding: 0px 5px; }
          .thirty-second-note { background: purple; padding: 0px 2.5px; }
        `}
      </style>
    </div>
  );
};

export default Musicsheet;