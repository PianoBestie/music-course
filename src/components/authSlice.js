// src/redux/authSlice.js

import { createSlice } from '@reduxjs/toolkit';
import { auth } from '../firebaseConfig';

const initialState = {
  currentUser: null,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action) {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.currentUser = null;
      state.loading = false;
    },
  },
});

export const { setUser, setLoading, setError, clearUser } = authSlice.actions;

/**
 * Thunk: Listens for Firebase Auth state changes.
 * Automatically updates Redux store when user signs in or out.
 */
export const initAuthListener = () => (dispatch) => {
  dispatch(setLoading(true));

  return auth.onAuthStateChanged(
    (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified,
          photoURL: firebaseUser.photoURL,
        };
        dispatch(setUser(userData));
      } else {
        dispatch(clearUser());
      }
    },
    (error) => {
      dispatch(setError(error.message));
    }
  );
};

/**
 * Thunk: Manually sets current user from Firebase (if already signed in).
 * Use this if you're not relying on onAuthStateChanged listener.
 */
export const setCurrentUserFromAuth = () => (dispatch) => {
  dispatch(setLoading(true));

  const user = auth.currentUser;

  if (user) {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL,
    };
    dispatch(setUser(userData));
  } else {
    dispatch(clearUser());
  }
};

export default authSlice.reducer;
