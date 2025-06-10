import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import Button from '../../components/Button/Button';
import styles from './UserDashboard.module.css';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const UserDashboard = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const recipes = useSelector(state => state.recipes.recipes);
  const favorites = useSelector(state => state.recipes.favorites);
  const favoriteRecipes = recipes.filter(recipe => favorites.includes(recipe.id));

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    dietaryPreferences: user?.dietaryPreferences || [],
    cookingSkillLevel: user?.cookingSkillLevel || 'Beginner',
    favoriteCuisines: user?.favoriteCuisines || [],
    socialMediaLinks: user?.socialMediaLinks || {
      facebook: '',
      twitter: '',
      instagram: '',
      pinterest: '',
      youtube: ''
    }
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    setProfileFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      dietaryPreferences: user?.dietaryPreferences || [],
      cookingSkillLevel: user?.cookingSkillLevel || 'Beginner',
      favoriteCuisines: user?.favoriteCuisines || [],
      socialMediaLinks: user?.socialMediaLinks || {
        facebook: '',
        twitter: '',
        instagram: '',
        pinterest: '',
        youtube: ''
      }
    });
  }, [user, navigate]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileFormData.name.trim()) {
      setProfileErrors({ name: 'Name is required' });
      return;
    }
    setProfileErrors({});
    setIsProfileLoading(true);
    setProfileMessage(null);
    try {
      const result = await updateProfile(profileFormData.name, profileFormData.avatar);
      if (result.success) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditingProfile(false);
      } else {
        setProfileMessage({ type: 'error', text: result.error || 'Failed to update profile.' });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmNewPassword) {
      setPasswordErrors({ submit: 'All fields are required.' });
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
      setPasswordErrors({ confirmNewPassword: 'New passwords do not match.' });
      return;
    }
    if (passwordFormData.newPassword.length < 6) {
      setPasswordErrors({ newPassword: 'Password must be at least 6 characters.' });
      return;
    }
    setPasswordErrors({});
    setIsPasswordLoading(true);
    setPasswordMessage(null);
    try {
      const result = await updatePassword(passwordFormData.currentPassword, passwordFormData.newPassword);
      if (result.success) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setIsEditingPassword(false);
      } else {
        setPasswordMessage({ type: 'error', text: result.error || 'Failed to update password.' });
      }
    } catch (error) {
      console.error('Password update error:', error);
      setPasswordMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Helper to get initials from name
  function getInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  if (!user) {
    return <div className={styles.notLoggedIn}>Please log in to view your dashboard.</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.pageTitle}>User Dashboard</h1>

      <section className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Profile Information</h2>
        <div className={styles.profileInfo}>
          <div className={styles.avatar} style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: isDarkMode ? '#fff' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            color: isDarkMode ? 'var(--primary)' : '#fff',
            fontWeight: 700,
            border: isDarkMode ? '2px solid var(--primary)' : 'none'
          }}>
            {getInitials(profileFormData.name || user.name)}
          </div>
          <div className={styles.userInfo}>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            {user.bio && <p><strong>Bio:</strong> {user.bio}</p>}
            <p><strong>Cooking Skill Level:</strong> {user.cookingSkillLevel || 'Beginner'}</p>
            
            {user.dietaryPreferences && user.dietaryPreferences.length > 0 && (
              <div>
                <p><strong>Dietary Preferences:</strong></p>
                <ul className={styles.tagsList}>
                  {user.dietaryPreferences.map(pref => (
                    <li key={pref} className={styles.tag}>{pref}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {user.favoriteCuisines && user.favoriteCuisines.length > 0 && (
              <div>
                <p><strong>Favorite Cuisines:</strong></p>
                <ul className={styles.tagsList}>
                  {user.favoriteCuisines.map(cuisine => (
                    <li key={cuisine} className={styles.tag}>{cuisine}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {user.socialMediaLinks && Object.values(user.socialMediaLinks).some(link => link) && (
              <div className={styles.socialMediaLinks}>
                <p><strong>Connect with me:</strong></p>
                <div className={styles.socialIcons}>
                  {user.socialMediaLinks.facebook && (
                    <a href={user.socialMediaLinks.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                    </a>
                  )}
                  {user.socialMediaLinks.twitter && (
                    <a href={user.socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                      </svg>
                    </a>
                  )}
                  {user.socialMediaLinks.instagram && (
                    <a href={user.socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </a>
                  )}
                  {user.socialMediaLinks.pinterest && (
                    <a href={user.socialMediaLinks.pinterest} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0a12 12 0 0 0-4.34 23.16c-.02-.46-.03-1.2.03-1.71.18-.75 1.17-4.75 1.17-4.75s-.3-.6-.3-1.48c0-1.39.81-2.43 1.81-2.43.85 0 1.26.64 1.26 1.4 0 .86-.54 2.14-.83 3.32-.24.99.5 1.8 1.48 1.8 1.78 0 3.14-1.87 3.14-4.57 0-2.39-1.72-4.07-4.18-4.07-2.85 0-4.51 2.14-4.51 4.35 0 .87.33 1.78.76 2.28.08.1.09.18.07.28-.08.31-.24.98-.28 1.12-.04.18-.14.22-.33.13-1.25-.58-2.03-2.4-2.03-3.87 0-3.15 2.29-6.04 6.61-6.04 3.47 0 6.17 2.47 6.17 5.77 0 3.45-2.18 6.22-5.2 6.22-1.01 0-1.97-.53-2.29-1.14l-.62 2.36c-.22.87-.83 1.96-1.24 2.62.94.29 1.92.44 2.93.44 5.52 0 10-4.48 10-10S17.52 0 12 0z" />
                      </svg>
                    </a>
                  )}
                  {user.socialMediaLinks.youtube && (
                    <a href={user.socialMediaLinks.youtube} target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          {!isEditingProfile && (
            <Button variant="outline" onClick={() => setIsEditingProfile(true)} className={styles.editButton}>
              Edit Profile
            </Button>
          )}
        </div>

        {isEditingProfile && (
          <form onSubmit={handleProfileSubmit} className={styles.profileForm}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>Name:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileFormData.name}
                onChange={handleProfileInputChange}
                className={`${styles.input} ${profileErrors.name ? styles.inputError : ''}`}
                disabled={isProfileLoading}
              />
              {profileErrors.name && <span className={styles.error}>{profileErrors.name}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="bio" className={styles.label}>Bio:</label>
              <textarea
                id="bio"
                name="bio"
                value={profileFormData.bio}
                onChange={handleProfileInputChange}
                className={styles.textarea}
                disabled={isProfileLoading}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Cooking Skill Level:</label>
              <select
                name="cookingSkillLevel"
                value={profileFormData.cookingSkillLevel}
                onChange={handleProfileInputChange}
                className={styles.select}
                disabled={isProfileLoading}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Professional">Professional</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Dietary Preferences:</label>
              <div className={styles.checkboxGroup}>
                {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'Low-Fat'].map(preference => (
                  <label key={preference} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="dietaryPreferences"
                      value={preference}
                      checked={profileFormData.dietaryPreferences.includes(preference)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProfileFormData(prev => ({
                          ...prev,
                          dietaryPreferences: e.target.checked
                            ? [...prev.dietaryPreferences, value]
                            : prev.dietaryPreferences.filter(item => item !== value)
                        }));
                      }}
                      className={styles.checkbox}
                      disabled={isProfileLoading}
                    />
                    {preference}
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Favorite Cuisines:</label>
              <div className={styles.checkboxGroup}>
                {['Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai', 'Mediterranean', 'French', 'American', 'Middle Eastern'].map(cuisine => (
                  <label key={cuisine} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="favoriteCuisines"
                      value={cuisine}
                      checked={profileFormData.favoriteCuisines.includes(cuisine)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProfileFormData(prev => ({
                          ...prev,
                          favoriteCuisines: e.target.checked
                            ? [...prev.favoriteCuisines, value]
                            : prev.favoriteCuisines.filter(item => item !== value)
                        }));
                      }}
                      className={styles.checkbox}
                      disabled={isProfileLoading}
                    />
                    {cuisine}
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Social Media Links:</label>
              <div className={styles.socialLinks}>
                <div className={styles.socialLinkField}>
                  <label htmlFor="facebook" className={styles.socialLabel}>Facebook:</label>
                  <input
                    type="text"
                    id="facebook"
                    name="socialMediaLinks.facebook"
                    value={profileFormData.socialMediaLinks.facebook}
                    onChange={(e) => {
                      setProfileFormData(prev => ({
                        ...prev,
                        socialMediaLinks: {
                          ...prev.socialMediaLinks,
                          facebook: e.target.value
                        }
                      }));
                    }}
                    className={styles.input}
                    disabled={isProfileLoading}
                    placeholder="https://facebook.com/yourusername"
                  />
                </div>
                
                <div className={styles.socialLinkField}>
                  <label htmlFor="twitter" className={styles.socialLabel}>Twitter:</label>
                  <input
                    type="text"
                    id="twitter"
                    name="socialMediaLinks.twitter"
                    value={profileFormData.socialMediaLinks.twitter}
                    onChange={(e) => {
                      setProfileFormData(prev => ({
                        ...prev,
                        socialMediaLinks: {
                          ...prev.socialMediaLinks,
                          twitter: e.target.value
                        }
                      }));
                    }}
                    className={styles.input}
                    disabled={isProfileLoading}
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>
                
                <div className={styles.socialLinkField}>
                  <label htmlFor="instagram" className={styles.socialLabel}>Instagram:</label>
                  <input
                    type="text"
                    id="instagram"
                    name="socialMediaLinks.instagram"
                    value={profileFormData.socialMediaLinks.instagram}
                    onChange={(e) => {
                      setProfileFormData(prev => ({
                        ...prev,
                        socialMediaLinks: {
                          ...prev.socialMediaLinks,
                          instagram: e.target.value
                        }
                      }));
                    }}
                    className={styles.input}
                    disabled={isProfileLoading}
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>
                
                <div className={styles.socialLinkField}>
                  <label htmlFor="pinterest" className={styles.socialLabel}>Pinterest:</label>
                  <input
                    type="text"
                    id="pinterest"
                    name="socialMediaLinks.pinterest"
                    value={profileFormData.socialMediaLinks.pinterest}
                    onChange={(e) => {
                      setProfileFormData(prev => ({
                        ...prev,
                        socialMediaLinks: {
                          ...prev.socialMediaLinks,
                          pinterest: e.target.value
                        }
                      }));
                    }}
                    className={styles.input}
                    disabled={isProfileLoading}
                    placeholder="https://pinterest.com/yourusername"
                  />
                </div>
                
                <div className={styles.socialLinkField}>
                  <label htmlFor="youtube" className={styles.socialLabel}>YouTube:</label>
                  <input
                    type="text"
                    id="youtube"
                    name="socialMediaLinks.youtube"
                    value={profileFormData.socialMediaLinks.youtube}
                    onChange={(e) => {
                      setProfileFormData(prev => ({
                        ...prev,
                        socialMediaLinks: {
                          ...prev.socialMediaLinks,
                          youtube: e.target.value
                        }
                      }));
                    }}
                    className={styles.input}
                    disabled={isProfileLoading}
                    placeholder="https://youtube.com/channel/yourchannel"
                  />
                </div>
              </div>
            </div>
            
            {profileMessage && (
              <div className={`${styles.message} ${profileMessage.type === 'success' ? styles.success : styles.error}`}>
                {profileMessage.text}
              </div>
            )}
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={isProfileLoading} loading={isProfileLoading}>
                Save Changes
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsEditingProfile(false)} disabled={isProfileLoading}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Update Password</h2>
        {!isEditingPassword ? (
          <Button variant="outline" onClick={() => setIsEditingPassword(true)} className={styles.editButton}>
            Change Password
          </Button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
            {passwordErrors.submit && (
              <div className={styles.errorMessage}>
                {passwordErrors.submit}
              </div>
            )}
            <div className={styles.formGroup}>
              <label htmlFor="current-password" className={styles.label}>Current Password:</label>
              <input
                type="password"
                id="current-password"
                name="currentPassword"
                value={passwordFormData.currentPassword}
                onChange={handlePasswordInputChange}
                className={`${styles.input}`}
                disabled={isPasswordLoading}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="new-password" className={styles.label}>New Password:</label>
              <input
                type="password"
                id="new-password"
                name="newPassword"
                value={passwordFormData.newPassword}
                onChange={handlePasswordInputChange}
                className={`${styles.input} ${passwordErrors.newPassword ? styles.inputError : ''}`}
                disabled={isPasswordLoading}
              />
              {passwordErrors.newPassword && <span className={styles.error}>{passwordErrors.newPassword}</span>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirm-new-password" className={styles.label}>Confirm New Password:</label>
              <input
                type="password"
                id="confirm-new-password"
                name="confirmNewPassword"
                value={passwordFormData.confirmNewPassword}
                onChange={handlePasswordInputChange}
                className={`${styles.input} ${passwordErrors.confirmNewPassword ? styles.inputError : ''}`}
                disabled={isPasswordLoading}
              />
              {passwordErrors.confirmNewPassword && <span className={styles.error}>{passwordErrors.confirmNewPassword}</span>}
            </div>
            {passwordMessage && (
              <div className={`${styles.message} ${passwordMessage.type === 'success' ? styles.success : styles.error}`}>
                {passwordMessage.text}
              </div>
            )}
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={isPasswordLoading} loading={isPasswordLoading}>
                Update Password
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsEditingPassword(false)} disabled={isPasswordLoading}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Saved Recipes Section */}
      <section className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Saved Recipes</h2>
        {favoriteRecipes.length === 0 ? (
          <p>You have no favorite recipes yet.</p>
        ) : (
          <div className={styles.recipesGrid}>
            {favoriteRecipes.map(recipe => (
              <RecipeCard key={recipe.id} {...recipe} isFavorite />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserDashboard; 