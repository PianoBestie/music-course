import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const usePaymentStatusCache = () => {
  const getCachedPaymentStatus = (userId) => {
    try {
      const cachedData = localStorage.getItem(`paymentStatus_${userId}`);
      if (!cachedData) return null;
      
      const { status, timestamp } = JSON.parse(cachedData);
      // Cache valid for 1 hour
      if (Date.now() - timestamp > 3600000) {
        localStorage.removeItem(`paymentStatus_${userId}`);
        return null;
      }
      return status;
    } catch (error) {
      console.error('Error reading payment cache:', error);
      return null;
    }
  };

  const setCachedPaymentStatus = (userId, status) => {
    try {
      localStorage.setItem(
        `paymentStatus_${userId}`,
        JSON.stringify({ status, timestamp: Date.now() })
      );
    } catch (error) {
      console.error('Error caching payment status:', error);
    }
  };

  return { getCachedPaymentStatus, setCachedPaymentStatus };
};

const PaymentProtectedRoute = ({ children }) => {
  const currentUser = useSelector((state) => state.auth.currentUser);
  const authLoading = useSelector((state) => state.auth.loading);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const location = useLocation();
  const { getCachedPaymentStatus, setCachedPaymentStatus } = usePaymentStatusCache();

  const LoadingFallback = useMemo(() => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ), []);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      setFirestoreLoading(false);
      return;
    }

    // Check cache first
    const cachedStatus = getCachedPaymentStatus(currentUser.uid);
    if (cachedStatus) {
      setPaymentStatus(cachedStatus);
      setFirestoreLoading(false);
      return;
    }

    let unsubscribe;

    const fetchPaymentStatus = async () => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const newStatus = doc.data().paymentStatus || 'pending';
            setPaymentStatus(newStatus);
            setCachedPaymentStatus(currentUser.uid, newStatus);
          } else {
            setPaymentStatus('pending');
          }
          setFirestoreLoading(false);
        });
      } catch (error) {
        console.error('Payment check error:', error);
        setPaymentStatus('pending');
        setFirestoreLoading(false);
      }
    };

    fetchPaymentStatus();

    return () => unsubscribe && unsubscribe();
  }, [currentUser, authLoading, getCachedPaymentStatus, setCachedPaymentStatus]);

  if (authLoading || (!paymentStatus && firestoreLoading)) {
    return LoadingFallback;
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