import { configureStore } from '@reduxjs/toolkit';
import recipesReducer from './recipesSlice';

const store = configureStore({
  reducer: {
    recipes: recipesReducer,
  },
});

export default store; 