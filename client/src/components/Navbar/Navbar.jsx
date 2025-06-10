import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
    await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
      <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link to="/">
          <img src="/logo.png" alt="CookBook" />
          </Link>
      </div>

      <div className={styles.searchBar}>
                <input
          type="text"
                  placeholder="Search recipes..."
                  className={styles.searchInput}
                />
        <div className={styles.searchIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
        </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            {user ? (
          <Link to="/profile" className={styles.profileIconLink}>
            <div className={styles.avatar}>
              <img 
                src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random&color=fff&size=200`} 
                alt={user.username}
              />
                  </div>
                </Link>
            ) : (
              <div className={styles.authButtons}>
            <Link to="/login" className={styles.loginButton}>
                    Login
                </Link>
            <Link to="/register" className={styles.registerButton}>
              Register
                </Link>
              </div>
            )}
        </div>
      </nav>
  );
};

export default Navbar; 