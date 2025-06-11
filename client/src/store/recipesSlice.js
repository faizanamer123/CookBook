import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '../config';

const initialState = {
  recipes: [],
  favorites: [],
  loading: false,
  error: null,
  comments: {} // Store comments by recipe ID
};

// Async thunks
export const fetchRecipes = createAsyncThunk(
  'recipes/fetchRecipes',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recipes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }

      return data.map(recipe => ({
        ...recipe,
        id: recipe._id || recipe.id,
        title: recipe.title || 'Untitled Recipe',
        image: recipe.image || recipe.imageUrl || '',
        imageUrl: recipe.imageUrl || recipe.image || '',
        rating: recipe.rating || 0,
        cookTime: recipe.cookTime || 0,
        tags: Array.isArray(recipe.tags) ? recipe.tags : [],
        author: recipe.author 
          ? {
              ...recipe.author,
              id: recipe.author._id || recipe.author.id
            }
          : { username: 'Unknown' }
      }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRecipeById = createAsyncThunk(
  'recipes/fetchRecipeById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recipes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load recipe');
      }
      
      const data = await response.json();
      if (!data || !data.id) {
        throw new Error('Invalid recipe data received');
      }

      return {
        ...data,
        id: data.id || data._id,
        title: data.title || 'Untitled Recipe',
        description: data.description || '',
        image: data.image || data.imageUrl || '',
        imageUrl: data.imageUrl || data.image || '',
        rating: data.rating || 0,
        cookTime: data.cookTime || 0,
        servings: data.servings || 1,
        difficulty: data.difficulty || 'Easy',
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
        steps: data.steps || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        author: data.author
          ? {
              ...data.author,
              id: data.author._id || data.author.id
            }
          : { username: 'Unknown' },
        comments: Array.isArray(data.comments) ? data.comments : []
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addRecipe = createAsyncThunk(
  'recipes/addRecipe',
  async (recipeData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(recipeData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }
      
      const data = await response.json();
      return {
        ...data,
        id: data._id,
        title: data.title || 'Untitled Recipe',
        image: data.image || data.imageUrl || '',
        imageUrl: data.imageUrl || data.image || '',
        rating: data.rating || 0,
        cookTime: data.cookTime || 0,
        tags: Array.isArray(data.tags) ? data.tags : [],
        author: data.author
          ? {
              ...data.author,
              id: data.author._id || data.author.id
            }
          : { username: 'Unknown' }
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch recipes
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single recipe
      .addCase(fetchRecipeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.recipes.findIndex(recipe => recipe.id === action.payload.id);
        if (index !== -1) {
          state.recipes[index] = action.payload;
        } else {
          state.recipes.push(action.payload);
        }
      })
      .addCase(fetchRecipeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add recipe
      .addCase(addRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes.push(action.payload);
      })
      .addCase(addRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  toggleFavorite,
  addComment,
  deleteComment
} = recipesSlice.actions;

export default recipesSlice.reducer; 