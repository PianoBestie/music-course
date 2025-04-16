import React, { useState, useEffect } from 'react';
import { Piano as PianoIcon, Verified as VerifiedIcon, CheckCircle } from '@mui/icons-material';
import { Google } from '@mui/icons-material';
import { CircularProgress, Alert, Button } from '@mui/material';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const navigate = useNavigate();

  // Payment details
  const paymentDetails = {
    amount: '599',
    upiId: 'dwaynedevaq96@okicici',
    name: 'Piano Bestie',
    note: '1-year piano course access'
  };

  // Check payment status in Firestore
  const checkPaymentStatus = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() && userDoc.data().paymentStatus === 'verified';
  };

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isVerified = await checkPaymentStatus(user.uid);
        setPaymentVerified(isVerified);
        
        setUserData({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });

        if (!isVerified) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              paymentStatus: 'pending',
              createdAt: new Date().toISOString()
            });
            setSuccess('Account created! Complete payment to continue');
          } else {
            setSuccess('Welcome back! Complete your payment');
          }
        } else {
          setSuccess('Payment verified! Your courses are unlocked');
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const isVerified = await checkPaymentStatus(result.user.uid);
      setPaymentVerified(isVerified);
      
      setUserData({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });

      if (!isVerified) {
        const userDoc = await getDoc(doc(db, "users", result.user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", result.user.uid), {
            paymentStatus: 'pending',
            createdAt: new Date().toISOString()
          });
          setSuccess('Account created! Complete payment to continue');
        } else {
          setSuccess('Welcome back! Complete your payment');
        }
      } else {
        setSuccess('Payment verified! Your courses are unlocked');
      }
    } catch (error) {
      setError(error.message.includes('popup') 
        ? 'Sign in cancelled' 
        : 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmission = async () => {
    try {
      setPaymentLoading(true);
      const paymentRef = `PB${Date.now().toString().slice(-6)}`;
      
      await setDoc(doc(db, 'users', userData.uid), {
        paymentStatus: 'pending',
        paymentReference: paymentRef,
        paymentInitiatedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      navigate('/payment-required?redirect=/dashboard');
    } catch (error) {
      setError('Payment submission failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setPaymentVerified(false);
      setSuccess('');
    } catch (error) {
      setError('Error signing out. Please try again.');
    }
  };

  const handleAccessDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-8 px-8 text-center">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-md mb-3">
              <PianoIcon className="text-indigo-600 text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">Piano Bestie</h1>
            <p className="text-blue-100 mt-1">Start your musical journey</p>
          </div>
        </div>

        <div className="p-6">
          {error && <Alert severity="error" className="mb-4">{error}</Alert>}
          {success && <Alert severity="success" className="mb-4">{success}</Alert>}

          {!userData ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-blue-700 text-center">
                  Sign up with Google to continue
                </p>
              </div>
              
              <button 
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center transition disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Google className="w-5 h-5 mr-3 text-red-500" />
                    Continue with Google
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          ) : paymentVerified ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
                <CheckCircle className="text-emerald-500 text-4xl mx-auto mb-3" />
                <h3 className="font-bold text-emerald-800 text-lg mb-2">
                  Payment Verified Successfully!
                </h3>
                <p className="text-emerald-700 mb-4">
                Full course access has been granted.
                </p>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={handleAccessDashboard}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Access Your Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-3 text-center">
                  Complete Your Payment
                </h3>
                
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${paymentDetails.upiId}&pn=${encodeURIComponent(paymentDetails.name)}&am=${paymentDetails.amount}&tn=${encodeURIComponent(paymentDetails.note)}`} 
                      alt="UPI QR Code"
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200 w-full">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-gray-600">UPI ID:</span>
                      <span className="font-mono">{paymentDetails.upiId}</span>
                      
                      <span className="text-gray-600">Amount:</span>
                      <span>₹{paymentDetails.amount}</span>
                      
                      <span className="text-gray-600">Name:</span>
                      <span>{paymentDetails.name}</span>
                    </div>
                  </div>

                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handlePaymentSubmission}
                    disabled={paymentLoading}
                    startIcon={paymentLoading ? <CircularProgress size={20} /> : null}
                  >
                    {paymentLoading ? 'Processing...' : 'I Have Made Payment'}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    After payment verification, you'll gain full access
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;