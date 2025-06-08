import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import './styles/global.css';

const Home = lazy(() => import('./pages/Home/Home'));
const Browse = lazy(() => import('./pages/Browse/Browse'));
const CreateRecipe = lazy(() => import('./pages/CreateRecipe/CreateRecipe'));
const UserDashboard = lazy(() => import('./pages/UserDashboard/UserDashboard'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const RecipeDetails = lazy(() => import('./pages/RecipeDetails/RecipeDetails'));

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Helper to sync user state with localStorage
  const syncUserFromStorage = useCallback(() => {
    setUser(JSON.parse(localStorage.getItem('user')));
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      syncUserFromStorage();
    };
    window.addEventListener('storage', handleStorage);
    syncUserFromStorage();
    setLoading(false);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncUserFromStorage]);

  // Patch: Listen for login/signup/logout events and update user state
  useEffect(() => {
    const handleUserChange = () => {
      syncUserFromStorage();
    };
    window.addEventListener('userChanged', handleUserChange);
    return () => window.removeEventListener('userChanged', handleUserChange);
  }, [syncUserFromStorage]);

  if (loading) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main style={{ marginTop: '80px', padding: '1rem' }}>
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  {!user ? (
                    <>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="*" element={<Login />} />
                    </>
                  ) : (
                    <>
                      <Route path="/" element={<Home />} />
                      <Route path="/browse" element={<Browse />} />
                      <Route path="/create" element={<CreateRecipe />} />
                      <Route path="/dashboard" element={<UserDashboard />} />
                      <Route path="/recipe/:id" element={<RecipeDetails />} />
                      <Route path="*" element={<Home />} />
                    </>
                  )}
                </Routes>
              </Suspense>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
