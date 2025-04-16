import { createSlice } from '@reduxjs/toolkit';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const initialState = {
  currentUser: null,
  paymentStatus: null,
  authLoading: true,
  paymentLoading: true,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (state, action) => {
      state.currentUser = action.payload.user;
      state.paymentStatus = action.payload.status;
      state.authLoading = false;
      state.paymentLoading = false;
    },
    setAuthLoading: (state, action) => {
      state.authLoading = action.payload;
    },
    setPaymentLoading: (state, action) => {
      state.paymentLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearAuth: (state) => {
      state.currentUser = null;
      state.paymentStatus = null;
    }
  }
});

export const initializeAuthListener = () => (dispatch) => {
  dispatch(setAuthLoading(true));
  
  const authUnsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Return the Firestore unsubscribe function
      return onSnapshot(doc(db, 'users', user.uid), (doc) => {
        const status = doc.exists() ? doc.data().paymentStatus : 'pending';
        dispatch(setAuthState({
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          },
          status
        }));
      });
    } else {
      dispatch(clearAuth());
      dispatch(setAuthLoading(false));
      return () => {}; // Return empty function if no user
    }
  });

  return () => {
    authUnsubscribe();
  };
};

export const { setAuthState, setAuthLoading, setPaymentLoading, setError, clearAuth } = authSlice.actions;
export default authSlice.reducer;