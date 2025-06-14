import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import './styles/global.css';
import { useDispatch } from 'react-redux';
import { fetchFavorites } from './store/recipesSlice';

const Landing = lazy(() => import('./pages/Landing/Landing'));
const Home = lazy(() => import('./pages/Home/Home'));
const Browse = lazy(() => import('./pages/Browse/Browse'));
const CreateRecipe = lazy(() => import('./pages/CreateRecipe/CreateRecipe'));
const UserDashboard = lazy(() => import('./pages/UserDashboard/UserDashboard'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const RecipeDetails = lazy(() => import('./pages/RecipeDetails/RecipeDetails'));
const UserProfile = lazy(() => import('./pages/UserProfile/UserProfile'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route component (for login/register)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  // Load favorites when user is authenticated
  useEffect(() => {
    if (user) {
      dispatch(fetchFavorites());
    }
  }, [user, dispatch]);

  return (
    <div className="App">
      <Navbar />
      <main style={{ marginTop: '80px', padding: '1rem' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={
              user ? (
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              ) : (
                <Landing />
              )
            } />

            {/* Public routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Protected routes */}
            <Route path="/browse" element={
              <ProtectedRoute>
                <Browse />
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <CreateRecipe />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/recipe/:id" element={
              <ProtectedRoute>
                <RecipeDetails />
              </ProtectedRoute>
            } />
            <Route path="/profile/:id" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={
              user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
            } />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
