import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Production and development configuration
const firebaseConfig = {
  apiKey: "AIzaSyBwkGEcfpoq_KzqTNS2EbKj5t4APtRgrW4",
  authDomain: "interactive-music.firebaseapp.com",
  projectId: "interactive-music",
  storageBucket: "interactive-music.firebasestorage.app",
  messagingSenderId: "125878767239",
  appId: "1:125878767239:web:bf1a52a1bf719266877222"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enhanced configuration for production
if (process.env.NODE_ENV === 'production') {
  // Production-specific settings
  auth.languageCode = 'en'; // Set default language
  
  // Optional: Persistence settings
  // setPersistence(auth, browserSessionPersistence);
  
  console.log('Firebase running in production mode');
} else {
  console.log('Firebase running in development mode');
  
  // Connect to Firestore emulator if running locally
  if (window.location.hostname === 'localhost') {
    import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firestore emulator');
    }).catch(err => {
      console.warn('Failed to connect to Firestore emulator:', err);
    });
  }
}

export { db, auth };