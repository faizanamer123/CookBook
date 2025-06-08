import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import styles from './Register.module.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return !value.trim() ? 'Name is required' : '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Email is invalid';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        const requirementsMet = Object.values({
          length: value.length >= 8,
          uppercase: /[A-Z]/.test(value),
          lowercase: /[a-z]/.test(value),
          number: /[0-9]/.test(value),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        }).every(Boolean);
        if (!requirementsMet) return 'Password does not meet all requirements';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  useEffect(() => {
    // Validate password and confirm password when password changes and has been touched
    if (touched.password) {
      validateField('password', formData.password);
    }
    if (touched.confirmPassword) {
       validateField('confirmPassword', formData.confirmPassword);
    }
     const { password } = formData;
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [formData.password, touched.password, touched.confirmPassword]);

  useEffect(() => {
    // Validate email when it changes and has been touched
    if (touched.email) {
      const error = validateField('email', formData.email);
      setErrors(prev => ({ ...prev, email: error }));
    }
  }, [formData.email, touched.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), {});
    setTouched(allTouched);
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.name, email: formData.email, password: formData.password })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message && data.message.toLowerCase().includes('exists')) {
          setErrors({ submit: 'Email already exists. Please use a different email or login.' });
        } else {
          setErrors({ submit: data.message || 'Failed to create account. Please try again.' });
        }
        return;
      }
      setErrors({});
      // Registration successful, log in user and redirect to home
      const userWithName = { ...data.user, name: data.user.name || data.user.username };
      localStorage.setItem('user', JSON.stringify(userWithName));
      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event('userChanged'));
      // Force reload to ensure state is synced and user is redirected to home
      window.location.href = '/';
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // TODO: Implement social login
    console.log(`Logging in with ${provider}`);
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        <div className={styles.registerHeader}>
          <h1>Create Account</h1>
          <p>Join CookBook and start sharing your recipes</p>
        </div>

        <div className={styles.socialLogin}>
          <Button
            variant="outline"
            fullWidth
            onClick={() => handleSocialLogin('google')}
            className={styles.socialButton}
            disabled={isLoading}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className={styles.socialIcon} />
            Continue with Google
          </Button>
        </div>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.registerForm} noValidate>
          {errors.submit && (
            <div className={styles.errorMessage}>
              {errors.submit}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="register-name">Full Name</label>
            <input
              type="text"
              id="register-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.name && errors.name ? styles.inputError : ''}`}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
            {touched.name && errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-email">Email</label>
            <input
              type="email"
              id="register-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ''}`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {touched.email && errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="register-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${touched.password && errors.password ? styles.inputError : ''}`}
                placeholder="Create a password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#888',
                  padding: 0
                }}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {touched.password && errors.password && <span className={styles.error}>{errors.password}</span>}
            <div className={styles.passwordRequirements}>
              <div className={`${styles.requirement} ${passwordRequirements.length ? styles.met : styles.unmet}`}>
                {passwordRequirements.length ? '✓' : '×'} At least 8 characters
              </div>
              <div className={`${styles.requirement} ${passwordRequirements.uppercase ? styles.met : styles.unmet}`}>
                {passwordRequirements.uppercase ? '✓' : '×'} One uppercase letter
              </div>
              <div className={`${styles.requirement} ${passwordRequirements.lowercase ? styles.met : styles.unmet}`}>
                {passwordRequirements.lowercase ? '✓' : '×'} One lowercase letter
              </div>
              <div className={`${styles.requirement} ${passwordRequirements.number ? styles.met : styles.unmet}`}>
                {passwordRequirements.number ? '✓' : '×'} One number
              </div>
              <div className={`${styles.requirement} ${passwordRequirements.special ? styles.met : styles.unmet}`}>
                {passwordRequirements.special ? '✓' : '×'} One special character
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="register-confirm-password">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="register-confirm-password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${touched.confirmPassword && errors.confirmPassword ? styles.inputError : ''}`}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#888',
                  padding: 0
                }}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <span className={styles.error}>{errors.confirmPassword}</span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className={styles.loginPrompt}>
          <p>
            Already have an account?{' '}
            <Link to="/login" className={styles.loginLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 