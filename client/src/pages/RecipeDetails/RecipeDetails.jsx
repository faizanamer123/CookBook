import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import styles from './RecipeDetails.module.css';
import Button from '../../components/Button/Button';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaEdit, FaTrash, FaArrowLeft, FaClock, FaUtensils, FaStar, FaRegStar, FaShare } from 'react-icons/fa';
import { API_URL } from '../../config';
import { useDispatch } from 'react-redux';
import { fetchSavedRecipes } from '../../store/recipesSlice';

const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onRatingChange(star)}
          className={`${styles.starButton} ${readOnly ? styles.readOnly : ''}`}
          disabled={readOnly}
        >
          {star <= rating ? <FaStar className={styles.filledStar} /> : <FaRegStar />}
        </button>
      ))}
    </div>
  );
};

const RecipeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (user) {
      // Ensure user ID is normalized for comparisons
      if (user._id && !user.id) {
        user.id = user._id;
      } else if (user.id && !user._id) {
        user._id = user.id;
      }
    }
    
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`${API_URL}/recipes/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch recipe');
        }
        
        const data = await response.json();
        
        // Normalize author data to ensure consistent ID formats
        let normalizedAuthor = data.author;
        if (typeof normalizedAuthor === 'object') {
          normalizedAuthor = {
            ...normalizedAuthor,
            id: normalizedAuthor._id || normalizedAuthor.id,
            _id: normalizedAuthor._id || normalizedAuthor.id,
          };
        }
        
        setRecipe({
          ...data,
          likes: data.likes || [], // Ensure likes is initialized as an empty array if undefined
          author: normalizedAuthor
        });
        
        // Log the author details for debugging
        console.log('Author data:', normalizedAuthor);
        console.log('Current user:', user);
        
        // Check if user has liked the recipe
        if (user) {
          const likeResponse = await fetch(`${API_URL}/recipes/${id}/like`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (likeResponse.ok) {
            const likeData = await likeResponse.json();
            setIsLiked(likeData.liked);
          }
        }
        
        // Check if recipe is bookmarked
        if (user) {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              console.warn('No token found for bookmark check');
              return;
            }
            
            const bookmarksResponse = await fetch(`${API_URL}/recipes/user/bookmarks`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (bookmarksResponse.ok) {
              const bookmarkedRecipes = await bookmarksResponse.json();
              setIsBookmarked(bookmarkedRecipes.some(recipe => recipe._id === id));
            } else {
              console.error('Failed to fetch bookmarks:', await bookmarksResponse.text());
            }
          } catch (error) {
            console.error('Error checking bookmark status:', error);
          }
        }

        // Fetch comments if they exist
        if (data.comments && data.comments.length > 0) {
          setComments(data.comments);
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
        setError('Failed to load recipe. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, user]);

  const handleLikeToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/recipes/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setIsLiked(data.isLiked);
      setRecipe(prev => ({
        ...prev,
        likes: data.isLiked 
          ? [...(prev.likes || []), user._id]
          : (prev.likes || []).filter(id => id !== user._id)
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`${API_URL}/recipes/${id}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bookmark toggle failed:', errorText);
        throw new Error('Failed to toggle bookmark');
      }

      const data = await response.json();
      setIsBookmarked(data.isBookmarked);

      // Dispatch the fetchSavedRecipes action to update the Redux store
      dispatch(fetchSavedRecipes());
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
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
      setError('Failed to delete recipe');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/recipes/${id}/comments`,
        {
          text: newComment,
          rating: newRating
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const newCommentData = {
        _id: response.data.comment._id,
        content: newComment,
        rating: newRating,
        createdAt: new Date().toISOString(),
        author: {
          _id: user._id,
          username: user.username
        }
      };

      setComments(prev => [...prev, newCommentData]);
      setRecipe(prev => ({
        ...prev,
        averageRating: response.data.averageRating
      }));
      
      setNewComment('');
      setNewRating(0);
      setError(null);
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe for ${recipe.title}!`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Recipe link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing recipe:', err);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading recipe...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!recipe) {
    return <div className={styles.notFound}>Recipe not found</div>;
  }

  // Add debug info for author check
  const authorId = recipe.author?._id?.toString() || recipe.author?.id?.toString() || recipe.author?.toString();
  const userId = user?._id?.toString() || user?.id?.toString();
  console.log('Author comparison:', { 
    authorId, 
    userId,
    match: authorId === userId,
    authorType: typeof recipe.author,
    userType: typeof user
  });

  // Simplified isAuthor check using string comparison
  const isAuthor = user && recipe.author && authorId === userId;

  console.log('isAuthor result:', isAuthor);

  return (
    <div className={styles.recipeDetailsContainer}>
      <div className={styles.recipeHeader}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className={styles.recipeImageWrapper}>
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.title} className={styles.recipeImage} />
        ) : (
          <div className={styles.noImage}>No image available</div>
        )}
        <div className={styles.recipeActions}>
          <button 
            className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            onClick={handleLikeToggle}
            aria-label={isLiked ? 'Unlike recipe' : 'Like recipe'}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
            <span>{recipe.likes?.length || 0}</span>
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={handleShare}
            aria-label="Share recipe"
          >
            <FaShare />
          </button>

          <button 
            className={`${styles.actionButton} ${isBookmarked ? styles.bookmarked : ''}`}
            onClick={handleBookmarkToggle}
            aria-label={isBookmarked ? 'Remove from saved recipes' : 'Save recipe'}
          >
            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          </button>
          
          {/* Show edit button if user is author */}
          {isAuthor && (
            <button 
              className={styles.actionButton} 
              onClick={() => navigate(`/create?edit=${id}`)}
              aria-label="Edit recipe"
            >
              <FaEdit />
            </button>
          )}
          
          {/* Show delete button if user is author */}
          {isAuthor && (
            <button 
              className={`${styles.actionButton} ${styles.deleteButton}`} 
              onClick={handleDeleteRecipe}
              aria-label="Delete recipe"
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className={styles.deleteConfirm}>
          <p>Are you sure you want to delete this recipe?</p>
          <div className={styles.deleteActions}>
            <button 
              className={styles.cancelButton}
              onClick={() => setDeleteConfirm(false)}
            >
              Cancel
            </button>
            <button 
              className={styles.confirmButton}
              onClick={handleDeleteRecipe}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className={styles.recipeContent}>
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

        {recipe.description && (
          <div className={styles.recipeDescription}>
            <p>{recipe.description}</p>
          </div>
        )}

        <div className={styles.ingredientsSection}>
          <h2>Ingredients</h2>
          <ul className={styles.ingredientsList}>
            {recipe.ingredients?.map((ingredient, index) => (
              <li key={index} className={styles.ingredientItem}>
                <span className={styles.ingredientAmount}>
                  {ingredient.amount} {ingredient.unit}
                </span>
                <span className={styles.ingredientName}>{ingredient.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.instructionsSection}>
          <h2>Instructions</h2>
          <ol className={styles.instructionsList}>
            {recipe.instructions?.map((step, index) => (
              <li key={index} className={styles.instructionStep}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <div className={styles.stepText}>{step}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.commentsSection}>
          <h2>Comments and Ratings</h2>
          <div className={styles.overallRating}>
            <StarRating rating={Math.round(recipe.averageRating || 0)} readOnly />
            <span>({recipe.averageRating?.toFixed(1) || '0.0'} average from {comments.length} reviews)</span>
          </div>

          {user ? (
            <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
              <div className={styles.ratingInput}>
                <label>Your Rating:</label>
                <StarRating rating={newRating} onRatingChange={setNewRating} />
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this recipe..."
                className={styles.commentTextarea}
                required
              />
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Add Comment'}
              </Button>
            </form>
          ) : (
            <p className={styles.loginPrompt}>
              Please <button onClick={() => navigate('/login')}>login</button> to leave a comment
            </p>
          )}

          <div className={styles.commentsList}>
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <div className={styles.commentAuthor}>
                      <span>{comment.author.username}</span>
                    </div>
                    {comment.rating > 0 && (
                      <StarRating rating={comment.rating} readOnly />
                    )}
                  </div>
                  <p className={styles.commentText}>{comment.content}</p>
                  <span className={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className={styles.noComments}>No comments yet. Be the first to share your thoughts!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;