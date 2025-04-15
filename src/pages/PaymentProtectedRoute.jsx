import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { auth } from '../firebaseConfig';
import { CircularProgress } from '@mui/material';

const PaymentProtectedRoute = ({ children }) => {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        console.log("Firestore Payment Data:", data); // Debug log
        
        // Ensure we're checking the exact field name
        const status = data.paymentStatus;
        setPaymentStatus(status);

        // If verified and on payment-required, redirect to intended path
        if (status === 'verified' && location.pathname === '/payment-required') {
          const redirectTo = new URLSearchParams(location.search).get('redirect') || '/dashboard';
          navigate(redirectTo, { replace: true });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, location]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={`/signup?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (paymentStatus !== 'verified') {
    return <Navigate to={`/payment-required?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
};

export default React.memo(PaymentProtectedRoute);