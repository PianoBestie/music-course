import React, { useState, useEffect, useRef } from "react";
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";

const SongPlay = () => {
  const [midiData, setMidiData] = useState(null);
  const [midiFile, setMidiFile] = useState(null);
  const [fileName2, setFileName2] = useState("");
  const pianoRef2 = useRef(null);
  const [bars, setBars] = useState([]);

  useEffect(() => {
    if (midiFile) {
      const fetchMidi = async () => {
        try {
          const midi = new Midi(await midiFile.arrayBuffer());
          setMidiData(midi);
        } catch (error) {
          console.error("Error loading MIDI file:", error);
        }
      };
      fetchMidi();
    }
  }, [midiFile]);

  const handleFileChange2 = (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    if (file) {
      setFileName2(file.name); // Update the state with the file name
    }

    if (!file.name.toLowerCase().endsWith(".mid")) {
      alert("Please upload a valid .mid file.");
      return;
    }

    setMidiFile(file);
  };

  const playMidi = async () => {
    try {
      await Tone.start();
      console.log("AudioContext started");

      if (midiData) {
        const synth = new Tone.Synth().toDestination();
        const bpm = midiData.header.tempos.length > 0 ? midiData.header.tempos[0].bpm : 120;
        console.log(`BPM: ${bpm}`);

        const timeSignatures = midiData.header.timeSignatures.length > 0 
          ? midiData.header.timeSignatures.map(ts => ({
              time: ts.ticks / midiData.header.ppq,
              numerator: ts.timeSignature[0],
              denominator: ts.timeSignature[1] || 4
            }))
          : [{ time: 0, numerator: 4, denominator: 4 }];

        console.log("Time Signatures:", timeSignatures);

        Tone.Transport.bpm.value = bpm;
        Tone.Transport.start();

        let barsArray = [];
        let currentBar = [];
        let lastBarTime = 0;
        let currentTSIndex = 0;
        let currentTimeSignature = timeSignatures[0].numerator;
        let beatDuration = 60 / bpm;
        let barDuration = beatDuration * currentTimeSignature;

        midiData.tracks.forEach((track) => {
          track.notes.forEach((note) => {
            const noteTime = note.time;

            // Check for time signature changes
            while (
              currentTSIndex < timeSignatures.length - 1 &&
              noteTime >= timeSignatures[currentTSIndex + 1].time
            ) {
              currentTSIndex++;
              currentTimeSignature = timeSignatures[currentTSIndex].numerator;
              barDuration = beatDuration * currentTimeSignature;
            }

            synth.triggerAttackRelease(note.name, note.duration, noteTime);
            scheduleKeyHighlight(note.name, noteTime, note.duration);

            // New Bar Check
            if (noteTime >= lastBarTime + barDuration) {
              if (currentBar.length > 0) {
                currentBar.push("|");  // Add bar separator
                barsArray.push(currentBar.join(" "));
              }
              currentBar = [];
              lastBarTime = Math.floor(noteTime / barDuration) * barDuration;
            }

            // Add note to the current bar
            currentBar.push(note.name);
          });
        });

        // Push the last bar if it has notes
        if (currentBar.length > 0) {
          currentBar.push("|");  // Add separator at the last bar
          barsArray.push(currentBar.join(" "));
        }

        setBars(barsArray);
      }
    } catch (error) {
      console.error("Error starting Tone.js:", error);
    }
  };

  const scheduleKeyHighlight = (note, noteTime, duration) => {
    // Schedule key highlight at the exact time the note is triggered
    Tone.Transport.scheduleOnce(() => {
      highlightKey(note); // Highlight key when note is played
    }, noteTime);

    // Schedule key to be unhighlighted after the note's duration (sustain time)
    Tone.Transport.scheduleOnce(() => {
      removeHighlightKey(note); // Remove highlight after the sustain time
    }, noteTime + duration);
  };

  const highlightKey = (noteName) => {
    const key = pianoRef2.current.querySelector(`.key[data-note="${noteName}"]`);
    if (key) {
      key.classList.add("active");
    }
  };

  const removeHighlightKey = (noteName) => {
    const key = pianoRef2.current.querySelector(`.key[data-note="${noteName}"]`);
    if (key) {
      key.classList.remove("active");
    }
  };

  return (
    <div className="songplay-container bg-gradient-to-tr from-[#6d306d] to-[#3B444E] text-white">
      <h2 className="text-xl font-semibold my-3">MIDI Song Player</h2>
      <div className="flex gap-5 items-center">
        <div className="my-3 flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-blue-500 transition duration-300">
          <input
            type="file"
            accept=".mid"
            onChange={handleFileChange2}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center justify-center gap-2 text-lg font-medium text-gray-700 cursor-pointer hover:text-blue-600"
          >
            <span className="text-2xl">📤</span>
            <span>Drag & Drop or Click to Select MIDI File</span>
          </label>
        </div>
        <div><h3 className="text-xl font-semibold my-2">{fileName2 ? fileName2 : 'MIDI file not uploaded yet'}</h3></div>
      </div>


      <div className="flex piano" ref={pianoRef2}>
        {[...Array(4)].map((_, octave) =>
          ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
            (note, index) => {
              const noteName = note + (octave + 3); // Adjusting for the octave range
              return (
                <div key={noteName} className="relative">
                  {/* White Key */}
                  {note.includes("#") ? (
                    <div
                      className="w-8 h-20 bg-slate-900 text-white border border-gray-700 shadow-lg z-10
                      flex items-center justify-center absolute top-0 left-1/2 -translate-x-1/2 rounded-md key"
                      data-note={noteName}
                    >
                      {noteName}
                    </div>
                  ) : (
                    <div
                      className="w-12 h-32 bg-white border border-gray-400 text-gray-800 shadow-md
                      flex items-end justify-center rounded-md key"
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
      <div className="flex piano" ref={pianoRef2}>
        {[...Array(4)].map((_, octave) =>
          ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
            (note, index) => {
              const noteName = note + (octave + 3); // Adjusting for the octave range
              return (
                <div key={noteName} className="relative">
                  {/* White Key */}
                  {note.includes("#") ? (
                    <div
                      className="w-8 h-20 bg-slate-900 text-white border border-gray-700 shadow-lg z-10
                      flex items-center justify-center absolute top-0 left-1/2 -translate-x-1/2 rounded-md key"
                      data-note={noteName}
                    >
                      {noteName}
                    </div>
                  ) : (
                    <div
                      className="w-12 h-32 bg-white border border-gray-400 text-gray-800 shadow-md
                      flex items-end justify-center rounded-md key"
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

      <div className="w-full max-w-3xl mt-6 p-4 bg-gray-900 text-white rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-3 text-center text-gray-300">
          Song Bars
        </h3>
        <div className="flex flex-wrap gap-2">
          {bars.map((bar, index) => (
            <div
              key={index}
              className="shadow-md text-sm font-mono tracking-wide"
            >
              {bar}
            </div>
          ))}
        </div>
      </div>

      <style>
        {`
          .songplay-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
          }
          .piano {
            display: flex;
            position: relative;
          }

          .key.active {
            background-color: #68C6FB;
          }

          .play-button {
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #446fbf;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          }

          .play-button:hover {
            background-color: #355b99;
          }

          .music-sheet-lines {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
          }

          .music-sheet-line {
            width: 80%;
            background-color: white;
            height: 2px;
            margin-bottom: 5px;
          }
        `}
      </style>
    </div>
  );
};

export default SongPlay;
