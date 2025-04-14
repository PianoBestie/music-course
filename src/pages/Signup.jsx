import React, { useState, useEffect } from 'react';
import { Piano as PianoIcon, Verified as VerifiedIcon } from '@mui/icons-material';
import { Google } from '@mui/icons-material';
import { CircularProgress, Alert, Button } from '@mui/material';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for payment success redirect
  useEffect(() => {
    const uid = searchParams.get('uid');
    if (uid && auth.currentUser?.uid === uid) {
      checkPaymentStatus();
    }
  }, [searchParams]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          setUserData({
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL
          });
          setSuccess('Google authentication successful!');
        } else {
          navigate('/dashboard');
        }
      }
    });
    return unsubscribe;
  }, [navigate]);

  const checkPaymentStatus = async () => {
    try {
      setPaymentLoading(true);
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      
      if (userDoc.exists() && userDoc.data().paymentStatus === 'verified') {
        navigate('/dashboard');
      } else {
        // Poll for payment status (webhook might be delayed)
        setTimeout(checkPaymentStatus, 3000);
      }
    } catch (error) {
      console.error('Payment check failed:', error);
      setError('Payment verification in progress. Please refresh later.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      
      if (!userDoc.exists()) {
        setUserData({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        });
        setSuccess("Google auth successful! Complete payment.");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setError(getFirebaseErrorMessage(error.code));
      console.error("Google sign-in error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      setError('');
      
      const response = await fetch('https://music-course.onrender.com/api/create-payment-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          userId: userData.uid,
          email: userData.email,
          name: userData.displayName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const { payment_url } = await response.json();
      window.location.href = payment_url;

    } catch (error) {
      console.error('Payment processing error:', error);
      setError(error.message || 'Payment processing failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getFirebaseErrorMessage = (code) => {
    switch (code) {
      case 'auth/popup-closed-by-user':
        return 'Sign in process was cancelled.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/operation-not-allowed':
        return 'Google sign-in is not enabled. Please contact support.';
      default:
        return 'Sign in failed. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-tr from-[#81479a] to-[#446fbf] py-8 px-8 text-center">
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="bg-white p-3 rounded-full shadow-md mb-3">
                <PianoIcon className="text-indigo-600 text-3xl" />
              </div>
              <h1 className="text-2xl font-bold text-white">Join Piano Bestie</h1>
              <p className="text-blue-100 mt-1">Start your musical journey today</p>
            </div>
          </div>
          
          <div className="p-8">
            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" className="mb-4">
                {success}
              </Alert>
            )}

            {!userData ? (
              <>
                <div className="space-y-5">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-blue-700 text-center">
                      Sign up with Google to get started
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white py-2.5 px-4 border border-blue-100 rounded-lg shadow-sm text-sm font-medium text-blue-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center transition disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} className="mr-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Google className="w-5 h-5 mr-3 text-red-500" />
                        Sign up with Google
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-blue-600">
                    Already have an account?{' '}
                    <a href="/login" className="font-medium text-blue-700 hover:text-blue-600">
                      Sign in
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center">
                  <VerifiedIcon className="text-green-500 mr-2" />
                  <p className="text-green-700">
                    Signed in as <span className="font-semibold">{userData.email}</span>
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Note:</span> ₹599 for 1-year access to all piano courses
                  </p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-blue-700">
                      I agree to the <Link to='/terms'><a  className="font-medium text-blue-600 hover:text-blue-500">Terms</a> and <a  className="font-medium text-blue-600 hover:text-blue-500">Privacy Policy</a></Link>
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="w-full flex justify-center items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                >
                  {paymentLoading ? (
                    <>
                      <CircularProgress size={20} color="inherit" className="mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    'Pay ₹599 & Get 1-Year Access'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <p className="mt-6 text-center text-sm text-blue-700 opacity-80">
          © {new Date().getFullYear()} Piano Bestie. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Signup;