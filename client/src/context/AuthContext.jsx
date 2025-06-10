import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      // Update state and storage synchronously
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      // Dispatch event to notify components of user change
      window.dispatchEvent(new Event('userChanged'));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
      // Dispatch event to notify components of user change
      window.dispatchEvent(new Event('userChanged'));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Dispatch event to notify components of user change
    window.dispatchEvent(new Event('userChanged'));
  };

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile: async (name, avatar) => {
      return new Promise(resolve => {
        setTimeout(() => {
          setUser(prevUser => {
            if (prevUser) {
              const updatedUser = { ...prevUser, name, avatar };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              window.dispatchEvent(new Event('userChanged'));
              return updatedUser;
            }
            return null;
          });
          resolve({ success: true });
        }, 500);
      });
    },
    updatePassword: async (currentPassword, newPassword) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 