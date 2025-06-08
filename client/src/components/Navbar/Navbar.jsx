import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../Button/Button';
import styles from './Navbar.module.css';

// Helper to get initials from name
function getInitials(name) {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    // Navigate to the browse page with the search query as a URL parameter
    navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
    // Close mobile menu after search on mobile
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <Link to="/" className={styles.logo}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            CookBook
          </Link>

          <div className={styles.navLinks}>
            {user && (
              <form onSubmit={handleSearch} className={styles.searchBar}>
                <input
                  type="search"
                  placeholder="Search recipes..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search recipes"
                />
                <span className={styles.searchIcon}>🔍</span>
              </form>
            )}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {user ? (
              <>
                <Link to="/dashboard" className={styles.profileIconLink}>
                  <div className={styles.avatar} style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: isDarkMode ? '#fff' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: isDarkMode ? 'var(--primary)' : '#fff',
                    fontWeight: 700,
                    border: isDarkMode ? '2px solid var(--primary)' : 'none'
                  }}>
                    {getInitials(user.name)}
                  </div>
                </Link>
                <Button variant="outline" onClick={logout}>Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            <button
              className={styles.mobileMenu}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className={styles.mobileNav}>
          <button
            className={styles.closeButton}
            onClick={toggleMobileMenu}
            aria-label="Close mobile menu"
          >
            ✕
          </button>
          <div className={styles.mobileNavLinks}>
            {user && (
              <form onSubmit={handleSearch} className={styles.searchBar}>
                <input
                  type="search"
                  placeholder="Search recipes..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search recipes"
                />
                <span className={styles.searchIcon}>🔍</span>
              </form>
            )}
            
            {user ? (
              <>
                <Link to="/dashboard" onClick={toggleMobileMenu}>
                  <Button variant="outline" fullWidth>
                    Profile
                  </Button>
                </Link>
                <Button variant="outline" fullWidth onClick={logout}>Logout</Button>
              </>
            ) : (
               <>
                 <Link to="/login" onClick={toggleMobileMenu}>
                   <Button variant="outline" fullWidth>
                     Login
                   </Button>
                 </Link>
                 <Link to="/register" onClick={toggleMobileMenu}>
                   <Button variant="primary" fullWidth>
                     Sign Up
                   </Button>
                 </Link>
               </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar; 