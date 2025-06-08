import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleFavorite, addComment, deleteComment } from '../../store/recipesSlice';
import Button from '../../components/Button/Button';
import styles from './RecipeDetails.module.css';
import { useAuth } from '../../context/AuthContext';

const RecipeDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [recipe, setRecipe] = useState(null);
  const [comments, setComments] = useState([]);
  const isFavorite = useSelector(state => 
    state.recipes.favorites.includes(parseInt(id))
  );

  const [checkedIngredients, setCheckedIngredients] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    // Reset checked ingredients when recipe changes
    setCheckedIngredients([]);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/recipes/${id}`)
      .then(res => res.json())
      .then(data => { setRecipe(data); setLoading(false); })
      .catch(err => { setError('Failed to load recipe'); setLoading(false); });
  }, [id]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/recipes/${id}/comments`)
      .then(res => res.json())
      .then(setComments)
      .catch(() => setComments([]));
  }, [id]);

  const toggleIngredient = (index) => {
    setCheckedIngredients(prev => 
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/recipes/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setCommentText('');
      }
    } catch (error) {}
    setIsSubmitting(false);
  };

  const handleDeleteComment = (commentId) => {
    dispatch(deleteComment({ recipeId: parseInt(id), commentId }));
  };

  const toggleFavorite = () => {
    dispatch(toggleFavorite(parseInt(id)));
  };

  const shareRecipe = () => {
    // Implement share functionality
    navigator.clipboard.writeText(window.location.href);
    alert('Recipe link copied to clipboard!');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/recipes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) window.location.href = '/browse';
    else alert('Failed to delete recipe');
  };

  const handleEditClick = () => {
    setEditData({
      title: recipe.title,
      ingredients: recipe.ingredients.join('\n'),
      steps: Array.isArray(recipe.instructions) ? recipe.instructions.join('\n') : recipe.instructions,
      tags: recipe.tags.join(', '),
      // image: null (handled separately)
    });
    setEditMode(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('title', editData.title);
    fd.append('ingredients', JSON.stringify(editData.ingredients.split('\n')));
    fd.append('steps', editData.steps);
    fd.append('tags', JSON.stringify(editData.tags.split(',').map(t => t.trim())));
    if (editData.image) fd.append('image', editData.image);
    const res = await fetch(`http://localhost:5000/api/recipes/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    });
    if (res.ok) {
      const updated = await res.json();
      setRecipe(updated);
      setEditMode(false);
    } else {
      alert('Failed to update recipe');
    }
  };

  if (loading) return <div className={styles.loading}>Loading recipe...</div>;
  if (error) return <div className={styles.loading}>{error}</div>;
  if (!recipe) return <div className={styles.loading}>Recipe not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.banner}>
          <img
            src={recipe.image}
            alt={recipe.title}
            className={styles.bannerImage}
          />
          <div className={styles.overlay}>
            <h1 className={styles.title}>{recipe.title}</h1>
            <div className={styles.meta}>
              <div className={styles.rating}>
                ⭐ {recipe.rating.toFixed(1)}
              </div>
              <div className={styles.author}>
                <img
                  src={recipe.authorAvatar || 'https://source.unsplash.com/random/100x100/?portrait'}
                  alt={recipe.author}
                  className={styles.avatar}
                />
                <span>{recipe.author}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="outline" onClick={toggleFavorite}>
                {isFavorite ? '❤️ Saved' : '🤍 Save'}
              </Button>
              <Button variant="outline" onClick={shareRecipe}>
                📤 Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.main}>
          <section className={styles.ingredients}>
            <h2>Ingredients</h2>
            <ul className={styles.ingredientsList}>
              {recipe.ingredients?.map((ingredient, index) => (
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
            {recipe.instructions?.map((step, index) => (
              <div key={index} className={styles.step}>
                <div className={styles.stepNumber}>{index + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </section>

          <section className={styles.comments}>
            <h2>Comments</h2>
            <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className={styles.commentInput}
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                variant="primary"
                disabled={!commentText.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>

            <div className={styles.commentsList}>
              {comments.map(comment => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <img src={comment.authorAvatar} alt={comment.author} className={styles.avatar} />
                    <div>
                      <strong>{comment.author}</strong>
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className={styles.deleteComment}
                    >
                      ✕
                    </button>
                  </div>
                  <p>{comment.text}</p>
                </div>
              ))}
            </div>
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
            {recipe.tags?.map(tag => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </aside>
      </div>

      {user && recipe.author && user.id === recipe.author._id && !editMode && (
        <>
          <Button variant="outline" onClick={handleDelete}>Delete</Button>
          <Button variant="outline" onClick={handleEditClick}>Edit</Button>
        </>
      )}
      {editMode && (
        <form onSubmit={handleEditSubmit} className={styles.editForm} style={{margin:'2rem 0'}}>
          <input name="title" value={editData.title} onChange={handleEditChange} className={styles.input} />
          <textarea name="ingredients" value={editData.ingredients} onChange={handleEditChange} className={styles.textarea} />
          <textarea name="steps" value={editData.steps} onChange={handleEditChange} className={styles.textarea} />
          <input name="tags" value={editData.tags} onChange={handleEditChange} className={styles.input} />
          <input type="file" name="image" onChange={e => setEditData(prev => ({ ...prev, image: e.target.files[0] }))} />
          <Button type="submit" variant="primary">Save</Button>
          <Button type="button" variant="outline" onClick={()=>setEditMode(false)}>Cancel</Button>
        </form>
      )}
    </div>
  );
};

export default RecipeDetails; 