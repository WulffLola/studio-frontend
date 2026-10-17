'use client';

import { configureStore } from '@reduxjs/toolkit';
import studioReducer from './studioSlice'; // cambialo si usás otro nombre de slice

export const reduxStore = configureStore({
  reducer: {
    studio: studioReducer, // el key "studio" es el nombre del slice en el estado
  },
});

export type RootState = ReturnType<typeof reduxStore.getState>;
export type AppDispatch = typeof reduxStore.dispatch;
