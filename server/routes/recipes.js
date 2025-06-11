const express = require('express');
const asyncHandler = require('express-async-handler');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { auth } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Get all recipes
router.get('/', asyncHandler(async (req, res) => {
  try {
    const { author, category } = req.query;
    const filter = {};
    
    // Filter by author if provided
    if (author) {
      filter.author = author;
    }

    // Filter by category if provided
    if (category) {
      const normalizedCategory = category.toLowerCase().trim();
      filter.tags = {
        $regex: new RegExp(`^${normalizedCategory}$|^${normalizedCategory}s$|^${normalizedCategory.replace('-', ' ')}$|^${normalizedCategory.replace('-', ' ')}s$`, 'i')
      };
    }
    
    const recipes = await Recipe.find(filter).populate('author', 'username email profilePicture');
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Error fetching recipes', error: error.message });
  }
}));

// Get single recipe by ID
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const recipeId = req.params.id;
    console.log(`Fetching recipe with ID: ${recipeId}`);
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      console.error(`Invalid recipe ID format: ${recipeId}`);
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }
    
    const recipe = await Recipe.findById(recipeId)
      .populate('author', 'username profilePicture');
    
    if (!recipe) {
      console.error(`Recipe not found with ID: ${recipeId}`);
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    console.log(`Successfully found recipe: ${recipe.title}`);
    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}));

// Create new recipe
router.post('/', auth, upload.single('image'), asyncHandler(async (req, res) => {
  console.log('Received recipe creation request');
  try {
    const { title, description, ingredients, instructions, tags, cookTime, servings, difficulty } = req.body;
    
    // Validate required fields
    if (!title || !description || !ingredients || !instructions || !tags || !cookTime || !servings || !difficulty) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'All fields are required',
        missing: Object.entries({ title, description, ingredients, instructions, tags, cookTime, servings, difficulty })
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      });
    }

    // Parse JSON fields
    let parsedIngredients, parsedTags, parsedInstructions;
    try {
      parsedIngredients = JSON.parse(ingredients);
      parsedTags = JSON.parse(tags);
      parsedInstructions = JSON.parse(instructions);
    } catch (error) {
      console.error('JSON parse error:', error);
      return res.status(400).json({ message: 'Invalid ingredients, instructions, or tags format' });
    }

    // Validate parsed data
    if (!Array.isArray(parsedIngredients) || !Array.isArray(parsedTags) || !Array.isArray(parsedInstructions)) {
      return res.status(400).json({ message: 'Ingredients, instructions, and tags must be arrays' });
    }

    if (parsedIngredients.length === 0) {
      return res.status(400).json({ message: 'At least one ingredient is required' });
    }

    // Ensure ingredients have the right format (objects with name, amount, unit)
    parsedIngredients = parsedIngredients.map(ingredient => {
      if (typeof ingredient === 'string') {
        // Convert string ingredients to object format
        const parts = ingredient.trim().split(' ');
        return {
          name: parts.slice(2).join(' ') || ingredient,
          amount: parts[0] || '1',
          unit: parts[1] || ''
        };
      }
      return {
        name: ingredient.name || '',
        amount: ingredient.amount || '1',
        unit: ingredient.unit || ''
      };
    });

    let imageUrl = '';
    if (req.file) {
      try {
        console.log('Uploading image to Cloudinary...');
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          resource_type: 'image',
          folder: 'cookbook',
          timeout: 60000,
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });

        console.log('Image uploaded successfully:', result.secure_url);
        imageUrl = result.secure_url;
      } catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({ 
          message: 'Failed to upload image',
          error: error.message 
        });
      }
    }

    console.log('Creating recipe in database...');
    const recipe = new Recipe({
      title: title.trim(),
      description: description.trim(),
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      image: imageUrl,
      imageUrl: imageUrl,
      cookTime: parseInt(cookTime),
      servings: parseInt(servings),
      difficulty,
      author: req.user._id,
      cuisineType: 'Other',
      tags: parsedTags
    });

    const savedRecipe = await recipe.save();
    console.log('Recipe saved, populating author...');
    
    const populatedRecipe = await Recipe.findById(savedRecipe._id)
      .populate('author', 'username email profilePicture')
      .lean();

    if (!populatedRecipe) {
      throw new Error('Failed to retrieve created recipe');
    }

    // Format the response
    const responseRecipe = {
      ...populatedRecipe,
      id: populatedRecipe._id.toString(),
      _id: populatedRecipe._id.toString(),
      author: {
        id: populatedRecipe.author._id.toString(),
        _id: populatedRecipe.author._id.toString(),
        username: populatedRecipe.author.username,
        email: populatedRecipe.author.email,
        profilePicture: populatedRecipe.author.profilePicture
      },
      likeCount: 0,
      averageRating: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Sending response...');
    res.status(201).json(responseRecipe);
  } catch (error) {
    console.error('Recipe creation error:', error);
    res.status(500).json({ 
      message: 'Failed to create recipe',
      error: error.message 
    });
  }
}));

