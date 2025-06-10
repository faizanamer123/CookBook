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
  const recipes = await Recipe.find().populate('author', 'username email profilePicture');
  res.json(recipes);
}));

// Get single recipe by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate('author', 'username email profilePicture')
    .lean();

  if (!recipe) {
    return res.status(404).json({ message: 'Recipe not found' });
  }

  // Increment view count
  await Recipe.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
  recipe.viewCount = (recipe.viewCount || 0) + 1;

  // Format the response
  const responseRecipe = {
    ...recipe,
    id: recipe._id.toString(),
    _id: recipe._id.toString(),
    author: {
      id: recipe.author._id.toString(),
      username: recipe.author.username,
      email: recipe.author.email,
      profilePicture: recipe.author.profilePicture
    },
    likeCount: recipe.likes ? recipe.likes.length : 0,
    averageRating: recipe.averageRating || 0,
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
      author: req.user._id,
      viewCount: 0,
      likes: []
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
  const recipe = await Recipe.findById(req.params.id)
    .populate({
      path: 'comments.author',
      select: 'username profilePicture'
    });
    
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  res.json(recipe.comments || []);
}));

// Add a comment with rating
router.post('/:id/comments', auth, asyncHandler(async (req, res) => {
  const { text, rating } = req.body;
  if (!text) return res.status(400).json({ message: 'Comment text is required' });
  
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
  
  const comment = {
    _id: new mongoose.Types.ObjectId(),
    author: req.user._id,
    authorName: req.user.username,
    text,
    rating: rating ? parseInt(rating) : undefined,
    createdAt: new Date()
  };
  
  recipe.comments = recipe.comments || [];
  recipe.comments.push(comment);
  await recipe.save();
  
  const populatedRecipe = await Recipe.findById(req.params.id)
    .populate({
      path: 'comments.author',
      select: 'username profilePicture'
    });
  
  const newComment = populatedRecipe.comments.find(c => c._id.toString() === comment._id.toString());
  
  res.status(201).json({
    comment: newComment,
    averageRating: populatedRecipe.averageRating
  });
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

// Toggle like for a recipe
router.post('/:id/like', auth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

  const userIndex = recipe.likes.findIndex(userId => 
    userId.toString() === req.user._id.toString());
  
  // Toggle like
  if (userIndex === -1) {
    recipe.likes.push(req.user._id);
    
    // Also add to user's liked recipes
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { likedRecipes: recipe._id } }
    );
  } else {
    recipe.likes.splice(userIndex, 1);
    
    // Also remove from user's liked recipes
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { likedRecipes: recipe._id } }
    );
  }
  
  await recipe.save();
  
  res.json({
    liked: userIndex === -1,
    likeCount: recipe.likes.length
  });
}));

// Toggle save/bookmark recipe
router.post('/:id/bookmark', auth, asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

  const user = await User.findById(req.user._id);
  const recipeIndex = user.savedRecipes.findIndex(id => 
    id.toString() === recipe._id.toString());

  if (recipeIndex === -1) {
    user.savedRecipes.push(recipe._id);
  } else {
    user.savedRecipes.splice(recipeIndex, 1);
  }

  await user.save();
  res.json({ 
    isBookmarked: recipeIndex === -1,
    savedRecipes: user.savedRecipes 
  });
}));

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