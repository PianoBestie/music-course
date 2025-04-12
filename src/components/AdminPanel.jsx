import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = "https://aqtoehdipmlwnxgtoara.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxdG9laGRpcG1sd254Z3RvYXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2OTkyODAsImV4cCI6MjA1OTI3NTI4MH0.Foh4jXzvRm7deYockdR2h1Amtz3tDfNUFad4JHZCJZg"
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const AdminPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [exercises, setExercises] = useState({
    noteKnowledge: {},
    chordKnowledge: {},
  });
  const [formData, setFormData] = useState({
    category: "noteKnowledge",
    name: "",
    midiFile: null,
    mp3File: null,
    pdfFile: null,
    movieName: "", // Changed from difficulty
    root: "C",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setIsLoading(true);

      const [noteRes, chordRes] = await Promise.all([
        supabase
          .from("exercises")
          .select("*")
          .eq("category", "noteKnowledge")
          .order("name", { ascending: true }),

        supabase
          .from("exercises")
          .select("*")
          .eq("category", "chordKnowledge")
          .order("name", { ascending: true }),
      ]);

      if (noteRes.error || chordRes.error)
        throw noteRes.error || chordRes.error;

      const noteExercises = {};
      noteRes.data.forEach((exercise) => {
        noteExercises[exercise.name] = {
          midi_url: exercise.midi_url || null,
          mp3_url: exercise.mp3_url || null,
          pdf_url: exercise.pdf_url || null,
          movieName: exercise.movieName || "", // Changed from difficulty
          root: exercise.root || "C",
          id: exercise.id,
        };
      });

      const chordExercises = {};
      chordRes.data.forEach((exercise) => {
        chordExercises[exercise.name] = {
          midi_url: exercise.midi_url || null,
          mp3_url: exercise.mp3_url || null,
          pdf_url: exercise.pdf_url || null,
          movieName: exercise.movieName || "", // Changed from difficulty
          root: exercise.root || "C",
          id: exercise.id,
        };
      });
      setExercises({
        noteKnowledge: noteExercises,
        chordKnowledge: chordExercises,
      });
    } catch (error) {
      console.error("Load exercises error:", error);
      toast.error("Failed to load exercises. Please check your permissions.");
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const uploadFile = async (file, fileType) => {
    if (!file) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${fileType}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from("music-exercises")
        .upload(filePath, file, {
          cacheControl: "36000",
          upsert: false,
          contentType: file.type,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("music-exercises").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Upload error details:", error);
      toast.error(`File upload failed: ${error.message}`);
      throw error;
    }
  };

  const deleteFile = async (url) => {
    try {
      const urlParts = url.split("/");
      const filePath = urlParts
        .slice(urlParts.indexOf("music-exercises") + 1)
        .join("/");

      const { error } = await supabase.storage
        .from("music-exercises")
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      toast.error("File deletion failed: " + error.message);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Exercise name is required");
      return;
    }

    try {
      setIsLoading(true);

      const exerciseData = {
        category: formData.category,
        name: formData.name.trim(),
        movieName: formData.movieName.trim(), // Changed from difficulty
        root: formData.root,
        updated_at: new Date().toISOString(),
        midi_url: null,
        mp3_url: null,
        pdf_url: null,
      };

      if (formData.midiFile) {
        exerciseData.midi_url = await uploadFile(formData.midiFile, "midi");
      }

      if (formData.mp3File) {
        exerciseData.mp3_url = await uploadFile(formData.mp3File, "mp3");
      }

      if (formData.pdfFile) {
        exerciseData.pdf_url = await uploadFile(formData.pdfFile, "pdf");
      }

      if (editingId) {
        const { error } = await supabase
          .from("exercises")
          .update(exerciseData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Exercise updated successfully!");
      } else {
        exerciseData.created_at = new Date().toISOString();
        const { error } = await supabase.from("exercises").insert(exerciseData);

        if (error) throw error;
        toast.success("Exercise created successfully!");
      }

      setFormData({
        category: "noteKnowledge",
        name: "",
        midiFile: null,
        mp3File: null,
        pdfFile: null,
        movieName: "",
        root: "C",
      });
      setEditingId(null);
      await loadExercises();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(`Operation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category, name) => {
    const exercise = exercises[category][name];
    setFormData({
      category,
      name,
      midiFile: null,
      mp3File: null,
      pdfFile: null,
      movieName: exercise.movieName || "",
      root: exercise.root || "C",
    });
    setEditingId(exercise.id);
  };

  const handleDelete = async (category, name) => {
    if (!window.confirm("Are you sure you want to delete this exercise?"))
      return;

    try {
      setIsLoading(true);
      const exerciseId = exercises[category][name].id;
      const exercise = exercises[category][name];

      const deletePromises = [];
      if (exercise.midi_url) deletePromises.push(deleteFile(exercise.midi_url));
      if (exercise.mp3_url) deletePromises.push(deleteFile(exercise.mp3_url));
      if (exercise.pdf_url) deletePromises.push(deleteFile(exercise.pdf_url));

      await Promise.all(deletePromises);

      const { error } = await supabase
        .from("exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;

      toast.success("Exercise deleted successfully!");
      await loadExercises();
    } catch (error) {
      toast.error("Delete failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const rootNotes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  return (
    <div className="admin-panel-container p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-8 shadow-lg">
        <h1 className="text-3xl font-bold text-white">Exercise Management <span className="text-gray-400 font-rubik font-thin"> (Admin Panel)</span></h1>
        <p className="text-indigo-100 mt-2">Manage all exercises and content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingId ? "Edit Exercise" : "Add New Exercise"}
            </h2>
            {editingId && (
              <button
                onClick={() => {
                  setFormData({
                    category: "noteKnowledge",
                    name: "",
                    midiFile: null,
                    mp3File: null,
                    pdfFile: null,
                    movieName:"",
                    root: "C",
                  });
                  setEditingId(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="noteKnowledge">Note Knowledge</option>
                <option value="chordKnowledge">Chord Knowledge</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exercise Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., bgm/song1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Root Note
                </label>
                <select
                  name="root"
                  value={formData.root}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {rootNotes.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Movie Name
                </label>
                <input
                  type="text"
                  name="movieName"
                  value={formData.movieName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter movie name"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MIDI File
                </label>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-600 truncate">
                        {formData.midiFile
                          ? formData.midiFile.name
                          : "Choose file..."}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <input
                      type="file"
                      name="midiFile"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".mid,.midi"
                    />
                  </label>
                </div>
                {exercises[formData.category]?.[formData.name]?.midi_url &&
                  !formData.midiFile && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Current:{" "}
                      {exercises[formData.category][formData.name].midi_url
                        .split("/")
                        .pop()}
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MP3 File (optional)
                </label>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-600 truncate">
                        {formData.mp3File
                          ? formData.mp3File.name
                          : "Choose file..."}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <input
                      type="file"
                      name="mp3File"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".mp3"
                    />
                  </label>
                </div>
                {exercises[formData.category]?.[formData.name]?.mp3_url &&
                  !formData.mp3File && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Current:{" "}
                      {exercises[formData.category][formData.name].mp3_url
                        .split("/")
                        .pop()}
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File (optional)
                </label>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                      <span className="text-sm text-gray-600 truncate">
                        {formData.pdfFile
                          ? formData.pdfFile.name
                          : "Choose file..."}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <input
                      type="file"
                      name="pdfFile"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf"
                    />
                  </label>
                </div>
                {exercises[formData.category]?.[formData.name]?.pdf_url &&
                  !formData.pdfFile && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Current:{" "}
                      {exercises[formData.category][formData.name].pdf_url
                        ?.split("/")
                        .pop() || "None"}
                    </p>
                  )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : editingId ? (
                  "Update Exercise"
                ) : (
                  "Create Exercise"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Exercises List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Note Knowledge Exercises */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Note Knowledge Exercises
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full">
                {Object.keys(exercises.noteKnowledge).length} exercises
              </span>
            </div>

            {isLoading && Object.keys(exercises.noteKnowledge).length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : Object.keys(exercises.noteKnowledge).length === 0 ? (
              <div className="text-center py-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-500 mt-2">
                  No note knowledge exercises found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Root
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Files
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(exercises.noteKnowledge).map(
                      ([name, exercise]) => (
                        <tr key={`note-${name}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {exercise.movieName || "No movie specified"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {exercise.root || "C"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {exercise.midi_url && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-indigo-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                    />
                                  </svg>
                                  <span className="truncate max-w-xs">
                                    {exercise.midi_url.split("/").pop()}
                                  </span>
                                </div>
                              )}
                              {exercise.mp3_url && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-purple-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                    />
                                  </svg>
                                  <span className="truncate max-w-xs">
                                    {exercise.mp3_url.split("/").pop()}
                                  </span>
                                </div>
                              )}
                              {exercise.pdf_url && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-red-500"
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
                                  <span className="truncate max-w-xs">
                                    {exercise.pdf_url.split("/").pop()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleEdit("noteKnowledge", name)
                                }
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                disabled={isLoading}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete("noteKnowledge", name)
                                }
                                className="text-red-600 hover:text-red-900 flex items-center"
                                disabled={isLoading}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Chord Knowledge Exercises */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Chord Knowledge Exercises
              </h2>
              <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full">
                {Object.keys(exercises.chordKnowledge).length} exercises
              </span>
            </div>

            {isLoading && Object.keys(exercises.chordKnowledge).length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : Object.keys(exercises.chordKnowledge).length === 0 ? (
              <div className="text-center py-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-500 mt-2">
                  No chord knowledge exercises found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Root
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Files
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(exercises.chordKnowledge).map(
                      ([name, exercise]) => (
                        <tr key={`chord-${name}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {name}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                          {exercise.movieName || 'No movie specified'}
                          </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {exercise.root || "C"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {exercise.midi_url && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-indigo-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                    />
                                  </svg>
                                  <span className="truncate max-w-xs">
                                    {exercise.midi_url.split("/").pop()}
                                  </span>
                                </div>
                              )}
                              {exercise.mp3_url && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-purple-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                    />
                                  </svg>
                                  <span className="truncate max-w-xs">
                                    {exercise.mp3_url.split("/").pop()}
                                  </span>
                                </div>
                              )}
                              {exercise.pdf_url && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-1 text-red-500"
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
                                  <span className="truncate max-w-xs">
                                    {exercise.pdf_url.split("/").pop()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleEdit("chordKnowledge", name)
                                }
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                disabled={isLoading}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete("chordKnowledge", name)
                                }
                                className="text-red-600 hover:text-red-900 flex items-center"
                                disabled={isLoading}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
