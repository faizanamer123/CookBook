import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaUser, FaHeart, FaRegHeart, FaTrash, FaPencilAlt } from 'react-icons/fa';
import { DEFAULT_IMAGE } from '../../config';
import { useAuth } from '../../context/AuthContext';
import styles from './RecipeCard.module.css';
import axios from 'axios';
import { API_URL } from '../../config';
import { useDispatch } from 'react-redux';
import { fetchRecipes } from '../../store/recipesSlice';

const RecipeCard = ({ 
  id, 
  _id,
  title, 
  imageUrl, 
  image,
  rating = 0, 
  cookTime = '', 
  author = '', 
  tags = [],
  likeCount = 0,
  isLiked = false,
  showDelete = false
}) => {
  const { user, token } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Ensure we have a valid ID
  const recipeId = id || _id;

  // Ensure title is a string
  const safeTitle = typeof title === 'string' ? title : 'Untitled Recipe';

  // Ensure tags is an array
  const safeTags = Array.isArray(tags) ? tags : [];
  
  // Handle different author formats
  let authorName = '';
  let authorId = '';
  if (typeof author === 'object' && author !== null) {
    authorName = author.username || 'Unknown';
    authorId = author._id || author.id;
  } else if (typeof author === 'string') {
    authorName = author || 'Unknown';
  }

  // Check if user is the author of this recipe
  const isAuthor = user && authorId && 
    (authorId === user._id || authorId === user.id);

  const displayTags = safeTags.slice(0, 3);
  const displayCookTime = typeof cookTime === 'number' ? `${cookTime} mins` : cookTime;

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

    try {
      await axios.post(`${API_URL}/recipes/${recipeId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setLiked(!liked);
      setLikes(liked ? likes - 1 : likes + 1);
    } catch (error) {
      console.error('Error liking recipe:', error);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
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
    navigate(`/create?edit=${recipeId}`);
  };

  return (
    <Link to={`/recipe/${recipeId}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <img 
          src={getImageUrl()}
          alt={safeTitle}
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
          
          {isAuthor && (
            <button 
              className={`${styles.actionButton} ${styles.editButton}`}
              onClick={handleEdit}
              aria-label="Edit recipe"
            >
              <FaPencilAlt />
            </button>
          )}
          
          {isAuthor && (
            <button 
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete recipe"
            >
              <FaTrash />
            </button>
          )}
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{safeTitle}</h3>
        <div className={styles.meta}>
          <div className={styles.rating}>
            <FaStar className={styles.icon} />
            <span>{rating ? rating.toFixed(1) : '0.0'}</span>
          </div>
          <div className={styles.cookTime}>
            <FaClock className={styles.icon} />
            <span>{displayCookTime}</span>
          </div>
        </div>
        <div className={styles.author}>
          <FaUser className={styles.icon} />
          <span>{authorName || 'Unknown'}</span>
          {author && author.id && (
            <Link
              to={`/profile/${author.id}`}
              className={styles.profileButton}
              onClick={e => e.stopPropagation()}
            >
              View Profile
            </Link>
          )}
        </div>
        {displayTags.length > 0 && (
          <div className={styles.tags}>
            {displayTags.map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
            {safeTags.length > 3 && (
              <span className={styles.moreTag}>+{safeTags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

RecipeCard.propTypes = {
  id: PropTypes.string,
  _id: PropTypes.string,
  title: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  image: PropTypes.string,
  rating: PropTypes.number,
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
 