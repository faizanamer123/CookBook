import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Profile.module.css';

const Profile = () => {
  const { user } = useAuth();
  const [userRecipes, setUserRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user's recipes
        const recipesResponse = await fetch(`/api/recipes/user/${user._id}`);
        const recipesData = await recipesResponse.json();
        setUserRecipes(recipesData);

        // Fetch saved recipes
        const savedResponse = await fetch(`/api/recipes/saved/${user._id}`);
        const savedData = await savedResponse.json();
        setSavedRecipes(savedData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <div className={styles.profileInfo}>
          <img 
            src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff&size=200`} 
            alt={user.username}
            className={styles.profilePicture}
          />
          <div className={styles.userDetails}>
            <h1>{user.username}</h1>
            <p className={styles.email}>{user.email}</p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2>My Recipes</h2>
          <div className={styles.recipeGrid}>
            {userRecipes.map(recipe => (
              <div key={recipe._id} className={styles.recipeCard}>
                <img src={recipe.image} alt={recipe.title} />
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2>Saved Recipes</h2>
          <div className={styles.recipeGrid}>
            {savedRecipes.map(recipe => (
              <div key={recipe._id} className={styles.recipeCard}>
                <img src={recipe.image} alt={recipe.title} />
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 