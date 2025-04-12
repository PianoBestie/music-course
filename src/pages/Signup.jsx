import React, { useState, useEffect } from 'react';
import { Piano as PianoIcon, Verified as VerifiedIcon } from '@mui/icons-material';
import { Google } from '@mui/icons-material';
import { CircularProgress, Alert, Button } from '@mui/material';
import { 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
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
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user);
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      // Use signInWithPopup instead of redirect
      const result = await signInWithPopup(auth, provider);
      console.log("Sign-in result:", result);
      
      // Check Firestore for user record
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        setUserData({
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        });
        setSuccess('Authentication successful! Complete your registration.');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkUserRegistration(user);
      }
    });

    // Handle redirect result
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          checkUserRegistration(result.user);
        }
      } catch (err) {
        setError(getFirebaseErrorMessage(err.code));
        console.error('Redirect error:', err);
      }
    };

    handleRedirect();

    return () => unsubscribe();
  }, []);

  const checkUserRegistration = async (user) => {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      setUserData({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      });
      setSuccess('Google authentication successful! Please complete payment to finish registration.');
    } else {
      setSuccess("Welcome back to Piano Bestie! You are already signed in.");
      // Redirect to dashboard or home page
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      setError('');
      
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }
  
      const amountInPaise = 1 * 100; // ₹1 in paise
  
      const orderResponse = await fetch('https://music-course.onrender.com/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amountInPaise,
          notes: { 
            name: userData.displayName, 
            email: userData.email,
            uid: userData.uid
          }
        }),
      });
  
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
  
      const orderData = await orderResponse.json();

  
      const options = {
        key: "rzp_test_vTXBgsrLhU2Mcg",
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'Piano Bestie',
        description: 'Account Verification',
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            const verificationResponse = await fetch('https://music-course.onrender.com/verify-payment', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userData.uid
              })
            });
  
            if (!verificationResponse.ok) {
              throw new Error('Payment verification failed');
            }
  
            const verificationData = await verificationResponse.json();
            
            if (verificationData.success) {
              await completeRegistration(response);
              navigate('/dashboard');
            } else {
              setError('Payment verification failed');
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: userData.displayName,
          email: userData.email
        },
        theme: { color: '#81479a' }
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setError(error.message || 'Payment processing failed');
      setPaymentLoading(false);
    }
  };

  const completeRegistration = async (paymentDetails = null) => {
    try {
      const userDataToSave = {
        name: userData.displayName,
        uid:userData.uid,
        email: userData.email,
        photoURL: userData.photoURL,
        createdAt: new Date(),
        lastLogin: new Date(),
        emailVerified: true,
        role: 'user',
        status: 'active',
        provider: 'google',
        paymentStatus: paymentDetails ? 'verified' : 'pending',
        paymentMethod: paymentDetails ? 'razorpay' : null,
        ...(paymentDetails && {
          paymentDate: new Date(),
          paymentDetails: {
            razorpayOrderId: paymentDetails.razorpay_order_id,
            razorpayPaymentId: paymentDetails.razorpay_payment_id,
            razorpaySignature: paymentDetails.razorpay_signature,
            amount: 1,
            currency: 'INR'
          }
        })
      };
  
      // Add debug logging
      console.log('Saving to Firestore:', {
        collection: 'users',
        id: userData.uid,
        data: userDataToSave
      });
  
      await setDoc(doc(db, 'users', userData.uid), userDataToSave);
  
      setSuccess('Registration and payment successful! Redirecting...');
      
      // Add a small delay before redirect to ensure data is saved
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
  
    } catch (err) {
      console.error('Firestore write error:', err);
      setError(`Failed to complete registration: ${err.message}`);
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
                    <span className="font-semibold">Note:</span> A nominal ₹1 payment is required to verify your account and complete registration.
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
                    'Pay ₹1 & Complete Registration'
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