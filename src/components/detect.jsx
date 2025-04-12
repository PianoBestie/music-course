import React, { useState, useEffect, useRef } from "react";
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";

const Musicsheet = () => {
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
    if (!file.name.toLowerCase().endsWith(".mid")) {
      alert("Please upload a valid .mid file.");
      return;
    }
    setFileName2(file.name);
    setMidiFile(file);
  };

  const playMidi = async () => {
    try {
      await Tone.start();
      console.log("AudioContext started");

      if (midiData) {
        const synth = new Tone.Synth().toDestination();
        const bpm = midiData.header.tempos.length > 0 ? midiData.header.tempos[0].bpm : 120;
        Tone.Transport.bpm.value = bpm;
        Tone.Transport.start();

        const timeSignatures = midiData.header.timeSignatures.length > 0 
          ? midiData.header.timeSignatures.map(ts => ({
              time: ts.ticks / midiData.header.ppq,
              numerator: ts.timeSignature[0],
              denominator: ts.timeSignature[1] || 4
            }))
          : [{ time: 0, numerator: 4, denominator: 4 }];

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

            if (noteTime >= lastBarTime + barDuration) {
              if (currentBar.length > 0) {
                currentBar.push("");
                barsArray.push(currentBar.join(" "));
              }
              currentBar = [];
              lastBarTime = Math.floor(noteTime / barDuration) * barDuration;
            }

            let noteLengthClass = getNoteLengthClass(note.duration, beatDuration);
            currentBar.push(`<span class="${noteLengthClass}">${note.name}</span>`);
          });
        });

        if (currentBar.length > 0) {
          currentBar.push("");
          barsArray.push(currentBar.join(" "));
        }

        setBars(barsArray);
      }
    } catch (error) {
      console.error("Error starting Tone.js:", error);
    }
  };

  const scheduleKeyHighlight = (note, noteTime, duration) => {
    Tone.Transport.scheduleOnce(() => {
      highlightKey(note);
    }, noteTime);
    Tone.Transport.scheduleOnce(() => {
      removeHighlightKey(note);
    }, noteTime + duration);
  };

  const highlightKey = (noteName) => {
    const key = pianoRef2.current?.querySelector(`.key[data-note="${noteName}"]`);
    if (key) key.classList.add("active");
  };

  const removeHighlightKey = (noteName) => {
    const key = pianoRef2.current?.querySelector(`.key[data-note="${noteName}"]`);
    if (key) key.classList.remove("active");
  };
  const getNoteLengthClass = (duration, beatDuration) => {
    const epsilon = 0.05 * beatDuration; // Small tolerance
  
    if (Math.abs(duration - 4 * beatDuration) < epsilon) return "whole-note";
    if (Math.abs(duration - 2 * beatDuration) < epsilon) return "half-note";
    if (Math.abs(duration - beatDuration) < epsilon) return "quarter-note";
    if (Math.abs(duration - beatDuration / 2) < epsilon) return "eighth-note";
    if (Math.abs(duration - beatDuration / 4) < epsilon) return "sixteenth-note";
    return "thirty-second-note";
  };
  
  return (
    <div className="songplay-container bg-gray-900 text-white p-6">
      <h2 className="text-xl font-semibold">MIDI Song Player</h2>
      <div className="my-3">
        <input type="file" accept=".mid" onChange={handleFileChange2} />
        <p>{fileName2 || "No file selected"}</p>
      </div>

      <div className="bars-container">
        <h3 className="text-lg font-semibold mb-3">Song Bars</h3>
        <div className="bars flex ">
          {bars.map((bar, index) => (
            <div key={index} className="bar px-3 border-r-4 text-black font-bold font-montserrat" dangerouslySetInnerHTML={{ __html: bar }} />
          ))}
        </div>
      </div>
      <div className="piano" ref={pianoRef2}>
        {[...Array(4)].map((_, octave) =>
          ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
            (note, index) => {
              const noteName = note + (octave + 3);
              return (
                <div key={noteName} className="relative">
                  {note.includes("#") ? (
                    <div className="black-key key flex items-center justify-center" data-note={noteName}>{noteName}</div>
                  ) : (
                    <div className="white-key key text-black flex items-end" data-note={noteName}>{noteName}</div>
                  )}
                </div>
              );
            }
          )
        )}
      </div>

      <button onClick={playMidi} className="play-button">Play MIDI</button>


      <style>
        {`
          .piano { display: flex; }
          .key { padding: 10px; margin: 2px; text-align: center; }
          .white-key { width: 40px; height: 120px; background: white; border: 1px solid black; }
          .black-key { width: 30px; height: 80px; background: black; color: white; position: absolute; margin-left: -15px; z-index: 1; }
          .active { background: #68C6FB !important; }
          .play-button { margin-top: 20px; padding: 10px 20px; background-color: #446fbf; color: white; border: none; border-radius: 5px; cursor: pointer; }
          .bars-container { margin-top: 20px; padding: 10px; background: gray; }
          .whole-note { background: red; padding:0 80px; }
          .half-note { background: orange; padding:0 40px; }
          .quarter-note { background: yellow; padding:0 20px; }
          .eighth-note { background: lightgreen; padding:0 10px; }
          .sixteenth-note { background: blue; padding:0 5px; }
.thirty-second-note { background: purple; padding:0 2.5px; }
        `}
      </style>
    </div>
  );
};

export default Musicsheet;
