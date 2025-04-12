import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { Chord } from "@tonaljs/tonal";
import Essentia from "essentia.js";

const AudioChordDetector = () => {
  const [audioFile, setAudioFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [chords, setChords] = useState([]);
  const [bpm, setBpm] = useState(120);
  const [bars, setBars] = useState([]);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const audioRef = useRef(null);
  const [essentia, setEssentia] = useState(null);

  useEffect(() => {
    const initEssentia = async () => {
      try {
        const essentiaInstance = new Essentia();
        console.log("Essentia Initialized:", essentiaInstance);
        setEssentia(essentiaInstance);
      } catch (error) {
        console.error("Error initializing Essentia:", error);
      }
    };
    initEssentia();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".mp3") && !file.name.toLowerCase().endsWith(".wav")) {
      alert("Please upload a valid .mp3 or .wav file.");
      return;
    }
    setFileName(file.name);
    setAudioFile(file);
  };

  const detectChords = async () => {
    if (!audioFile || !essentia) return;
  
    const audioContext = new AudioContext();
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log("Audio Buffer:", audioBuffer); // Debugging
  
    const audioData = audioBuffer.getChannelData(0);
    const frameSize = 4096;
    const hopSize = 2048;
    const sampleRate = audioBuffer.sampleRate;
  
    const detectedChords = [];
    for (let i = 0; i < audioData.length; i += hopSize) {
      const frame = audioData.slice(i, i + frameSize);
      const pitch = essentia.PitchYin(frame); // Using PitchYin is more reliable
      console.log("Detected Pitch:", pitch.frequency); 
      
  
      if (pitch && pitch.frequency > 0) { 
        const note = essentia.FrequencyToNote(pitch.frequency); 
        console.log("Detected Note:", note);
        if (note && note.note) { 
            const chord = Chord.detect([note.note]);
            console.log("Chord:", chord);
            if (chord.length > 0) {
                detectedChords.push({ time: i / sampleRate, chord: chord[0] });
            }
        }
    }
    
    }
  
    console.log("Detected Chords:", detectedChords); // Debugging
    setChords(detectedChords);
  };

  const calculateBars = () => {
    const beatsPerBar = 4;
    const secondsPerBeat = 60 / bpm;
    const totalBeats = 8;
    const totalBars = Math.ceil(totalBeats / beatsPerBar);

    const barPositions = [];
    for (let i = 0; i < totalBars; i++) {
      const barTime = i * beatsPerBar * secondsPerBeat;
      barPositions.push(barTime);
    }

    setBars(barPositions);
  };

  const playAudio = async () => {
    if (!audioFile) return;

    await Tone.start();

    const fileURL = URL.createObjectURL(audioFile);

    const player = new Tone.Player(fileURL, () => {
      player.start();
    }).toDestination();

    Tone.Transport.scheduleRepeat(() => {
      const position = Tone.Transport.seconds * 100;
      setPlaybackPosition(position);
    }, 0.05);
  };

  useEffect(() => {
    console.log("Chords:", chords);
  }, [chords]);

  return (
    <div className="audio-chord-detector bg-gray-900 text-white p-6">
      <h2 className="text-xl font-semibold">Audio Chord Detector</h2>
      <div className="my-3">
        <input type="file" accept=".mp3,.wav" onChange={handleFileChange} />
        <p>{fileName || "No file selected"}</p>
      </div>

      <div className="music-sheet overflow-auto border border-gray-500 relative h-40">
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

        {bars.map((barTime, index) => (
          <div
            key={index}
            className="bar"
            style={{
              position: "absolute",
              left: `${barTime * 100}px`,
              top: "0px",
              bottom: "0px",
              width: "2px",
              backgroundColor: "rgba(255, 255, 255, 0.3)",
              zIndex: 1,
            }}
          ></div>
        ))}

        {chords.map((chord, index) => (
          <div
            key={index}
            className="chord absolute bg-[#110016] text-white p-1 rounded"
            style={{
              left: `${chord.time * 100}px`,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            {chord.chord}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={detectChords}
          className="bg-[#110016] text-white py-2 px-4 rounded-lg hover:bg-blue-400 transition duration-200"
        >
          Detect Chords
        </button>
        <button
          onClick={playAudio}
          className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-400 transition duration-200 ml-2"
        >
          Play Audio
        </button>
      </div>
    </div>
  );
};

export default AudioChordDetector;