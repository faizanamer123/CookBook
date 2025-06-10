const express = require('express');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'cookbook_profile_pictures' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    const readableStream = new Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });
    
    readableStream.pipe(uploadStream);
  });
};

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const user = await User.create({ username, email, password });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ 
    token, 
    user: { 
      id: user._id, 
      username: user.username, 
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      dietaryPreferences: user.dietaryPreferences,
      cookingSkillLevel: user.cookingSkillLevel,
      favoriteCuisines: user.favoriteCuisines,
      socialMediaLinks: user.socialMediaLinks,
      savedRecipes: user.savedRecipes,
      likedRecipes: user.likedRecipes
    } 
  });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ 
    token, 
    user: { 
      id: user._id, 
      username: user.username, 
      email: user.email,
      bio: user.bio,
      profilePicture: user.profilePicture,
      dietaryPreferences: user.dietaryPreferences,
      cookingSkillLevel: user.cookingSkillLevel,
      favoriteCuisines: user.favoriteCuisines,
      socialMediaLinks: user.socialMediaLinks,
      savedRecipes: user.savedRecipes,
      likedRecipes: user.likedRecipes
    } 
  });
}));

// Get current user
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
}));

// Update user profile
router.put('/profile', auth, asyncHandler(async (req, res) => {
  try {
    const { 
      username, 
      bio, 
      dietaryPreferences, 
      cookingSkillLevel, 
      favoriteCuisines, 
      socialMediaLinks 
    } = req.body;
    
    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (dietaryPreferences) updates.dietaryPreferences = dietaryPreferences;
    if (cookingSkillLevel) updates.cookingSkillLevel = cookingSkillLevel;
    if (favoriteCuisines) updates.favoriteCuisines = favoriteCuisines;
    if (socialMediaLinks) updates.socialMediaLinks = socialMediaLinks;
    
    // Log the user ID and update object for debugging
    console.log('Updating user:', req.user._id);
    console.log('Update data:', updates);
    
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      console.log('User not found for ID:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Ensure we're sending a proper JSON response
    return res.json(user);
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ message: err.message || 'Error updating profile' });
  }
}));

// Upload profile picture
router.post('/profile-picture', auth, upload.single('image'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Log for debugging
    console.log('Uploading profile picture for user:', req.user._id);
    console.log('File details:', { 
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);
    console.log('Cloudinary upload result:', result.secure_url);
    
    // Update user profile with the new image URL
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: result.secure_url },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      console.log('User not found for ID:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      message: 'Profile picture uploaded successfully',
      profilePicture: result.secure_url,
      user
    });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ message: err.message || 'Error uploading profile picture' });
  }
}));

// Change password
router.post('/change-password', auth, asyncHandler(async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ message: err.message || 'Error changing password' });
  }
}));

module.exports = router; 