// Update recipe
router.put('/:id', auth, upload.single('image'), asyncHandler(async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    
    // Check if user is the author
    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this recipe' });
    }

    // Handle image upload if a new image is provided
    let imageUrl = recipe.image || recipe.imageUrl;
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          resource_type: 'image',
          folder: 'cookbook',
          timeout: 60000,
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });
        
        imageUrl = result.secure_url;
      } catch (error) {
        console.error('Image upload error:', error);
        return res.status(500).json({ 
          message: 'Failed to upload image',
          error: error.message 
        });
      }
    } else if (req.body.existingImage) {
      // If no new file but existing image URL is provided, use that
      imageUrl = req.body.existingImage;
    }

    // Parse JSON fields
    let parsedIngredients, parsedTags, parsedInstructions;
    try {
      if (req.body.ingredients) {
        parsedIngredients = JSON.parse(req.body.ingredients);
      }
      if (req.body.tags) {
        parsedTags = JSON.parse(req.body.tags);
      }
      if (req.body.instructions) {
        parsedInstructions = JSON.parse(req.body.instructions);
      }
    } catch (error) {
      console.error('JSON parse error:', error);
      return res.status(400).json({ message: 'Invalid ingredients, instructions, or tags format' });
    }

    // Update recipe fields
    const updates = {
      title: req.body.title || recipe.title,
      description: req.body.description || recipe.description,
      image: imageUrl,
      imageUrl: imageUrl,
      cookTime: req.body.cookTime ? parseInt(req.body.cookTime) : recipe.cookTime,
      servings: req.body.servings ? parseInt(req.body.servings) : recipe.servings,
      difficulty: req.body.difficulty || recipe.difficulty,
      cuisineType: req.body.cuisineType || recipe.cuisineType
    };

    // Only update arrays if they were provided
    if (parsedIngredients) {
      updates.ingredients = parsedIngredients;
    }
    if (parsedInstructions) {
      updates.instructions = parsedInstructions;
    }
    if (parsedTags) {
      updates.tags = parsedTags;
    }

    // Update the recipe
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'username email profilePicture');

    if (!updatedRecipe) {
      return res.status(404).json({ message: 'Recipe not found after update' });
    }

    // Format the response
    const responseRecipe = {
      ...updatedRecipe.toObject(),
      id: updatedRecipe._id.toString(),
      _id: updatedRecipe._id.toString(),
      author: {
        id: updatedRecipe.author._id.toString(),
        _id: updatedRecipe.author._id.toString(),
        username: updatedRecipe.author.username,
        email: updatedRecipe.author.email,
        profilePicture: updatedRecipe.author.profilePicture
      }
    };

    res.json(responseRecipe);
  } catch (error) {
    console.error('Recipe update error:', error);
    res.status(500).json({ 
      message: 'Failed to update recipe',
      error: error.message 
    });
  }
}));

// Delete recipe
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if user is the author of the recipe
    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }

    // Delete the recipe
    await Recipe.findByIdAndDelete(req.params.id);

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Failed to delete recipe', error: error.message });
  }
}));

