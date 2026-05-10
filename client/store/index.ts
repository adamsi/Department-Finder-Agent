import { configureStore } from '@reduxjs/toolkit';
import toastReducer from './slices/toastSlice';
import uploadReducer from './slices/uploadSlice';
import chatMemoryReducer from './slices/chatMemorySlice';

export const store = configureStore({
  reducer: {
    toast: toastReducer,
    upload: uploadReducer,
    chatMemory: chatMemoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
