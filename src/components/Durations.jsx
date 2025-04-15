import { useState, useRef, useCallback, useEffect } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MetronomeIcon from '@mui/icons-material/AccessTime';

const MSheet = () => {
  const [selectedNoteKnowledge, setSelectedNoteKnowledge] = useState(null);
  const [osmd, setOsmd] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [notesReady, setNotesReady] = useState(false);
  const [isOsmdReady, setIsOsmdReady] = useState(false);
  const sheetMusicDiv = useRef(null);
  const synth = useRef(null);
  const metronomeSynth = useRef(null);
  const graphicalNotes = useRef([]);
  const [midiFile, setMidiFile] = useState(null);
  const activeKeysRef = useRef({});
  const transportEventsRef = useRef([]);
  const currentNoteIndexRef = useRef(0);
  const originalNoteColorsRef = useRef({});
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState([4, 4]);
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);
  const [beatCount, setBeatCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  
  // Embedded files for Note Knowledge and Chord Knowledge
  const noteKnowledgeFiles = {

    "2/4": {
      xml: "public/24.xml",
      midi: "public/24.mid",
    },
    "3/4": {
      xml: "./public/34.xml",
      midi: "/public/34.mid",
    },
    "6/8": {
      xml: "./public/68.xml",
      midi: "/public/68.mid",
    },
    "5/8": {
      xml: "./public/58.xml",
      midi: "/public/58.mid",
    },
    "7/8": {
      xml: "./public/78.xml",
      midi: "/public/78.mid",
    },
  };

  useEffect(() => {
    // Initialize Tone.js synth and metronome
    synth.current = new Tone.PolySynth(Tone.Synth, {
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.5,
      }
    }).toDestination();
    synth.current.volume.value = -10 + (volume * 20); // Convert 0-1 to -20-0 dB
    
    metronomeSynth.current = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 1,
      oscillator: { type: "square" },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.1 }
    }).toDestination();
    metronomeSynth.current.volume.value = -5;
    
    // Initialize OSMD
    if (sheetMusicDiv.current) {
      const newOsmd = new OpenSheetMusicDisplay(sheetMusicDiv.current, {
        autoResize: true,
        backend: "svg",
        drawTitle: false,
        drawSubtitle: false,
        drawComposer: false,
        drawLyricist: false,
      });
      setOsmd(newOsmd);
      setIsOsmdReady(true);
    }

    return () => {
      cleanupPlayback(true); // true indicates component unmount
      if (synth.current) synth.current.dispose();
      if (metronomeSynth.current) metronomeSynth.current.dispose();
    };
  }, [volume]);

  useEffect(() => {
    const handleTransportStart = () => {
      setIsPlaying(true);
      if (metronomeEnabled) {
        startMetronome();
      }
    };

    const handleTransportStop = () => {
      setIsPlaying(false);
      stopMetronome();
    };

    Tone.Transport.on("start", handleTransportStart);
    Tone.Transport.on("stop", handleTransportStop);
    Tone.Transport.on("pause", handleTransportStop);

    return () => {
      Tone.Transport.off("start", handleTransportStart);
      Tone.Transport.off("stop", handleTransportStop);
      Tone.Transport.off("pause", handleTransportStop);
    };
  }, [metronomeEnabled]);

  const startMetronome = () => {
    if (!metronomeEnabled) return;
    
    const [beatsPerMeasure, beatUnit] = timeSignature;
    setMetronomeIsPlaying(true);
    setBeatCount(0);
    
    // Clear any existing metronome events
    transportEventsRef.current = transportEventsRef.current.filter(
      id => !id.toString().includes('metronome')
    );
  
    // Schedule metronome clicks based on the time signature
    const clickInterval = Tone.Transport.scheduleRepeat(time => {
      const currentBeat = Math.floor(Tone.Transport.position.split(':')[0]);
      const beatInMeasure = currentBeat % beatsPerMeasure;
      setBeatCount(beatInMeasure + 1);
      
      // Stronger click on first beat, others softer
      if (beatInMeasure === 0) {
        metronomeSynth.current.triggerAttackRelease("G5", "32n", time, 1);
      } else {
        metronomeSynth.current.triggerAttackRelease("C5", "32n", time, 0.5);
      }
    }, `${beatUnit}n`, 0); // Use the beat unit from time signature
  
    transportEventsRef.current.push(clickInterval);
  };

  const stopMetronome = () => {
    setMetronomeIsPlaying(false);
    setBeatCount(0);
  };

  const cleanupPlayback = (isUnmount = false) => {
    // Clear all active key highlights
    Object.keys(activeKeysRef.current).forEach(key => {
      clearTimeout(activeKeysRef.current[key]);
    });
    activeKeysRef.current = {};
    setActiveKey(null);
    
    // Clear all scheduled transport events
    transportEventsRef.current.forEach(id => {
      if (Tone.Transport) {
        Tone.Transport.clear(id);
      }
    });
    transportEventsRef.current = [];
    
    // Reset note index
    currentNoteIndexRef.current = 0;
    
    // Stop any ongoing playback if Tone exists
    if (Tone.Transport && !isUnmount) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;
    }
    
    // Reset note colors in sheet music
    resetNoteColors();
    
    // Stop metronome
    stopMetronome();
    setIsPlaying(false);
  };

  const resetNoteColors = () => {
    const svgContainer = document.querySelector('#sheet-music-container #osmdSvgPage1');
    if (!svgContainer) return;
  
    // Restore all notes that we've stored original colors for
    Object.entries(originalNoteColorsRef.current).forEach(([id, color]) => {
      const element = svgContainer.querySelector(`#${id}`);
      if (element) {
        element.setAttribute('fill', color);
        element.setAttribute('stroke', color === 'black' ? 'black' : 'black');
      }
    });
  
    // Also reset any temporary notes that might have been highlighted
    const allNoteElements = svgContainer.querySelectorAll('.vf-stem path');
    allNoteElements.forEach(element => {
      if (!originalNoteColorsRef.current[element.id]) {
        element.setAttribute('fill', 'black');
        element.setAttribute('stroke', 'black');
      }
    });
  
    originalNoteColorsRef.current = {};
  };
  
  const highlightSheetNote = (duration) => {
    if (!osmd || !osmd.sheet) {
      console.error("OSMD or sheet music is not fully loaded.");
      return;
    }
  
    const svgContainer = document.querySelector('#sheet-music-container #osmdSvgPage1');
    if (!svgContainer) {
      console.error("SVG container not found");
      return;
    }
  
    const noteElements = svgContainer.querySelectorAll('.vf-stem path');

    if (noteElements.length === 0) {
      console.error("No note elements found");
      return;
    }
  
    if (currentNoteIndexRef.current < noteElements.length) {
      const noteElement = noteElements[currentNoteIndexRef.current];
      const noteId = noteElement.getAttribute('id') || `temp-note-${currentNoteIndexRef.current}`;
      
      // Ensure the element has an ID
      noteElement.setAttribute('id', noteId);
      console.log(noteId);
      
      // Save original color if not already saved
      if (!originalNoteColorsRef.current[noteId]) {
        const currentFill = noteElement.getAttribute('fill');
        originalNoteColorsRef.current[noteId] = currentFill || 'black';
      }
  
      // Highlight the note
      noteElement.setAttribute('fill', '#FF3459'); // Using blue-500
      noteElement.setAttribute('stroke', '#FF3459');
  
      // Clear any existing timeout for this note
      if (activeKeysRef.current[`sheet-note-${noteId}`]) {
        clearTimeout(activeKeysRef.current[`sheet-note-${noteId}`]);
      }
  
      // Set timeout to revert color
      const timeoutId = setTimeout(() => {
        noteElement.setAttribute('fill', originalNoteColorsRef.current[noteId]);
        noteElement.setAttribute('stroke', 'black');
      }, duration * 1000);
      
      // Store timeout for cleanup
      activeKeysRef.current[`sheet-note-${noteId}`] = timeoutId;
  
      currentNoteIndexRef.current++;
    } else {
      currentNoteIndexRef.current = 0;
    }
  };

  const handleNoteKnowledgeChange = (event) => {
    cleanupPlayback();
    const selectedOption = event.target.value;
    setSelectedNoteKnowledge(selectedOption);

    if (selectedOption && noteKnowledgeFiles[selectedOption]) {
      const { xml, midi } = noteKnowledgeFiles[selectedOption];
      loadSheetMusicFromUrl(xml);
      setMidiFileFromUrl(midi);
    }
  };

  const loadSheetMusicFromUrl = async (url) => {
    try {
      const response = await fetch(url);
      const content = await response.text();
      loadSheetMusicContent(content);
    } catch (error) {
      console.error("Error loading sheet music from URL:", error);
      alert("Error loading sheet music. Please check the file URL.");
    }
  };

  const setMidiFileFromUrl = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      setMidiFile(new Blob([arrayBuffer], { type: "audio/midi" }));
    } catch (error) {
      console.error("Error loading MIDI file from URL:", error);
      alert("Error loading MIDI file. Please check the file URL.");
    }
  };

  const loadSheetMusicContent = (content) => {
    if (!osmd) {
      console.error("OSMD is not initialized.");
      return;
    }
console.log(osmd);

    osmd
      .load(content)
      .then(() => {
        console.log("Sheet music loaded successfully.");
        return osmd.render();
      })
      .then(() => {
        osmd.sheet.title.print = false;
        osmd.render();
        console.log("Sheet music rendered successfully.");
        extractGraphicalNotes();
      })
      .catch((error) => {
        console.error("Error loading sheet music:", error);
        alert("Error loading sheet music. Please check the file format.");
      });
  };

  const extractGraphicalNotes = () => {
    if (!osmd || !osmd.sheet) {
      console.error("OSMD is not fully loaded.");
      return;
    }

    graphicalNotes.current = [];

    osmd.sheet.Instruments.forEach((instrument) => {
      instrument.staves.forEach((staff) => {
        staff.voices.forEach((voice) => {
          voice.voiceEntries.forEach((voiceEntry) => {
            voiceEntry.notes.forEach((note) => {
              if (note.pitch) {
                const halfTone = note.pitch.halfTone;
                const noteName = getNoteNameFromHalfTone(halfTone);

                if (note.graphicalNote && note.graphicalNote.svgElement) {
                  const noteId = `note-${graphicalNotes.current.length}`;
                  note.graphicalNote.svgElement.setAttribute("id", noteId);
                  note.graphicalNote.svgElement.setAttribute("fill", "red");

                  graphicalNotes.current.push({
                    noteName,
                    note,
                    graphicalNote: note.graphicalNote,
                    noteId,
                  });
                }
              }
            });
          });
        });
      });
    });

    console.log("Graphical notes extracted:", graphicalNotes.current);
    setNotesReady(true);
  };

  const getNoteNameFromHalfTone = (halfTone) => {
    const noteNames = [
      "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
    ];
    const octave = Math.floor(halfTone / 12);
    const noteIndex = halfTone % 12;
    return `${noteNames[noteIndex]}${octave}`;
  };

  const highlightPianoKey = useCallback((noteName, isActive, duration = 0.5) => {
    if (activeKeysRef.current[noteName]) {
      clearTimeout(activeKeysRef.current[noteName]);
      delete activeKeysRef.current[noteName];
    }

    if (isActive) {
      setActiveKey(noteName);
      activeKeysRef.current[noteName] = setTimeout(() => {
        setActiveKey(prev => prev === noteName ? null : prev);
        delete activeKeysRef.current[noteName];
      }, duration * 1000);
    } else {
      setActiveKey(prev => prev === noteName ? null : prev);
    }
  }, []);

  const playMidiFile = async () => {
    if (!midiFile) {
      alert("Please select a category first.");
      return;
    }
  
    if (!notesReady) {
      alert("Sheet music is not fully loaded yet. Please wait.");
      return;
    }
  
    cleanupPlayback();
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const midi = new Midi(arrayBuffer);
  
        // Set BPM from MIDI file (use first tempo change or default to 120)
        const initialBpm = midi.header.tempos[0]?.bpm || 120;
        setBpm(initialBpm);
        Tone.Transport.bpm.value = initialBpm;
  
        // Set time signature from MIDI file (use first time signature or default to 4/4)
        const initialTimeSignature = midi.header.timeSignatures[0]?.timeSignature || [4, 4];
        setTimeSignature(initialTimeSignature);
  
        // Rest of your playback logic...
        midi.tracks.forEach((track) => {
          track.notes.forEach((note) => {
            const eventId = Tone.Transport.scheduleOnce((time) => {
              synth.current.triggerAttackRelease(note.name, note.duration, time);
              highlightPianoKey(note.name, true, note.duration);
              highlightSheetNote(note.duration);
            }, note.time);
            
            transportEventsRef.current.push(eventId);
          });
        });
  
        // Add end callback
        const endEvent = Tone.Transport.scheduleOnce(() => {
          cleanupPlayback();
        }, midi.duration);
  
        transportEventsRef.current.push(endEvent);
  
        // Start playback
        Tone.Transport.start();
      } catch (error) {
        console.error("Error playing MIDI:", error);
        cleanupPlayback();
      }
    };
    reader.readAsArrayBuffer(midiFile);
  };

  const stopPlayback = () => {
    cleanupPlayback();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      if (Tone.Transport.state === 'paused') {
        Tone.Transport.start();
      } else {
        playMidiFile();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <MusicNoteIcon className="text-3xl" />
              <h1 className="text-2xl md:text-3xl font-bold">Music Note Duration</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Note Knowledge Dropdown */}
            <h6 className="text-lg md:text-xl font-bold">Select any👉</h6>

              <select
                onChange={handleNoteKnowledgeChange}
                value={selectedNoteKnowledge || ""}
                className="px-4 py-2 border border-blue-300 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 backdrop-blur-sm"
              >
                <option value="" className="text-gray-800">Select Note Knowledge</option>
                {Object.keys(noteKnowledgeFiles).map((option) => (
                  <option key={option} value={option} className="text-gray-800">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  isPlaying 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPlaying ? (
                  <>
                    <PauseIcon className="text-lg" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <PlayArrowIcon className="text-lg" />
                    <span>Play</span>
                  </>
                )}
              </button>
              
              <button
                onClick={stopPlayback}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg flex items-center gap-2 transition-colors"
              >
                <StopIcon className="text-lg" />
                <span>Stop</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Metronome Control */}
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <MetronomeIcon className="text-blue-600" />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={metronomeEnabled}
                    onChange={(e) => setMetronomeEnabled(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Metronome
                </label>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                {volume > 0 ? (
                  <VolumeUpIcon className="text-blue-600" />
                ) : (
                  <VolumeOffIcon className="text-gray-500" />
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-24 accent-blue-600"
                />
              </div>

              {/* BPM and Time Signature Display */}
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  {bpm.toFixed(0)} BPM
                </span>
                <span className="text-sm font-medium text-gray-500">|</span>
                <span className="text-sm font-medium text-gray-700">
                  {timeSignature[0]}/{timeSignature[1]}
                </span>
              </div>
            </div>
          </div>

        
        </div>

        {/* Sheet Music Container */}
        <div
          ref={sheetMusicDiv}
          id="sheet-music-container"
          className="p-4 bg-white h-[500px] overflow-auto"
        ></div>

        {/* Status Bar */}
        <div className="bg-gray-800 text-white p-3 text-sm flex justify-between items-center">
          <div>
            {selectedNoteKnowledge ? (
              <span className="text-green-400">Loaded: {selectedNoteKnowledge}</span>
            ) : (
              <span className="text-yellow-400">No sheet selected</span>
            )}
          </div>
          <div>
            {isPlaying ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span>Playing</span>
              </span>
            ) : (
              <span className="text-gray-400">Ready</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MSheet;