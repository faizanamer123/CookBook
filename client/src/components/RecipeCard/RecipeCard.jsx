import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { FaStar, FaClock, FaUser, FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import { DEFAULT_IMAGE } from '../../config';
import { useAuth } from '../../context/AuthContext';
import styles from './RecipeCard.module.css';
import axios from 'axios';
import { API_URL } from '../../config';
import { useDispatch } from 'react-redux';
import { fetchRecipes } from '../../store/recipesSlice';

const RecipeCard = ({ 
  id, 
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

  const authorName = typeof author === 'object' ? author.username : author;
  const isAuthor = typeof author === 'object' && user && author.id === user.id;
  const displayTags = tags.slice(0, 3);
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
      await axios.post(`${API_URL}/recipes/${id}/like`, {}, {
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
      await axios.delete(`${API_URL}/recipes/${id}`, {
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

  return (
    <Link to={`/recipe/${id}`} className={styles.card}>
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
          
          {(isAuthor || showDelete) && (
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
        <h3 className={styles.title}>{title}</h3>
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
        </div>
        {displayTags.length > 0 && (
          <div className={styles.tags}>
            {displayTags.map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className={styles.moreTag}>+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

RecipeCard.propTypes = {
  id: PropTypes.string.isRequired,
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
 