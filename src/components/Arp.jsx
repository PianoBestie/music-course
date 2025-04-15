import React, { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";

const Arp = () => {
  // Audio context and nodes
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscillatorsRef = useRef({});
  // Metronome state
  const metronomeRef = useRef(null);
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatCount, setBeatCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
  // State
  const [activeKey, setActiveKey] = useState(null);
  const [selectedScale, setSelectedScale] = useState("C");
  const [scaleType, setScaleType] = useState("arp1");
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [nextExpectedNote, setNextExpectedNote] = useState(null);
  const [showNextExpected, setShowNextExpected] = useState(true);
  const [scaleNotes, setScaleNotes] = useState([]);
  const [forceRender, setForceRender] = useState(false);
    const [isPlay, setIsPlay] = useState(false);
  // MIDI state
  const [midiInput, setMidiInput] = useState(null);
  const [midiDevices, setMidiDevices] = useState([]);

  // Piano keys
  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.5;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  // Helper function to generate arpeggio patterns
  const generatePatternArp = (notes, pattern) => {
    return pattern.map(step => notes[step - 1]);
  };

  // Scales and patterns
  const scales = {
    arp1: {
      C: generatePatternArp(["C4", "G4", "C5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  "C#": generatePatternArp(["C#4", "G#4", "C#5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  D: generatePatternArp(["D4", "A4", "D5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  "D#": generatePatternArp(["D#4", "A#4", "D#5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  E: generatePatternArp(["E4", "B4", "E5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  F: generatePatternArp(["F4", "C5", "F5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  "F#": generatePatternArp(["F#4", "C#5", "F#5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  G: generatePatternArp(["G4", "D5", "G5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  "G#": generatePatternArp(["G#4", "D#5", "G#5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  A: generatePatternArp(["A4", "E5", "A5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  "A#": generatePatternArp(["A#4", "F5", "A#5"], [1, 2, 3, 2, 1, 2, 3, 2]),
  B: generatePatternArp(["B4", "F#5", "B5"], [1, 2, 3, 2, 1, 2, 3, 2]),
    },
    arp2: {
      C: generatePatternArp(["C4", "G4", "C5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      D: generatePatternArp(["D4", "A4", "D5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      E: generatePatternArp(["E4", "B4", "E5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      F: generatePatternArp(["F4", "C5", "F5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      G: generatePatternArp(["G4", "D5", "G5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      A: generatePatternArp(["A4", "E5", "A5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      "A#": generatePatternArp(["A#4", "F5", "A#5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
      B: generatePatternArp(["B4", "F#5", "B5"], [1, 2, 3, 2, 3, 2, 3, 2, 1, 2, 3, 2, 3, 2, 3, 2]),
    },
    arp3: {
      C: generatePatternArp(["C4", "G4", "C5", "D5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "D#5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      D: generatePatternArp(["D4", "A4", "D5", "E5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "F5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      E: generatePatternArp(["E4", "B4", "E5", "F#5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      F: generatePatternArp(["F4", "C5", "F5", "G5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "G#5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      G: generatePatternArp(["G4", "D5", "G5", "A5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "A#5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      A: generatePatternArp(["A4", "E5", "A5", "B5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "C6"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      B: generatePatternArp(["B4", "F#5", "B5", "C#6"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
    },
    arp4: {
      C: generatePatternArp(["C4", "G4", "C5", "E5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "F5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      D: generatePatternArp(["D4", "A4", "D5", "F#5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "G5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      E: generatePatternArp(["E4", "B4", "E5", "G#5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      F: generatePatternArp(["F4", "C5", "F5", "A5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "A#5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      G: generatePatternArp(["G4", "D5", "G5", "B5"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "C6"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      A: generatePatternArp(["A4", "E5", "A5", "C#6"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "D6"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
      B: generatePatternArp(["B4", "F#5", "B5", "D#6"], [1, 2, 3, 2, 4, 2, 3, 2, 1, 2, 3, 2, 4, 2, 3, 2]),
    },
    arp5: {
      C: generatePatternArp(["C4", "G4", "C5", "D5", "E5"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "D#5", "F5"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      D: generatePatternArp(["D4", "A4", "D5", "E5", "F#5"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "F5", "G5"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      E: generatePatternArp(["E4", "B4", "E5", "F#5", "G#5"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      F: generatePatternArp(["F4", "C5", "F5", "G5", "A5"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "G#5", "A#5"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      G: generatePatternArp(["G4", "D5", "G5", "A5", "B5"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "A#5", "C6"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      A: generatePatternArp(["A4", "E5", "A5", "B5", "C#6"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "C6", "D6"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
      B: generatePatternArp(["B4", "F#5", "B5", "C#6", "D#6"], [1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, 2]),
    },
    arp6: {
      C: generatePatternArp(["C4", "G4", "C5", "E5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "F5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      D: generatePatternArp(["D4", "A4", "D5", "F#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "G5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      E: generatePatternArp(["E4", "B4", "E5", "G#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      F: generatePatternArp(["F4", "C5", "F5", "A5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "A#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      G: generatePatternArp(["G4", "D5", "G5", "B5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "C6"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      A: generatePatternArp(["A4", "E5", "A5", "C#6"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "D6"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      B: generatePatternArp(["B4", "F#5", "B5", "D#6"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
    },
    arp7: {
      C: generatePatternArp(["C4", "G4", "C5", "E5", "G5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "F5", "G#5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      D: generatePatternArp(["D4", "A4", "D5", "F#5", "A5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "G5", "A#5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      E: generatePatternArp(["E4", "B4", "E5", "G#5", "B5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      F: generatePatternArp(["F4", "C5", "F5", "A5", "C6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "A#5", "C#6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      G: generatePatternArp(["G4", "D5", "G5", "B5", "D6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "C6", "D#6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      A: generatePatternArp(["A4", "E5", "A5", "C#6", "E6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "D6", "F6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      B: generatePatternArp(["B4", "F#5", "B5", "D#6", "F#6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
    },
    arp16: {
      C: generatePatternArp(["C4", "E4", "G4", "C5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      F: generatePatternArp(["F4", "A4", "C5", "F5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      G: generatePatternArp(["G4", "B4", "D5", "G5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5"], [1, 4, 3, 2, 1, 4, 3, 2]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5"], [1, 4, 3, 2, 1, 4, 3, 2]),
    },
    arp17: {
      C: generatePatternArp(["C4", "E4", "G4", "C5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      F: generatePatternArp(["F4", "A4", "C5", "F5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      G: generatePatternArp(["G4", "B4", "D5", "G5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
    },
    arp18: {
      C: generatePatternArp(["C4", "E4", "G4", "C5", "E5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5", "F5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5", "F#5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5", "G5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5", "G#5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      F: generatePatternArp(["F4", "A4", "C5", "F5", "A5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5", "A#5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      G: generatePatternArp(["G4", "B4", "D5", "G5", "B5"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5", "C6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5", "C#6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5", "D6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5", "D#6"], [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2]),
    },
    arp19: {
      C: generatePatternArp(["C4", "E4", "G4", "C5", "E5", "G5"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5", "F5", "G#5"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5", "F#5", "A5"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5", "G5", "A#5"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5", "G#5", "B5"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      F: generatePatternArp(["F4", "A4", "C5", "F5", "A5", "C6"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5", "A#5", "C#6"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      G: generatePatternArp(["G4", "B4", "D5", "G5", "B5", "D6"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5", "C6", "D#6"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5", "C#6", "E6"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5", "D6", "F6"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5", "D#6", "F6"], [1, 2, 3, 4, 5, 6, 5, 4, 1, 2, 3, 4, 5, 6, 5, 4]),
    },
    arp20: {
      C: generatePatternArp(["C4", "E4", "G4", "C5", "E5", "G5", "C6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5", "F5", "G#5", "C#6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5", "F#5", "A5", "D6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5", "G5", "A#5", "D#6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5", "G#5", "B5", "E6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      F: generatePatternArp(["F4", "A4", "C5", "F5", "A5", "C6", "F6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5", "A#5", "C#6", "F#6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      G: generatePatternArp(["G4", "B4", "D5", "G5", "B5", "D6", "G6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5", "C6", "D#6", "G 6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5", "C#6", "E6", "A6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5", "D6", "F6", "A 6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5", "D#6", "F6", "B6"], [1, 2, 3, 4, 5, 6, 7, 6, 1, 2, 3, 4, 5, 6, 7, 6]),
    },
    arp21: {
      C: generatePatternArp(["C4", "E4", "G4"], [1, 2, 3, 1, 2, 3]),
      "C#": generatePatternArp(["C#4", "F4", "G#4"], [1, 2, 3, 1, 2, 3]),
      D: generatePatternArp(["D4", "F#4", "A4"], [1, 2, 3, 1, 2, 3]),
      "D#": generatePatternArp(["D#4", "G4", "A#4"], [1, 2, 3, 1, 2, 3]),
      E: generatePatternArp(["E4", "G#4", "B4"], [1, 2, 3, 1, 2, 3]),
      F: generatePatternArp(["F4", "A4", "C5"], [1, 2, 3, 1, 2, 3]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5"], [1, 2, 3, 1, 2, 3]),
      G: generatePatternArp(["G4", "B4", "D5"], [1, 2, 3, 1, 2, 3]),
      "G#": generatePatternArp(["G#4", "C5", "D#5"], [1, 2, 3, 1, 2, 3]),
      A: generatePatternArp(["A4", "C#5", "E5"], [1, 2, 3, 1, 2, 3]),
      "A#": generatePatternArp(["A#4", "D5", "F5"], [1, 2, 3, 1, 2, 3]),
      B: generatePatternArp(["B4", "D#5", "F#5"], [1, 2, 3, 1, 2, 3]),
    },
    arp22: {
      C: generatePatternArp(["C4", "E4", "G4"], [1, 3, 2, 3, 1, 3, 2, 3]),
      "C#": generatePatternArp(["C#4", "F4", "G#4"], [1, 3, 2, 3, 1, 3, 2, 3]),
      D: generatePatternArp(["D4", "F#4", "A4"], [1, 3, 2, 3, 1, 3, 2, 3]),
      "D#": generatePatternArp(["D#4", "G4", "A#4"], [1, 3, 2, 3, 1, 3, 2, 3]),
      E: generatePatternArp(["E4", "G#4", "B4"], [1, 3, 2, 3, 1, 3, 2, 3]),
      F: generatePatternArp(["F4", "A4", "C5"], [1, 3, 2, 3, 1, 3, 2, 3]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5"], [1, 3, 2, 3, 1, 3, 2, 3]),
      G: generatePatternArp(["G4", "B4", "D5"], [1, 3, 2, 3, 1, 3, 2, 3]),
      "G#": generatePatternArp(["G#4", "C5", "D#5"], [1, 3, 2, 3, 1, 3, 2, 3]),
      A: generatePatternArp(["A4", "C#5", "E5"], [1, 3, 2, 3, 1, 3, 2, 3]),
      "A#": generatePatternArp(["A#4", "D5", "F5"], [1, 3, 2, 3, 1, 3, 2, 3]),
      B: generatePatternArp(["B4", "D#5", "F#5"], [1, 3, 2, 3, 1, 3, 2, 3]),
    },
    arp23: {
      C: generatePatternArp(["C4", "E4", "G4"], [1, 2, 3, 2, 1, 2, 3, 2]),
      "C#": generatePatternArp(["C#4", "F4", "G#4"], [1, 2, 3, 2, 1, 2, 3, 2]),
      D: generatePatternArp(["D4", "F#4", "A4"], [1, 2, 3, 2, 1, 2, 3, 2]),
      "D#": generatePatternArp(["D#4", "G4", "A#4"], [1, 2, 3, 2, 1, 2, 3, 2]),
      E: generatePatternArp(["E4", "G#4", "B4"], [1, 2, 3, 2, 1, 2, 3, 2]),
      F: generatePatternArp(["F4", "A4", "C5"], [1, 2, 3, 2, 1, 2, 3, 2]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5"], [1, 2, 3, 2, 1, 2, 3, 2]),
      G: generatePatternArp(["G4", "B4", "D5"], [1, 2, 3, 2, 1, 2, 3, 2]),
      "G#": generatePatternArp(["G#4", "C5", "D#5"], [1, 2, 3, 2, 1, 2, 3, 2]),
      A: generatePatternArp(["A4", "C#5", "E5"], [1, 2, 3, 2, 1, 2, 3, 2]),
      "A#": generatePatternArp(["A#4", "D5", "F5"], [1, 2, 3, 2, 1, 2, 3, 2]),
      B: generatePatternArp(["B4", "D#5", "F#5"], [1, 2, 3, 2, 1, 2, 3, 2]),
    },
    arp25: {
      C: generatePatternArp(["C4", "E4", "G4", "C5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      F: generatePatternArp(["F4", "A4", "C5", "F5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      G: generatePatternArp(["G4", "B4", "D5", "G5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5"], [1, 2, 3, 2, 4, 2, 1, 2, 3, 2, 4, 2]),
    },
    arp26: {
      C: generatePatternArp(["C4", "E4", "G4", "C5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      F: generatePatternArp(["F4", "A4", "C5", "F5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      G: generatePatternArp(["G4", "B4", "D5", "G5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5"], [1, 2, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4]),
    },
    arp27: {
      C: generatePatternArp(["C4", "E4", "G4", "C5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      F: generatePatternArp(["F4", "A4", "C5", "F5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      G: generatePatternArp(["G4", "B4", "D5", "G5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5"], [1, 4, 3, 4, 2, 3, 1, 4, 3, 4, 2, 3]),
    },
    arp28: {
      C: generatePatternArp(["C4", "E4", "G4", "C5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      F: generatePatternArp(["F4", "A4", "C5", "F5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      G: generatePatternArp(["G4", "B4", "D5", "G5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5"], [1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2]),
    },
    arp30: {
      C: generatePatternArp(
        ["C5", "D5", "E5", "F5", "G5", "A5", "B4"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      "C#": generatePatternArp(
        ["C#5", "D#5", "F5", "F#5", "G#5", "A#5", "C6"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      D: generatePatternArp(
        ["D5", "E5", "F#5", "G5", "A5", "B5", "C#6"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      "D#": generatePatternArp(
        ["D#5", "F5", "G5", "G#5", "A#5", "C6", "D6"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      E: generatePatternArp(
        ["E5", "F#5", "G#5", "A5", "B5", "C#6", "D#6"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      F: generatePatternArp(
        // F major: F, G, A, Bb, C, D, E
        ["F5", "G5", "A5", "Bb5", "C6", "D6", "E5"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      G: generatePatternArp(
        // G major: G, A, B, C, D, E, F#
        ["G5", "A5", "B5", "C6", "D6", "E6", "F#5"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      "F#": generatePatternArp(
        ["F#5", "G#5", "A#5", "B5", "C#6", "D#6", "F6"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      "G#": generatePatternArp(
        ["G#5", "A#5", "C6", "C#6", "D#6", "F6", "G6"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      "A#": generatePatternArp(
        ["A#5", "C6", "D6", "D#6", "F6", "G6", "A6"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]
      ),
    
      B: generatePatternArp(
        ["B5", "C#6", "D#6", "E6", "F#6", "G#6", "A#6"],
        [1, 3, 5, 3, 1, 3, 5, 3,
         7, 2, 5, 2, 7, 2, 5, 2,
         1, 3, 6, 3, 1, 3, 6, 3,
         1, 4, 6, 4, 1, 4, 6, 4]),
    },
    arp8: {
      C: generatePatternArp(["C4", "G4", "C5"], [1, 2, 3, 1, 2, 3]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5"], [1, 2, 3, 1, 2, 3]),
      D: generatePatternArp(["D4", "A4", "D5"], [1, 2, 3, 1, 2, 3]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5"], [1, 2, 3, 1, 2, 3]),
      E: generatePatternArp(["E4", "B4", "E5"], [1, 2, 3, 1, 2, 3]),
      F: generatePatternArp(["F4", "C5", "F5"], [1, 2, 3, 1, 2, 3]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5"], [1, 2, 3, 1, 2, 3]),
      G: generatePatternArp(["G4", "D5", "G5"], [1, 2, 3, 1, 2, 3]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5"], [1, 2, 3, 1, 2, 3]),
      A: generatePatternArp(["A4", "E5", "A5"], [1, 2, 3, 1, 2, 3]),
      "A#": generatePatternArp(["A#4", "F5", "A#5"], [1, 2, 3, 1, 2, 3]),
      B: generatePatternArp(["B4", "F#5", "B5"], [1, 2, 3, 1, 2, 3]),
    },
    arp9: {
      C: generatePatternArp(["C4", "G4", "C5", "D5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "D#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      D: generatePatternArp(["D4", "A4", "D5", "E5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "F5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      E: generatePatternArp(["E4", "B4", "E5", "F#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      F: generatePatternArp(["F4", "C5", "F5", "G5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "G#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      G: generatePatternArp(["G4", "D5", "G5", "A5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "A#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      A: generatePatternArp(["A4", "E5", "A5", "B5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "C6"], [1, 2, 3, 4, 1, 2, 3, 4]),
      B: generatePatternArp(["B4", "F#5", "B5", "C#6"], [1, 2, 3, 4, 1, 2, 3, 4]),
    },
    arp10: {
      C: generatePatternArp(["C4", "G4", "C5", "E5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "F5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      D: generatePatternArp(["D4", "A4", "D5", "F#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "G5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      E: generatePatternArp(["E4", "B4", "E5", "G#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      F: generatePatternArp(["F4", "C5", "F5", "A5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "A#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      G: generatePatternArp(["G4", "D5", "G5", "B5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "C6"], [1, 2, 3, 4, 1, 2, 3, 4]),
      A: generatePatternArp(["A4", "E5", "A5", "C#6"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "D6"], [1, 2, 3, 4, 1, 2, 3, 4]),
      B: generatePatternArp(["B4", "F#5", "B5", "D#6"], [1, 2, 3, 4, 1, 2, 3, 4]),
    },
    arp11: {
      C: generatePatternArp(["C4", "G4", "C5", "D5", "E5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "D#5", "F5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      D: generatePatternArp(["D4", "A4", "D5", "E5", "F#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "F5", "G5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      E: generatePatternArp(["E4", "B4", "E5", "F#5", "G#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      F: generatePatternArp(["F4", "C5", "F5", "G5", "A5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "G#5", "A#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      G: generatePatternArp(["G4", "D5", "G5", "A5", "B5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "A#5", "C6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      A: generatePatternArp(["A4", "E5", "A5", "B5", "C#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "C6", "D6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      B: generatePatternArp(["B4", "F#5", "B5", "C#6", "D#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    },
    arp12: {
      C: generatePatternArp(["C4", "G4", "C5", "E5", "G5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "F5", "G#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      D: generatePatternArp(["D4", "A4", "D5", "F#5", "A5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "G5", "A#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      E: generatePatternArp(["E4", "B4", "E5", "G#5", "B5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      F: generatePatternArp(["F4", "C5", "F5", "A5", "C6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "A#5", "C#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      G: generatePatternArp(["G4", "D5", "G5", "B5", "D6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "C6", "D#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      A: generatePatternArp(["A4", "E5", "A5", "C#6", "E6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "D6", "F6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
      B: generatePatternArp(["B4", "F#5", "B5", "D#6", "F#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    },
    arp13: {
      C: generatePatternArp(["C4", "G4", "C5", "D5", "E5", "G5"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      "C#": generatePatternArp(["C#4", "G#4", "C#5", "D#5", "F5", "G#5"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      D: generatePatternArp(["D4", "A4", "D5", "E5", "F#5", "A5"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "F5", "G5", "A#5"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      E: generatePatternArp(["E4", "B4", "E5", "F#5", "G#5", "B5"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      F: generatePatternArp(["F4", "C5", "F5", "G5", "A5", "C6"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "G#5", "A#5", "C#6"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      G: generatePatternArp(["G4", "D5", "G5", "A5", "B5", "D6"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "A#5", "C6", "D#6"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      A: generatePatternArp(["A4", "E5", "A5", "B5", "C#6", "E6"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      "A#": generatePatternArp(["A#4", "F5", "A#5", "C6", "D6", "F6"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
      B: generatePatternArp(["B4", "F#5", "B5", "C#6", "D#6", "F#6"], [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6]),
    },
    arp14: {
      C: generatePatternArp(["C4", "G4", "C5", "D5", "G5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),

      "C#": generatePatternArp(["C#4", "G#4", "C#5", "D#5", "G#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      D: generatePatternArp(["D4", "A4", "D5", "E5", "A5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      "D#": generatePatternArp(["D#4", "A#4", "D#5", "F5", "A#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      E: generatePatternArp(["E4", "B4", "E5", "F#5", "B5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      F: generatePatternArp(["F4", "C5", "F5", "G5", "C6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      "F#": generatePatternArp(["F#4", "C#5", "F#5", "G#5", "C#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      G: generatePatternArp(["G4", "D5", "G5", "A5", "D6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      "G#": generatePatternArp(["G#4", "D#5", "G#5", "A#5", "D#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      A: generatePatternArp(["A4", "E5", "A5", "B5", "E6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      "A#": generatePatternArp(["A#4", "F5", "A#5", "C6", "F6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      B: generatePatternArp(["B4", "F#5", "B5", "C#6", "F#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
    },
    arp15: {
      C: generatePatternArp(["C4", "G4", "D5", "E5", "G5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),

      "C#": generatePatternArp(["C#4", "G#4", "D#5", "F5", "G#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      D: generatePatternArp(["D4", "A4", "E5", "F#5", "A5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      "D#": generatePatternArp(["D#4", "A#4", "F5", "G5", "A#5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      E: generatePatternArp(["E4", "B4", "F#5", "G#5", "B5"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      F: generatePatternArp(["F4", "C5", "G5", "A5", "C6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      "F#": generatePatternArp(["F#4", "C#5", "G#5", "A#5", "C#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      G: generatePatternArp(["G4", "D5", "A5", "B5", "D6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      "G#": generatePatternArp(["G#4", "D#5", "A#5", "C6", "D#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      A: generatePatternArp(["A4", "E5", "B5", "C#6", "E6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      "A#": generatePatternArp(["A#4", "F5", "C6", "D6", "F6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    
      B: generatePatternArp(["B4", "F#5", "C#6", "D#6", "F#6"], [1, 2, 3, 4, 5, 1, 2, 3, 4, 5]),
    },
    arp24: {
      C: generatePatternArp(["C4", "E4", "G4", "C5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "C#": generatePatternArp(["C#4", "F4", "G#4", "C#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      D: generatePatternArp(["D4", "F#4", "A4", "D5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "D#": generatePatternArp(["D#4", "G4", "A#4", "D#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      E: generatePatternArp(["E4", "G#4", "B4", "E5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      F: generatePatternArp(["F4", "A4", "C5", "F5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "F#": generatePatternArp(["F#4", "A#4", "C#5", "F#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      G: generatePatternArp(["G4", "B4", "D5", "G5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "G#": generatePatternArp(["G#4", "C5", "D#5", "G#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      A: generatePatternArp(["A4", "C#5", "E5", "A5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      "A#": generatePatternArp(["A#4", "D5", "F5", "A#5"], [1, 2, 3, 4, 1, 2, 3, 4]),
      B: generatePatternArp(["B4", "D#5", "F#5", "B5"], [1, 2, 3, 4, 1, 2, 3, 4]),
    },
    arp29: {
      C: generatePatternArp(
        ["C5", "D5", "E5", "F5", "G5", "A5", "B4"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      "C#": generatePatternArp(
        ["C#5", "D#5", "F5", "F#5", "G#5", "A#5", "C5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      D: generatePatternArp(
        ["D5", "E5", "F#5", "G5", "A5", "B5", "C#5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      "D#": generatePatternArp(
        ["D#5", "F5", "G5", "G#5", "A#5", "C6", "D5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      E: generatePatternArp(
        ["E5", "F#5", "G#5", "A5", "B5", "C#6", "D#5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      F: generatePatternArp(
        ["F5", "G5", "A5", "A#5", "C6", "D6", "E5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      "F#": generatePatternArp(
        ["F#5", "G#5", "A#5", "B5", "C#6", "D#6", "F5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      G: generatePatternArp(
        ["G5", "A5", "B5", "C6", "D6", "E6", "F#5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      "G#": generatePatternArp(
        ["G#5", "A#5", "C6", "C#6", "D#6", "F6", "G5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      A: generatePatternArp(
        ["A5", "B5", "C#6", "D6", "E6", "F#6", "G#5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      "A#": generatePatternArp(
        ["A#5", "C6", "D6", "D#6", "F6", "G6", "A5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
      B: generatePatternArp(
        ["B5", "C#6", "D#6", "E6", "F#6", "G#6", "A#5"],
        [1, 3, 5, 1, 3, 5, 7, 2, 5, 7, 2, 5, 1, 3, 6, 1, 3, 6, 1, 4, 6, 1, 4, 6]
      ),
    },
    arp31: {
      C: generatePatternArp(
        ["C5", "D5", "E5", "F5", "G5", "A5", "B4"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      "C#": generatePatternArp(
        ["C#5", "D#5", "F5", "F#5", "G#5", "A#5", "C5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      D: generatePatternArp(
        ["D5", "E5", "F#5", "G5", "A5", "B5", "C#5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      "D#": generatePatternArp(
        ["D#5", "F5", "G5", "G#5", "A#5", "C6", "D5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      E: generatePatternArp(
        ["E5", "F#5", "G#5", "A5", "B5", "C#6", "D#5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      F: generatePatternArp(
        ["F5", "G5", "A5", "A#5", "C6", "D6", "E5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      "F#": generatePatternArp(
        ["F#5", "G#5", "A#5", "B5", "C#6", "D#6", "F5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      G: generatePatternArp(
        ["G5", "A5", "B5", "C6", "D6", "E6", "F#5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      "G#": generatePatternArp(
        ["G#5", "A#5", "C6", "C#6", "D#6", "F6", "G5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      A: generatePatternArp(
        ["A5", "B5", "C#6", "D6", "E6", "F#6", "G#5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      "A#": generatePatternArp(
        ["A#5", "C6", "D6", "D#6", "F6", "G6", "A5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
      B: generatePatternArp(
        ["B5", "C#6", "D#6", "E6", "F#6", "G#6", "A#5"],
        [1, 5, 3, 5, 1, 5, 3, 5,  
         7, 5, 2, 5, 7, 5, 2, 5,  
         1, 6, 3, 6, 1, 6, 3, 6,  
         1, 6, 4, 6, 1, 6, 4, 6]
      ),
    },
    arp32: {
      C: generatePatternArp(
        ["C5", "D5", "E5", "F5", "G5", "A5", "B4"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      "C#": generatePatternArp(
        ["C#5", "D#5", "F5", "F#5", "G#5", "A#5", "C5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      D: generatePatternArp(
        ["D5", "E5", "F#5", "G5", "A5", "B5", "C#5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      "D#": generatePatternArp(
        ["D#5", "F5", "G5", "G#5", "A#5", "C6", "D5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      E: generatePatternArp(
        ["E5", "F#5", "G#5", "A5", "B5", "C#6", "D#5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      F: generatePatternArp(
        ["F5", "G5", "A5", "A#5", "C6", "D6", "E5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      "F#": generatePatternArp(
        ["F#5", "G#5", "A#5", "B5", "C#6", "D#6", "F5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      G: generatePatternArp(
        ["G5", "A5", "B5", "C6", "D6", "E6", "F#5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      "G#": generatePatternArp(
        ["G#5", "A#5", "C6", "C#6", "D#6", "F6", "G5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      A: generatePatternArp(
        ["A5", "B5", "C#6", "D6", "E6", "F#6", "G#5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      "A#": generatePatternArp(
        ["A#5", "C6", "D6", "D#6", "F6", "G6", "A5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
      B: generatePatternArp(
        ["B5", "C#6", "D#6", "E6", "F#6", "G#6", "A#5"],
        [5, 3, 1, 5, 3, 1,  
         5, 2, 7, 5, 2, 7,  
         6, 3, 1, 6, 3, 1,  
         6, 4, 1, 6, 4, 1]
      ),
    }
  };

  // Safe access to scale options
  const scaleOptions = scales[scaleType] ? Object.keys(scales[scaleType]) : [];

  const getNoteFrequency = (midiNote) => {
    const A4 = 440;
    return A4 * Math.pow(2, (midiNote - 69) / 12);
  };

  const noteToMidiNumber = (noteName, octave) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = notes.indexOf(noteName);
    if (noteIndex === -1) return 60; // fallback to middle C
    return noteIndex + (octave + 1) * 12;
  };

  // Play a note using Web Audio API
 const playNote = useCallback((noteInput, duration = null, velocity = 127) => {
    initAudioContext();
    const audioContext = audioContextRef.current;
    
    // Convert input to MIDI number
    let midiNumber;
    let noteName;
    
    if (typeof noteInput === 'number') {
      midiNumber = noteInput;
      noteName = midiToNoteName(noteInput);
    } else {
      const note = noteInput.slice(0, -1);
      const octave = parseInt(noteInput.slice(-1));
      midiNumber = noteToMidiNumber(note, octave);
      noteName = noteInput;
    }

    // Create audio nodes with envelope
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    // Configure oscillator
    oscillator.type = 'triangle';
    oscillator.frequency.value = getNoteFrequency(midiNumber);
    
    // Configure envelope (ADSR)
    const attackTime = 0.02;
    const decayTime = 0.1;
    const sustainLevel = velocity / 127 * 0.6;
    const releaseTime = 0.1;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime);
    gain.gain.exponentialRampToValueAtTime(sustainLevel * 0.8, now + attackTime + decayTime);
    
    // Connect nodes
    oscillator.connect(gain);
    gain.connect(gainNodeRef.current);
    oscillator.start(now);
    
    // Store oscillator with MIDI number as key
    oscillatorsRef.current[midiNumber] = { oscillator, gain };
    
    // Schedule note off if duration is provided
    if (duration !== null) {
      const releaseStart = now + duration - releaseTime;
      if (releaseStart > now) {
        gain.gain.setValueAtTime(sustainLevel, releaseStart);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      }
      oscillator.stop(now + duration);
    }

    return { midiNumber, noteName };
  }, [initAudioContext]);

  // Stop a specific note
  const stopNote = useCallback((noteInput) => {
    let noteName;
    
    if (typeof noteInput === 'number') {
      noteName = midiToNoteName(noteInput);
    } else {
      noteName = noteInput;
    }

    if (oscillatorsRef.current[noteName]) {
      oscillatorsRef.current[noteName].stop();
      delete oscillatorsRef.current[noteName];
    }
  }, []);

  // Stop all playing notes
  const stopAllNotes = useCallback(() => {
    Object.entries(oscillatorsRef.current).forEach(([noteName, oscillator]) => {
      oscillator.stop();
      delete oscillatorsRef.current[noteName];
    });
  }, []);

  const highlightKey = useCallback((noteName, highlightType) => {
    const key = document.querySelector(`.key9[data-note="${noteName}"]`);
    if (!key) return;
  
    key.classList.remove("active", "incorrect", "correct", "next-expected", "activeorange");
  
    if (highlightType) {
      key.classList.add(highlightType);
      
      if (["incorrect", "active"].includes(highlightType)) {
        setTimeout(() => {
          if (!key.classList.contains("correct") && 
              !key.classList.contains("next-expected")) {
            key.classList.remove(highlightType);
          }
        }, 500);
      }
    }
  }, [showNextExpected]);

  // Handle piano key mouse down
  const handlePianoKeyMouseDown = useCallback((noteName) => {
    if (!isYourTurn) {
      playNote(noteName);
      highlightKey(noteName, "active");
      setActiveKey(noteName);
      return;
    }

    const currentNote = scaleNotes[currentNoteIndex];
    
    if (currentNote === noteName) {
      playNote(noteName);
      highlightKey(noteName, "correct");
      setActiveKey(noteName);

      const newIndex = currentNoteIndex + 1;
      setCurrentNoteIndex(newIndex);
      
      if (newIndex < scaleNotes.length) {
        setNextExpectedNote(scaleNotes[newIndex]);
      } else {
        setNextExpectedNote(null);
      }

      if (newIndex === scaleNotes.length) {
        setTimeout(() => {
          toast.success("Finished! Great job!");
          setIsYourTurn(false);
          if (metronomeRef.current) {
            clearInterval(metronomeRef.current);
            metronomeRef.current = null;
          }
          setIsPlaying(false);
          setCurrentNoteIndex(0);
          setActiveKey(null);
          setNextExpectedNote(null);
          document.querySelectorAll(".key9").forEach((key) => {
            key.classList.remove("correct", "incorrect", "next-expected");
          });
        }, 250);
      }
    } else {
      playNote(noteName);
      highlightKey(noteName, "incorrect");
      
      if (currentNote) {
        highlightKey(currentNote, "next-expected");
      }
    }
  }, [isYourTurn, scaleNotes, currentNoteIndex, highlightKey, playNote]);

  // Handle piano key mouse up
  const handlePianoKeyMouseUp = useCallback((noteName) => {
    stopNote(noteName);
    if (!isYourTurn) {
      setActiveKey(null);
      highlightKey(noteName, null);
    }
  }, [isYourTurn, stopNote, highlightKey]);

  // MIDI Device Setup
  useEffect(() => {
    const onMIDISuccess = (midiAccess) => {
      const inputs = Array.from(midiAccess.inputs.values());
      setMidiDevices(inputs);
      if (inputs.length > 0) {
        setMidiInput(inputs[0]);
      }
      midiAccess.onstatechange = () => {
        setMidiDevices(Array.from(midiAccess.inputs.values()));
        setForceRender(prev => !prev);
      };
    };

    const onMIDIFailure = (error) => {
      console.error("MIDI access error:", error);
    };

    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then(onMIDISuccess)
        .catch(onMIDIFailure);
    }

    return () => {
      if (midiInput) {
        midiInput.onmidimessage = null;
      }
      stopAllNotes();
    };
  }, []);

  const midiToNoteName = (midiNumber) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = midiNumber % 12;
    const octave = Math.floor(midiNumber / 12) - 1;
    return notes[noteIndex] + octave;
  };

  const handleMIDIMessage = useCallback((message) => {
    const [command, note, velocity] = message.data;
    
    // Note on (144) with velocity > 0
    if (command === 144 && velocity > 0) {
      const noteName = midiToNoteName(note);
      handlePianoKeyMouseDown(noteName);
    } 
    // Note off (128) or note on with velocity 0
    else if (command === 128 || (command === 144 && velocity === 0)) {
      const noteName = midiToNoteName(note);
      handlePianoKeyMouseUp(noteName);
    }
  }, [handlePianoKeyMouseDown, handlePianoKeyMouseUp]);

  // Update MIDI input listener
  useEffect(() => {
    if (midiInput) {
      midiInput.onmidimessage = handleMIDIMessage;
    }
  }, [midiInput, handleMIDIMessage]);

  // Handle MIDI device change
  const handleMidiDeviceChange = (deviceId) => {
    const device = midiDevices.find(d => d.id === deviceId);
    if (device) {
      if (midiInput) {
        midiInput.onmidimessage = null;
      }
      setMidiInput(device);
      device.onmidimessage = handleMIDIMessage;
      setForceRender(prev => !prev);
    }
  };

  const playScale = useCallback(async () => {
    if (!scales[scaleType] || !scales[scaleType][selectedScale]) {
      toast.error("Scale pattern not found");
      return;
    }
  
    initAudioContext();
    const notes = [...scales[scaleType][selectedScale]];
    setScaleNotes(notes);
    setCurrentNoteIndex(0);
    setIsYourTurn(false);
    setNextExpectedNote(null);
    setIsPlay(true);
    setIsPlaying(true);
  
    // Remove all highlight classes
    document.querySelectorAll(".key9").forEach(key => {
      key.classList.remove("correct", "incorrect", "next-expected", "activeorange", "active");
    });
  
    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    const noteDuration = 0.15;
    const tempo = 120;
    const secondsPerBeat = 60 / tempo;
  
    notes.forEach((note, i) => {
      const noteTime = now + i * secondsPerBeat;
      
      setTimeout(() => {
        setActiveKey(note);
        playNote(note, noteDuration);
        highlightKey(note, "active");
      }, i * secondsPerBeat * 1000);
      
      setTimeout(() => {
        setActiveKey(null);
        highlightKey(note, null);
      }, (i * secondsPerBeat + noteDuration) * 1000);
    });
  
    const totalDuration = notes.length * secondsPerBeat * 1000;
    setTimeout(() => {
      if (!isYourTurn) {
        setActiveKey(null);
      }
      setIsPlay(false); // Reset isPlay after the scale finishes playing
    setIsPlaying(false);

    }, totalDuration);
  }, [selectedScale, scaleType, initAudioContext, highlightKey, playNote, isYourTurn]);
  // Highlight next expected note
  useEffect(() => {
    if (nextExpectedNote && showNextExpected) {
      highlightKey(nextExpectedNote, "next-expected");
    }
  }, [nextExpectedNote, showNextExpected, highlightKey]);

  // Metronome functions
  const toggleMetronome = useCallback(() => {
    initAudioContext();
    const audioContext = audioContextRef.current;

    if (metronomeIsPlaying) {
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
        metronomeRef.current = null;
      }
      setBeatCount(-1);
    } else {
      const interval = 60 / bpm;
      setBeatCount(0);

      let startTime = audioContext.currentTime + interval;
      let count = 0;

      metronomeRef.current = setInterval(() => {
        count = (count + 1) % 4; // Fixed 4/4 time signature
        setBeatCount(count);

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        // Downbeat has higher pitch
        oscillator.frequency.value = count === 0 ? 880 : 440;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);

        startTime += interval;
      }, interval * 1000);
    }
    setMetronomeIsPlaying(!metronomeIsPlaying);
  }, [metronomeIsPlaying, bpm, initAudioContext]);

  // Handle BPM change
  const handleBpmChange = (e) => {
    const newBpm = parseInt(e.target.value);
    if (newBpm >= 50 && newBpm <= 250) {
      setBpm(newBpm);
      // Restart metronome if it's currently playing to apply new BPM
      if (metronomeIsPlaying) {
        toggleMetronome();
        setTimeout(toggleMetronome, 100);
      }
    }
  };

  // Clean up metronome on unmount
  useEffect(() => {
    return () => {
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
      }
    };
  }, []);

  return (
    <div className="piano-container8 mx-5">
            <h2 className="text-2xl font-mali my-2 bg-gradient-to-tr from-[#328ea3] to-[#32157F] p-3 text-white w-full text-center">
        Arpeggios
      </h2>
      <div className="flex items-center justify-center w-full space-x-4 my-2">
        {/* Scale Type Dropdown */}
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
            <optgroup label="Shuffle Patterns (1-2-3-2 style)">
              <option value="arp1">Arp 1</option>
              <option value="arp2">Arp 2</option>
              <option value="arp3">Arp 3</option>
              <option value="arp4">Arp 4</option>
              <option value="arp5">Arp 5</option>
              <option value="arp6">Arp 6</option>
              <option value="arp7">Arp 7</option>
              <option value="arp16">Arp 16</option>
              <option value="arp17">Arp 17</option>
              <option value="arp18">Arp 18</option>
              <option value="arp19">Arp 19</option>
              <option value="arp20">Arp 20</option>
              <option value="arp21">Arp 21</option>
              <option value="arp22">Arp 22</option>
              <option value="arp23">Arp 23</option>
              <option value="arp25">Arp 25</option>
              <option value="arp26">Arp 26</option>
              <option value="arp27">Arp 27</option>
              <option value="arp28">Arp 28</option>
            </optgroup>

            <optgroup label="Run Patterns (sequential 1-2-3-4 style)">
              <option value="arp8">Arp 8</option>
              <option value="arp9">Arp 9</option>
              <option value="arp10">Arp 10</option>
              <option value="arp11">Arp 11</option>
              <option value="arp12">Arp 12</option>
              <option value="arp13">Arp 13</option>
              <option value="arp14">Arp 14</option>
              <option value="arp15">Arp 15</option>
              <option value="arp24">Arp 24</option>
            </optgroup>
            <optgroup label="Chord Progressions">
              <option value="arp29">Arp 29</option>
              <option value="arp30">Arp 30</option>
              <option value="arp31">Arp 31</option>
              <option value="arp32">Arp 32</option>
            </optgroup>
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
            {scaleOptions.map((scale) => (
              <option key={scale} value={scale}>
                {scale} {scaleType}
              </option>
            ))}
          </select>
        </div>

        {/* Next Expected Note Toggle */}
        <div className="toggle-next-expected flex items-center space-x-2">
          <label className="text-sm font-semibold">Guide:</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={showNextExpected}
              onChange={() => setShowNextExpected(prev => !prev)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      {/* Metronome Controls */}
      <div className="metronome-controls flex items-center justify-center gap-4 my-4">
        <div className="flex items-center gap-2">
          <label className="font-semibold">Metronome:</label>
          <button
            onClick={toggleMetronome}
            className={`px-3 py-1 rounded-md ${
              metronomeIsPlaying
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } text-white ${!isYourTurn? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!isYourTurn}
          >
            {metronomeIsPlaying ? "Stop" : "Start"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-semibold">BPM:</label>
          <input
            type="range"
            min="50"
            max="250"
            value={bpm}
            onChange={handleBpmChange}
            className="w-32"
          />
          <span className="w-12 border-2 border-black p-1 rounded-md bg-gray-100 text-center">
            {bpm}
          </span>
        </div>

        <div className="metronome-indicator flex items-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                beatCount === i
                  ? "bg-yellow-400 scale-110 shadow-md"
                  : "bg-gray-300 scale-100"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Piano UI */}
      <div className="piano9">
        {/* White Keys */}
        {["4", "5", "6"].map((octave, octaveIndex) =>
          whiteKeys.map((key, i) => (
            <div
            key={key + octave}
            className={`white-key9 key9 ${
              activeKey === key + octave ? "active" : ""
            } ${
              !isYourTurn &&
              scales[scaleType]?.[selectedScale]?.includes(key + octave) &&
              !activeKey && !isPlay
                ? "activeorange"
                : ""
            }`}
            onTouchStart={() => handlePianoKeyMouseDown(key + octave)}
            onTouchEnd={() => handlePianoKeyMouseUp(key + octave)}
            data-note={key + octave}
          >
            {key + octave}
          </div>
          ))
        )}

        {/* Black Keys */}
        {["4", "5", "6"].map((octave, octaveIndex) =>
          Object.entries(blackKeys).map(([key, pos]) => (
            <div
              key={key + octave}
              className={`black-key9 key9 ${
                activeKey === key + octave ? "active" : ""
              } ${
                !isYourTurn &&
              scales[scaleType]?.[selectedScale]?.includes(key + octave) &&
              !activeKey && !isPlay
                  ? "activeorange"
                  : ""
              }`}
              onTouchStart={() => handlePianoKeyMouseDown(key + octave)}
              onTouchEnd={() => handlePianoKeyMouseUp(key + octave)}
              data-note={key + octave}
              style={{ left: `${(pos + octaveIndex * 7) * (100 / 21) + 3}%` }}
            >
              {key}
            </div>
          ))
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex mt-2 gap-4 justify-center">
        <button
          className="bg-[#110016] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#110016] hover:to-[#450159] transition duration-300 font-merriweather"
          onClick={playScale}
        >
          ▶ Play {selectedScale} {scaleType}
        </button>
        
        <button
          onClick={() => {
            if (scaleNotes.length === 0) return;
            setIsYourTurn(true);
            setCurrentNoteIndex(0);
            if (showNextExpected) {
              setNextExpectedNote(scaleNotes[0]);
            }
            document.querySelectorAll('.key9.activeorange').forEach(key => {
              key.classList.remove('activeorange');
            });
          }}
          className={`bg-[#008c7a] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#00d2b4] hover:to-[#008c7a] transition duration-300 ${
              isPlaying ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isPlaying  } 
        >
          ✋ Your Turn
        </button>
        
        <div className="midi-device-selector mt-4 text-center">
          <label className="font-semibold text-xs">MIDI Device:</label>
          {midiDevices.length > 0 ? (
            <select
              onChange={(e) => handleMidiDeviceChange(e.target.value)}
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
      </div>

      <style>
        {`
          .piano-container8 {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 20px;
          }
          .piano9 {
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
          .white-key9 {
            width: 14.28%;
            height: 200px;
            background: linear-gradient(145deg, #fff, #f0f0f0);
            border: 1px solid #ccc;
            border-radius: 0 0 6px 6px;
            color: #333;
            box-shadow: 2px 5px 10px rgba(0, 0, 0, 0.3);
            margin-right: -1px;
          }
          .black-key9 {
            width: 3.17%;
            height: 120px;
            background: linear-gradient(145deg, #222, #000);
            color: #fff;
            z-index: 1;
            position: absolute;
            border-radius: 0 0 4px 4px;
            box-shadow: 3px 5px 10px rgba(0, 0, 0, 0.5);
          }
          .key9 {
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
          .correct {
            background: linear-gradient(135deg, #00d2b4 0%, #008c7a 100%) !important;
            transform: scale(1.05);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
            z-index: 1;
          }
          .next-expected {
            background: linear-gradient(135deg, #8a2be2 0%, #4b0082 100%) !important;
            transform: scale(1.05);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
            z-index: 1;
          }
          .incorrect {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5253 100%) !important;
            transform: scale(1.05);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
            z-index: 1;
          }
          .switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
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
            transition: .4s;
            border-radius: 24px;
          }
          .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          }
          input:checked + .slider {
            background-color: #8a2be2;
          }
          input:checked + .slider:before {
            transform: translateX(26px);
          }
          select option:checked {
            background-color: #ff69b4;
            color: white;
          }
          optgroup {
            font-weight: bold;
            color: #333;
          }
        `}
      </style>
    </div>
  );
};

export default Arp;