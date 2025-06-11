import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_URL } from '../../config';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import styles from './UserProfile.module.css';
import { FaUser, FaEnvelope, FaBook, FaUtensils, FaGlobeAmericas } from 'react-icons/fa';

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserAndRecipes = async () => {
      setLoading(true);
      try {
        // Fetch user info
        const userRes = await fetch(`${API_URL}/auth/user/${id}`);
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const userData = await userRes.json();
        setUser(userData);

        // Fetch user's recipes
        const recipesRes = await fetch(`${API_URL}/recipes?author=${id}`);
        if (!recipesRes.ok) throw new Error('Failed to fetch recipes');
        const recipesData = await recipesRes.json();
        setRecipes(recipesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndRecipes();
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!user) return <div className={styles.error}>User not found</div>;

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <img
            src={user.profilePicture || '/default-avatar.png'}
            alt={user.username}
            className={styles.avatar}
          />
          <div className={styles.profileInfo}>
            <h2 className={styles.userName}>{user.username}</h2>
            <div className={styles.infoItem}>
              <FaEnvelope className={styles.infoIcon} />
              <span>{user.email || 'No email provided'}</span>
            </div>
            {user.bio && (
              <div className={styles.infoItem}>
                <FaBook className={styles.infoIcon} />
                <span>{user.bio}</span>
              </div>
            )}
            {user.cookingSkillLevel && (
              <div className={styles.infoItem}>
                <FaUtensils className={styles.infoIcon} />
                <span>Cooking Skill: {user.cookingSkillLevel}</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.profileDetails}>
          {user.dietaryPreferences && user.dietaryPreferences.length > 0 && (
            <div className={styles.detailSection}>
              <h3 className={styles.sectionTitle}>Dietary Preferences</h3>
              <div className={styles.tagContainer}>
                {user.dietaryPreferences.map((pref, index) => (
                  <span key={index} className={styles.tag}>{pref}</span>
                ))}
              </div>
            </div>
          )}

          {user.favoriteCuisines && user.favoriteCuisines.length > 0 && (
            <div className={styles.detailSection}>
              <h3 className={styles.sectionTitle}>Favorite Cuisines</h3>
              <div className={styles.tagContainer}>
                {user.favoriteCuisines.map((cuisine, index) => (
                  <span key={index} className={styles.tag}>{cuisine}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.recipesSection}>
        <h2 className={styles.recipesSectionTitle}>Recipes by {user.username}</h2>
        <div className={styles.recipesGrid}>
          {recipes.length === 0 ? (
            <p className={styles.noRecipes}>No recipes yet from this chef.</p>
          ) : (
            recipes.map(recipe => (
              <RecipeCard key={recipe.id || recipe._id} {...recipe} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 