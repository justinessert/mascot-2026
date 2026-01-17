/**
 * Login Page Component
 * 
 * KEY REACT CONCEPTS USED:
 * 
 * 1. useState - For managing form input values and UI state
 *    - Unlike Angular's two-way binding [(ngModel)], React uses "controlled components"
 *    - You explicitly store the value in state and update it on every keystroke
 * 
 * 2. useAuth - Our custom hook that provides auth functions
 *    - Hooks are functions that let you "hook into" React features
 *    - Custom hooks (like useAuth) let us share logic between components
 * 
 * 3. useNavigate - React Router's hook for programmatic navigation
 *    - Similar to Angular's Router.navigate()
 * 
 * 4. Event handling - Functions that run when user interacts
 *    - onClick, onChange, onSubmit
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

function Login() {
    // ============================================
    // STATE MANAGEMENT with useState
    // ============================================
    // 
    // useState returns an array: [currentValue, setterFunction]
    // We use array destructuring to name them whatever we want
    // 
    // When you call the setter (e.g., setEmail("new value")):
    //   1. React updates the state
    //   2. React re-renders the component with the new value
    //   3. The input displays the updated value

    const [email, setEmail] = useState('');        // Form input for email
    const [password, setPassword] = useState('');  // Form input for password
    const [error, setError] = useState('');        // Error message to display
    const [loading, setLoading] = useState(false); // Disable button while submitting

    // ============================================
    // HOOKS from React Router and our Auth
    // ============================================

    // useNavigate returns a function we can call to change routes
    const navigate = useNavigate();

    // useSearchParams lets us read query parameters from the URL
    const [searchParams] = useSearchParams();
    const redirectPath = searchParams.get('redirect') || '/';

    // useAuth returns our auth context with user info and functions
    // This works because we wrapped the app in <AuthProvider> in main.jsx
    const { login } = useAuth();

    // ============================================
    // EVENT HANDLER - Form submission
    // ============================================
    // 
    // async/await works the same as in Python
    // 'e' is the event object - we call preventDefault() to stop
    // the browser from doing a full page refresh (default form behavior)

    const handleSubmit = async (e) => {
        e.preventDefault();  // Prevent page refresh

        // Clear any previous errors
        setError('');

        // Basic validation
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);  // Show loading state

            // Call our auth login function (from useAuth hook)
            // This calls Firebase signInWithEmailAndPassword under the hood
            await login(email, password);

            // If successful, navigate to redirect path (or home)
            navigate(redirectPath);

        } catch (err) {
            // Firebase returns error codes like 'auth/wrong-password'
            // We convert them to user-friendly messages
            console.error('Login error:', err);

            switch (err.code) {
                case 'auth/user-not-found':
                    setError('No account found with this email');
                    break;
                case 'auth/wrong-password':
                    setError('Incorrect password');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address');
                    break;
                case 'auth/invalid-credential':
                    setError('Invalid email or password');
                    break;
                default:
                    setError('Failed to log in. Please try again.');
            }
        } finally {
            // finally runs whether success or error (like Python)
            setLoading(false);
        }
    };

    // ============================================
    // JSX - The component's rendered output
    // ============================================
    // 
    // JSX looks like HTML but it's JavaScript
    // Key differences:
    //   - className instead of class (class is reserved in JS)
    //   - {expression} to embed JavaScript values
    //   - onChange, onClick instead of (change), (click)
    //   - camelCase for attributes (htmlFor instead of for)

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>🏀 Login</h1>
                <p className="auth-subtitle">Welcome back to Mascot Madness!</p>

                {/* Conditional rendering: only show error if it exists */}
                {/* This is like *ngIf in Angular */}
                {error && <div className="auth-error">{error}</div>}

                {/* Form with onSubmit handler */}
                <form onSubmit={handleSubmit} className="auth-form">

                    {/* CONTROLLED INPUT - Email */}
                    {/* value={email} - displays current state */}
                    {/* onChange - updates state on every keystroke */}
                    {/* e.target.value - the current text in the input */}
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            disabled={loading}
                        />
                    </div>

                    {/* CONTROLLED INPUT - Password with visibility toggle */}
                    <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        disabled={loading}
                        label="Password"
                    />

                    {/* Submit button - disabled while loading */}
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                {/* Link to signup page */}
                {/* Link is from React Router - it navigates without page refresh */}
                <p className="auth-switch">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
                <p className="auth-switch">
                    <Link to="/forgot-password">Forgot your password?</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
