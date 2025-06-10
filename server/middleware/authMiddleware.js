const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Middleware to protect routes - verifies JWT token and attaches user to request
const auth = asyncHandler(async (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  // Check if header exists and has the correct format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided or invalid format');
    return res.status(401).json({ message: 'Access denied. No valid token provided.' });
  }
  
  try {
    // Verify token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('User not found with ID:', decoded.id);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Attach user info to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else {
      return res.status(500).json({ message: 'Server error in authentication' });
    }
  }
});

module.exports = { auth };