import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect, useLayoutEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import { auth } from './firebaseConfig';
// Page Components
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Course from "./pages/Course";
import DashBoard from "./pages/DashBoard";
// Practice Components
import Practice from "./components/Practice";
import Interactive from "./components/Interactive";
import ChordsPiano from "./components/ChordsPiano";
import Arp from "./components/Arp";
import RootChords from "./components/RootChords";
import TimeSign from "./components/Timesign";
import Durations from "./components/Durations";
import PianoHandPosition from "./components/PianoHandPosition";
import ExercisePiano from "./components/ExercisePiano";
import PaymentProtectedRoute from "./pages/PaymentProtectedRoute";
import PaymentRequired from "./pages/PaymentRequired";
import { useDispatch } from 'react-redux';
import { initAuthListener } from './components/authSlice';
import AdminPanel from "./components/AdminPanel";
import NotFound from "./pages/NotFound";

const PortraitWarning = () => (
  <div className="portrait-warning">
    <h2>Please rotate your device</h2>
    <p>For the best experience, please use landscape mode</p>
    <div className="rotation-icon">🔄</div>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  );
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  // Initialize auth listener and clean up
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      dispatch(initAuthListener());
    });
    return () => unsubscribe();
  }, [dispatch]);

  // Handle portrait/landscape detection with cleanup
  useLayoutEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset state when route changes
  useEffect(() => {
    if (location.pathname !== currentPath) {
      setCurrentPath(location.pathname);
    }
  }, [location.pathname, currentPath]);

  // Your admin UID
  const ADMIN_UID = "HH6FKWxOYwNXCw401GXS8Ukzt773";

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '14px',
            padding: '12px 20px',
            borderRadius: '8px',
            background: '#333',
            color: '#fff',
          },
        }} 
      />
      
      {isPortrait ? (
        <PortraitWarning />
      ) : (
        <>
          <Navbar />
          <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
            <Routes location={location} key={location.key}> {/* Changed from location.pathname */}
              {/* Conditional route for admin */}
              {user && user.uid === ADMIN_UID ? (
                <Route path="/" element={<AdminPanel />} />
              ) : (
                <Route path="/" element={<Home />} />
              )}
              
              <Route path="/adminpanel" element={<AdminPanel/>} />
              <Route path="/course" element={<Course />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/payment-required" element={<PaymentRequired/>} />
              <Route 
                path="/dashboard" 
                element={
                  <PaymentProtectedRoute>
                    <DashBoard />
                  </PaymentProtectedRoute>
                } 
              />
              {/* Music Practice Routes */}
              <Route path="/interactive" element={<Interactive />} />
              <Route path="/chords-piano" element={<ChordsPiano />} />
              <Route path="/arp" element={<Arp />} />
              <Route path="/root-chords" element={<RootChords />} />
              <Route path="/time-sign" element={<TimeSign />} />
              <Route path="/durations" element={<Durations />} />
              <Route path="/piano-hand-position" element={<PianoHandPosition />} />
              <Route path="/exercise-piano" element={<ExercisePiano />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </>
      )}
    </>
  );
}

export default App;