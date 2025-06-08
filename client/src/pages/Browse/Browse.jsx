import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setRecipes } from '../../store/recipesSlice'; // Import setRecipes action
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import Button from '../../components/Button/Button';
import RecipeSearch from '../../components/RecipeSearch/RecipeSearch';
import styles from './Browse.module.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';

const categories = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Quick & Easy'
];

const Browse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const allRecipes = useSelector(state => state.recipes.recipes);
  const dispatch = useDispatch(); // Get dispatch function

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedTags, setSelectedTags] = useState([]);
  const [cookTimeRange, setCookTimeRange] = useState([0, 120]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/recipes`);
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const data = await response.json();
        setRecipes(data);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    const category = params.get('category') || '';
    setSearchQuery(query);
    if (category) {
      setSelectedTags([category]);
    }
  }, []); // Run only on mount

  const allTags = useMemo(() => {
    const tagsSet = new Set();
    allRecipes.forEach(recipe => {
      if (recipe.tags && Array.isArray(recipe.tags)) {
        recipe.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    const tagsArray = Array.from(tagsSet);
    // console.log('Available Tags:', tagsArray);
    return tagsArray;
  }, [allRecipes]);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = searchQuery === '' || 
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      recipe.tags.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (allRecipes.length > 0) {
      setRecipes(allRecipes);
    }
  }, [allRecipes]);

  const handleCookTimeChange = (e) => {
    const value = parseInt(e.target.value);
    // console.log('Cook time filter changed to:', value);
    setCookTimeRange([0, value]);
  };

  const handleRatingChange = (rating) => {
    const newRating = rating === ratingFilter ? 0 : rating;
    // console.log('Rating filter changed to:', newRating);
    setRatingFilter(newRating);
  };

  const FilterPanel = () => (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Tags</h3>
        <RecipeSearch
          tags={allTags}
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
          onChange={handleCookTimeChange}
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
              onClick={() => handleRatingChange(rating)}
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
              <div className={styles.noResults}>No recipes found</div>
            ) : (
              filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe._id}
                  id={recipe._id}
                  title={recipe.title}
                  image={recipe.imageUrl}
                  rating={recipe.rating}
                  cookTime={`${recipe.cookTime} mins`}
                  author={recipe.author}
                  tags={recipe.tags}
                />
              ))
            )}
          </div>
          {filteredRecipes.length === 0 && (allRecipes.length > 0) && (
            <div className={styles.noResults}>
              No recipes found matching your criteria
            </div>
          )}
           {filteredRecipes.length === 0 && (allRecipes.length === 0) && (
            <div className={styles.noResults}>
              Loading recipes...
            </div>
          )}
          {filteredRecipes.length > 0 && (
            <div className={styles.loadMore}>
              <Button variant="outline">Load More</Button>
            </div>
          )}
        </div>
      </div>
      {isMobileFiltersOpen && (
        <div className={`${styles.mobileFiltersPanel} ${isMobileFiltersOpen ? styles.open : ''}`}>
          <div className={styles.mobileFiltersHeader}>
            <h2>Filters</h2>
            <button
              className={styles.closeButton}
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              ✕
            </button>
          </div>
          <FilterPanel />
        </div>
      )}
    </div>
  );
};

export default Browse; 