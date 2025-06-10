const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  ingredients: [{ type: String, required: true }],
  steps: { type: String, required: true },
  tags: [{ type: String }],
  imageUrl: { type: String },
  cookTime: { type: Number },
  servings: { type: Number },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewCount: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual property for like count
recipeSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual property for average rating
recipeSchema.virtual('averageRating').get(function() {
  if (this.comments.length === 0) return 0;
  
  const ratingSum = this.comments.reduce((sum, comment) => {
    return sum + (comment.rating || 0);
  }, 0);
  
  const commentCount = this.comments.filter(comment => comment.rating).length;
  return commentCount > 0 ? ratingSum / commentCount : 0;
});

module.exports = mongoose.model('Recipe', recipeSchema); 