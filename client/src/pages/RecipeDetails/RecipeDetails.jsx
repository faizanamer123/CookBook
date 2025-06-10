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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    dispatch(fetchRecipeById(id));
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
    }
  }, [recipe]);

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
      const response = await fetch(`${API_URL}/recipes/${id}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      const data = await response.json();
      setIsFavorite(data.isFavorite);
      dispatch(toggleFavorite(recipe.id));
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite status');
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
              <div className={styles.rating}>
                ⭐ {recipe.rating?.toFixed(1) || '0.0'}
              </div>
              <div className={styles.author}>
                <img
                  src={recipe.author?.avatar || 'https://source.unsplash.com/random/100x100/?portrait'}
                  alt={recipe.author?.username}
                  className={styles.avatar}
                />
                <span>{recipe.author?.username || 'Unknown'}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={handleToggleFavorite}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {isFavorite ? 'Saved' : 'Save'}
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
                    <span>{ingredient}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.instructions}>
            <h2>Instructions</h2>
            {recipe.steps?.split('\n').map((step, index) => (
              <div key={index} className={styles.step}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </section>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Recipe Info</h3>
            <ul className={styles.infoList}>
              <li className={styles.infoItem}>
                <span>Prep Time:</span> {recipe.prepTime || 'N/A'}
              </li>
              <li className={styles.infoItem}>
                <span>Cook Time:</span> {recipe.cookTime} mins
              </li>
              <li className={styles.infoItem}>
                <span>Servings:</span> {recipe.servings || 'N/A'}
              </li>
              <li className={styles.infoItem}>
                <span>Difficulty:</span> {recipe.difficulty || 'N/A'}
              </li>
            </ul>
          </div>

          <div className={styles.tags}>
            {Array.isArray(recipe.tags) && recipe.tags.map(tag => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </aside>
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