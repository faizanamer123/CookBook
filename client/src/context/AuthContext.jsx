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
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token');
  });

  // Add a function to check if token is valid
  const isAuthenticated = () => {
    return !!token;
  };

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
      setToken(data.token);
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
      setToken(data.token);
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
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Dispatch event to notify components of user change
    window.dispatchEvent(new Event('userChanged'));
  };

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setToken(storedToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateProfile = async (profileData) => {
    try {
      if (!token) throw new Error('No authentication token found');

      console.log('Updating profile with data:', profileData);
      
      // Using fetch instead of axios for consistency
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      // First check if the response is OK
      if (!response.ok) {
        // Try to get a more specific error message
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to update profile (${response.status})`);
        } catch (parseError) {
          // If we can't parse the error JSON
          throw new Error(`Server error ${response.status}: Could not update profile`);
        }
      }

      // Try to parse the JSON response
      const data = await response.json();
      
      // Update the user state with the new profile data
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch event to notify components of user change
      window.dispatchEvent(new Event('userChanged'));
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  const uploadProfilePicture = async (imageFile) => {
    try {
      if (!token) throw new Error('No authentication token found');
      if (!imageFile) throw new Error('No image file provided');
      
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch(`${API_URL}/auth/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
      
      const data = await response.json();
      
      // Update user with new profile picture URL
      const updatedUser = { ...user, profilePicture: data.profilePicture };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch event to notify components of user change
      window.dispatchEvent(new Event('userChanged'));
      
      return { success: true, profilePicture: data.profilePicture };
    } catch (error) {
      console.error('Profile picture upload error:', error);
      return { success: false, error: error.message };
    }
  };
  
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update password');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    uploadProfilePicture
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 