// Get comments for a recipe
router.get('/:id/comments', asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate('comments.author', 'username profilePicture');
    
  if (!recipe) {
    return res.status(404).json({ message: 'Recipe not found' });
  }
  
  res.json({
    comments: recipe.comments || []
  });
}));

// Add a comment to a recipe
router.post('/:id/comments', auth, asyncHandler(async (req, res) => {
  try {
    const { text, rating } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (rating && (rating < 0 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 0 and 5' });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const comment = {
      author: req.user._id,
      content: text,
      rating: rating || 0,
      createdAt: new Date()
    };

    recipe.comments.push(comment);
    
    // Calculate new average rating
    const validRatings = recipe.comments.filter(c => c.rating > 0);
    if (validRatings.length > 0) {
      const sum = validRatings.reduce((acc, c) => acc + c.rating, 0);
      recipe.averageRating = Math.round((sum / validRatings.length) * 10) / 10;
    }

    await recipe.save();

    // Populate the author details for the new comment
    const populatedRecipe = await Recipe.findById(recipe._id)
      .populate('comments.author', 'username profilePicture');

    const newComment = populatedRecipe.comments[populatedRecipe.comments.length - 1];

    res.status(201).json({
      comment: {
        _id: newComment._id,
        content: newComment.content,
        rating: newComment.rating,
        createdAt: newComment.createdAt,
        author: {
          _id: newComment.author._id,
          username: newComment.author.username,
          profilePicture: newComment.author.profilePicture
        }
      },
      averageRating: recipe.averageRating
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
}));

// Delete a comment
router.delete('/:id/comments/:commentId', auth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  
  const comment = recipe.comments.find(c => c._id.toString() === req.params.commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  
  // Check if the user is the comment author or recipe author
  if (comment.author.toString() !== req.user._id.toString() && 
      recipe.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this comment' });
  }
  
  recipe.comments = recipe.comments.filter(c => c._id.toString() !== req.params.commentId);
  await recipe.save();
  
  res.json({ 
    message: 'Comment deleted',
    averageRating: recipe.averageRating
  });
}));

// Toggle like on a recipe
router.post('/:id/like', auth, asyncHandler(async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if user has already liked the recipe
    const likedIndex = recipe.likes.indexOf(req.user.id);
    
    if (likedIndex === -1) {
      // Add like
      recipe.likes.push(req.user.id);
    } else {
      // Remove like
      recipe.likes.splice(likedIndex, 1);
    }

    await recipe.save();
    res.json({ 
      likes: recipe.likes.length,
      isLiked: likedIndex === -1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}));

// Check if user has liked a recipe
router.get('/:id/like', auth, asyncHandler(async (req, res) => {
  const recipeId = req.params.id;
  const userId = req.user._id;
  
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    return res.status(404).json({ message: 'Recipe not found' });
  }
  
  const isLiked = recipe.likes.includes(userId);
  
  res.json({
    liked: isLiked,
    likeCount: recipe.likes.length
  });
}));

// Toggle bookmark on a recipe
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const bookmarkIndex = user.savedRecipes.indexOf(recipe._id);
    
    if (bookmarkIndex === -1) {
      // Add bookmark
      user.savedRecipes.push(recipe._id);
    } else {
      // Remove bookmark
      user.savedRecipes.splice(bookmarkIndex, 1);
    }

    await user.save();
    res.json({ 
      isBookmarked: bookmarkIndex === -1,
      savedRecipes: user.savedRecipes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookmarked recipes
router.get('/bookmarks', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'savedRecipes',
      populate: {
        path: 'author',
        select: 'username email profilePicture'
      }
    });
  
  res.json(user.savedRecipes);
}));

// Get user's liked recipes
router.get('/liked', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'likedRecipes',
      populate: {
        path: 'author',
        select: 'username email profilePicture'
      }
    });
  
  res.json(user.likedRecipes);
}));

module.exports = router; 