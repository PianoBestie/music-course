import React, { useState } from 'react';

const Quiz = () => {
    const questions = [
        {
          question: "What is the tonic of the C major scale?",
          options: ["C", "D", "E", "F"],
          answer: "C"
        },
        {
          question: "What is the subtonic of the C major scale?",
          options: ["B", "A", "D", "G"],
          answer: "B"
        },
        {
          question: "Which of the following is the supertonic of the G major scale?",
          options: ["A", "B", "C", "D"],
          answer: "A"
        },
        {
          question: "What is the dominant of the F major scale?",
          options: ["C", "B", "D", "E"],
          answer: "C"
        },
        {
          question: "Which chord is formed by the notes C, E, and G?",
          options: ["C major", "C minor", "D major", "F major"],
          answer: "C major"
        },
        {
          question: "What is the scale degree of 'B' in the C major scale?",
          options: ["7th", "6th", "5th", "4th"],
          answer: "7th"
        },
        {
          question: "What is the interval between C and G?",
          options: ["Perfect 5th", "Major 6th", "Minor 3rd", "Perfect 4th"],
          answer: "Perfect 5th"
        },
        {
          question: "What is the harmonic minor scale of A?",
          options: ["A B C D E F G# A", "A B C D E F G A", "A B C# D E F G A", "A B C D E F G A"],
          answer: "A B C D E F G# A"
        },
        {
          question: "What is the pattern for a natural minor scale?",
          options: ["W H W W H W W", "W W H W W H W", "H W W H W W W", "W W W H W W W"],
          answer: "W H W W H W W"
        },
        {
          question: "Which of these scales is a pentatonic scale?",
          options: ["C D E G A", "C D E F G A B", "C D E F G A", "C D F G A"],
          answer: "C D E G A"
        },
        {
          question: "What is the dominant 7th chord in the key of E?",
          options: ["B D# F# A", "C# E G# B", "A C# E G", "B D G A"],
          answer: "B D# F# A"
        },
        {
          question: "What is the tonic of the A major scale?",
          options: ["A", "B", "C#", "D"],
          answer: "A"
        },
        {
          question: "What is the formula for a natural minor scale?",
          options: ["W H W W H W W", "W H W W W H W", "W W H W H W W", "H W H W W W W"],
          answer: "W H W W H W W"
        },
        {
          question: "What chord is formed by the notes C, E♭, G?",
          options: ["C minor", "C major", "C diminished", "C augmented"],
          answer: "C minor"
        },
        {
          question: "What is the seventh note of the D major scale?",
          options: ["C#", "B", "A", "D"],
          answer: "C#"
        },
        {
          question: "Which of the following is a chromatic scale?",
          options: ["C C# D D# E F F# G G# A A# B C", "C D E F G A B C", "C D E F G A B", "C D E F G A"],
          answer: "C C# D D# E F F# G G# A A# B C"
        },
        {
          question: "Which of the following is the tonic in the key of E major?",
          options: ["E", "F#", "A", "B"],
          answer: "E"
        },
        {
          question: "What is the dominant seventh chord in the key of A?",
          options: ["E G# B D", "D F# A C", "C E G B", "F A C E"],
          answer: "E G# B D"
        },
        {
          question: "What is the note interval between C and B?",
          options: ["Major 7th", "Minor 7th", "Perfect 5th", "Major 6th"],
          answer: "Major 7th"
        },
        {
          question: "What is the relative minor of C major?",
          options: ["A minor", "D minor", "G minor", "F minor"],
          answer: "A minor"
        },
        {
          question: "Which of these is the formula for a diminished chord?",
          options: ["1 b3 b5", "1 3 5", "1 b3 5", "1 3 b5"],
          answer: "1 b3 b5"
        },
        {
          question: "What is the tonic of the G major scale?",
          options: ["G", "A", "B", "C"],
          answer: "G"
        },
        {
          question: "Which scale has the following pattern: W W H W W W H?",
          options: ["Major", "Minor", "Chromatic", "Pentatonic"],
          answer: "Major"
        },
        {
          question: "Which scale degree is known as the 'mediant'?",
          options: ["3rd", "4th", "5th", "6th"],
          answer: "3rd"
        },
        {
          question: "What is the interval between C and F#?",
          options: ["Augmented 4th", "Perfect 5th", "Major 6th", "Diminished 5th"],
          answer: "Augmented 4th"
        },
        {
          question: "What is the subdominant of the D major scale?",
          options: ["G major", "C major", "B minor", "A major"],
          answer: "G major"
        },
        {
          question: "Which chord is formed by the notes D, F#, and A?",
          options: ["D major", "D minor", "E major", "C major"],
          answer: "D major"
        },
        {
          question: "What is the chord progression I-IV-V in the key of C?",
          options: ["C F G", "C D G", "F G A", "G A B"],
          answer: "C F G"
        },
        {
          question: "What scale has the notes C, D, E, F, G, A, B, C?",
          options: ["C major", "C minor", "C chromatic", "C pentatonic"],
          answer: "C major"
        },
        {
          question: "In the key of G, what is the mediant?",
          options: ["B", "D", "F#", "A"],
          answer: "B"
        },
        {
          question: "What is the dominant of the D major scale?",
          options: ["A major", "G major", "B minor", "F# major"],
          answer: "A major"
        },
        {
          question: "Which note is a major 3rd above C?",
          options: ["E", "F#", "D", "G"],
          answer: "E"
        },
        {
          question: "In the key of A major, what is the subdominant?",
          options: ["D major", "E major", "F# minor", "C# minor"],
          answer: "D major"
        },
        {
          question: "What is the interval between A and D?",
          options: ["Perfect 5th", "Minor 3rd", "Perfect 4th", "Major 6th"],
          answer: "Perfect 4th"
        },
        {
          question: "Which scale has the following pattern: H W W H W W W?",
          options: ["Major", "Minor", "Chromatic", "Pentatonic"],
          answer: "Minor"
        },
        {
          question: "What is the leading tone in the key of A?",
          options: ["G#", "A", "B", "F#"],
          answer: "G#"
        },
        {
          question: "What is the tonic of the F major scale?",
          options: ["F", "E", "D", "C"],
          answer: "F"
        },
        {
          question: "Which of these is a diminished 7th chord?",
          options: ["B D F A♭", "C E G B♭", "D F# A C", "A C E G"],
          answer: "B D F A♭"
        },
        {
          question: "What is the scale degree of 'C' in the key of G major?",
          options: ["2nd", "3rd", "4th", "5th"],
          answer: "3rd"
        },
        {
          question: "What is the dominant chord in the key of E major?",
          options: ["B major", "F# major", "C# minor", "A major"],
          answer: "B major"
        },
        {
          question: "Which of these scales is made of the notes A, B, D, E, F#, G#?",
          options: ["A major", "A minor", "A pentatonic", "A harmonic minor"],
          answer: "A harmonic minor"
        },
        {
          question: "What is the interval between G and B?",
          options: ["Major 3rd", "Minor 3rd", "Perfect 4th", "Diminished 5th"],
          answer: "Major 3rd"
        },
        {
          question: "What is the third note in the D major scale?",
          options: ["F#", "G", "A", "B"],
          answer: "F#"
        },
        {
          question: "Which scale uses the pattern W H W W H W W?",
          options: ["Major", "Minor", "Chromatic", "Pentatonic"],
          answer: "Major"
        },
        {
          question: "What is the interval between C and D?",
          options: ["Major 2nd", "Minor 2nd", "Perfect 5th", "Diminished 4th"],
          answer: "Major 2nd"
        }
      ];
      
      

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState(new Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const handleSelectAnswer = (index, option) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = option;
    setAnswers(updatedAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handlePagination = (direction) => {
    setCurrentPage((prevPage) =>
      direction === 'next' ? Math.min(prevPage + 1, questions.length - 1) : Math.max(prevPage - 1, 0)
    );
  };

  const score = answers.filter((answer, index) => answer === questions[index].answer).length;

  return (
<div className="quiz-container bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto mt-8">
  <h2 className="text-3xl font-bold text-center mb-8 text-indigo-600">Quiz</h2>
  {!submitted ? (
    <div>
      <div className="question-container mb-6">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4"> {questions[currentPage].question}</h3>
        <div className="options space-y-4">
          {questions[currentPage].options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <button
                onClick={() => handleSelectAnswer(currentPage, option)}
                className={`w-full px-6 py-3 rounded-lg transition-all duration-300 focus:outline-none ${
                  answers[currentPage] === option
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-700 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                {option}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pagination flex justify-between items-center mb-6">
        <button
          onClick={() => handlePagination('prev')}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => handlePagination('next')}
          disabled={currentPage === questions.length - 1}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <button
        onClick={handleSubmit}
        className="submit-button w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300"
      >
        Submit Quiz
      </button>
    </div>
  ) : (
    <div className="result bg-gray-200 p-6 rounded-lg mt-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Quiz Results</h3>
      <p className="text-lg font-semibold text-indigo-600">Your Score: {score} / {questions.length}</p>
      <ul className="mt-6 space-y-4">
        {questions.map((question, index) => (
          <li key={index} className="bg-white p-4 rounded-lg shadow-sm">
            <p className="font-medium text-gray-800">{index+1} . {question.question}</p>
            <p className="text-gray-600">Your answer: <span className="font-semibold text-indigo-600">{answers[index]}</span></p>
            <p className="text-gray-600">Correct answer: <span className="font-semibold text-green-600">{question.answer}</span></p>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>


  
  );
};

export default Quiz;
