import React, { useState, useEffect } from "react";

const MusicNoteLearning = () => {
  const [currentNote, setCurrentNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(0);

  const landmarkNotes = {
    treble: ["E4", "G4", "B4", "D5", "F5"],
    bass: ["G2", "B2", "D3", "F3", "A3"],
  };

  const getRandomNote = () => {
    const clef = Math.random() > 0.5 ? "treble" : "bass";
    const notes = landmarkNotes[clef];
    return { note: notes[Math.floor(Math.random() * notes.length)], clef };
  };

  const initializeNote = () => {
    const { note } = getRandomNote();
    setCurrentNote(note);
    setFeedback("");
  };

  const handleGuess = (guessedNote) => {
    if (guessedNote === currentNote) {
      setFeedback("✅ Correct! Well done!");
      setScore((prev) => prev + 1);
    } else {
      setFeedback(`❌ Oops! The correct note was ${currentNote}.`);
    }
    setTimeout(() => initializeNote(), 1500);
  };

  useEffect(() => {
    initializeNote();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4 text-gray-800 text-center">
        🎼 Music Note Learning 🎵
      </h1>
      <p className="text-gray-600 text-lg text-center mb-4">
        Identify the note displayed and select the correct answer!
      </p>

      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center">
        <p className="text-xl text-gray-700 mb-2">What note is this?</p>
        <div className="text-5xl font-bold text-blue-500">{currentNote}</div>
      </div>

      {/* Treble and Bass Staff */}
      <div className="flex flex-col items-center mt-6">
        <p className="text-lg font-semibold">🎵 Treble Clef (G Clef)</p>
        <div className="w-80 h-16 bg-gray-300 rounded-lg flex items-center justify-center border border-gray-600">
          <p className="text-2xl">🎼 𝄞</p>
        </div>
      </div>

      <div className="flex flex-col items-center mt-6">
        <p className="text-lg font-semibold">🎵 Bass Clef (F Clef)</p>
        <div className="w-80 h-16 bg-gray-300 rounded-lg flex items-center justify-center border border-gray-600">
          <p className="text-2xl">🎼 𝄢</p>
        </div>
      </div>

      {feedback && (
        <div className="mt-4 text-lg font-semibold text-gray-800">{feedback}</div>
      )}
      
      <div className="mt-4 text-xl font-bold text-gray-700">Score: {score}</div>
      
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[...landmarkNotes.treble, ...landmarkNotes.bass].map((note) => (
          <button
            key={note}
            onClick={() => handleGuess(note)}
            className="bg-blue-500 text-white py-3 px-5 rounded-lg hover:bg-blue-600 transition"
          >
            {note}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MusicNoteLearning;
