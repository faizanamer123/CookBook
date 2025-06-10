import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRecipeById, toggleFavorite } from '../../store/recipesSlice';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { API_URL, DEFAULT_IMAGE } from '../../config';
import styles from './RecipeDetails.module.css';

const RecipeDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { recipes, loading, error } = useSelector(state => state.recipes);
  const recipe = recipes.find(r => r.id === id);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    ingredients: '',
    steps: '',
    tags: '',
    image: null
  });
  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    dispatch(fetchRecipeById(id));
    
    // Fetch comments
    const fetchComments = async () => {
      try {
        const response = await fetch(`${API_URL}/recipes/${id}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };
    
    fetchComments();
  }, [dispatch, id, user, navigate]);

  useEffect(() => {
    if (recipe) {
      setEditData({
        title: recipe.title,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : '',
        steps: recipe.steps || '',
        tags: Array.isArray(recipe.tags) ? recipe.tags.join(', ') : '',
        image: null
      });
      
      // Check if recipe is in user's liked recipes
      if (user && user.likedRecipes) {
        setIsLiked(user.likedRecipes.includes(recipe.id));
      }
      
      // Check if recipe is in user's saved recipes
      if (user && user.savedRecipes) {
        setIsFavorite(user.savedRecipes.includes(recipe.id));
      }
    }
  }, [recipe, user]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('title', editData.title);
      formData.append('ingredients', JSON.stringify(editData.ingredients.split('\n').map(i => i.trim())));
      formData.append('steps', editData.steps);
      formData.append('tags', JSON.stringify(editData.tags.split(',').map(t => t.trim())));
      if (editData.image) formData.append('image', editData.image);

      const response = await fetch(`${API_URL}/recipes/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      dispatch(fetchRecipeById(id));
      setEditMode(false);
    } catch (err) {
      console.error('Error updating recipe:', err);
      alert(err.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/recipes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      navigate('/browse');
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert(err.message);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleIngredient = (index) => {
    setCheckedIngredients(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recipes/${id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle bookmark');
      }

      const data = await response.json();
      setIsFavorite(data.isBookmarked);
      dispatch(toggleFavorite(recipe.id));
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      alert('Failed to update bookmark status');
    }
  };
  
  const handleToggleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recipes/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setIsLiked(data.liked);
      
      // Update the recipe likes count in the UI
      if (recipe) {
        recipe.likeCount = data.likeCount;
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Failed to update like status');
    }
  };
  
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/recipes/${id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: commentText,
          rating: commentRating
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const data = await response.json();
      setComments(prev => [...prev, data.comment]);
      setCommentText('');
      setCommentRating(5);
      
      // Update recipe's average rating
      if (recipe) {
        recipe.averageRating = data.averageRating;
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      alert(err.message);
    }
  };

  const shareRecipe = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: `Check out this recipe: ${recipe.title}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(console.error);
    }
  };

  if (loading) return <div className={styles.loading}>Loading recipe...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!recipe) return <div className={styles.error}>Recipe not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.banner}>
          <img
            src={recipe.imageUrl || DEFAULT_IMAGE}
            alt={recipe.title}
            className={styles.bannerImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_IMAGE;
            }}
          />
          <div className={styles.overlay}>
            <h1 className={styles.title}>{recipe.title}</h1>
            <div className={styles.meta}>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>{recipe.viewCount || 0}</span>
                </div>
                <div className={styles.stat}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <span>{recipe.likeCount || 0}</span>
                </div>
                <div className={styles.stat}>
                  <span>⭐</span>
                  <span>{recipe.averageRating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              <div className={styles.author}>
                <img
                  src={recipe.author?.profilePicture || 'https://source.unsplash.com/random/100x100/?portrait'}
                  alt={recipe.author?.username}
                  className={styles.avatar}
                />
                <span>{recipe.author?.username || 'Unknown'}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleToggleFavorite}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {isFavorite ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleToggleLike}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {isLiked ? 'Liked' : 'Like'}
              </Button>
              <Button variant="outline" onClick={shareRecipe}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Share
              </Button>
              {user && recipe.author?.id === user.id && (
                <>
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.main}>
          <section className={styles.ingredients}>
            <h2>Ingredients</h2>
            <ul className={styles.ingredientsList}>
              {Array.isArray(recipe.ingredients) && recipe.ingredients.map((ingredient, index) => (
                <li key={index} className={styles.ingredient}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checkedIngredients.includes(index)}
                      onChange={() => toggleIngredient(index)}
                      className={styles.checkbox}
                    />
                    <span className={checkedIngredients.includes(index) ? styles.checked : ''}>
                      {ingredient}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.instructions}>
            <h2>Instructions</h2>
            <div className={styles.steps}>
              {recipe.steps && recipe.steps.split('\n').map((step, index) => (
                <div key={index} className={styles.step}>
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>
          
          <section className={styles.comments}>
            <h2>Comments and Ratings</h2>
            <div className={styles.commentForm}>
              <form onSubmit={handleAddComment}>
                <div className={styles.ratingInput}>
                  <label>Your Rating:</label>
                  <div className={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCommentRating(star)}
                        className={styles.starButton}
                      >
                        <span className={commentRating >= star ? styles.filledStar : styles.emptyStar}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts or tips about this recipe..."
                  required
                  className={styles.commentTextarea}
                />
                <Button type="submit" variant="primary" fullWidth>
                  Add Comment
                </Button>
              </form>
            </div>
            
            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAuthor}>
                        <img 
                          src={comment.author?.profilePicture || 'https://source.unsplash.com/random/100x100/?portrait'} 
                          alt={comment.authorName} 
                          className={styles.commentAvatar} 
                        />
                        <span>{comment.authorName}</span>
                      </div>
                      {comment.rating && (
                        <div className={styles.commentRating}>
                          {Array(5).fill(0).map((_, i) => (
                            <span key={i} className={i < comment.rating ? styles.filledStar : styles.emptyStar}>★</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className={styles.commentText}>{comment.text}</p>
                    <div className={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.recipeInfo}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Cook Time</span>
              <span className={styles.infoValue}>{recipe.cookTime} min</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Servings</span>
              <span className={styles.infoValue}>{recipe.servings}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Difficulty</span>
              <span className={styles.infoValue}>{recipe.difficulty}</span>
            </div>
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className={styles.tags}>
              <h3>Tags</h3>
              <div className={styles.tagsList}>
                {recipe.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editMode && (
        <form onSubmit={handleEditSubmit} className={styles.editForm}>
          <input 
            name="title" 
            value={editData.title} 
            onChange={handleEditChange} 
            className={styles.input}
            placeholder="Recipe Title"
            required
          />
          <textarea 
            name="ingredients" 
            value={editData.ingredients} 
            onChange={handleEditChange} 
            className={styles.textarea}
            placeholder="Ingredients (one per line)"
            required
          />
          <textarea 
            name="steps" 
            value={editData.steps} 
            onChange={handleEditChange} 
            className={styles.textarea}
            placeholder="Instructions (one step per line)"
            required
          />
          <input 
            name="tags" 
            value={editData.tags} 
            onChange={handleEditChange} 
            className={styles.input}
            placeholder="Tags (comma separated)"
          />
          <input 
            type="file" 
            name="image" 
            onChange={e => setEditData(prev => ({ ...prev, image: e.target.files[0] }))} 
            accept="image/*"
          />
          <div className={styles.formActions}>
            <Button type="submit" variant="primary">Save Changes</Button>
            <Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RecipeDetails; 