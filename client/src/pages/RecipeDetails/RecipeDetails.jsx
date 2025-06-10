import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import styles from './RecipeDetails.module.css';
import Button from '../../components/Button/Button';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaEdit, FaTrash, FaArrowLeft, FaClock, FaUtensils } from 'react-icons/fa';
import { API_URL } from '../../config';

const RecipeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, toggleRecipeLike, toggleRecipeBookmark } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching recipe with ID: ${id}`);
        const response = await axios.get(`${API_URL}/recipes/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Recipe data received:', response.data);
        
        // Ensure ingredients is always an array of objects with name, amount, unit
        let recipeData = response.data;
        if (recipeData && Array.isArray(recipeData.ingredients)) {
          // Make sure ingredients have the correct structure
          recipeData.ingredients = recipeData.ingredients.map(ingredient => {
            if (typeof ingredient === 'string') {
              // Convert string ingredients to object format
              const parts = ingredient.trim().split(' ');
              const amount = parts[0] || '1';
              const unit = parts.length > 2 ? parts[1] : '';
              const name = parts.length > 2 ? 
                parts.slice(2).join(' ') : 
                parts.length > 1 ? parts[1] : ingredient.trim();
              
              return {
                name: name || ingredient.trim(),
                amount: amount,
                unit: unit
              };
            }
            return ingredient;
          });
        } else if (recipeData && !recipeData.ingredients) {
          recipeData.ingredients = [];
        }
        
        setRecipe(recipeData);
        
        // Check if user has liked or bookmarked this recipe
        if (user) {
          setIsLiked(user.likedRecipes?.includes(id));
          setIsBookmarked(user.savedRecipes?.includes(id));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError(err.response?.data?.message || 'Failed to load recipe');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchRecipe();
    }
  }, [id, user]);

  const handleLikeToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const result = await toggleRecipeLike(id);
      if (result.success) {
        setIsLiked(result.liked);
        
        // Update recipe likes count
        setRecipe(prev => ({
          ...prev,
          likes: result.liked ? (prev.likes + 1) : (prev.likes - 1)
        }));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const result = await toggleRecipeBookmark(id);
      if (result.success) {
        setIsBookmarked(result.bookmarked);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/recipes/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      navigate('/');
    } catch (err) {
      console.error('Error deleting recipe:', err);
      setError('Failed to delete recipe. Please try again.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading recipe...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error loading recipe</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/browse')}>Browse Recipes</button>
      </div>
    );
  }

  if (!recipe) {
    return <div className={styles.notFound}>Recipe not found</div>;
  }

  const isAuthor = user && recipe.author?._id === user.id;

  return (
    <div className={styles.recipeDetailsContainer}>
      <div className={styles.recipeHeader}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        
        <div className={styles.recipeActions}>
          <button 
            className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            onClick={handleLikeToggle}
            aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />} {recipe.likes || 0}
          </button>
          
          <button 
            className={`${styles.actionButton} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmarkToggle}
            aria-label={isBookmarked ? 'Remove from saved recipes' : 'Save recipe'}
          >
            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </button>
          
          {isAuthor && (
            <>
              <button 
                className={styles.actionButton} 
                onClick={() => navigate(`/recipe/edit/${id}`)}
                aria-label="Edit recipe"
              >
                <FaEdit />
              </button>
              
              <button 
                className={`${styles.actionButton} ${styles.deleteButton}`} 
                onClick={handleDeleteRecipe}
                aria-label="Delete recipe"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className={styles.recipeContent}>
        <div className={styles.recipeImageContainer}>
          {recipe.image ? (
            <img src={recipe.image} alt={recipe.title} className={styles.recipeImage} />
          ) : (
            <div className={styles.placeholderImage}>No image available</div>
          )}
        </div>
        
        <div className={styles.recipeInfo}>
          <h1 className={styles.recipeTitle}>{recipe.title}</h1>
          
          <div className={styles.recipeMetadata}>
            <div className={styles.metaItem}>
              <FaClock />
              <span>{recipe.cookTime} min</span>
            </div>
            
            <div className={styles.metaItem}>
              <FaUtensils />
              <span>{recipe.servings} servings</span>
            </div>
            
            <div className={styles.metaItem}>
              <span className={styles.difficultyTag}>{recipe.difficulty}</span>
            </div>
            
            {recipe.cuisineType && (
              <div className={styles.metaItem}>
                <span className={styles.cuisineTag}>{recipe.cuisineType}</span>
              </div>
            )}
          </div>
          
          {recipe.author && (
            <div className={styles.recipeAuthor}>
              {recipe.author.profilePicture ? (
                <img 
                  src={recipe.author.profilePicture} 
                  alt={recipe.author.username} 
                  className={styles.authorImage}
                />
              ) : (
                <div className={styles.authorInitials}>
                  {recipe.author.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span>By {recipe.author.username}</span>
            </div>
          )}
          
          {recipe.description && (
            <div className={styles.recipeDescription}>
              <p>{recipe.description}</p>
            </div>
          )}
          
          {recipe.dietaryRestrictions && recipe.dietaryRestrictions.length > 0 && (
            <div className={styles.dietaryTags}>
              {recipe.dietaryRestrictions.map(tag => (
                <span key={tag} className={styles.dietaryTag}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.recipeDetails}>
        <div className={styles.ingredientsSection}>
          <h2>Ingredients</h2>
          <ul className={styles.ingredientsList}>
            {recipe.ingredients && recipe.ingredients.map((ingredient, index) => (
              <li key={index} className={styles.ingredientItem}>
                <span className={styles.ingredientAmount}>
                  {ingredient.amount} {ingredient.unit || ''}
                </span>
                <span className={styles.ingredientName}>{ingredient.name}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className={styles.instructionsSection}>
          <h2>Instructions</h2>
          <ol className={styles.instructionsList}>
            {recipe.instructions.map((step, index) => (
              <li key={index} className={styles.instructionStep}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <div className={styles.stepText}>{step}</div>
              </li>
            ))}
          </ol>
        </div>
      </div>
      
      <div className={styles.commentsSection}>
        <h2>Comments and Ratings</h2>
        {/* Comments section to be implemented */}
        <div className={styles.commentForm}>
          <Button variant="primary" disabled={!user}>Add Comment</Button>
          {!user && <p>Please login to comment</p>}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails; 