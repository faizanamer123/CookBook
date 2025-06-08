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
  comments: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema); 