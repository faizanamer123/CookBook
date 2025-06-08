import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaStar, FaClock, FaUser } from 'react-icons/fa';
import { DEFAULT_IMAGE } from '../../config';
import styles from './RecipeCard.module.css';

const RecipeCard = ({ id, title, image, rating = 0, cookTime = '', author = '', tags = [] }) => {
  const authorName = typeof author === 'object' ? author.username : author;
  const displayTags = tags.slice(0, 3);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_IMAGE;
  };

  return (
    <Link to={`/recipe/${id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <img 
          src={image || DEFAULT_IMAGE} 
          alt={title}
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.meta}>
          <div className={styles.rating}>
            <FaStar className={styles.icon} />
            <span>{rating.toFixed(1)}</span>
          </div>
          <div className={styles.cookTime}>
            <FaClock className={styles.icon} />
            <span>{cookTime}</span>
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
          </div>
        )}
      </div>
    </Link>
  );
};

RecipeCard.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  image: PropTypes.string,
  rating: PropTypes.number,
  cookTime: PropTypes.string,
  author: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      username: PropTypes.string
    })
  ]),
  tags: PropTypes.arrayOf(PropTypes.string)
};

export default RecipeCard; 
 