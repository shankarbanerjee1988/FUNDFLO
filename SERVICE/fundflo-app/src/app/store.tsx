import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/auth/slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers as needed
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


