const express = require('express');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

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
      socialMediaLinks: user.socialMediaLinks
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
      socialMediaLinks: user.socialMediaLinks
    } 
  });
}));

// Get current user
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}));

// Update user profile
router.put('/profile', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    
    const user = await User.findByIdAndUpdate(
      decoded.id, 
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}));

// Upload profile picture
router.post('/profile-picture', upload.single('image'), asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);
    
    // Update user profile with the new image URL
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { profilePicture: result.secure_url },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ 
      message: 'Profile picture uploaded successfully',
      profilePicture: result.secure_url,
      user
    });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({ message: 'Error uploading profile picture' });
  }
}));

module.exports = router; 