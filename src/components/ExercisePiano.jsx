import React, { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";

const Piano = () => {
  // Audio and state management
    const [isPlay, setIsPlay] = useState(false);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscillatorsRef = useRef({});
  const [activeKey, setActiveKey] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [currentNotes, setCurrentNotes] = useState([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [nextExpectedNote, setNextExpectedNote] = useState(null);
  const [showNextExpected, setShowNextExpected] = useState(true);
  const [midiInput, setMidiInput] = useState(null);
  const [midiDevices, setMidiDevices] = useState([]);
  const [forceRender, setForceRender] = useState(false);
  
  // Metronome state
  const metronomeRef = useRef(null);
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatCount, setBeatCount] = useState(0);
  // Scale and exercise configuration
  const [selectedScale, setSelectedScale] = useState("C");
  const [selectedExercise, setSelectedExercise] = useState("ex1");
  const [selectedScaleType, setSelectedScaleType] = useState("major");
  const [scaleDirection, setScaleDirection] = useState("ascending");
  
  // Piano keys configuration
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

  // Convert MIDI note number to frequency
  const getNoteFrequency = (midiNote) => {
    const A4 = 440;
    return A4 * Math.pow(2, (midiNote - 69) / 12);
  };

  // Convert note name + octave to MIDI number
  const noteToMidiNumber = (noteName, octave) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = notes.indexOf(noteName);
    if (noteIndex === -1) return 60; // fallback to middle C
    return noteIndex + (octave + 1) * 12;
  };

  // Convert MIDI number to note name
  const midiToNoteName = (midiNumber) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    return notes[midiNumber % 12] + octave;
  };

 // Enhanced note playing with proper polyphony support
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


  // Enhanced note stopping
  const stopNote = useCallback((noteInput, releaseTime = 0.1) => {
    let midiNumber;
    
    if (typeof noteInput === 'number') {
      midiNumber = noteInput;
    } else {
      const note = noteInput.slice(0, -1);
      const octave = parseInt(noteInput.slice(-1));
      midiNumber = noteToMidiNumber(note, octave);
    }

    const noteData = oscillatorsRef.current[midiNumber];
    if (noteData) {
      const { oscillator, gain } = noteData;
      const now = audioContextRef.current?.currentTime || 0;
      
      // Apply release envelope
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
      
      // Stop oscillator after release
      oscillator.stop(now + releaseTime);
      
      // Clean up after release completes
      setTimeout(() => {
        if (oscillatorsRef.current[midiNumber]?.oscillator === oscillator) {
          delete oscillatorsRef.current[midiNumber];
        }
      }, releaseTime * 1000);
    }
  }, []);

  // Stop all playing notes
  const stopAllNotes = useCallback(() => {
    Object.values(oscillatorsRef.current).forEach(({ oscillator, gain }) => {
      gain.gain.cancelScheduledValues(0);
      gain.gain.setValueAtTime(gain.gain.value, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.1);
      oscillator.stop(0.1);
    });

    oscillatorsRef.current = {};

  }, []);
  // Update highlightKey function
  const highlightKey = useCallback(
    (noteName, highlightType) => {
      if (
        !showNextExpected &&
        (highlightType === "next-expected" ||
          highlightType === "correct-and-expected")
      ) {
        return;
      }
  
      const key = document.querySelector(`.key9[data-note="${noteName}"]`);
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
          
          // If it's an incorrect note, remove the class after 1 second
          if (highlightType === "incorrect") {
            setTimeout(() => {
              key.classList.remove("incorrect");
            }, 200);
          }
        }
      }, 10);
    },
    [showNextExpected]
  );

  // Generate scales safely
  const generateScale = (rootNote, scaleType) => {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const rootIndex = notes.indexOf(rootNote);
    if (rootIndex === -1) return []; // Return empty array if invalid root note

    const scaleFormulas = {
      major: [0, 2, 4, 5, 7, 9, 11, 12],
      minor: [0, 2, 3, 5, 7, 8, 10, 12],
      mayamalava: [0, 1, 4, 5, 7, 8, 11, 12],
      harmonicMinor:[0,2,3,5,7,8,11,12]
   
    };

    const scaleTypeBase = scaleType.replace(/_ex\d|_Triangle/, "");
    const intervals = scaleFormulas[scaleTypeBase] || scaleFormulas.major; // Fallback to major
    
    return intervals.map((interval) => {
      const totalSemitones = rootIndex + interval;
      const noteIndex = totalSemitones % 12;
      const octave = 4 + Math.floor(totalSemitones / 12);
      return notes[noteIndex] + octave;
    });
  };

  const generatePattern = (notes, patternType) => {
    if (!notes || notes.length === 0) return [];
    
    switch (patternType) {
      case "ex1":
        return [...notes, ...notes.reverse()];
      case "ex2":
        return [
          ...Array(3).fill([notes[0], notes[1]]).flat(),
          notes[2],
          notes[3],
          ...notes,
          ...Array(3).fill([notes[7], notes[6]]).flat(),
          notes[5],
          notes[4],
          ...notes.reverse(),
        ];
      case "ex3":
        return [
          ...Array(2).fill([notes[0], notes[1], notes[2]]).flat(),
          notes[0],
          notes[1],
          ...notes,
          ...Array(2).fill([notes[7], notes[6], notes[5]]).flat(),
          notes[7],
          notes[6],
          ...notes.reverse(),
        ];
      case "ex4":
        return [
          ...Array(2).fill([notes[0], notes[1], notes[2], notes[3]]).flat(),
          ...notes,
          ...Array(2).fill([notes[7], notes[6], notes[5], notes[4]]).flat(),
          ...notes.reverse(),
        ];
      case "ex5":
        return [
          ...notes.slice(0, 5),
          null,
          notes[0],
          notes[1],
          ...notes,
          ...notes.slice(3, 8).reverse(),
          null,
          notes[7],
          notes[6],
          ...[...notes].reverse(),
        ];
      case "ex6":
        return [
          ...notes.slice(0, 6),
          notes[0],
          notes[1],
          ...notes,
          ...notes.slice(2, 8).reverse(),
          notes[7],
          notes[6],
          ...[...notes].reverse(),
        ];
      case "ex7":
        return [
          ...notes.slice(0, 7),
          null,
  
          ...notes,
          ...notes.slice(1, 8).reverse(),
          null,
 
          ...[...notes].reverse(),
        ];
      case "ex8":
        return [
          ...notes.slice(0, 5),
          notes[3],
          notes[2],
          notes[1],
          ...notes,
          ...notes.slice(3, 8).reverse(),
          notes[4],
          notes[5],
          notes[6],

          ...[...notes].reverse(),
        ];
      case "ex9":
        return [
          ...notes.slice(0, 5),
          notes[3],
          notes[5],
          notes[4],
          ...notes,
          ...notes.slice(3, 8).reverse(),
          notes[4],
          notes[2],
          notes[3],

          ...[...notes].reverse(),
        ];
      case "ex10":
        return [
          ...notes.slice(0, 5),
          null,
          notes[2],
          notes[3],
          notes[4],
          null,
          null,
          null,
          notes[4],
          null, 
          null, 
          null, 
          notes[2],
          notes[3],
          notes[4],
          notes[3],
          notes[6],          
          notes[5],          
          notes[4],          
          notes[3],          

          notes[2],
          notes[3],
          notes[4],
          notes[2], 
          
          notes[3],
          notes[2],
          notes[1],
          notes[0], 
   

        ];
      case "ex11":
        return [
          notes[7],
          null,
          notes[6],
          notes[5],
          notes[6],
          null,  
          notes[5],
          notes[4],
          notes[5],
          null,  
          notes[4],
          notes[3],
          notes[4],
          null,          
          notes[4], 
          null,  

          notes[2],          
          notes[3],          
          notes[4],
          notes[5],
          notes[6],
          notes[5], 
          notes[4], 
          notes[3], 
          
          notes[2],
          notes[3],
          notes[4],
          notes[2], 

          notes[3],
          notes[2],
          notes[1],
          notes[0], 
        ];
      case "ex12":
        return [
          notes[7],
          notes[7],
          notes[6],
          notes[5],
          notes[6],
          notes[6],
          notes[5],
          notes[4],
          notes[5],
          notes[5],
          notes[4],
          notes[3],
          notes[4],
          null,          
          notes[4], 
          null,  

          notes[2],          
          notes[3],          
          notes[4],
          notes[5],
          notes[6],
          notes[5], 
          notes[4], 
          notes[3], 
          
          notes[2],
          notes[3],
          notes[4],
          notes[2], 

          notes[3],
          notes[2],
          notes[1],
          notes[0], 
        ];
      case "ex13":
        return [
          notes[0],
          notes[1],
          notes[2],
          notes[1],
          notes[2],
          null,
          notes[2],
          notes[3],
          notes[4],
          notes[3],
          notes[4],
          null,
          notes[5],
          notes[4],
          notes[5],
          null,          
          notes[3], 
          notes[4],          
          notes[5],          
          notes[4],
          notes[5],
          notes[6],
          notes[5], 
          notes[4], 
          
          notes[3],
          notes[4],
          notes[5],
          notes[4], 

          notes[3],
          notes[2],
          notes[1],
          notes[0], 
        ];
      case "ex14":
        return [
          notes[0],
          notes[1],
          notes[2],
          notes[3],
          notes[4],
          null,
          notes[4],
          null,
          notes[5],
          notes[5],
          notes[4],
          null,
          notes[3],
          notes[3],
          notes[4],
          null,
          notes[5],
          notes[6],
          notes[7],
          null,          
          notes[7], 
          notes[6],          
          notes[5],          
          notes[4],
          notes[7], 
          notes[6],          
          notes[5],          
          notes[4],

          notes[3],
          notes[2],
          notes[1],
          notes[0], 
        ];
        case "ex15":
    return [...notes.flatMap(n => [n, n]), ...notes.flatMap(n => [n, n]).reverse()];
    case "ex16": {
      
      // Forward: 11 22 33 44 → 22 33 44 55 → ... → 55 66 77 88
      const forward = [];
      for (let i = 0; i <= notes.length - 4; i++) {
        forward.push(...notes.slice(i, i + 4).flatMap(n => [n, n]));
      }
      
      // Reverse: 88 77 66 55 → 77 66 55 44 → ... → 44 33 22 11
      const reversedNotes = [...notes].reverse(); // [8,7,6,5,4,3,2,1]
      const reverse = [];
      for (let i = 0; i <= reversedNotes.length - 4; i++) {
        reverse.push(...reversedNotes.slice(i, i + 4).flatMap(n => [n, n]));
      }
      
      return [...forward, ...reverse];
    }
    case "ex17": {
      
      // Forward sequences: 11 22 33 22 11 22 33 44, 22 33 44 33 22 33 44 55, etc.
      const forward = [];
      for (let i = 0; i <= notes.length - 4; i++) {
        const [a, b, c, d] = notes.slice(i, i + 4);
        forward.push(
          a, a, b, b, c, c,  // 11 22 33
          b, b, a, a,         // 22 11
          b, b, c, c,         // 22 33
          d, d                // 44
        );
      }
    
      // Reverse sequences: 88 77 66 77 88 77 66 55, etc.
      const reverse = [];
      for (let i = notes.length - 1; i >= 3; i--) {
        const [d, c, b, a] = [notes[i], notes[i-1], notes[i-2], notes[i-3]];
        reverse.push(
          d, d, c, c, b, b,  // 88 77 66
          c, c, d, d,         // 77 88
          c, c, b, b,         // 77 66
          a, a                // 55
        );
      }
    
      return [...forward, ...reverse];
    }
 
    case "ex18": {
      
      // Forward sequences
      const forward = [];
      for (let i = 0; i <= notes.length - 4; i++) {
        const [a, b, c, d] = notes.slice(i, i + 4);
        forward.push(
          a, a, b, a, a, b, a, b,  // 11 21 12 12 (corrected)
          a, a, b, b, c, c, d, d    // 11 22 33 44
        );
      }
    
      // Reverse sequences
      const reverse = [];
      for (let i = notes.length - 1; i >= 3; i--) {
        const [d, c, b, a] = [notes[i], notes[i-1], notes[i-2], notes[i-3]];
        reverse.push(
          d, d, c, d, d, c, d, c,  // 88 78 87 87
          d, d, c, c, b, b, a, a    // 88 77 66 55
        );
      }
    
      return [...forward, ...reverse];
    }
    case "ex19": {
      
      // Forward sequences
      const forward = [];
      for (let i = 0; i <= notes.length - 4; i++) {
        const [a, b, c, d] = notes.slice(i, i + 4);
        forward.push(
          a, a, b, b,      // 11 22
          c, a, b, c,       // 31 23
          a, a, b, b,       // 11 22
          c, c, d, d        // 33 44
        );
      }
    
      // Reverse sequences
      const reverse = [];
      for (let i = notes.length - 1; i >= 3; i--) {
        const [d, c, b, a] = [notes[i], notes[i-1], notes[i-2], notes[i-3]];
        reverse.push(
          d, d, c, c,      // 88 77
          b, d, c, b,       // 68 76
          d, d, c, c,       // 88 77
          b, b, a, a        // 66 55
        );
      }
    
      return [...forward, ...reverse];
    }
    case "ex20": {
      const result = [];
      
      // Forward sequences
      for (let i = 0; i <= notes.length - 4; i++) {
        const [a, b, c, d] = notes.slice(i, i + 4);
        result.push(
          a, a, null, b, b, null, c, c,  // a,a,null,b,b,null,c,c
          a, a, b, b, c, c, d, d          // a,a,b,b,c,c,d,d
        );
      }
    
      // Reverse sequences
      for (let i = notes.length - 1; i >= 3; i--) {
        const [d, c, b, a] = [notes[i], notes[i-1], notes[i-2], notes[i-3]];
        result.push(
          d, d, null, c, c, null, b, b,  // d,d,null,c,c,null,b,b
          d, d, c, c, b, b, a, a          // d,d,c,c,b,b,a,a
        );
      }
    
      return result;
    }
    case "ex21": {
      const result = [];
      
      // Forward sequences
      for (let i = 0; i <= notes.length - 4; i++) {
        const [a, b, c, d] = notes.slice(i, i + 4);
        result.push(
          a, null, a,   // a,null,a
          b, null, b,   // b,null,b
          c, c,         // c,c
          a, a, b, b, c, c, d, d  // a,a,b,b,c,c,d,d
        );
      }
    
      // Reverse sequences
      for (let i = notes.length - 1; i >= 3; i--) {
        const [d, c, b, a] = [notes[i], notes[i-1], notes[i-2], notes[i-3]];
        result.push(
          d, null, d,   // d,null,d
          c, null, c,   // c,null,c
          b, b,         // b,b
          d, d, c, c, b, b, a, a  // d,d,c,c,b,b,a,a
        );
      }
    
      return result;
    }
    case "ex22": {
      const result = [];
      
      // Forward sequences
      for (let i = 0; i <= notes.length - 4; i++) {
        const [a, b, c, d] = notes.slice(i, i + 4);
        result.push(
          a, a, a, b,    // a,a,a,b
          b, b, c, c,    // b,b,c,c
          a, a, b, b,    // a,a,b,b
          c, c, d, d     // c,c,d,d
        );
      }
    
      // Reverse sequences
      for (let i = notes.length - 1; i >= 3; i--) {
        const [d, c, b, a] = [notes[i], notes[i-1], notes[i-2], notes[i-3]];
        result.push(
          d, d, d, c,    // d,d,d,c
          c, c, b, b,    // c,c,b,b
          d, d, c, c,    // d,d,c,c
          b, b, a, a     // b,b,a,a
        );
      }
    
      return result;
    }
    case "ex23": {
      const result = [];
      
      // Forward sequences
      for (let i = 0; i <= notes.length - 4; i++) {
        const [a, b, c, d] = notes.slice(i, i + 4);
        result.push(
          a, a, d, d,    // a,a,d,d (mirror edges)
          c, c, b, b,    // c,c,b,b (mirror middle)
          a, a, b, b,    // a,a,b,b (normal progression)
          c, c, d, d     // c,c,d,d (normal progression)
        );
      }
    
      // Reverse sequences
      for (let i = notes.length - 1; i >= 3; i--) {
        const [d, c, b, a] = [notes[i], notes[i-1], notes[i-2], notes[i-3]];
        result.push(
          d, d, a, a,    // d,d,a,a (mirror edges)
          b, b, c, c,    // b,b,c,c (mirror middle)
          d, d, c, c,    // d,d,c,c (normal regression)
          b, b, a, a     // b,b,a,a (normal regression)
        );
      }
    
      return result;
    }
      case "triangle":
        const pattern = [];
        for (let i = 0; i < notes.length; i++) {
          for (let j = 0; j <= i; j++) pattern.push(notes[j]);
          for (let j = i - 1; j >= 0; j--) pattern.push(notes[j]);
          if (i < notes.length - 1) pattern.push(null);
        }
        return pattern;

        case "bonus1":
         return [ 
          notes[0],
          null,
          notes[5],
          null,
          notes[4],
          null,
          notes[3],
          notes[2],

          notes[0],
          null,
          notes[4],
          null,
          notes[3],
          notes[4],
          notes[5],
          notes[6],

          notes[0],
          null,
          notes[7],
          null,
          notes[6],
          null,
          notes[5],
          notes[4],
          notes[2],
          null,
          notes[3],
          notes[4],
          notes[3],
          notes[2],
          notes[1],
          notes[0],     
        ];
        case "bonus2":
  return [
    // Forward (16 steps)
    0, null, 1, 2,  
    3, null, 4, 5,  
    2, null, 3, 4,  
    5, null, 6, 7,  

    // Reverse (16 steps, adjusted for symmetry)
    7, null, 6, 5,  
    4,null,   3, 2, 
    4, null, 3, 2,  
    1,  null, 0, null // (Optional: Add padding if needed)
  ].map(i => i === null ? null : notes[i]);
      default:
        return notes;


        
    }
  }
  

  // Generate scales safely with fallbacks
  const getScales = () => {
    const scaleTypes = ["major", "minor", "mayamalava","harmonicMinor"];
    const rootNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    
    return scaleTypes.reduce((acc, type) => {
      acc[type] = rootNotes.reduce((scaleAcc, note) => {
        const scale = generateScale(note, type);
        scaleAcc[note] = generatePattern(scale, selectedExercise);
        return scaleAcc;
      }, {});
      return acc;
    }, {});
  };

  const scales = getScales();
  // Handle piano key mouse down
  const handlePianoKeyMouseDown = useCallback(
    (noteName) => {
      if (!isYourTurn) {
        playNote(noteName);
        setActiveKey(noteName);
        return;
      }
  
      playNote(noteName);
      
      // Find the next non-null note index
      let nextIndex = currentNoteIndex;
      let currentExpectedNote = currentNotes[nextIndex];
      
      // Skip null values
      while (currentExpectedNote === null && nextIndex < currentNotes.length - 1) {
        nextIndex++;
        currentExpectedNote = currentNotes[nextIndex];
      }
  
      const nextNote = currentNotes[nextIndex + 1];
      
      if (currentExpectedNote === noteName) {
        if (nextNote === noteName) {
          highlightKey(
            noteName,
            showNextExpected ? "correct-and-expected" : "correct"
          );
        } else {
          highlightKey(noteName, "correct");
        }
  
        setActiveKey(noteName);
        const newIndex = nextIndex + 1;
        setCurrentNoteIndex(newIndex);
  
        // Find the next non-null expected note
        let nextExpectedIdx = newIndex;
        while (nextExpectedIdx < currentNotes.length && currentNotes[nextExpectedIdx] === null) {
          nextExpectedIdx++;
        }
  
        if (showNextExpected && nextExpectedIdx < currentNotes.length) {
          setNextExpectedNote(currentNotes[nextExpectedIdx]);
          highlightKey(currentNotes[nextExpectedIdx], "next-expected");
        }
  
        if (newIndex >= currentNotes.length) {
          setTimeout(() => {
            toast.success("Finished! Great job!");
            setIsYourTurn(false);
            if (metronomeRef.current) {
              clearInterval(metronomeRef.current);
              metronomeRef.current = null;
            }
            setCurrentNoteIndex(0);
            setActiveKey(null);
            setNextExpectedNote(null);
            document
              .querySelectorAll(".key9")
              .forEach((key) =>
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
        highlightKey(noteName, "incorrect");
      }
    },
    [isYourTurn, currentNotes, currentNoteIndex, highlightKey, showNextExpected, playNote]
  );
  // Handle piano key mouse up
  const handlePianoKeyMouseUp = useCallback(
    (noteName) => {
      stopNote(noteName);
      if (!isYourTurn) {
        setActiveKey(null);
      }
    },
    [isYourTurn, stopNote]
  );
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

  // MIDI success handler
  const onMIDISuccess = (midiAccess) => {
    const inputs = Array.from(midiAccess.inputs.values());
    if (inputs.length > 0) {
      setMidiDevices(inputs);
      setMidiInput(inputs[0]);
      inputs[0].onmidimessage = handleMIDIMessage;
    }
  };

  // MIDI failure handler
  const onMIDIFailure = (error) => {
    console.error("Failed to access MIDI devices:", error);
  };

  // Handle MIDI device change
  const handleMidiDeviceChange = (deviceId) => {
    const device = midiDevices.find((d) => d.id === deviceId);
    if (device) {
      if (midiInput) {
        midiInput.onmidimessage = null;
      }
      setMidiInput(device);
      device.onmidimessage = handleMIDIMessage;
      setForceRender((prev) => !prev);
    }
  };

  // MIDI initialization
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator
        .requestMIDIAccess()
        .then(onMIDISuccess)
        .catch(onMIDIFailure);
    } else {
      console.error("Web MIDI API not supported in this browser.");
    }

    return () => {
      if (midiInput) {
        midiInput.onmidimessage = null;
      }

      stopAllNotes();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update MIDI listener when input changes
  useEffect(() => {
    if (midiInput) {
      midiInput.onmidimessage = handleMIDIMessage;
    }
  }, [midiInput, handleMIDIMessage]);

  // Play the selected scale
  const playScale = async () => {
    setIsPlaying(true);
    const scaleNotes = [...scales[selectedScaleType][selectedScale]];
    setCurrentNotes(scaleNotes);
    
    // Clear all activeorange highlights when playback starts
    document.querySelectorAll('.key9').forEach(key => {
      key.classList.remove('activeorange');
    });

    if (scaleDirection === "descending") scaleNotes.reverse();
    
    for (let i = 0; i < scaleNotes.length; i++) {
      const note = scaleNotes[i];
      if (note !== null) {
        playNote(note, 0.5);
        setActiveKey(note);
        highlightKey(note, "active");
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setActiveKey(null);
    setIsPlaying(false);
setIsPlay(true)
    // Restore activeorange highlights after playback ends
    scaleNotes.forEach(note => {
      if (note !== null) {
        const key = document.querySelector(`.key9[data-note="${note}"]`);
        if (key) key.classList.add('activeorange');
        
      }
    });
  };

  // Start "Your Turn" mode
  const startYourTurn = useCallback(() => {
    if (currentNotes.length === 0) {
      toast.error("No exercise loaded");
      return;
    }
  
    setIsYourTurn(true);
    
    // Find the first non-null note
    let firstNoteIndex = 0;
    while (firstNoteIndex < currentNotes.length && currentNotes[firstNoteIndex] === null) {
      firstNoteIndex++;
    }
  
    setCurrentNoteIndex(firstNoteIndex);
  
    document.querySelectorAll(".key9").forEach((key) => {
      key.classList.remove(
        "correct",
        "active",
        "activeorange",
        "incorrect",
        "next-expected",
        "correct-and-expected"
      );
    });
  
    const firstNote = currentNotes[firstNoteIndex];
    setNextExpectedNote(firstNote);
    if (showNextExpected && firstNote) {
      highlightKey(firstNote, "next-expected");
    }
  }, [currentNotes, highlightKey, showNextExpected]);



  return (
    <div className="piano-container8 mx-5">
      <h2 className="text-2xl font-mali my-2 bg-gradient-to-tr from-[#328ea3] to-[#32157F] p-3 text-white w-full text-center">
        Exercises
      </h2>
      
      {/* Controls Section */}
      <div className="flex items-center justify-center w-full space-x-4 my-2">
        {/* Exercise Dropdown */}
        <div className="exercise-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Exercise:</label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
      <optgroup label="Sarali Varisai">
    <option value="ex1">Exercise 1</option>
    <option value="ex2">Exercise 2</option>
    <option value="ex3">Exercise 3</option>
    <option value="ex4">Exercise 4</option>
    <option value="ex5">Exercise 5</option>
    <option value="ex6">Exercise 6</option>
    <option value="ex7">Exercise 7</option>
    <option value="ex8">Exercise 8</option>
    <option value="ex9">Exercise 9</option>
    <option value="ex10">Exercise 10</option>
    <option value="ex11">Exercise 11</option>
    <option value="ex12">Exercise 12</option>
    <option value="ex13">Exercise 13</option>
    <option value="ex14">Exercise 14</option>
  </optgroup>
  <optgroup label="Jantai Varisai">
    <option value="ex15">Exercise 15</option>
    <option value="ex16">Exercise 16</option>
    <option value="ex17">Exercise 17</option>
    <option value="ex18">Exercise 18</option>
    <option value="ex19">Exercise 19</option>
    <option value="ex20">Exercise 20</option>
    <option value="ex21">Exercise 21</option>
    <option value="ex22">Exercise 22</option>
    <option value="ex23">Exercise 23</option>
    </optgroup>
    <optgroup label="Extra">
    <option value="triangle">Triangle</option>
    <option value="bonus1">Bonus 1</option>
    <option value="bonus2">Bonus 2</option>
    </optgroup>
          </select>
        </div>

        {/* Scale Type Dropdown */}
        <div className="scale-type-selector flex items-center space-x-4">
          <label className="text-lg font-semibold">Scale Type:</label>
          <select
            value={selectedScaleType}
            onChange={(e) => setSelectedScaleType(e.target.value)}
            className="border-2 border-black p-2 rounded-md font-montserrat"
          >
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="mayamalava">Mayamalava</option>
            <option value="harmonicMinor">Harmonic minor</option>
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
            {scales[selectedScaleType] && Object.keys(scales[selectedScaleType]).map((scale) => (
              <option key={scale} value={scale}>
                {scale}
              </option>
            ))}
          </select>
        </div>

        {/* Next Expected Note Toggle */}
        <div className="toggle-next-expected flex items-center space-x-4">
          <label className="text-sm font-semibold font-mali">
            Guide me <span className="font-thin text-xs">(Show Next Note):</span>
          </label>
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
            } text-white ${!isYourTurn ? "opacity-50 cursor-not-allowed" : ""}`}
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
        {["4", "5"].map((octave) =>
          whiteKeys.map((key, i) => {
            const note = key + octave;
            const isInScale = scales[selectedScaleType]?.[selectedScale]?.includes(note);
            return (
              <div
                key={note}
                className={`white-key9 key9 ${
                  activeKey === note ? "active" : ""
                } ${
                  !isPlaying && isInScale && !isYourTurn ?  "activeorange" : ""
                }`}
                onMouseDown={() => handlePianoKeyMouseDown(note)}
                onMouseUp={() => handlePianoKeyMouseUp(note)}
                data-note={note}
                style={{ left: `${i * 50}px` }}
              >
                {note}
              </div>
            );
          })
        )}

        {["4", "5"].map((octave) =>
          Object.entries(blackKeys).map(([key, pos]) => {
            const note = key + octave;
            const isInScale = scales[selectedScaleType]?.[selectedScale]?.includes(note);
            return (
              <div
                key={note}
                className={`black-key9 key9 ${
                  activeKey === note ? "active" : ""
                } ${
                  !isPlaying && isInScale && !isYourTurn ? "activeorange" : ""
                }`}
                onMouseDown={() => handlePianoKeyMouseDown(note)}
                onMouseUp={() => handlePianoKeyMouseUp(note)}
                data-note={note}
                style={{ left: `${(pos + (octave === "5" ? 7 : 0)) * (100 / 14) + 4}%` }}
              >
                {key}
              </div>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex mt-2 gap-5 justify-center">
        <button
          className="bg-[#110016] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#110016] hover:to-[#450159] transition duration-300 font-merriweather"
          onClick={playScale}
          disabled={isPlaying}
        >
          {isPlaying
            ? "Playing..."
            : `▶ Play ${selectedScale} ${selectedScaleType} Scale (${scaleDirection})`}
        </button>

        <button
          onClick={startYourTurn}
          className={`bg-[#008c7a] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#00d2b4] hover:to-[#008c7a] transition duration-300 font-mali ${
            !isPlay? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isPlay} 
        >
          ✋ Your Turn
        </button>

        {/* MIDI Device Selector */}
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

      {/* Styles */}
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
            width: 4.57%;
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
            background: linear-gradient(135deg, #00b4db 0%, #0083b0 100%) !important;
            border: 1px solid black;
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
          }
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
          .slider.round:before {
            border-radius: 50%;
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

export default Piano;