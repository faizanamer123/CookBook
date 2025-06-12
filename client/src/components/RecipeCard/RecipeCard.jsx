import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaUser, FaHeart, FaRegHeart, FaTrash, FaPencilAlt, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { DEFAULT_IMAGE } from '../../config';
import { useAuth } from '../../context/AuthContext';
import styles from './RecipeCard.module.css';
import axios from 'axios';
import { API_URL } from '../../config';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecipes, toggleFavoriteAsync } from '../../store/recipesSlice';

const RecipeCard = (props) => {
  const { 
    id, 
    _id,
    title = 'Untitled Recipe', 
    imageUrl, 
    image,
    rating = 0,
    averageRating = 0,
    cookTime = '', 
    author = '', 
    tags = [],
    likeCount = 0,
    isLiked = false,
    showDelete = false,
    ...otherProps
  } = props;

  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Check if this recipe is in favorites
  const favorites = useSelector(state => state.recipes.favorites);
  const recipeId = id || _id;
  const isFavorite = favorites.includes(id) || favorites.includes(_id);

  // Fetch initial like status
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (user && token && recipeId) {
        try {
          const response = await axios.get(`${API_URL}/recipes/${recipeId}/like`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data) {
            setLiked(response.data.liked);
            setLikes(response.data.likeCount);
          }
        } catch (error) {
          console.error('Error fetching like status:', error);
        }
      }
    };
    
    fetchLikeStatus();
  }, [recipeId, user, token]);

  // Handle possible missing or malformed data
  const authorName = typeof author === 'object' ? author.username : author;
  
  // Check if current user is the author of this recipe
  const isAuthor = user && typeof author === 'object' && (
    (author.id && user.id && author.id === user.id) || 
    (author._id && user._id && author._id === user._id) ||
    (author.id && user._id && author.id === user._id) ||
    (author._id && user.id && author._id === user.id)
  );
  
  const displayTags = Array.isArray(tags) ? tags.slice(0, 3) : [];
  const displayCookTime = typeof cookTime === 'number' ? `${cookTime} mins` : cookTime;

  // Use averageRating if available, otherwise fall back to rating
  const displayRating = averageRating || rating;

  const getImageUrl = () => {
    if (imageError) {
      return image || DEFAULT_IMAGE;
    }
    return imageUrl || image || DEFAULT_IMAGE;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    setImageError(true);
    e.target.src = image || DEFAULT_IMAGE;
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!recipeId) {
      console.error('Recipe ID is missing');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/recipes/${recipeId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update state based on response from server
      if (response.data) {
        setLiked(response.data.isLiked);
        setLikes(response.data.likes);
      }
    } catch (error) {
      console.error('Error liking recipe:', error);
    }
  };
  
  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!recipeId) {
      console.error('Recipe ID is missing');
      return;
    }
    
    dispatch(toggleFavoriteAsync(recipeId));
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    if (!recipeId) {
      console.error('Recipe ID is missing');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await axios.delete(`${API_URL}/recipes/${recipeId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      dispatch(fetchRecipes());
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setIsDeleting(false);
    }
  };
  
  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!recipeId) {
      console.error('Recipe ID is missing');
      return;
    }
    
    navigate(`/create?edit=${recipeId}`);
  };

  // Guard against missing recipeId
  if (!recipeId) {
    return null;
  }

  return (
    <div className={styles.card} onClick={() => navigate(`/recipe/${recipeId}`)}>
      <div className={styles.imageContainer}>
        <img 
          src={getImageUrl()}
          alt={title}
          onError={handleImageError}
          loading="lazy"
          className={styles.recipeImage}
        />
        <div className={styles.actions}>
          <button 
            className={`${styles.actionButton} ${liked ? styles.liked : ''}`}
            onClick={handleLike}
            aria-label={liked ? "Unlike recipe" : "Like recipe"}
          >
            {liked ? <FaHeart /> : <FaRegHeart />}
            <span>{likes}</span>
          </button>
          
          <button 
            className={`${styles.actionButton} ${isFavorite ? styles.saved : ''}`}
            onClick={handleSave}
            aria-label={isFavorite ? "Unsave recipe" : "Save recipe"}
          >
            {isFavorite ? <FaBookmark /> : <FaRegBookmark />}
          </button>
          
          {isAuthor && (
            <>
              <button 
                className={`${styles.actionButton} ${styles.editButton}`}
                onClick={handleEdit}
                aria-label="Edit recipe"
              >
                <FaPencilAlt />
              </button>
              
              <button 
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete recipe"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.meta}>
          <div className={styles.rating}>
            <FaStar className={styles.starIcon} />
            <span>{displayRating.toFixed(1)}</span>
          </div>
          <div className={styles.cookTime}>
            <FaClock className={styles.clockIcon} />
            <span>{displayCookTime}</span>
          </div>
        </div>
        {authorName && (
          <div className={styles.author}>
            <FaUser className={styles.userIcon} />
            <span>{authorName}</span>
          </div>
        )}
        {displayTags.length > 0 && (
          <div className={styles.tags}>
            {displayTags.map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

RecipeCard.propTypes = {
  id: PropTypes.string,
  _id: PropTypes.string,
  title: PropTypes.string,
  imageUrl: PropTypes.string,
  image: PropTypes.string,
  rating: PropTypes.number,
  averageRating: PropTypes.number,
  cookTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  author: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      id: PropTypes.string,
      username: PropTypes.string
    })
  ]),
  tags: PropTypes.arrayOf(PropTypes.string),
  likeCount: PropTypes.number,
  isLiked: PropTypes.bool,
  showDelete: PropTypes.bool
};

export default RecipeCard; 
 