import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwkGEcfpoq_KzqTNS2EbKj5t4APtRgrW4",
  authDomain: "interactive-music.firebaseapp.com",
  projectId: "interactive-music",
  storageBucket: "interactive-music.firebasestorage.app",
  messagingSenderId: "125878767239",
  appId: "1:125878767239:web:bf1a52a1bf719266877222"
};

// Debugging check

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };