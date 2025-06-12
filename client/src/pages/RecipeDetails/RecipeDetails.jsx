import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import styles from './RecipeDetails.module.css';
import Button from '../../components/Button/Button';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaEdit, FaTrash, FaArrowLeft, FaClock, FaUtensils, FaStar, FaRegStar, FaShare, FaSmile } from 'react-icons/fa';
import { API_URL } from '../../config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFavorites, toggleFavoriteAsync } from '../../store/recipesSlice';
import EmojiPicker from 'emoji-picker-react';

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
  const dispatch = useDispatch();
  const { user, token } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  
  // Get favorites from Redux store
  const favorites = useSelector(state => state.recipes.favorites);
  const isBookmarked = favorites.includes(id);
  
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const recipeRes = await axios.get(`${API_URL}/recipes/${id}`);
        const recipeData = recipeRes.data;
        
        // Check if user has liked the recipe
        if (user && token) {
          try {
            const likeStatusRes = await axios.get(`${API_URL}/recipes/${id}/like`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (likeStatusRes.data) {
              setIsLiked(likeStatusRes.data.liked);
              setLikeCount(likeStatusRes.data.likeCount);
            }
          } catch (err) {
            console.error('Error fetching like status:', err);
          }
        }

        // Set recipe data
        setRecipe(recipeData);

        // Set comments directly since they are now populated from the server
        if (recipeData.comments && recipeData.comments.length > 0) {
          setComments(recipeData.comments);
        }
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError(err.response?.data?.message || 'Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    // Fetch recipe data and favorites
    fetchRecipe();
    if (user && token) {
      dispatch(fetchFavorites());
    }
  }, [id, user, token, dispatch]);

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

  const handleLikeToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/recipes/${id}/like`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setIsLiked(response.data.isLiked);
        setLikeCount(response.data.likes);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like status');
    }
  };

  const handleBookmarkToggle = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    dispatch(toggleFavoriteAsync(id));
  };

  const handleDeleteRecipe = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      await axios.delete(`${API_URL}/recipes/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
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
            'Authorization': `Bearer ${token}`
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

  const handleEmojiClick = (emojiData) => {
    setNewComment(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
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

  // Check if current user is the author of this recipe
  const isAuthor = user && recipe.author && (
    (recipe.author.id && user.id && recipe.author.id === user.id) || 
    (recipe.author._id && user._id && recipe.author._id === user._id) ||
    (recipe.author.id && user._id && recipe.author.id === user._id) ||
    (recipe.author._id && user.id && recipe.author._id === user.id)
  );
  
  const cuisineType = recipe.cuisineType !== 'Other' ? recipe.cuisineType : null;

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
            <span>{likeCount}</span>
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
          
          {isAuthor && (
            <>
              <button 
                className={styles.actionButton} 
                onClick={() => navigate(`/create?edit=${id}`)}
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
          
          {cuisineType && (
            <div className={styles.metaItem}>
              <span className={styles.cuisineTag}>{cuisineType}</span>
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
            {recipe.ingredients && 
              // Create a map to deduplicate ingredients by using a unique key
              [...new Set(recipe.ingredients.map(i => JSON.stringify(i)))]
                .map(item => JSON.parse(item))
                .map((ingredient, index) => (
                  <li key={index} className={styles.ingredientItem}>
                    <span className={styles.ingredientAmount}>
                      {ingredient.amount} {ingredient.unit}
                    </span>
                    <span className={styles.ingredientName}>{ingredient.name}</span>
                  </li>
                ))
            }
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
              <div className={styles.commentInputContainer}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this recipe..."
                  className={styles.commentTextarea}
                  required
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
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>
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
                      <span>{comment.author?.username || 'Unknown User'}</span>
                      {user && comment.author?._id && comment.author._id !== user._id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${comment.author._id}`);
                          }}
                          className={styles.profileLink}
                        >
                          View Profile
                        </button>
                      )}
                    </div>
                    {comment.rating > 0 && (
                      <StarRating rating={comment.rating} readOnly />
                    )}
                  </div>
                  <p className={styles.commentText}>{comment.content}</p>
                  <div className={styles.commentFooter}>
                    <span className={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
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