import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import './styles/global.css';

const Home = lazy(() => import('./pages/Home/Home'));
const Browse = lazy(() => import('./pages/Browse/Browse'));
const CreateRecipe = lazy(() => import('./pages/CreateRecipe/CreateRecipe'));
const UserDashboard = lazy(() => import('./pages/UserDashboard/UserDashboard'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const RecipeDetails = lazy(() => import('./pages/RecipeDetails/RecipeDetails'));
const UserProfile = lazy(() => import('./pages/UserProfile/UserProfile'));

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

  return (
    <div className="App">
      <Navbar />
      <main style={{ marginTop: '80px', padding: '1rem' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
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

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
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
