import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import Button from '../../components/Button/Button';
import ImageCropper from '../../components/ImageCropper/ImageCropper';
import styles from './UserDashboard.module.css';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { FaCamera, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { fetchSavedRecipes } from '../../store/recipesSlice';

const UserDashboard = () => {
  const { user, updateProfile, updatePassword, uploadProfilePicture } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const dispatch = useDispatch();

  const recipes = useSelector(state => state.recipes.recipes);
  const favorites = useSelector(state => state.recipes.favorites);
  const favoriteRecipes = recipes.filter(recipe => favorites.includes(recipe.id));
  const savedRecipes = useSelector(state => state.recipes.savedRecipes);
  const isLoading = useSelector(state => state.recipes.loading);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    username: user?.username || '',
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
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [picturePreview, setPicturePreview] = useState(user?.profilePicture || null);
  const [pictureError, setPictureError] = useState(null);
  
  // Image cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    setProfileFormData({
      username: user?.username || '',
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
    setPicturePreview(user?.profilePicture || null);
    
    // Fetch saved recipes when component mounts
    dispatch(fetchSavedRecipes());
  }, [user, navigate, dispatch]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDietaryPreferenceChange = (e) => {
    const { value, checked } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      dietaryPreferences: checked 
        ? [...prev.dietaryPreferences, value]
        : prev.dietaryPreferences.filter(pref => pref !== value)
    }));
  };

  const handleCuisineChange = (e) => {
    const { value, checked } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      favoriteCuisines: checked 
        ? [...prev.favoriteCuisines, value]
        : prev.favoriteCuisines.filter(cuisine => cuisine !== value)
    }));
  };

  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      socialMediaLinks: {
        ...prev.socialMediaLinks,
        [name]: value
      }
    }));
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setPictureError('Please select an image file (jpg, png, etc.)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPictureError('Image size must be less than 5MB');
      return;
    }
    
    // Clear any previous errors
    setPictureError(null);
    
    // Create object URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropper(true);
  };

  const handleCropComplete = async (croppedImageBlob) => {
    setProfilePicture(croppedImageBlob);
    setPicturePreview(URL.createObjectURL(croppedImageBlob));
    setShowCropper(false);
    
    // Upload the cropped image immediately
    await handleUploadProfilePicture(croppedImageBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
  };

  const handleUploadProfilePicture = async (imageBlob = null) => {
    const imageToUpload = imageBlob || profilePicture;
    
    if (!imageToUpload) {
      setPictureError('Please select an image to upload');
      return;
    }
    
    setUploadingPicture(true);
    setPictureError(null);
    
    try {
      const result = await uploadProfilePicture(imageToUpload);
      if (result.success) {
        setPicturePreview(result.profilePicture);
        setProfileMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        setProfilePicture(null); // Clear the file input
      } else {
        setPictureError(result.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setPictureError('An unexpected error occurred');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileFormData.username.trim()) {
      setProfileErrors({ username: 'Username is required' });
      return;
    }
    setProfileErrors({});
    setIsProfileLoading(true);
    setProfileMessage(null);
    try {
      const result = await updateProfile({
        username: profileFormData.username,
        bio: profileFormData.bio,
        dietaryPreferences: profileFormData.dietaryPreferences,
        cookingSkillLevel: profileFormData.cookingSkillLevel,
        favoriteCuisines: profileFormData.favoriteCuisines,
        socialMediaLinks: profileFormData.socialMediaLinks
      });
      
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

      {showCropper && imageToCrop ? (
        <div className={styles.cropperModal}>
          <div className={styles.cropperOverlay} onClick={handleCropCancel}></div>
          <div className={styles.cropperContent}>
            <h3 className={styles.cropperTitle}>Crop Profile Picture</h3>
            <ImageCropper 
              imageSrc={imageToCrop} 
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          </div>
        </div>
      ) : null}

      <section className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Profile Information</h2>
        <div className={styles.profileInfo}>
          <div className={styles.profileImageContainer}>
            <div className={styles.profilePictureWrapper}>
              {picturePreview ? (
                <img 
                  src={picturePreview} 
                  alt={user.username || 'Profile'} 
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.avatar} style={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: isDarkMode ? '#fff' : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  color: isDarkMode ? 'var(--primary)' : '#fff',
                  fontWeight: 700,
                  border: isDarkMode ? '2px solid var(--primary)' : 'none'
                }}>
                  {getInitials(user.username)}
                </div>
              )}
              
              <label htmlFor="profile-picture" className={styles.pictureEditButton}>
                <FaCamera />
              </label>
            </div>
            
            <div className={styles.profilePictureUpload}>
              <input
                type="file"
                id="profile-picture"
                onChange={handleProfilePictureChange}
                accept="image/*"
                className={styles.fileInput}
              />
              {pictureError && <p className={styles.errorText}>{pictureError}</p>}
            </div>
          </div>
          
          <div className={styles.userInfo}>
            <p><strong>Name:</strong> {user.username}</p>
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
            
            <div className={styles.editButtons}>
              <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                <FaEdit /> Edit Profile
              </Button>
              <Button onClick={() => setIsEditingPassword(true)} variant="outline">
                Edit Password
              </Button>
            </div>

            {profileMessage && (
              <div className={`${styles.message} ${styles[profileMessage.type]}`}>
                {profileMessage.text}
              </div>
            )}
          </div>
        </div>

        {isEditingProfile && (
          <form className={styles.editForm} onSubmit={handleProfileSubmit}>
            <h3>Edit Profile</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileFormData.username}
                onChange={handleProfileInputChange}
                className={styles.input}
              />
              {profileErrors.username && <span className={styles.errorText}>{profileErrors.username}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={profileFormData.bio}
                onChange={handleProfileInputChange}
                className={styles.textarea}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Cooking Skill Level</label>
              <select
                name="cookingSkillLevel"
                value={profileFormData.cookingSkillLevel}
                onChange={handleProfileInputChange}
                className={styles.select}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Dietary Preferences</label>
              <div className={styles.checkboxGroup}>
                {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'Low-Fat'].map(preference => (
                  <label key={preference} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      value={preference}
                      checked={profileFormData.dietaryPreferences.includes(preference)}
                      onChange={handleDietaryPreferenceChange}
                      className={styles.checkbox}
                    />
                    {preference}
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Favorite Cuisines</label>
              <div className={styles.checkboxGroup}>
                {['Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai', 'Mediterranean', 'French', 'American', 'Middle Eastern'].map(cuisine => (
                  <label key={cuisine} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      value={cuisine}
                      checked={profileFormData.favoriteCuisines.includes(cuisine)}
                      onChange={handleCuisineChange}
                      className={styles.checkbox}
                    />
                    {cuisine}
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Social Media Links</label>
              <div className={styles.socialLinks}>
                <div className={styles.socialLinkField}>
                  <label htmlFor="facebook">Facebook</label>
                  <input
                    type="text"
                    id="facebook"
                    name="facebook"
                    value={profileFormData.socialMediaLinks.facebook}
                    onChange={handleSocialMediaChange}
                    className={styles.input}
                    placeholder="https://facebook.com/yourusername"
                  />
                </div>
                
                <div className={styles.socialLinkField}>
                  <label htmlFor="twitter">Twitter</label>
                  <input
                    type="text"
                    id="twitter"
                    name="twitter"
                    value={profileFormData.socialMediaLinks.twitter}
                    onChange={handleSocialMediaChange}
                    className={styles.input}
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>
                
                <div className={styles.socialLinkField}>
                  <label htmlFor="instagram">Instagram</label>
                  <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    value={profileFormData.socialMediaLinks.instagram}
                    onChange={handleSocialMediaChange}
                    className={styles.input}
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>
                
                <div className={styles.socialLinkField}>
                  <label htmlFor="pinterest">Pinterest</label>
                  <input
                    type="text"
                    id="pinterest"
                    name="pinterest"
                    value={profileFormData.socialMediaLinks.pinterest}
                    onChange={handleSocialMediaChange}
                    className={styles.input}
                    placeholder="https://pinterest.com/yourusername"
                  />
                </div>
                
                <div className={styles.socialLinkField}>
                  <label htmlFor="youtube">YouTube</label>
                  <input
                    type="text"
                    id="youtube"
                    name="youtube"
                    value={profileFormData.socialMediaLinks.youtube}
                    onChange={handleSocialMediaChange}
                    className={styles.input}
                    placeholder="https://youtube.com/channel/yourchannel"
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={isProfileLoading}>
                {isProfileLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {isEditingPassword && (
          <form className={styles.editForm} onSubmit={handlePasswordSubmit}>
            <h3>Change Password</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordFormData.currentPassword}
                onChange={handlePasswordInputChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordFormData.newPassword}
                onChange={handlePasswordInputChange}
                className={styles.input}
              />
              {passwordErrors.newPassword && <span className={styles.errorText}>{passwordErrors.newPassword}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={passwordFormData.confirmNewPassword}
                onChange={handlePasswordInputChange}
                className={styles.input}
              />
              {passwordErrors.confirmNewPassword && <span className={styles.errorText}>{passwordErrors.confirmNewPassword}</span>}
            </div>
            
            {passwordErrors.submit && <div className={styles.errorText}>{passwordErrors.submit}</div>}
            
            {passwordMessage && (
              <div className={`${styles.message} ${styles[passwordMessage.type]}`}>
                {passwordMessage.text}
              </div>
            )}
            
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={isPasswordLoading}>
                {isPasswordLoading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditingPassword(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Saved Recipes Section */}
      <section className={styles.recipesSection}>
        <h2 className={styles.sectionTitle}>Your Saved Recipes</h2>
        {isLoading ? (
          <div className={styles.loading}>Loading your saved recipes...</div>
        ) : savedRecipes.length > 0 ? (
          <div className={styles.recipesGrid}>
            {savedRecipes.map(recipe => (
              <RecipeCard 
                key={recipe._id || recipe.id} 
                id={recipe._id || recipe.id}
                title={recipe.title}
                imageUrl={recipe.imageUrl || recipe.image}
                rating={recipe.averageRating || recipe.rating || 0}
                cookTime={recipe.cookTime || 0}
                author={recipe.author}
                tags={recipe.tags || []}
              />
            ))}
          </div>
        ) : (
          <p className={styles.noRecipes}>
            You haven't saved any recipes yet. Browse recipes and click the bookmark icon to save them here.
          </p>
        )}
      </section>
    </div>
  );
};

export default UserDashboard; 