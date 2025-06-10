const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  ingredients: [{ 
    name: { type: String, required: true },
    amount: { type: String, required: true },
    unit: { type: String }
  }],
  instructions: [{ type: String, required: true }],
  image: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cookTime: { type: Number, default: 0 },
  servings: { type: Number, default: 1 },
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    default: 'Medium'
  },
  cuisineType: { 
    type: String, 
    enum: ['Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai', 'Mediterranean', 'French', 'American', 'Middle Eastern', 'Other'],
    default: 'Other'
  },
  dietaryRestrictions: [{ type: String }],
  tags: [{ type: String }],
  likes: { type: Number, default: 0 },
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Add indexes for search performance
recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Calculate average rating
recipeSchema.methods.getAverageRating = function() {
  if (this.comments.length === 0) {
    return 0;
  }
  
  const commentCount = this.comments.filter(comment => comment.rating).length;
  if (commentCount === 0) {
    return 0;
  }
  
  const sum = this.comments.reduce((total, comment) => {
    return total + (comment.rating || 0);
  }, 0);
  
  return sum / commentCount;
};

module.exports = mongoose.model('Recipe', recipeSchema); 