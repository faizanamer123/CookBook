import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  recipes: [],
  favorites: [],
  loading: false,
  error: null,
  comments: {} // Store comments by recipe ID
};

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    setRecipes: (state, action) => {
      state.recipes = action.payload;
    },
    addRecipe: (state, action) => {
      const newRecipe = {
        ...action.payload,
        id: action.payload._id || action.payload.id,
        rating: action.payload.rating || 0,
        comments: action.payload.comments || []
      };
      state.recipes.unshift(newRecipe); // Add to beginning of array
      state.loading = false;
      state.error = null;
    },
    updateRecipe: (state, action) => {
      const index = state.recipes.findIndex(recipe => recipe.id === action.payload.id);
      if (index !== -1) {
        state.recipes[index] = action.payload;
      }
    },
    deleteRecipe: (state, action) => {
      state.recipes = state.recipes.filter(recipe => recipe.id !== action.payload);
    },
    toggleFavorite: (state, action) => {
      const recipeId = action.payload;
      const index = state.favorites.indexOf(recipeId);
      if (index === -1) {
        state.favorites.push(recipeId);
      } else {
        state.favorites.splice(index, 1);
      }
    },
    addComment: (state, action) => {
      const { recipeId, comment } = action.payload;
      if (!state.comments[recipeId]) {
        state.comments[recipeId] = [];
      }
      state.comments[recipeId].push({
        id: Date.now(),
        ...comment,
        createdAt: new Date().toISOString()
      });
    },
    deleteComment: (state, action) => {
      const { recipeId, commentId } = action.payload;
      if (state.comments[recipeId]) {
        state.comments[recipeId] = state.comments[recipeId].filter(
          comment => comment.id !== commentId
        );
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  setRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
  addComment,
  deleteComment,
  setLoading,
  setError
} = recipesSlice.actions;

export default recipesSlice.reducer; 