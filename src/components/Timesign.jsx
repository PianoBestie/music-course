import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
// Inside your component:

const noteSymbols = {
  Whole: { note: '𝅝', rest: '𝄻' },
  Half: { note: '𝅗𝅥', rest: '𝄼' },
  Quarter: { note: '𝅘𝅥', rest: '𝄽' },
  Eighth: { note: '𝅘𝅥𝅮', rest: '𝄾' },
  Sixteenth: { note: '𝅘𝅥𝅯', rest: '𝄿' }
};

const noteDurations = {
  '4/4': {
    Whole: 4,      // Fills entire measure
    Half: 2,       // Half measure
    Quarter: 1,    // One beat
    Eighth: 0.5,   // Half beat
    Sixteenth: 0.25 // Quarter beat
  }
};

export default function MusicVisualizer() {
  const [timeSig] = useState('4/4');
  const [noteType, setNoteType] = useState('Quarter');
  const [bpm, setBpm] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState(0);
  const [activeBeat, setActiveBeat] = useState(0);
  const [notePattern, setNotePattern] = useState([]);
  const navigate = useNavigate();

  // Audio setup
  const [synth, setSynth] = useState(null);
  const [click, setClick] = useState(null);

  useEffect(() => {
    const c = new Tone.PolySynth(Tone.Synth).toDestination();
    c.volume.value = -10;
    
    const s = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 1,
      oscillator: { type: "square" },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0.01,
        release: 0.01,
        attackCurve: "linear"
      }
    }).toDestination();
    s.volume.value = -12;
    
    setSynth(s);
    setClick(c);
    return () => {
      s.dispose();
      c.dispose();
    };
  }, []);

  // Initialize note pattern when note type changes
  useEffect(() => {
    const beats = 4;
    const duration = noteDurations[timeSig][noteType];
    const noteCount = Math.max(1, Math.floor(beats / duration));
    setNotePattern(Array(noteCount).fill(true));
    setActiveNote(0);
    setActiveBeat(0);
  }, [noteType, timeSig]);

  const toggleNoteRest = (index) => {
    if (!isPlaying) {
      const newPattern = [...notePattern];
      newPattern[index] = !newPattern[index];
      setNotePattern(newPattern);
    }
  };

  useEffect(() => {
    if (!synth || !click) return;
  
    const beats = 4; // Fixed for 4/4 time
    const duration = noteDurations[timeSig][noteType];
    const notesPerMeasure = duration ? beats / duration : 0;
    
    // Determine the smallest subdivision needed
    const subdivisions = noteType === 'Sixteenth' ? 4 : 
                       noteType === 'Eighth' ? 2 : 1;
    
    let beatCount = 0;
    
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.cancel();
  
    const schedule = (time) => {
      const currentSubdivision = beatCount % subdivisions;
      const currentBeat = Math.floor(beatCount / subdivisions) % beats;
      
      setActiveBeat(currentBeat);
      
      // Metronome clicks
      if (currentSubdivision === 0) {
        synth.triggerAttackRelease('C5', '16n', time, 0.5); // Strong beat
      } else {
        synth.triggerAttackRelease('C4', '16n', time, 0.3); // Weak subdivision
      }
  
      // Note highlighting
      if (duration && beatCount % (subdivisions * duration) === 0) {
        const noteIndex = Math.floor(beatCount / (subdivisions * duration)) % notesPerMeasure;
        setActiveNote(noteIndex);
        if (notePattern[noteIndex]) {
          click.triggerAttackRelease('D5', '16n', time);
        }
      }
  
      beatCount++;
    };
  
    // Schedule the loop to run indefinitely with the correct interval
    const interval = noteType === 'Sixteenth' ? '16n' : 
                   noteType === 'Eighth' ? '8n' : '4n';
    
    Tone.Transport.scheduleRepeat(schedule, interval);
  
    if (isPlaying) {
      Tone.start();
      Tone.Transport.start();
    } else {
      Tone.Transport.stop();
      setActiveBeat(0);
      setActiveNote(0);
    }
  
    return () => {
      Tone.Transport.cancel();
    };
  }, [isPlaying, timeSig, noteType, bpm, synth, click, notePattern]);

  const getVisualization = () => {
    const beats = 4;
    const duration = noteDurations[timeSig][noteType];
    const noteCount = Math.max(1, Math.floor(beats / duration));
    
    return Array.from({ length: noteCount }).map((_, i) => (
      <div
        key={i}
        className={`note-box ${activeNote === i ? 'active' : ''} ${notePattern[i] ? 'note' : 'rest'}`}
        style={{ width: `${100 / noteCount}%` }}
        onClick={() => toggleNoteRest(i)}
      >
        {notePattern[i] ? noteSymbols[noteType].note : noteSymbols[noteType].rest}
      </div>
    ));
  };

  return (
    <div className="music-visualizer">
  <h1 className="font-spacegrotesk text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
    Music Duration Visualizer (4/4 Only)
  </h1>
  
  <div className="flex flex-col gap-6 mb-8">
    
    <div className="flex flex-wrap gap-3 justify-center">
      {Object.keys(noteSymbols).map((note) => (
        <button
          key={note}
          onClick={() => setNoteType(note)}
          className={`font-urbanist font-semibold tracking-wide rounded-xl px-4 py-2 transition-all duration-200 ${
            noteType === note
              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md'
              : 'border-2 border-indigo-400 text-indigo-600 bg-white hover:bg-indigo-50'
          }`}
        >
          {note} {noteSymbols[note].note}/{noteSymbols[note].rest}
        </button>
      ))}

    </div>

 
  </div>

  <div className="text-center">
    <p className="font-dmsans text-gray-500 italic text-sm md:text-base">
      Click on notes to toggle between notes and rests
    </p>
  </div>
      <div className="visualization">
        <div className="notes">{getVisualization()}</div>
        <div className="metronome">
          {[1, 2, 3, 4].map((beat, i) => (
            <div
              key={i}
              className={`beat ${activeBeat === i ? 'active' : ''}`}
            >
              {beat}
            </div>
          ))}
        </div>
      </div>
      <div className='flex gap-5 mt-3'>
      <button
      onClick={() => setIsPlaying(!isPlaying)}
      className={`w-full font-manrope font-bold text-lg py-3 px-8 rounded-xl mx-auto transition-all duration-300 ${
        isPlaying
          ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg hover:shadow-xl'
          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl'
      }`}
    >
      {isPlaying ? 'Stop' : 'Play'}
    </button>
      <button
  onClick={() => navigate('/durations')}
  className={`font-manrope font-bold text-lg py-3 px-8 rounded-xl mx-auto transition-all duration-300 
    w-full bg-gradient-to-r from-indigo-500 to-teal-600 text-white shadow-lg hover:shadow-xl`}
>
  Click for More Stuffs ...
</button>
</div>
      <style jsx='true'>{`
        .music-visualizer {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          align-items: center;
        }
        .dropdown {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .bpm-control {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .bpm-control input {
          width: 60px;
          padding: 5px;
        }
        .instructions {
          margin-bottom: 10px;
          font-style: italic;
          color: #666;
        }
        .visualization {
          border: 1px solid #ccc;
          padding: 20px;
          border-radius: 5px;
        }
        .notes {
          display: flex;
          height: 100px;
          margin-bottom: 20px;
        }
        .note-box {
          border: 1px solid #999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          background: #eee;
          cursor: pointer;
          transition: all 0.2s;
        }
        .note-box.note {
          background: #f0f0f0;
        }
        .note-box.rest {
          background: #e0e0e0;
        }
        .note-box.note.active {
       background: #2196F3;
          color: white;
        }
        .note-box.rest.active {
          background: #FF5722;
          color: white;
        }
        .metronome {
          display: flex;
          gap: 5px;
        }
        .beat {
          flex: 1;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ddd;
          font-size: 24px;
          font-weight: bold;
        }
        .beat.active {
          background: #2196F3;
          color: white;
        }
      `}</style>
    </div>
  );
}