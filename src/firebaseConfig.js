import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  setPersistence, 
  browserSessionPersistence,
  browserLocalPersistence,
  GoogleAuthProvider
} from "firebase/auth";

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

// Configure authentication provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Enhanced configuration with error handling
const configureFirebase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('Firebase running in production mode');
      
      // Set persistence for production (local storage works better with GitHub Pages)
      await setPersistence(auth, browserLocalPersistence);
      
      // Additional production settings
      auth.languageCode = 'en';
      auth.settings.appVerificationDisabledForTesting = false;
      
    } else {
      console.log('Firebase running in development mode');
      
      // Use session persistence for development
      await setPersistence(auth, browserSessionPersistence);
      
      // Emulator connection
      if (window.location.hostname === 'localhost') {
        const { connectFirestoreEmulator } = await import('firebase/firestore');
        const { connectAuthEmulator } = await import('firebase/auth');
        
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, "http://localhost:9099");
        console.log('Connected to Firebase emulators');
      }
    }
  } catch (error) {
    console.error('Firebase configuration error:', error);
    throw error; // Re-throw to handle in calling code
  }
};

// Initialize configuration
configureFirebase().catch((error) => {
  console.error('Failed to configure Firebase:', error);
});

export { db, auth, googleProvider };