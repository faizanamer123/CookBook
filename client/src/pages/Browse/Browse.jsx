import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRecipes } from '../../store/recipesSlice';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import RecipeSearch from '../../components/RecipeSearch/RecipeSearch';
import styles from './Browse.module.css';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Browse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { recipes, loading, error } = useSelector(state => state.recipes);
  
  const [searchParams, setSearchParams] = useState({
    searchTerm: '',
    filters: {
      difficulty: '',
      cookTime: '',
      cuisine: '',
      dietary: []
    }
  });

  useEffect(() => {
    dispatch(fetchRecipes());

    // Get category from URL
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category) {
      setSearchParams(prev => ({
        ...prev,
        searchTerm: '',
        filters: {
          ...prev.filters,
          cuisine: category
        }
      }));
    }
  }, [dispatch, user, navigate, location.search]);

  const handleSearch = (params) => {
    setSearchParams(params);
  };

  const filteredRecipes = useMemo(() => {
    if (!Array.isArray(recipes)) return [];
    
    try {
      return recipes.filter(recipe => {
        if (!recipe) return false;

        try {
          // Search term filter (by title, description, or tags)
          const matchesSearch = !searchParams.searchTerm || 
            (recipe.title && recipe.title.toLowerCase().includes(searchParams.searchTerm.toLowerCase())) ||
            (recipe.description && recipe.description.toLowerCase().includes(searchParams.searchTerm.toLowerCase())) ||
            (recipe.tags && Array.isArray(recipe.tags) && recipe.tags.some(tag => 
              typeof tag === 'string' && tag.toLowerCase().includes(searchParams.searchTerm.toLowerCase())
            ));

          // Difficulty filter
          const matchesDifficulty = !searchParams.filters.difficulty || 
            recipe.difficulty === searchParams.filters.difficulty;

          // Cook time filter
          const matchesCookTime = !searchParams.filters.cookTime || 
            (searchParams.filters.cookTime === 'quick' && recipe.cookTime < 30) ||
            (searchParams.filters.cookTime === 'medium' && recipe.cookTime >= 30 && recipe.cookTime <= 60) ||
            (searchParams.filters.cookTime === 'long' && recipe.cookTime > 60);

          // Cuisine filter (from tags)
          const matchesCuisine = !searchParams.filters.cuisine || 
            (recipe.tags && Array.isArray(recipe.tags) && recipe.tags.some(tag =>
              typeof tag === 'string' && tag.toLowerCase() === searchParams.filters.cuisine.toLowerCase()
            ));
          
          // Dietary preferences filter (from tags)
          const matchesDietary = !searchParams.filters.dietary || !Array.isArray(searchParams.filters.dietary) || 
            searchParams.filters.dietary.length === 0 || 
            (recipe.dietaryRestrictions && Array.isArray(recipe.dietaryRestrictions) && 
              searchParams.filters.dietary.every(pref => 
                recipe.dietaryRestrictions.some(restriction => 
                  typeof restriction === 'string' && restriction.toLowerCase() === pref.toLowerCase()
                )
              )
            );

          return matchesSearch && matchesDifficulty && matchesCookTime && matchesCuisine && matchesDietary;
        } catch (error) {
          console.error("Error filtering recipe:", error, recipe);
          return false;
        }
      });
    } catch (error) {
      console.error("Error in filteredRecipes:", error);
      return [];
    }
  }, [recipes, searchParams]);

  const getCategoryMessage = () => {
    if (!searchParams.filters.cuisine) return null;
    
    if (filteredRecipes.length === 0) {
      return `No recipes found in the ${searchParams.filters.cuisine} category.`;
    }
    
    return `Showing ${filteredRecipes.length} recipe${filteredRecipes.length === 1 ? '' : 's'} in the ${searchParams.filters.cuisine} category.`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>Browse Recipes</h1>
        <p>Discover delicious recipes from our community</p>
        {searchParams.filters.cuisine && (
          <div className={styles.categoryInfo}>
            <p className={styles.categoryFilter}>
              {getCategoryMessage()}
            </p>
            <button 
              className={styles.clearFilter}
              onClick={() => {
                setSearchParams(prev => ({
                  ...prev,
                  filters: {
                    ...prev.filters,
                    cuisine: ''
                  }
                }));
                navigate('/browse');
              }}
            >
              Clear Category Filter
            </button>
          </div>
        )}
      </div>
      
      <RecipeSearch onSearch={handleSearch} initialSearchTerm={searchParams.searchTerm} initialFilters={searchParams.filters} />
      
      <div className={styles.recipesContainer}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading recipes...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>Error loading recipes: {error}</p>
            <button onClick={() => dispatch(fetchRecipes())}>Try Again</button>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className={styles.noResults}>
            <h3>No recipes found</h3>
            <p>Try adjusting your search or filters</p>
            {searchParams.filters.cuisine && (
              <button 
                className={styles.clearFilter}
                onClick={() => {
                  setSearchParams(prev => ({
                    ...prev,
                    filters: {
                      ...prev.filters,
                      cuisine: ''
                    }
                  }));
                  navigate('/browse');
                }}
              >
                Clear Category Filter
              </button>
            )}
          </div>
        ) : (
          <div className={styles.recipesGrid}>
            {filteredRecipes.map(recipe => (
              <div key={recipe.id || recipe._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <RecipeCard
                  id={recipe.id}
                  title={recipe.title}
                  imageUrl={recipe.imageUrl}
                  rating={recipe.averageRating}
                  cookTime={recipe.cookTime}
                  author={recipe.author}
                  tags={recipe.tags}
                  likeCount={recipe.likes?.length || 0}
                />
                {(recipe.author && (recipe.author.id || recipe.author._id)) && (
                  <button
                    className={styles.profileButton}
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigate(`/profile/${recipe.author.id || recipe.author._id}`);
                    }}
                    style={{ marginTop: '10px', alignSelf: 'center' }}
                  >
                    View {recipe.author.username || recipe.author.name || 'Creator'} Profile
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse; 