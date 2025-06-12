import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addRecipe } from '../../store/recipesSlice';
import Button from '../../components/Button/Button';
import styles from './CreateRecipe.module.css';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import axios from 'axios';
import { FaPlus, FaMinus, FaTimes, FaSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

const CreateRecipe = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [isEditMode, setIsEditMode] = useState(false);
  const [recipeId, setRecipeId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    cookTime: '',
    servings: '',
    difficulty: 'Easy',
    ingredients: [''],
    instructions: [''],
    tags: []
  });
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/login');
    
    // Check if we're in edit mode by looking for the edit query parameter
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    
    if (editId) {
      setIsEditMode(true);
      setRecipeId(editId);
      fetchRecipeForEdit(editId);
    }
  }, [user, navigate, location]);

  // Fetch the recipe data for editing
  const fetchRecipeForEdit = async (id) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/recipes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const recipe = response.data;
      
      // Check if the current user is the author
      if (recipe.author._id !== user.id && recipe.author.id !== user.id) {
        setError("You don't have permission to edit this recipe");
        navigate('/');
        return;
      }
      
      // Format ingredients for the form
      const formattedIngredients = recipe.ingredients.map(ing => 
        `${ing.amount} ${ing.unit} ${ing.name}`.trim()
      );
      
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        image: null, // We'll keep the existing image unless changed
        cookTime: recipe.cookTime || '',
        servings: recipe.servings || '',
        difficulty: recipe.difficulty || 'Easy',
        ingredients: formattedIngredients.length > 0 ? formattedIngredients : [''],
        instructions: recipe.instructions.length > 0 ? recipe.instructions : [''],
        tags: recipe.tags || []
      });
      
      if (recipe.image || recipe.imageUrl) {
        setImagePreview(recipe.image || recipe.imageUrl);
      }
      
    } catch (err) {
      console.error('Error fetching recipe for edit:', err);
      setError('Could not load the recipe for editing');
    } finally {
      setLoading(false);
    }
  };

  // Validate field on blur
  const validateField = (name, value) => {
    switch (name) {
      case 'title':
        return !value.trim() ? 'Title is required' : '';
      case 'description':
        return !value.trim() ? 'Description is required' : '';
      case 'cookTime':
        return !value ? 'Cook time is required' : 
               value < 1 ? 'Cook time must be at least 1 minute' : '';
      case 'servings':
        return !value ? 'Servings is required' : 
               value < 1 ? 'Servings must be at least 1' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          image: 'Please upload an image file'
        }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          image: 'Image size should be less than 5MB'
        }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({
        ...prev,
        image: ''
      }));
    }
  };

  const handleIngredientChange = (index, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = value;
    setFormData(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({
      ...prev,
      instructions: newInstructions
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const handleTagInputChange = (e) => {
    setNewTag(e.target.value);
  };

  const addTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      action();
    }
  };

  const validateForm = (data) => {
    const newErrors = {};
    Object.keys(data).forEach(key => {
      if (key !== 'tags' && key !== 'image') {
        const error = validateField(key, data[key]);
        if (error) newErrors[key] = error;
      }
    });

    // Only require image for new recipes, not when editing (if we already have an image preview)
    if (!data.image && !isEditMode && !imagePreview) {
      newErrors.image = 'Image is required';
    }
    
    if (data.ingredients.some(ing => !ing.trim())) {
      newErrors.ingredients = 'All ingredients must be filled';
    }
    if (data.instructions.some(inst => !inst.trim())) {
      newErrors.instructions = 'All instructions must be filled';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Mark all fields as touched
    Object.keys(formData).forEach(key => {
      setTouched(prev => ({ ...prev, [key]: true }));
    });

    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description.trim());
      
      // Handle image data
      if (formData.image) {
        // If we have a new image uploaded, include it
        formDataToSend.append('image', formData.image);
      } else if (isEditMode && imagePreview) {
        // If we're in edit mode and have a preview but no new upload,
        // pass the existing image URL
        formDataToSend.append('existingImage', imagePreview);
      }
      
      // Convert string ingredients to the required format with name, amount, and unit
      const formattedIngredients = formData.ingredients
        .filter(ing => ing.trim()) // Remove empty ingredients
        .map(ing => {
          // Simple parsing - assumes format like "2 cups flour" or "1/2 tsp salt"
          const parts = ing.trim().split(' ');
          const amount = parts[0] || '1';
          const unit = parts.length > 2 ? parts[1] : '';
          const name = parts.length > 2 ? 
            parts.slice(2).join(' ') : 
            parts.length > 1 ? parts[1] : ing.trim();
          
          return {
            name: name || ing.trim(),
            amount: amount,
            unit: unit
          };
        });

      formDataToSend.append('ingredients', JSON.stringify(formattedIngredients));
      formDataToSend.append('instructions', JSON.stringify(formData.instructions.filter(inst => inst.trim())));
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      formDataToSend.append('cookTime', formData.cookTime);
      formDataToSend.append('servings', formData.servings);
      formDataToSend.append('difficulty', formData.difficulty);

      let response;
      if (isEditMode && recipeId) {
        // Update existing recipe
        response = await axios.put(`${API_URL}/recipes/${recipeId}`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Create new recipe
        response = await axios.post(`${API_URL}/recipes`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      const newRecipe = response.data;
      console.log(`Recipe ${isEditMode ? 'updated' : 'created'} successfully:`, newRecipe);
      
      // Dispatch the new/updated recipe to Redux store
      dispatch(addRecipe(newRecipe));
      
      // Navigate to the recipe detail page
      navigate(`/recipe/${newRecipe._id || newRecipe.id}`);
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} recipe:`, error);
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} recipe`);
      setLoading(false);
    }
  };

  // Update page title based on mode
  const pageTitle = isEditMode ? 'Edit Recipe' : 'Create New Recipe';

  // Add click outside handler to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [emojiPickerRef]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.subtitle}>
          {isEditMode 
            ? 'Update your culinary masterpiece' 
            : 'Share your culinary masterpiece with the world!'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            placeholder="Enter recipe title"
            disabled={isSubmitting}
          />
          {errors.title && <span className={styles.error}>{errors.title}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>Description</label>
          <div className={styles.descriptionInputContainer}>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`${styles.textarea} ${errors.description ? styles.textareaError : ''}`}
            placeholder="Describe your recipe..."
            disabled={isSubmitting}
          />
            <button 
              type="button"
              className={styles.emojiButton}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Add emoji"
            >
              <FaSmile className={styles.emojiIcon} /> <span className={styles.emojiButtonText}>Emojis</span>
            </button>
            {showEmojiPicker && (
              <div className={styles.emojiPickerContainer} ref={emojiPickerRef}>
                <EmojiPicker onEmojiClick={(emojiData) => {
                  setFormData({
                    ...formData,
                    description: formData.description + emojiData.emoji
                  });
                  setShowEmojiPicker(false);
                }} />
              </div>
            )}
          </div>
          {errors.description && <span className={styles.error}>{errors.description}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Recipe Image</label>
          <div 
            className={`${styles.imageUpload} ${errors.image ? styles.imageUploadError : ''}`}
            onClick={() => document.getElementById('imageInput').click()}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && document.getElementById('imageInput').click()}
          >
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isSubmitting}
            />
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className={styles.imagePreview}
              />
            ) : (
              <div className={styles.uploadPrompt}>
                <span className={styles.uploadIcon}>📷</span>
                <p>Click or drag image to upload</p>
                <p className={styles.uploadHint}>Max size: 5MB</p>
              </div>
            )}
          </div>
          {errors.image && <span className={styles.error}>{errors.image}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="cookTime" className={styles.label}>Cook Time (minutes)</label>
          <input
            type="number"
            id="cookTime"
            name="cookTime"
            value={formData.cookTime}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`${styles.input} ${errors.cookTime ? styles.inputError : ''}`}
            min="1"
            disabled={isSubmitting}
          />
          {errors.cookTime && <span className={styles.error}>{errors.cookTime}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="servings" className={styles.label}>Servings</label>
          <input
            type="number"
            id="servings"
            name="servings"
            value={formData.servings}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`${styles.input} ${errors.servings ? styles.inputError : ''}`}
            min="1"
            disabled={isSubmitting}
          />
          {errors.servings && <span className={styles.error}>{errors.servings}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="difficulty" className={styles.label}>Difficulty</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`${styles.select} ${errors.difficulty ? styles.selectError : ''}`}
            disabled={isSubmitting}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Ingredients</label>
          <div className={styles.ingredientsList}>
            {formData.ingredients.map((ingredient, index) => (
              <div key={index} className={styles.ingredientItem}>
                <div className={styles.ingredientNumber}>{index + 1}</div>
                <input
                  type="text"
                  value={ingredient}
                  onChange={(e) => handleIngredientChange(index, e.target.value)}
                  placeholder="e.g. 2 cups flour"
                  className={styles.input}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className={styles.removeButton}
                  disabled={isSubmitting || formData.ingredients.length <= 1}
                  aria-label="Remove ingredient"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className={styles.addButton}
            disabled={isSubmitting}
          >
            <FaPlus /> Add Ingredient
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Instructions</label>
          <div className={styles.instructionsList}>
            {formData.instructions.map((instruction, index) => (
              <div key={index} className={styles.instructionItem}>
                <div className={styles.instructionNumber}>{index + 1}</div>
                <textarea
                  value={instruction}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  placeholder="Describe this step..."
                  className={styles.textarea}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => removeInstruction(index)}
                  className={styles.removeButton}
                  disabled={isSubmitting || formData.instructions.length <= 1}
                  aria-label="Remove step"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addInstruction}
            className={styles.addButton}
            disabled={isSubmitting}
          >
            <FaPlus /> Add Step
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Tags</label>
          <div className={styles.tagsList}>
            {formData.tags.map((tag, index) => (
              <div key={index} className={styles.tag}>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className={styles.tagRemove}
                  disabled={isSubmitting}
                  aria-label={`Remove tag ${tag}`}
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
          <div className={styles.tagInput}>
            <input
              type="text"
              value={newTag}
              onChange={handleTagInputChange}
              onKeyPress={(e) => handleKeyPress(e, addTag)}
              placeholder="Add a tag and press Enter"
              className={styles.tagInputField}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={addTag}
              className={styles.addButton}
              disabled={isSubmitting || !newTag.trim()}
            >
              <FaPlus /> Add
            </button>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <button
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Recipe' : 'Create Recipe'}
        </button>
      </form>
    </div>
  );
};

export default CreateRecipe; 