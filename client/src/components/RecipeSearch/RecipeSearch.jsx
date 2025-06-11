import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './RecipeSearch.module.css';

const RecipeSearch = ({ onSearch, initialSearchTerm = '', initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filters, setFilters] = useState({
    difficulty: '',
    cookTime: '',
    cuisine: '',
    dietary: [],
    ...initialFilters
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sync with initial props if they change
  React.useEffect(() => {
    setSearchTerm(initialSearchTerm);
    setFilters(prev => ({ ...prev, ...initialFilters }));
  }, [initialSearchTerm, initialFilters]);

  useEffect(() => {
    // Debounce search to avoid too many updates
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  const handleSearch = () => {
    onSearch({
      searchTerm,
      filters
    });
  };

  const handleFilterChange = (category, value) => {
    if (category === 'dietary') {
      // Toggle dietary preference
      setFilters(prev => {
        const newDietary = prev.dietary.includes(value)
          ? prev.dietary.filter(item => item !== value)
          : [...prev.dietary, value];
        return { ...prev, dietary: newDietary };
      });
    } else {
      // Set single value filters
      setFilters(prev => ({ ...prev, [category]: value }));
    }
  };

  const clearFilters = () => {
    setFilters({
      difficulty: '',
      cookTime: '',
      cuisine: '',
      dietary: []
    });
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search recipes by name, ingredients, or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button 
          className={styles.filterToggle}
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"></line>
            <line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line>
            <line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line>
            <line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
          Filters
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterSection}>
            <h4>Difficulty</h4>
            <div className={styles.filterOptions}>
              <button 
                className={`${styles.filterButton} ${filters.difficulty === 'Easy' ? styles.active : ''}`}
                onClick={() => handleFilterChange('difficulty', filters.difficulty === 'Easy' ? '' : 'Easy')}
              >
                Easy
              </button>
              <button 
                className={`${styles.filterButton} ${filters.difficulty === 'Medium' ? styles.active : ''}`}
                onClick={() => handleFilterChange('difficulty', filters.difficulty === 'Medium' ? '' : 'Medium')}
              >
                Medium
              </button>
              <button 
                className={`${styles.filterButton} ${filters.difficulty === 'Hard' ? styles.active : ''}`}
                onClick={() => handleFilterChange('difficulty', filters.difficulty === 'Hard' ? '' : 'Hard')}
              >
                Hard
              </button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Cook Time</h4>
            <div className={styles.filterOptions}>
              <button 
                className={`${styles.filterButton} ${filters.cookTime === 'quick' ? styles.active : ''}`}
                onClick={() => handleFilterChange('cookTime', filters.cookTime === 'quick' ? '' : 'quick')}
              >
                Quick (&lt; 30 min)
              </button>
              <button 
                className={`${styles.filterButton} ${filters.cookTime === 'medium' ? styles.active : ''}`}
                onClick={() => handleFilterChange('cookTime', filters.cookTime === 'medium' ? '' : 'medium')}
              >
                Medium (30-60 min)
              </button>
              <button 
                className={`${styles.filterButton} ${filters.cookTime === 'long' ? styles.active : ''}`}
                onClick={() => handleFilterChange('cookTime', filters.cookTime === 'long' ? '' : 'long')}
              >
                Long (&gt; 60 min)
              </button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Cuisine</h4>
            <div className={styles.filterOptions}>
              {['Italian', 'Mexican', 'Indian', 'Chinese', 'Thai', 'Japanese', 'Mediterranean', 'American'].map(cuisine => (
                <button 
                  key={cuisine}
                  className={`${styles.filterButton} ${filters.cuisine === cuisine ? styles.active : ''}`}
                  onClick={() => handleFilterChange('cuisine', filters.cuisine === cuisine ? '' : cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Dietary Preferences</h4>
            <div className={styles.filterOptions}>
              {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb'].map(pref => (
                <button 
                  key={pref}
                  className={`${styles.filterButton} ${filters.dietary.includes(pref) ? styles.active : ''}`}
                  onClick={() => handleFilterChange('dietary', pref)}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterActions}>
            <button 
              className={styles.clearButton}
              onClick={clearFilters}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

RecipeSearch.propTypes = {
  onSearch: PropTypes.func.isRequired
};

export default RecipeSearch; 