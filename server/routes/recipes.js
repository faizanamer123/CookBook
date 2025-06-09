const express = require('express');
const asyncHandler = require('express-async-handler');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const cloudinary = require('cloudinary');
const multer = require('multer');
const { auth } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Get all recipes
router.get('/', asyncHandler(async (req, res) => {
  const recipes = await Recipe.find().populate('author', 'username email');
  res.json(recipes);
}));

// Get single recipe by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate('author', 'username email')
    .lean();

  if (!recipe) {
    return res.status(404).json({ message: 'Recipe not found' });
  }

  // Format the response
  const responseRecipe = {
    ...recipe,
    id: recipe._id.toString(),
    _id: recipe._id.toString(),
    author: {
      id: recipe.author._id.toString(),
      username: recipe.author.username,
      email: recipe.author.email
    },
    rating: recipe.rating || 0,
    comments: recipe.comments || [],
    createdAt: recipe.createdAt ? recipe.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: recipe.updatedAt ? recipe.updatedAt.toISOString() : new Date().toISOString()
  };

  res.json(responseRecipe);
}));

// Create new recipe
router.post('/', auth, upload.single('image'), asyncHandler(async (req, res) => {
  console.log('Received recipe creation request');
  try {
    const { title, description, ingredients, steps, tags, cookTime, servings, difficulty } = req.body;
    
    // Validate required fields
    if (!title || !description || !ingredients || !steps || !tags || !cookTime || !servings || !difficulty) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'All fields are required',
        missing: Object.entries({ title, description, ingredients, steps, tags, cookTime, servings, difficulty })
          .filter(([_, value]) => !value)
          .map(([key]) => key)
      });
    }

    // Parse JSON fields
    let parsedIngredients, parsedTags;
    try {
      parsedIngredients = JSON.parse(ingredients);
      parsedTags = JSON.parse(tags);
    } catch (error) {
      console.error('JSON parse error:', error);
      return res.status(400).json({ message: 'Invalid ingredients or tags format' });
    }

    // Validate parsed data
    if (!Array.isArray(parsedIngredients) || !Array.isArray(parsedTags)) {
      return res.status(400).json({ message: 'Ingredients and tags must be arrays' });
    }

    if (parsedIngredients.length === 0) {
      return res.status(400).json({ message: 'At least one ingredient is required' });
    }

    let imageUrl = '';
    if (req.file) {
      try {
        console.log('Uploading image to Cloudinary...');
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        
        const result = await cloudinary.uploader.upload(dataURI, {
          resource_type: 'image',
          folder: 'cookbook',
          timeout: 60000, // 60 second timeout
          eager: [
            { width: 1000, height: 1000, crop: 'limit' }
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
      ingredients: parsedIngredients.map(i => i.trim()),
      steps: steps.trim(),
      tags: parsedTags.map(t => t.trim()),
      imageUrl,
      cookTime: parseInt(cookTime),
      servings: parseInt(servings),
      difficulty,
      author: req.user._id
    });

    const savedRecipe = await recipe.save();
    console.log('Recipe saved, populating author...');
    
    const populatedRecipe = await Recipe.findById(savedRecipe._id)
      .populate('author', 'username email')
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
        username: populatedRecipe.author.username,
        email: populatedRecipe.author.email
      },
      rating: 0,
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
router.put('/:id', auth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  if (recipe.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

  let imageUrl = recipe.imageUrl;
  if (req.file) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'cookbook' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    imageUrl = result.secure_url;
  }

  recipe.title = req.body.title || recipe.title;
  recipe.ingredients = req.body.ingredients ? JSON.parse(req.body.ingredients) : recipe.ingredients;
  recipe.steps = req.body.steps || recipe.steps;
  recipe.tags = req.body.tags ? JSON.parse(req.body.tags) : recipe.tags;
  recipe.imageUrl = imageUrl;

  await recipe.save();
  res.json(recipe);
}));

// Delete recipe
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  if (recipe.author.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
  await recipe.deleteOne();
  res.json({ message: 'Recipe deleted' });
}));

// Get comments for a recipe
router.get('/:id/comments', asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  res.json(recipe.comments || []);
}));

// Add a comment
router.post('/:id/comments', auth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  const comment = {
    _id: new mongoose.Types.ObjectId(),
    author: req.user._id,
    authorName: req.user.username,
    text: req.body.text,
    createdAt: new Date()
  };
  recipe.comments = recipe.comments || [];
  recipe.comments.push(comment);
  await recipe.save();
  res.status(201).json(comment);
}));

// Delete a comment
router.delete('/:id/comments/:commentId', auth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  recipe.comments = (recipe.comments || []).filter(c => c._id.toString() !== req.params.commentId);
  await recipe.save();
  res.json({ message: 'Comment deleted' });
}));

// Toggle favorite recipe
router.post('/:id/favorite', auth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

  const user = await User.findById(req.user._id);
  const recipeIndex = user.savedRecipes.indexOf(recipe._id);

  if (recipeIndex === -1) {
    user.savedRecipes.push(recipe._id);
  } else {
    user.savedRecipes.splice(recipeIndex, 1);
  }

  await user.save();
  res.json({ 
    isFavorite: recipeIndex === -1,
    savedRecipes: user.savedRecipes 
  });
}));

// Get user's favorite recipes
router.get('/favorites', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('savedRecipes');
  res.json(user.savedRecipes);
}));

// More routes (create, update, delete) can be added here

module.exports = router; 