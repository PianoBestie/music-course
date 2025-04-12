import React, { useState, useEffect, useRef } from "react";
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";

const Musicsheet = () => {
  const [midiData, setMidiData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [bpm, setBpm] = useState(120); // Default BPM
  const [customBpm, setCustomBpm] = useState(120); // Custom BPM for user input
  const [bars, setBars] = useState([]); // Array to hold bar positions
  const [isYourTurn, setIsYourTurn] = useState(false); // State for "Your Turn" mode
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0); // Track the current note index
  const sheetRef = useRef(null);
  const pianoRef2 = useRef(null); // Ref for the piano UI
  const synth = useRef(new Tone.Synth().toDestination()); // Synth for playing notes

  // Function to highlight a piano key
  const highlightKey = (noteName, isCorrect = true, duration = 0.5) => {
    const key = pianoRef2.current?.querySelector(`.key[data-note="${noteName}"]`);
    if (key) {
      key.classList.add(isCorrect ? "active" : "incorrect");
      setTimeout(() => key.classList.remove("active", "incorrect"), duration * 1000); // Remove highlight after note duration
    }
  };

  // Function to remove highlight from a piano key
  const removeHighlightKey = (noteName) => {
    const key = pianoRef2.current?.querySelector(`.key[data-note="${noteName}"]`);
    if (key) key.classList.remove("active", "incorrect");
  };

  useEffect(() => {
    if (midiData) {
      calculateBars();
    }
  }, [midiData, bpm]);

  // Load the embedded MIDI file when the component mounts
  useEffect(() => {
    const loadEmbeddedMidi = async () => {
      try {
        const response = await fetch("./saree.mid"); // Path to the embedded MIDI file
        if (!response.ok) {
          throw new Error("Failed to load embedded MIDI file");
        }
        const arrayBuffer = await response.arrayBuffer();
        const midi = new Midi(arrayBuffer);
        setMidiData(midi);
        setBpm(midi.header.tempos[0].bpm); // Set BPM from MIDI header
        setCustomBpm(midi.header.tempos[0].bpm); // Initialize custom BPM with MIDI BPM
      } catch (error) {
        console.error("Error loading embedded MIDI file:", error);
      }
    };

    loadEmbeddedMidi();
  }, []);

  const calculateBars = () => {
    if (!midiData) return;

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

  const handleTempoChange = (e) => {
    const newBpm = parseFloat(e.target.value);
    if (!isNaN(newBpm) && newBpm > 0) {
      setCustomBpm(newBpm);
      Tone.Transport.bpm.value = newBpm; // Update Transport BPM in real-time
      setBpm(newBpm); // Update BPM state to trigger bar recalculation
    }
  };

  const playMidi = async () => {
    if (!midiData) return;

    try {
      await Tone.start();
      console.log("AudioContext started");

      Tone.Transport.stop(); // Stop any previous playback
      Tone.Transport.cancel(); // Clear previous schedules
      Tone.Transport.bpm.value = customBpm; // Set custom BPM

      let noteData = [];

      midiData.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          // Schedule note playback
          Tone.Transport.scheduleOnce((time) => {
            synth.current.triggerAttackRelease(note.name, note.duration, time);
            highlightKey(note.name, true, note.duration); // Highlight the piano key with dynamic duration
          }, note.time);

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
        setPlaybackPosition(Tone.Transport.seconds * 240); // Move bar in sync
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

  // Handle piano key click in "Your Turn" mode
  const handlePianoKeyClick = async (noteName) => {
    if (!isYourTurn || !midiData) return;

    const currentNote = notes[currentNoteIndex];
    if (currentNote && currentNote.name === noteName) {
      // Play the note sound
      await Tone.start();
      synth.current.triggerAttackRelease(noteName, currentNote.duration);

      // Highlight the key and move the playback bar
      highlightKey(noteName, true, currentNote.duration); // Highlight with dynamic duration
      setPlaybackPosition(currentNote.time * 240); // Move playback bar
      setCurrentNoteIndex((prev) => prev + 1); // Move to the next note

      // Check if all notes are completed
      if (currentNoteIndex + 1 === notes.length) {
        alert("Finished! Great job!"); // Show finished alert
        setIsYourTurn(false); // Reset "Your Turn" mode
        setCurrentNoteIndex(0); // Reset note index
      }
    } else {
      // Play the note sound for incorrect key press
      await Tone.start();
      synth.current.triggerAttackRelease(noteName, 0.5); // Play for 0.5 seconds

      // Highlight the key in red for incorrect note
      highlightKey(noteName, false, 0.5); // Highlight for 0.5 seconds
    }
  };

  return (
    <div className="songplay-container bg-gray-900 text-white p-6">
      <h2 className="text-xl font-semibold">MIDI Song Player</h2>

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

      {/* Play and Your Turn Buttons */}
      <div className="flex gap-3">
        <button onClick={playMidi} className="play-button">
          Play MIDI
        </button>
        <button
          onClick={() => {
            setIsYourTurn(true);
            setCurrentNoteIndex(0); // Reset note index for "Your Turn" mode
          }}
          className="play-button bg-green-500"
        >
          Your Turn
        </button>
      </div>

      {/* Music Sheet with Notes */}
      <div
        ref={sheetRef}
        className="music-sheet overflow-auto border border-gray-500 relative"
      >
        {/* Music Lines (Staff) */}
        <div className="h-[0.5px] bg-black w-[800%] top-[87.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[75.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[63.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[51.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[39.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[27.5%] absolute"></div>
        <div className="h-[0.5px] bg-black w-[800%] top-[15.5%] absolute"></div>

        {/* Playback Position Bar */}
        <div
          className="playback-bar"
          style={{
            position: "absolute",
            left: `${playbackPosition}px`,
            top: "0px",
            bottom: "0px",
            width: "3px",
            backgroundColor: "red",
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
          if (note.duration >= 2) noteClass = "𝅝";
          else if (note.duration >= 1) noteClass = "𝅗𝅥";
          else if (note.duration >= 0.5) noteClass = "♩";
          else if (note.duration >= 0.25) noteClass = "♪";
          else if (note.duration >= 0.125) noteClass = "𝅘𝅥𝅯";

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
                className={`note absolute text-black font-bold font-montserrat px-2`}
                style={{
                  left: `${note.time * 240}px`,
                  top: `${(78.2 - baseMidi) * 3}%`,
                }}
              >
                {noteClass}
              </div>
            </div>
          );
        })}

        {/* Piano UI (C5 to C7) */}
        <div
          className="piano absolute position-fixed bottom-0 left-0 w-full opacity-50"
          ref={pianoRef2}
        >
          {[5, 6].map((octave) =>
            ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
              (note, index) => {
                const noteName = note + octave; // C5 to C7
                return (
                  <div
                    key={noteName}
                    className="relative text-sm mx-auto"
                    onClick={() => handlePianoKeyClick(noteName)}
                  >
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
      </div>

      <style>
        {`
          .piano { display: flex; position: fixed; top: 50%; }
          .key { padding: 10px; margin: 2px; text-align: center; cursor: pointer; }
          .white-key { width: 85px; height: 140px; background: white; border: 1px solid black; }
          .black-key { width: 50px; height: 90px; background: black; color: white; position: absolute; margin-left: -15px; z-index: 1; }
          .active { background: #68C6FB !important; }
          .incorrect { background: red !important; }
          .play-button { margin-top: 20px; padding: 10px 20px; background-color: #446fbf; color: white; border: none; border-radius: 5px; cursor: pointer; }
          .music-sheet { position: relative; height: 400px; width: 100%; background: white; overflow-x: auto; white-space: nowrap; }
          .note { position: absolute; height: 20px; font-size: 14px; border-radius: 5px; }
          .whole-note { background: red; padding: 0px 80px; }
          .half-note { background: orange; padding: 0px 40px; }
          .quarter-note { background: yellow; padding: 0px 20px; }
          .eighth-note { background: green; padding:0px 10px; }
          .sixteenth-note { background: skyblue; padding: 0px 5px; }
          .thirty-second-note { background: purple; padding: 0px 2.5px; }

          @media (min-width: 769px) and (max-width: 1024px) {
            .note {
              font-size: 6em;
            }
              .music-sheet{
              height:250px
              }
          }

          @media (min-width: 1025px) {
            .note {
              font-size: 12em;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Musicsheet;