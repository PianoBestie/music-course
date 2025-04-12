import { useState, useRef, useEffect } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { Midi } from "@tonejs/midi";
import * as Tone from "tone";
import JSZip from "jszip"; // For handling .mxl files

const MSheet = () => {
  const [sheetFile, setSheetFile] = useState(null); // For sheet music (XML/MXL)
  const [midiFile, setMidiFile] = useState(null); // For MIDI playback
  const [osmd, setOsmd] = useState(null);
  const [activeKey, setActiveKey] = useState(null); // For piano key highlighting
  const sheetMusicDiv = useRef(null);
  const synth = useRef(new Tone.Synth().toDestination()); // Tone.js synthesizer
  const graphicalNotes = useRef([]); // Store graphical notes for highlighting

  // Piano UI state and functions
  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];
  const blackKeys = { "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5 };

  useEffect(() => {
    if (sheetMusicDiv.current) {
      const newOsmd = new OpenSheetMusicDisplay(sheetMusicDiv.current, {
        autoResize: true,
        backend: "svg",
      });
      setOsmd(newOsmd);
    }

    // Initialize Tone.js synthesizer and pre-warm the audio context
    Tone.start();
  }, []);

  const handleSheetFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setSheetFile(selectedFile);
      if (selectedFile.name.endsWith(".mxl")) {
        loadMXLFile(selectedFile);
      } else if (selectedFile.name.endsWith(".xml")) {
        loadXMLFile(selectedFile);
      } else {
        alert("Please upload a valid .mxl or .xml file for sheet music.");
      }
    }
  };

  const handleMidiFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setMidiFile(selectedFile);
      if (!selectedFile.name.endsWith(".mid")) {
        alert("Please upload a valid .mid file for MIDI playback.");
      }
    }
  };

  const loadXMLFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      console.log("Loaded XML content:", content);
      if (osmd) {
        osmd.load(content)
          .then(() => {
            console.log("Sheet music loaded successfully.");
            osmd.render();

            // Add a delay to ensure rendering is complete
            setTimeout(() => {
              extractGraphicalNotes();
            }, 500); // 500ms delay
          })
          .catch((error) => {
            console.error("Error loading sheet music:", error);
            alert("Error loading sheet music. Please check the file format.");
          });
      }
    };
    reader.readAsText(file);
  };

  const loadMXLFile = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const zip = await JSZip.loadAsync(e.target.result);

        // Find the actual score XML file inside the MXL zip
        let xmlFileName = Object.keys(zip.files).find(
          (name) =>
            name.toLowerCase().endsWith(".xml") && name !== "container.xml"
        );

        if (xmlFileName) {
          const xmlContent = await zip.files[xmlFileName].async("text");
          console.log("Extracted Score XML content:", xmlContent);

          if (osmd) {
            osmd.load(xmlContent)
              .then(() => {
                console.log("Sheet music loaded successfully.");
                osmd.render();

                // Add a delay to ensure rendering is complete
                setTimeout(() => {
                  extractGraphicalNotes();
                }, 500); // 500ms delay
              })
              .catch((error) => {
                console.error("Error displaying sheet music:", error);
                alert("Error loading sheet music. Please check the file format.");
              });
          }
        } else {
          console.error("No valid MusicXML file found in the .mxl archive.");
          alert("Invalid .mxl file: No MusicXML found.");
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error processing .mxl file:", error);
      alert("Error processing .mxl file. Please check the file format.");
    }
  };

  const extractGraphicalNotes = () => {
    if (!osmd || !osmd.graphic || !osmd.graphic.measureList) {
      console.error("OSMD is not fully loaded or measureList is missing.");
      return;
    }

    graphicalNotes.current = []; // Reset graphical notes

    // Traverse the measureList
    osmd.graphic.measureList.forEach((measure) => {
      if (measure && measure.staffEntries) {
        measure.staffEntries.forEach((staffEntry) => {
          if (staffEntry && staffEntry.graphicalVoiceEntries) {
            staffEntry.graphicalVoiceEntries.forEach((voiceEntry) => {
              if (voiceEntry && voiceEntry.graphicalNotes) {
                voiceEntry.graphicalNotes.forEach((graphicalNote) => {
                  if (graphicalNote.sourceNote) {
                    graphicalNotes.current.push(graphicalNote);
                  }
                });
              }
            });
          }
        });
      }
    });

    console.log("Graphical notes extracted:", graphicalNotes.current);

    // Debug: Log the first few notes
    if (graphicalNotes.current.length > 0) {
      graphicalNotes.current.slice(0, 5).forEach((note, index) => {
        console.log(`Note ${index + 1}:`, note.sourceNote);
      });
    } else {
      console.warn("No graphical notes found. Check the MusicXML file or rendering process.");
    }
  };

  const playMidiFile = async () => {
    if (!midiFile) {
      alert("Please upload a MIDI file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      const midi = new Midi(arrayBuffer);

      // Schedule MIDI notes
      midi.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          Tone.Transport.scheduleOnce((time) => {
            synth.current.triggerAttackRelease(note.name, note.duration, time);
            highlightPianoKey(note.name, true, note.duration); // Highlight piano key
            highlightSheetNote(note.name, note.duration); // Highlight sheet note
          }, note.time);
        });
      });

      // Start playback
      Tone.Transport.start();
    };
    reader.readAsArrayBuffer(midiFile);
  };

  const highlightPianoKey = (noteName, isActive, duration = 0.5) => {
    setActiveKey(isActive ? noteName : null);
    setTimeout(() => setActiveKey(null), duration * 1000); // Remove highlight after duration
  };

  const highlightSheetNote = (noteName, duration) => {
    if (!graphicalNotes.current || graphicalNotes.current.length === 0) {
      console.error("No graphical notes found.");
      return;
    }

    // Find all matching notes
    const notesToHighlight = graphicalNotes.current.filter((graphicalNote) => {
      const osmdPitch = graphicalNote.sourceNote.halfTone;
      const osmdNoteName = Tone.Frequency(osmdPitch, "midi").toNote();
      return osmdNoteName === noteName;
    });

    if (notesToHighlight.length === 0) {
      console.warn(`No notes found for ${noteName}`);
      return;
    }

    // Highlight all matching notes
    notesToHighlight.forEach((note) => {
      const noteElement = note.getSVGElements(); // Get the SVG element(s) for the note
      if (noteElement && noteElement.length > 0) {
        noteElement.forEach((element) => {
          element.setAttribute("fill", "red"); // Highlight in red
          element.setAttribute("stroke", "red"); // Highlight stroke in red
        });

        setTimeout(() => {
          noteElement.forEach((element) => {
            element.setAttribute("fill", "black"); // Reset to black
            element.setAttribute("stroke", "black"); // Reset stroke to black
          });
        }, duration * 1000);
      }
    });
  };

  return (
    <div>
      <div>
        <h3>Upload Sheet Music (XML/MXL)</h3>
        <input type="file" accept=".xml,.mxl" onChange={handleSheetFileChange} />
      </div>
      <div>
        <h3>Upload MIDI File (.mid)</h3>
        <input type="file" accept=".mid" onChange={handleMidiFileChange} />
      </div>
      <button onClick={playMidiFile} className="px-3 py-2 bg-blue-900 text-white rounded-sm">
        ▶ Play MIDI
      </button>

      <div ref={sheetMusicDiv} style={{ width: "auto", height: "500px", border: "1px solid red" }}></div>

      {/* Piano UI */}
      <div className="piano-container8">
        <div className="piano8">
          {/* White Keys */}
          {["4", "5"].map((octave, octaveIndex) =>
            whiteKeys.map((key, i) => (
              <div
                key={key + octave}
                className={`white-key8 key8 ${
                  activeKey === key + octave ? "active" : ""
                }`}
                style={{
                  left: `${i * 50}px`, // Position of white keys
                }}
              >
                {key + octave}
              </div>
            ))
          )}

          {/* Black Keys */}
          {["4", "5"].map((octave, octaveIndex) =>
            Object.entries(blackKeys).map(([key, pos]) => (
              <div
                key={key + octave}
                className={`black-key8 key8 ${
                  activeKey === key + octave ? "active" : ""
                }`}
                style={{
                  left: `${(pos + octaveIndex * 7) * 50 + 29}px`, // Position of black keys
                }}
              >
                {key}
              </div>
            ))
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
          .piano8 {
            position: relative;
            display: flex;
            border: 3px solid black;
            border-radius: 8px;
            background: #222;
            padding: 5px;
            width: 700px;
            height: 200px;
          }
          .key8 {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            font-size: 12px;
            font-weight: bold;
            user-select: none;
            cursor: pointer;
            transition: background 0.1s, transform 0.1s;
          }
          .white-key8 {
            width: 50px;
            height: 180px;
            background: white;
            border: 1px solid #ccc;
            color: black;
          }
          .black-key8 {
            width: 30px;
            height: 110px;
            background: black;
            color: white;
            z-index: 1;
            position: absolute;
            margin-left: 2px;
            box-shadow: inset 0 0 8px gray;
            border-radius: 0 0 4px 4px;
          }
          .active {
            background-color: #60A5FA;
            transform: scale(1.1);
          }
        `}
      </style>
    </div>
  );
};

export default MSheet;