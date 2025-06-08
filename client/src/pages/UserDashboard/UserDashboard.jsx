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
    setProfileFormData({ name: user?.name || '' });
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