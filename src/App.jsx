import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Toaster } from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from 'react-redux';
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
// Page Components
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Course from "./pages/Course";
import DashBoard from "./pages/DashBoard";
import NotFound from "./pages/NotFound";
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
import { initializeAuthListener } from './components/authSlice';
import AdminPanel from "./components/AdminPanel";
import TermsOfService from "./pages/TermsOfService";

const PortraitWarning = () => (
  <div className="portrait-warning">
    <h2>Please rotate your device</h2>
    <p>For the best experience, please use landscape mode</p>
    <div className="rotation-icon">🔄</div>
  </div>
);

function App() {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.currentUser); // Changed from user to currentUser
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  );
  const location = useLocation();

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = dispatch(initializeAuthListener());
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  // Handle portrait/landscape detection
  useLayoutEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const ADMIN_UID = "HH6FKWxOYwNXCw401GXS8Ukzt773";

  // Memoize admin check to prevent unnecessary recomputations
  const isAdmin = useMemo(() => {
    return currentUser?.uid === ADMIN_UID;
  }, [currentUser]);

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
          <ScrollToTop />
          <Navbar />
          <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              
              {/* Protected Admin Route */}
              <Route 
                path="/adminpanel" 
                element={isAdmin ? <AdminPanel /> : <Navigate to="/" replace />} 
              />
              
              <Route path="/course" element={<Course />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/payment-required" element={<PaymentRequired />} />
              
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
              <Route path="/terms" element={<TermsOfService />} />
              
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