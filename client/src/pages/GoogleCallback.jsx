import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const result = await handleGoogleCallback(token);
      if (result.success) {
        navigate('/');
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, navigate, handleGoogleCallback]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <h2>Completing sign in...</h2>
      <div className="spinner"></div>
    </div>
  );
};

export default GoogleCallback; 