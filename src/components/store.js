// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import musicReducer from './musicSlice';

export const store = configureStore({
  reducer: {
    music: musicReducer,
    auth: authReducer,
  }
});
