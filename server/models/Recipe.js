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
  imageUrl: { type: String }, // For backward compatibility
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
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 }
}, { timestamps: true });

// Add indexes for search performance
recipeSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Pre-save middleware to handle image field migration
recipeSchema.pre('save', function(next) {
  // If imageUrl exists but image doesn't, copy it to image
  if (this.imageUrl && !this.image) {
    this.image = this.imageUrl;
  }
  // If image exists but imageUrl doesn't, copy it to imageUrl
  else if (this.image && !this.imageUrl) {
    this.imageUrl = this.image;
  }
  next();
});

// Calculate average rating
recipeSchema.methods.getAverageRating = function() {
  if (!this.comments || this.comments.length === 0) {
    return 0;
  }
  
  const validRatings = this.comments.filter(comment => comment.rating > 0);
  if (validRatings.length === 0) {
    return 0;
  }
  
  const sum = validRatings.reduce((total, comment) => total + comment.rating, 0);
  const average = sum / validRatings.length;
  
  // Update the averageRating field
  this.averageRating = Math.round(average * 10) / 10; // Round to 1 decimal place
  return this.averageRating;
};

// Pre-save hook to update average rating
recipeSchema.pre('save', function(next) {
  if (this.isModified('comments')) {
    this.getAverageRating();
  }
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema); 