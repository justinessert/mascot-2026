/**
 * Forgot Password Page
 * 
 * Sends a password reset email via Firebase Auth.
 * Uses the same patterns as Login/Signup:
 * - useState for form state
 * - useAuth hook for resetPassword function
 */

import { useState, FormEvent, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthError } from 'firebase/auth';
import './Auth.css';

function ForgotPassword(): React.ReactElement {
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [message, setMessage] = useState<string>('');  // Success message
    const [loading, setLoading] = useState<boolean>(false);

    const { resetPassword } = useAuth();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        try {
            setLoading(true);

            // Firebase sends an email with a reset link
            await resetPassword(email);

            // Show success message
            setMessage('Check your email for a password reset link');

        } catch (err) {
            console.error('Password reset error:', err);
            const authError = err as AuthError;

            switch (authError.code) {
                case 'auth/user-not-found':
                    setError('No account found with this email');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email address');
                    break;
                default:
                    setError('Failed to send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>🔑 Reset Password</h1>
                <p className="auth-subtitle">
                    Enter your email and we'll send you a link to reset your password.
                </p>

                {/* Error message - red */}
                {error && <div className="auth-error">{error}</div>}

                {/* Success message - green */}
                {message && <div className="auth-success">{message}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <p className="auth-switch">
                    Remember your password? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
