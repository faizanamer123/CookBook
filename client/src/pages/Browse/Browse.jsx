import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRecipes } from '../../store/recipesSlice';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import Button from '../../components/Button/Button';
import RecipeSearch from '../../components/RecipeSearch/RecipeSearch';
import styles from './Browse.module.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Browse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { recipes, loading, error } = useSelector(state => state.recipes);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [cookTimeRange, setCookTimeRange] = useState([0, 120]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    dispatch(fetchRecipes());
  }, [dispatch, user, navigate]);

  const filteredRecipes = useMemo(() => {
    if (!Array.isArray(recipes)) return [];
    
    return recipes.filter(recipe => {
      if (!recipe) return false;

      // Search query filter
      const matchesSearch = !searchQuery || 
        (recipe.title && recipe.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (recipe.description && recipe.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        (recipe.tags && Array.isArray(recipe.tags) && 
         selectedTags.every(tag => recipe.tags.includes(tag)));

      // Cook time filter
      const matchesCookTime = recipe.cookTime >= cookTimeRange[0] && 
        recipe.cookTime <= cookTimeRange[1];

      // Rating filter
      const matchesRating = (recipe.rating || 0) >= ratingFilter;

      return matchesSearch && matchesTags && matchesCookTime && matchesRating;
    });
  }, [recipes, searchQuery, selectedTags, cookTimeRange, ratingFilter]);

  const FilterPanel = () => (
    <div className={`${styles.filters} ${isMobileFiltersOpen ? styles.mobileFiltersPanel : ''}`}>
      {isMobileFiltersOpen && (
        <div className={styles.mobileFiltersHeader}>
          <h2>Filters</h2>
          <button
            className={styles.closeButton}
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Tags</h3>
        <RecipeSearch
          tags={Array.from(new Set(recipes.flatMap(recipe => recipe.tags || [])))}
          selectedTags={selectedTags}
          onChange={setSelectedTags}
        />
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Cook Time (minutes)</h3>
        <input
          type="range"
          min="0"
          max="120"
          value={cookTimeRange[1]}
          onChange={(e) => setCookTimeRange([cookTimeRange[0], parseInt(e.target.value)])}
          className={styles.rangeInput}
        />
        <div className={styles.rangeValues}>
          <span>{cookTimeRange[0]}</span>
          <span>{cookTimeRange[1]}</span>
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Rating</h3>
        <div className={styles.filterOptions}>
          {[4, 3, 2, 1].map(rating => (
            <label
              key={rating}
              className={styles.filterOption}
              onClick={() => setRatingFilter(rating === ratingFilter ? 0 : rating)}
            >
              <div className={`${styles.checkbox} ${ratingFilter === rating ? styles.checked : ''}`}>
                {ratingFilter === rating && '✓'}
              </div>
              {rating}+ stars
            </label>
          ))}
        </div>
      </div>

      <Button variant="primary" onClick={() => setIsMobileFiltersOpen(false)} fullWidth>
        Apply Filters
      </Button>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.mobileFilters}>
        <button
          className={styles.filterButton}
          onClick={() => setIsMobileFiltersOpen(true)}
        >
          Filters
          <span>⚡</span>
        </button>
      </div>
      <div className={styles.content}>
        <FilterPanel />
        <div>
          <div className={styles.recipesGrid}>
            {loading ? (
              <div className={styles.loading}>Loading recipes...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : filteredRecipes.length === 0 ? (
              <div className={styles.noResults}>
                {selectedTags.length > 0 || cookTimeRange[1] < 120 || ratingFilter > 0
                  ? 'No recipes found matching your filters'
                  : 'No recipes available'}
              </div>
            ) : (
              filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                  imageUrl={recipe.imageUrl}
                  rating={recipe.rating}
                  cookTime={recipe.cookTime}
                  author={recipe.author}
                  tags={recipe.tags}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse; 