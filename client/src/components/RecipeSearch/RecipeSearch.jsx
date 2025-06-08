import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import styles from './RecipeSearch.module.css';

const RecipeSearch = ({ tags, selectedTags, onChange }) => {
  const options = tags.map(tag => ({ value: tag, label: tag }));

  return (
    <div className={styles.container}>
      <label htmlFor="tag-select" className={styles.label}>
        Filter by tags:
      </label>
      <Select
        inputId="tag-select"
        isMulti
        options={options}
        value={options.filter(option => selectedTags.includes(option.value))}
        onChange={selected => onChange(selected.map(opt => opt.value))}
        className={styles.select}
        classNamePrefix="react-select"
        placeholder="Select tags..."
        aria-label="Filter recipes by tags"
      />
    </div>
  );
};

RecipeSearch.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedTags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired
};

export default RecipeSearch; 