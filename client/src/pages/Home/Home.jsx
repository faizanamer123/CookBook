import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { API_URL } from '../../config';
import styles from './Home.module.css';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiEdit, FiKey, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { isDarkMode } = useTheme();

  const handleBrowseClick = () => {
    navigate('/browse');
  };

  const handleCreateClick = () => {
    navigate('/create');
  };

  const handleCategoryClick = (category) => {
    navigate(`/browse?category=${encodeURIComponent(category.name)}`);
  };

  const handleProfileMenuToggle = () => setShowProfileMenu((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    fetch(`${API_URL}/recipes`)
      .then(res => res.json())
      .then(data => setFeaturedRecipes(data.slice(0, 3)))
      .catch(err => console.error('Failed to fetch recipes', err));
  }, []);

  // Categories with normalized names
  const categories = [
    { id: 1, name: 'breakfast', displayName: 'Breakfast', icon: '🍳', count: 45 },
    { id: 2, name: 'lunch', displayName: 'Lunch', icon: '🥪', count: 78 },
    { id: 3, name: 'dinner', displayName: 'Dinner', icon: '🍽️', count: 92 },
    { id: 4, name: 'dessert', displayName: 'Desserts', icon: '🍰', count: 56 },
    { id: 5, name: 'vegetarian', displayName: 'Vegetarian', icon: '🥗', count: 34 },
    { id: 6, name: 'fast-food', displayName: 'Fast Food', icon: '🍔', count: 65 },
    { id: 7, name: 'soup', displayName: 'Soups', icon: '🥣', count: 40 },
    { id: 8, name: 'salad', displayName: 'Salads', icon: '🥗', count: 55 },
    { id: 9, name: 'drink', displayName: 'Drinks', icon: '🍹', count: 30 },
    { id: 10, name: 'snack', displayName: 'Snacks', icon: '🥨', count: 70 }
  ];

  // Helper to get initials from name
  function getInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className={styles.home}>
      <div style={{ position: 'absolute', top: 24, right: 32, zIndex: 10 }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={handleProfileMenuToggle}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 0
            }}
            aria-label="User menu"
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: isDarkMode ? '#fff' : 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: isDarkMode ? 'var(--primary)' : '#fff',
              fontWeight: 700,
              border: isDarkMode ? '2px solid var(--primary)' : 'none'
            }}>
              {getInitials(user?.name)}
            </div>
            <FiChevronDown />
          </button>
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 48,
              background: 'var(--background)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              minWidth: 180,
              zIndex: 1000
            }}>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => { setShowProfileMenu(false); navigate('/dashboard'); }}
              >
                <FiUser /> Profile
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => { setShowProfileMenu(false); navigate('/dashboard'); }}
              >
                <FiEdit /> Edit Profile
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer' }}
                onClick={() => { setShowProfileMenu(false); navigate('/dashboard'); }}
              >
                <FiKey /> Change Password
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', color: 'var(--error)' }}
                onClick={handleLogout}
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Discover & Share Amazing Recipes</h1>
          <p>Join our community of food lovers and start sharing your favorite recipes today</p>
          <div className={styles.heroButtons}>
            <Button variant="primary" onClick={handleBrowseClick}>
              Browse Recipes
            </Button>
            <Button variant="secondary" onClick={handleCreateClick}>
              Create Recipe
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.featured} style={{ background: 'var(--background)', borderRadius: 16, padding: '2rem', margin: '2rem 0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h2>Featured Recipes</h2>
        {featuredRecipes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
            No featured recipes available yet. Be the first to create one!
          </div>
        ) : (
          <div className={styles.recipeGrid}>
            {featuredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id || recipe._id}
                id={recipe.id || recipe._id}
                title={recipe.title}
                imageUrl={recipe.imageUrl}
                rating={recipe.rating || 0}
                cookTime={recipe.cookTime}
                author={recipe.author}
                tags={recipe.tags}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.categories}>
        <h2>Browse by Category</h2>
        <div className={styles.categoryGrid}>
          {categories.map(category => (
            <div 
              key={category.id} 
              className={styles.categoryCard}
              onClick={() => handleCategoryClick(category)}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles.categoryIcon}>{category.icon}</span>
              <h3>{category.displayName}</h3>
              <p>{category.count} recipes</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home; 