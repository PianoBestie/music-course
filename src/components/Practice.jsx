import React, { useCallback, useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { Midi } from "@tonejs/midi";
import * as Tone from 'tone';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
// Initialize Supabase client
const supabaseUrl = "https://aqtoehdipmlwnxgtoara.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdG9laGRpcG1sd254Z3RvYXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTkyODAsImV4cCI6MjA1OTI3NTI4MH0.Foh4jXzvRm7deYockdR2h1Amtz3tDfNUFad4JHZCJZg";
const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

const Play = () => {
  // Redux state
  const navigate = useNavigate();
  const { tamilNotation } = useSelector((state) => state.music);
// Add this state variable
const [mp3Loaded, setMp3Loaded] = useState(false);
  // Refs and state
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscillatorsRef = useRef({});
  const metronomeRef = useRef(null);
  const audioRef = useRef(null);
  const [activeKeys, setActiveKeys] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlay, setIsPlay] = useState(false);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [currentNotes, setCurrentNotes] = useState([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [nextExpectedNote, setNextExpectedNote] = useState(null);
  const [showNextExpected, setShowNextExpected] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("noteKnowledge");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState([4, 4]);
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [midiInput, setMidiInput] = useState(null);
  const [midiDevices, setMidiDevices] = useState([]);
  const [forceRender, setForceRender] = useState(false);
  const [mp3Volume, setMp3Volume] = useState(0.5);
  // Add these refs at the component level
  const synthRef = useRef(null);
  const scheduledEventsRef = useRef(null);
  const timeoutRef = useRef(null);
  // Piano keys configuration
  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };
// Add these state variables at the top
const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const exercisesPerPage = 10;
const [searchQuery, setSearchQuery] = useState('');
const [showNotes, setShowNotes] = useState(false);
const [midiNotes, setMidiNotes] = useState([]);
const [rootNote, setRootNote] = useState("C"); // Default root note
const [isLoading, setIsLoading] = useState(false);
const [exercises, setExercises] = useState(() => {
  try {
    const savedExercises = localStorage.getItem('musicExercises');
    if (savedExercises) {
      return JSON.parse(savedExercises);
    }
  } catch (error) {
    console.error("Failed to parse exercises from localStorage", error);
  }
  
  // Default exercises if nothing in localStorage
  return {
    noteKnowledge: {
      "bgm/song1": { 
        midi_url: "/airtel.mid", 
        mp3_url: null, 
        pdf_url: "/airtel.pdf",
        root: "G",
        movieName:  "", 
        category: "noteKnowledge"
      }
    },
    chordKnowledge: {}
  };
});

  useEffect(() => {
    loadExercises();
  }, []);
  
  const loadExercises = async () => {
    try {
      setIsLoading(true);
  
      const [noteRes, chordRes] = await Promise.all([
        supabase
          .from('exercises')
          .select('*')
          .eq('category', 'noteKnowledge')
          .order('name', { ascending: true }),
  
        supabase
          .from('exercises')
          .select('*')
          .eq('category', 'chordKnowledge')
          .order('name', { ascending: true }),
      ]);
  
      if (noteRes.error || chordRes.error) throw noteRes.error || chordRes.error;
  
      const noteExercises = {};
      noteRes.data.forEach((exercise) => {
        noteExercises[exercise.name] = {
          midi_url: exercise.midi_url || null,
          mp3_url: exercise.mp3_url || null,
          pdf_url: exercise.pdf_url || null,
          movieName: exercise.movieName || "", 
          root: exercise.root || 'C',
          id: exercise.id,
        };
      });
  
      const chordExercises = {};
      chordRes.data.forEach((exercise) => {
        chordExercises[exercise.name] = {
          midi_url: exercise.midi_url || null,
          mp3_url: exercise.mp3_url || null,
          pdf_url: exercise.pdf_url || null,
          movieName: exercise.movieName || "", 
          root: exercise.root || 'C',
          id: exercise.id,
        };
      });
  
      setExercises({
        noteKnowledge: noteExercises,
        chordKnowledge: chordExercises,
      });
    } catch (error) {
      console.error('Load exercises error:', error);
      toast.error('Failed to load exercises. Please check your permissions.');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };
  
const ExerciseCard = ({exercise, name, data, isSelected, onSelect, onPlay }) => {
  return (
    <div 
      className={`relative border rounded-xl p-5 cursor-pointer transition-all duration-300 flex flex-col h-full bg-gray-900 shadow-lg hover:shadow-xl group ${
        isSelected 
          ? "border-indigo-400 border-2 ring-2 ring-indigo-900 bg-gray-800" 
          : "border-gray-700 hover:border-indigo-500"
      }`}
      onClick={onSelect}
    >
      {/* Selected badge (top right corner) */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-md z-10">
          Selected
        </div>
      )}
      
      {/* Header with name */}
      <div className="flex items-start justify-between mb-4">
        <h4 className={`font-semibold text-lg line-clamp-2 leading-tight ${
          isSelected ? "text-indigo-300" : "text-gray-200 group-hover:text-indigo-300"
        }`}>
          {name}
        </h4>
      </div>
      
      {/* Media type indicator */}
      <div className="flex items-center text-sm mb-4 gap-2">
        <div className={`w-3 h-3 rounded-full ${
          data.mp3 ? 'bg-emerald-400' : 'bg-blue-400'
        }`}></div>
        <span className={isSelected ? "text-gray-300" : "text-gray-400"}>
          {data.mp3 ? "With Background Music" : "MIDI Only"}
        </span>
      </div>
      
      {/* Description if available (optional) */}
      {data.description && (
        <p className={`text-sm mb-4 line-clamp-2 ${
          isSelected ? "text-gray-300" : "text-gray-500 group-hover:text-gray-400"
        }`}>
          {data.description}
        </p>
      )}
      
      {/* Footer with tags and action button */}
      <div className="mt-auto pt-3 border-t border-gray-800">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">

            <span className={`text-xs px-2 py-1 rounded ${
              name.length % 2 === 0 
                ? 'bg-green-900 text-[#fff]' 
                : 'bg-[#aa9f22] text-[#000]'
            }`}>
              {data.movieName || "Unknown"}
            </span>
          </div>
          
          <button 
            className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
              isSelected 
                ? 'text-indigo-400 hover:text-indigo-300' 
                : 'text-gray-500 hover:text-indigo-400'
            }`}
     
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                isSelected ? 'text-indigo-400' : 'text-gray-500 group-hover:text-indigo-400'
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
              />
            </svg>
            Select this to Play
          </button>
        </div>
      </div>
      
      {/* Hover overlay effect */}
      {!isSelected && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent to-gray-800 opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity duration-300"></div>
      )}
    </div>
  );
};
// Replace the current exercises state and related code with this:





  const tamilNotationMap = {
    1: "S",
    2: "R₁",
    3: "R₂",
    4: "G₁",
    5: "G₂",
    6: "M₁",
    7: "M₂ ",
    8: "P",
    9: "D₁",
    10: "D₂",
    11: "N₁",
    12: "N₂'",
    // Add more as needed
  };
  
  const getTamilNotation = (midiNumber, rootMidi) => {
    const noteDiff = (midiNumber - rootMidi + 12) % 12;
    return tamilNotationMap[noteDiff + 1] || "";
  };
  const extractMidiNotes = async (midiUrl) => {
    try {
      const midi = await Midi.fromUrl(midiUrl);
      const notes = [];
      
      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          notes.push({
            name: note.name,
            time: note.time,
            duration: note.duration,
            midiNumber: note.midi
          });
        });
      });
      
      return notes;
    } catch (error) {
      console.error("Error extracting MIDI notes:", error);
      return [];
    }
  };
  // Enhanced note conversion functions
  const noteToMidiNumber = (noteName, octave) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = notes.indexOf(noteName);
    if (noteIndex === -1) return 60; // fallback to middle C
    return noteIndex + (octave + 1) * 12;
  };

  const midiToNoteName = (midiNumber) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    return notes[midiNumber % 12] + octave;
  };

  // Enhanced audio context initialization
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.7;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  // Convert MIDI note number to frequency
  const getNoteFrequency = (midiNote) => {
    const A4 = 440;
    return A4 * Math.pow(2, (midiNote - 69) / 12);
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
    const releaseTime = 0.01;
    
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
    (noteNames, highlightType) => {
      if (!Array.isArray(noteNames)) {
        noteNames = [noteNames];
      }
  
      noteNames.forEach(noteName => {
        if (
          !showNextExpected &&
          (highlightType === "next-expected" ||
            highlightType === "correct-and-expected")
        ) {
          return;
        }
  
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
            
            if (highlightType === "incorrect") {
              setTimeout(() => {
                key.classList.remove("incorrect");
              }, 200);
            }
          }
        }, 10);
      });
    },
    [showNextExpected]
  );

  // Start/stop metronome
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
        count = (count + 1) % timeSignature[0];
        setBeatCount(count);

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = count === 0 ? 880 : 440;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);

        startTime += interval;
      }, interval * 1000);
    }
    setMetronomeIsPlaying(!metronomeIsPlaying);
  }, [metronomeIsPlaying, bpm, timeSignature, initAudioContext]);

  // Handle BPM change
  const handleBpmChange = (e) => {
    const newBpm = parseInt(e.target.value);
    if (newBpm >= 50 && newBpm <= 250) {
      setBpm(newBpm);
      if (metronomeIsPlaying) {
        toggleMetronome();
        setTimeout(toggleMetronome, 100);
      }
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
      }
      if (audioRef.current) {
        audioRef.current.stop();
        audioRef.current.dispose();
        audioRef.current = null;
      }
      stopAllNotes();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

// Handle piano key mouse down
const handlePianoKeyMouseDown = useCallback(
  (noteName) => {
    if (!isYourTurn) return;

    const { noteName: playedNoteName } = playNote(noteName);
    const currentExpectedChord = currentNotes[currentNoteIndex];
    const nextChord = currentNotes[currentNoteIndex + 1];

    if (currentExpectedChord.includes(playedNoteName)) {
      // Always add the note to active keys
      const newActiveKeys = [...new Set([...activeKeys, playedNoteName])];
      setActiveKeys(newActiveKeys);
      
      // Check if all expected notes are pressed
      const allNotesPlayed = currentExpectedChord.every(note => 
        newActiveKeys.includes(note)
      );

      if (allNotesPlayed) {
        // For chord knowledge, we only mark as correct (no correct-and-expected)
        const highlightClass = selectedCategory === 'chordKnowledge' 
          ? "correct" 
          : (nextChord && nextChord.includes(playedNoteName) && showNextExpected)
            ? "correct-and-expected"
            : "correct";

        highlightKey(currentExpectedChord, highlightClass);
        setActiveKeys([]);
        const newIndex = currentNoteIndex + 1;
        setCurrentNoteIndex(newIndex);

        if (showNextExpected && newIndex < currentNotes.length) {
          setNextExpectedNote(currentNotes[newIndex]);
          highlightKey(currentNotes[newIndex], "next-expected");
        }

        if (newIndex >= currentNotes.length) {
          setTimeout(() => {
            toast.success("Finished! Great job!");
            setIsYourTurn(false);
            setIsPlaying(false)

              if (metronomeRef.current) {
                clearInterval(metronomeRef.current);
                metronomeRef.current = null;
              }
            setCurrentNoteIndex(0);
            setActiveKeys([]);
            setNextExpectedNote(null);
            clearAllKeyHighlights();
          }, 1000);
        }
      } else {
        highlightKey(playedNoteName, "correct");
      }
    } else {
      highlightKey(playedNoteName, "incorrect");
    }
  },
  [isYourTurn, currentNotes, currentNoteIndex, highlightKey, showNextExpected, playNote, activeKeys, selectedCategory]
);
  // Handle piano key mouse up
  const handlePianoKeyMouseUp = useCallback(
    (noteName) => {
      stopNote(noteName);
    },
    [stopNote]
  );
// Enhanced MIDI message handler
const handleMIDIMessage = useCallback(
  (message) => {
    const [command, noteValue, velocity] = message.data;
    
    if (command === 144 && velocity > 0) {
      const { noteName } = playNote(noteValue, null, velocity);
      
      if (isYourTurn) {
        const currentExpectedChord = currentNotes[currentNoteIndex];
        const nextChord = currentNotes[currentNoteIndex + 1];

        if (currentExpectedChord.includes(noteName)) {
          // Always add the note to active keys
          const newActiveKeys = [...new Set([...activeKeys, noteName])];
          setActiveKeys(newActiveKeys);
          
          // Check if all expected notes are pressed
          const allNotesPlayed = currentExpectedChord.every(note => 
            newActiveKeys.includes(note)
          );

          if (allNotesPlayed) {
            // For chord knowledge, we only mark as correct (no correct-and-expected)
            const highlightClass = selectedCategory === 'chordKnowledge' 
              ? "correct" 
              : (nextChord && nextChord.includes(noteName) && showNextExpected)
                ? "correct-and-expected"
                : "correct";

            highlightKey(currentExpectedChord, highlightClass);
            setActiveKeys([]);
            const newIndex = currentNoteIndex + 1;
            setCurrentNoteIndex(newIndex);

            if (showNextExpected && newIndex < currentNotes.length) {
              setNextExpectedNote(currentNotes[newIndex]);
              highlightKey(currentNotes[newIndex], "next-expected");
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
                setActiveKeys([]);
                setNextExpectedNote(null);
                clearAllKeyHighlights();
              }, 1000);
            }
          } else {
            highlightKey(noteName, "correct");
          }
        } else {
          highlightKey(noteName, "incorrect");
        }
      } else {
        setActiveKeys(prev => [...prev, noteName]);
        highlightKey(noteName, "active");
      }
    } else if (command === 128 || (command === 144 && velocity === 0)) {
      stopNote(noteValue);
      const noteName = midiToNoteName(noteValue);
      
      if (!isYourTurn) {
        setActiveKeys(prev => prev.filter(n => n !== noteName));
        document.querySelectorAll(".key8").forEach((key) => {
          if (key.dataset.note === noteName) {
            key.classList.remove("active");
          }
        });
      }
    }
  },
  [isYourTurn, currentNotes, currentNoteIndex, highlightKey, showNextExpected, playNote, stopNote, activeKeys, selectedCategory]
);

// Helper function to clear all highlights
const clearAllKeyHighlights = () => {
  document.querySelectorAll(".key8").forEach((key) =>
    key.classList.remove(
      "correct",
      "active",
      "incorrect",
      "next-expected",
      "correct-and-expected"
    )
  );
};


 
  // MIDI success handler
  const onMIDISuccess = (midiAccess) => {
    const inputs = Array.from(midiAccess.inputs.values());
    if (inputs.length > 0) {
      setMidiDevices(inputs);
      setMidiInput(inputs[0]);
      inputs[0].onmidimessage = handleMIDIMessage;
    }
  };
  useEffect(() => {
    return () => {
      stopAllNotes();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [selectedExercise, stopAllNotes,isPlaying]);
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

  useEffect(() => {
    setIsPlay(false);
    setShowNotes(false)

  }, [selectedCategory, selectedExercise]);

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
  }, []);

  // Update MIDI listener when input changes
  useEffect(() => {
    if (midiInput) {
      midiInput.onmidimessage = handleMIDIMessage;
    }
  }, [midiInput, handleMIDIMessage]);

  const playExercise = async () => {
    if (!selectedExercise) {
      toast.error("Please select an exercise first");
      return;
    }
  
    const exerciseData = exercises[selectedCategory][selectedExercise];
    setRootNote(exerciseData.root || "C"); // Set root note from exercise data
   // Use the Cloudflare R2 URLs directly
   const midiUrl = exerciseData.midi_url;
   const mp3Url = exerciseData.mp3_url;
    try {
      setIsPlaying(true);
      setIsPlay(false);
      
      // Cleanup any previous instances
      cleanupPlayback();
  
      // Initialize Tone.js if not already started
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
  
      // Load MIDI file
      const midi = await Midi.fromUrl(midiUrl);
      
      // Extract and store all MIDI notes for display
      const allMidiNotes = [];
      midi.tracks.forEach(track => {
        track.notes.forEach(note => {
          allMidiNotes.push({
            name: note.name,
            time: note.time,
            duration: note.duration,
            midiNumber: note.midi,
            velocity: note.velocity
          });
        });
      });
      setMidiNotes(allMidiNotes);
  
      const midiBpm = midi.header.tempos[0]?.bpm || 120;
      const midiTimeSignature = midi.header.timeSignatures[0]?.timeSignature || [4, 4];
  
      setBpm(midiBpm);
      setTimeSignature(midiTimeSignature);
      Tone.Transport.bpm.value = midiBpm;
  
      // Create a new synth instance
      const synth = new Tone.PolySynth(Tone.Synth, {
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 0.1
        }
      }).toDestination();
      synth.volume.value = -10;
  
      // Store synth in ref for cleanup
      synthRef.current = synth;
  
      // Group notes by time for playback
      const noteGroups = {};
      midi.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          const timeKey = note.time.toFixed(4);
          if (!noteGroups[timeKey]) {
            noteGroups[timeKey] = [];
          }
          noteGroups[timeKey].push(note);
        });
      });
  
      const sortedNoteGroups = Object.entries(noteGroups)
        .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
        .map(([_, notes]) => notes);
  
      // Set current notes for highlighting
      const allNotes = sortedNoteGroups.map(group => group.map(n => n.name));
      setCurrentNotes(allNotes);
      setCurrentNoteIndex(0);
  
      // Schedule notes for playback
      const scheduledEvents = [];
      sortedNoteGroups.forEach((noteGroup) => {
        const noteTime = noteGroup[0].time;
        const noteNames = noteGroup.map(note => note.name);
        
        const eventId = Tone.Transport.schedule((time) => {
          noteGroup.forEach(note => {
            synth.triggerAttackRelease(
              note.name,
              note.duration,
              time,
              note.velocity
            );
          });
          
          setActiveKeys(noteNames);
          highlightKey(noteNames, "active");
          
          Tone.Transport.schedule(() => {
            setActiveKeys([]);
          }, `+${note.duration}`);
        }, noteTime);
        
        scheduledEvents.push(eventId);
      });
  
      // Store scheduled events for cleanup
      scheduledEventsRef.current = scheduledEvents;
  
      // Handle MP3 playback
      if (mp3Url) {
        const player = new Tone.Player({
          url: mp3Url,
          onload: () => {
            player.volume.value = Tone.gainToDb(mp3Volume);
            Tone.Transport.start();
          },
          onerror: (e) => {
            console.error("MP3 load error:", e);
            Tone.Transport.start();
          }
        }).toDestination();
        
        player.autostart = true;
        audioRef.current = player;
      } else {
        Tone.Transport.start();
      }
  
      // Store the timeout ID for cleanup
      const duration = midi.duration;
      timeoutRef.current = setTimeout(() => {
        stopPlayback();
      }, duration * 1100);
  
    } catch (error) {
      console.error("Error in playExercise:", error);
      toast.error("Failed to load MIDI file");
      stopPlayback();
    }
  };
  
  // Helper function to stop playback and clean up
  const stopPlayback = () => {
    cleanupPlayback();
    setIsPlaying(false);
    setIsPlay(true);
  };
  
  // Helper function to clean up all resources
  const cleanupPlayback = () => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  
    // Stop and clear transport
    Tone.Transport.cancel();
    Tone.Transport.stop();
  
    // Clear scheduled events
    if (scheduledEventsRef.current) {
      scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
      scheduledEventsRef.current = null;
    }
  
    // Dispose synth
    if (synthRef.current) {
      synthRef.current.dispose();
      synthRef.current = null;
    }
  
    // Dispose audio player
    if (audioRef.current) {
      audioRef.current.stop();
      audioRef.current.dispose();
      audioRef.current = null;
    }
  
    // Reset active keys
    setActiveKeys([]);
  };
  

  useEffect(() => {
    return () => {
      document.querySelectorAll(".key8").forEach((key) => {
        key.classList.remove("next-expected", "correct-and-expected","active");
      });
      // Clean up Tone.js resources
      Tone.Transport.cancel();
      Tone.Transport.stop();
      
      if (audioRef.current) {
        audioRef.current.stop();
        audioRef.current.dispose();
      }
      
      // Clean up Web Audio API resources
      stopAllNotes();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      // Clean up metronome
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showNextExpected) {
      document.querySelectorAll(".key8").forEach((key) => {
        key.classList.remove("next-expected", "correct-and-expected");
      });
    } else if (isYourTurn && nextExpectedNote) {
      highlightKey(nextExpectedNote, "next-expected");
    }
  }, [showNextExpected, isYourTurn, nextExpectedNote, highlightKey]);

  // Start "Your Turn" mode
  const startYourTurn = useCallback(() => {
    if (currentNotes.length === 0) {
      toast.error("No exercise loaded");
      return;
    }
  
    setIsYourTurn(true);
    stopAllNotes();
    setCurrentNoteIndex(0);
  
    document.querySelectorAll(".key8").forEach((key) => {
      key.classList.remove(
        "correct",
        "active",
        "incorrect",
        "next-expected",
        "correct-and-expected"
      );
    });
  
    const firstChord = currentNotes[0];
    setNextExpectedNote(firstChord);
    if (showNextExpected) {
      highlightKey(firstChord, "next-expected");
    }
  }, [currentNotes, highlightKey, showNextExpected]);

  return (
    <div className="piano-container8 ">
      <h2 className="text-2xl font-mali my-2 bg-gradient-to-tr from-[#328ea3] to-[#32157F] p-3 text-white w-full text-center">
        Practice Exercises
      </h2>

      <div className="flex items-center justify-center w-full gap-5 my-4">
     {/* Modern Category Selector */}
<div className="category-selector">
  <div className="relative w-full max-w-xs">
  
    <div className="relative">
      <select
        value={selectedCategory}
        onChange={(e) => {
          setSelectedCategory(e.target.value);
          setSelectedExercise("");
          setCurrentNotes([]);
        }}
        className="text-sm lg:text-lg block w-full pl-4 pr-10 py-3  border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg shadow-sm transition-all duration-200 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiA2MTYxNjEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1jaGV2cm9uLWRvd24iPjxwYXRoIGQ9Im02IDkgNiA2IDYtNiIvPjwvc3ZnPg==')] bg-no-repeat bg-[right_0.75rem_center]"
      >
        <option value="noteKnowledge">Note </option>
        <option value="chordKnowledge">Chord </option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  </div>
</div>

<button
  onClick={() => {
    setIsExerciseModalOpen(true);
    setCurrentPage(1);
  }}
  className="text-white p-2 rounded-md font-montserrat bg-gradient-to-r from-pink-600 to-purple-600 hover:bg-gray-100 transition-colors flex items-center gap-2 w-auto text-sm lg:text-lg"
>
  {selectedExercise || "Select Exercise"}
</button>


{isExerciseModalOpen && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={() => setIsExerciseModalOpen(false)}
  >
    <div 
      className="bg-gradient-to-r from-[#FA6488] to-[#8477CE] rounded-lg shadow-xl w-full w-6xl h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal Header */}
      <div className="p-2 border-b sticky top-0 bg-white z-10">
        <div>
          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search exercises..."
                className="w-full pl-10 pr-4 py-2 border border-black rounded-lg focus:ring-2 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex justify-between items-">
              <button
                onClick={() => setIsExerciseModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="red">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Exercises Grid */}
      <div className="p-6 overflow-y-auto flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(exercises[selectedCategory])
            .filter(([exerciseName]) => 
              searchQuery === '' || 
              exerciseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (exercises[selectedCategory][exerciseName].description && 
               exercises[selectedCategory][exerciseName].description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .slice((currentPage - 1) * exercisesPerPage, currentPage * exercisesPerPage)
            .map(([exerciseName, exerciseData]) => (
              <ExerciseCard
                key={exerciseName}
                name={exerciseName}
                data={exerciseData}
                isSelected={selectedExercise === exerciseName}
                onSelect={() => {
                  setSelectedExercise(exerciseName);
                  setIsExerciseModalOpen(false);
                }}
                onPlay={() => {
                  setSelectedExercise(exerciseName);
                  playExercise();
                  setIsExerciseModalOpen(false);
                }}
              />
            ))}
        </div>
      </div>
      
      {/* Pagination */}
      <div className="p-4 border-t bg-gray-50 sticky bottom-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * exercisesPerPage + 1} to{' '}
            {Math.min(currentPage * exercisesPerPage, 
              Object.entries(exercises[selectedCategory])
                .filter(([exerciseName]) => 
                  searchQuery === '' || 
                  exerciseName.toLowerCase().includes(searchQuery.toLowerCase())).length)} of{' '}
            {Object.entries(exercises[selectedCategory])
              .filter(([exerciseName]) => 
                searchQuery === '' || 
                exerciseName.toLowerCase().includes(searchQuery.toLowerCase())).length} exercises
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            
            {Array.from({ 
              length: Math.ceil(
                Object.entries(exercises[selectedCategory])
                  .filter(([exerciseName]) => 
                    searchQuery === '' || 
                    exerciseName.toLowerCase().includes(searchQuery.toLowerCase())).length / exercisesPerPage
              ) 
            })
              .slice(0, 5) // Show max 5 page buttons
              .map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-md ${currentPage === i + 1 ? 'bg-[#FA6488] text-white' : 'hover:bg-gray-100'}`}
                >
                  {i + 1}
                </button>
              ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(
                prev + 1, 
                Math.ceil(
                  Object.entries(exercises[selectedCategory])
                    .filter(([exerciseName]) => 
                      searchQuery === '' || 
                      exerciseName.toLowerCase().includes(searchQuery.toLowerCase())).length / exercisesPerPage
                )
              ))}
              disabled={currentPage === Math.ceil(
                Object.entries(exercises[selectedCategory])
                  .filter(([exerciseName]) => 
                    searchQuery === '' || 
                    exerciseName.toLowerCase().includes(searchQuery.toLowerCase())).length / exercisesPerPage
              )}
              className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

        <div className="toggle-next-expected flex items-center space-x-4">
          <label className="text-xs  font-mali">
          Show Next Note 
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
        {selectedExercise && exercises[selectedCategory][selectedExercise]?.pdf_url && (
      <a
        href={exercises[selectedCategory][selectedExercise].pdf_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
          />
        </svg>
        View PDF
      </a>
    )}
  <button
  onClick={() => setShowNotes(!showNotes)}
  className={`flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium ${
    !isPlay || isPlaying ? "opacity-50 cursor-not-allowed" : ""
  }`}
  disabled={!isPlay || isPlaying}
>
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className="h-5 w-5" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
      />
    </svg>
    {showNotes ? "Hide Notes" : "Show Notes"}
  </button>
      </div>
      {showNotes && midiNotes.length > 0 && (
  <div className="notes-display w-full mx-auto mt-4 p-4 bg-gray-100 rounded-lg">
    <h3 className="font-semibold mb-2">Exercise Notes (Root: {rootNote})</h3>
    
    <div className="space-x-2 flex flex-wrap bg-white">
      {(() => {
        // Default musical parameters (4/4 time at 120 BPM)
        const defaultBPM = 120;
        const beatsPerBar = 4;
        const barDuration = beatsPerBar * (60 / defaultBPM);

        // Create 4 bars
        return Array.from({ length: 4 }).map((_, barIndex) => {
          const barStart = barIndex * barDuration;
          const barEnd = (barIndex + 1) * barDuration;
          
          const barNotes = midiNotes.filter(note => 
            note.time >= barStart && note.time < barEnd
          );

          if (barNotes.length === 0) {
            return (
              <div key={barIndex} className="flex items-center justify-center p-2 bg-white rounded">
                <span className="text-gray-400">| 𝄽 |</span>
              </div>
            );
          }

          // Group notes by quantized time
          const timeSlots = {};
          barNotes.forEach(note => {
            const positionInBar = note.time - barStart;
            const quantizedTime = (Math.round(positionInBar * 4) / 4);
            
            timeSlots[quantizedTime] = timeSlots[quantizedTime] || [];
            timeSlots[quantizedTime].push(note);
          });

          // Convert timeSlots to sorted array
          const sortedSlots = Object.entries(timeSlots)
            .sort((a, b) => a[0] - b[0]);

          // Build bar content
          let barContent = [];
          sortedSlots.forEach(([time, notes], timeIndex) => {
            if (timeIndex > 0) {
              barContent.push(
                <span key={`sep-${timeIndex}`} className="mx-1"> </span>
              );
            }

            barContent.push(
              <div key={`notes-${timeIndex}`} className="flex space-x-1">
                {notes.map((note, noteIndex) => (
                  <div key={noteIndex} className="text-center px-1">
                    <div className="font-medium">{note.name}</div>
                    <div className="text-blue-600 ">
                      {getTamilNotation(note.midiNumber, noteToMidiNumber(rootNote, 4))}
                    </div>
                  </div>
                ))}
              </div>
            );
          });

          return (
            <div key={barIndex} className="flex items-center p-2 rounded">
              <div className="flex items-center border-r-2 border-black pr-3">
                {barContent }
              </div>
            </div>
          );
        });
      })()}
    </div>
  </div>
)}
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
            } text-white ${ !isYourTurn ? "opacity-50 cursor-not-allowed" : ""}`}
           
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
            {bpm.toFixed(0)}
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
           {/* MP3 Volume Control (only shown for chord exercises) */}
           {selectedCategory === "chordKnowledge" && exercises[selectedCategory][selectedExercise]?.mp3 && (
          <div className="flex items-center gap-2">
            <label className="font-semibold">BG Volume:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={mp3Volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setMp3Volume(newVolume);
                if (audioRef.current) {
                  audioRef.current.volume = newVolume;
                }
              }}
              className="w-24"
            />
          </div>
        )}

      </div>

      {/* Piano UI */}
      <div className="piano8">
        {["4", "5","6"].map((octave) =>
          whiteKeys.map((key) => (
            <div
              key={key + octave}
              className={`white-key8 key8 ${
                activeKeys.includes(key + octave) ? "active" : ""
              }`}
              onMouseDown={() => handlePianoKeyMouseDown(key + octave)}
              onMouseUp={() => handlePianoKeyMouseUp(key + octave)}
              data-note={key + octave}
            >
              {key + octave}
            </div>
          ))
        )}

        {["4", "5","6"].map((octave,octaveIndex) =>
          Object.entries(blackKeys).map(([key, pos]) => (
            <div
              key={key + octave}
              className={`black-key8 key8 ${
                activeKeys.includes(key + octave) ? "active" : ""
              }`}
              onTouchStart={() => handlePianoKeyMouseDown(key + octave)}
              onTouchEnd={() => handlePianoKeyMouseUp(key + octave)}
              data-note={key + octave}
              style={{
                left: `${(pos + octaveIndex * 7) * (100 / 21) + 3}%`,
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
          {isPlaying
            ? "Playing..."
            : `▶ Play ${selectedExercise || "Exercise"}`}
        </button>

        <button
          onClick={startYourTurn}
          className={`bg-[#008c7a] text-white py-2 px-6 rounded-lg hover:bg-gradient-to-tr hover:from-[#00d2b4] hover:to-[#008c7a] transition duration-300 font-mali ${
            !isPlay || isPlaying ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!isPlay || isPlaying} 
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
          width: 3.57%;
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
        .toggle-next-expected button {
          transition: background-color 0.3s ease;
        }
        .toggle-next-expected button:active {
          transform: scale(0.95);
        }
        .metronome-indicator div {
          transition: background-color 0.2s ease;
        }
        .metronome-indicator.active {
          transform: scale(1.1);
        }
          pdf-link {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #3b82f6;
    font-weight: 500;
    transition: color 0.2s;
  }
  .pdf-link:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
    .notes-display {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
  }
  .notes-display::-webkit-scrollbar {
    width: 6px;
  }
  .notes-display::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  .notes-display::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  .notes-display::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
      `}</style>
    </div>
  );
};

export default Play;