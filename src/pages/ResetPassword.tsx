/**
 * Reset Password Page
 * 
 * This page handles the password reset link that users click from their email.
 * Firebase includes a special "oobCode" (out-of-band code) in the URL that we
 * use to verify and complete the password reset.
 * 
 * URL format: /reset-password?oobCode=xxxxx&mode=resetPassword
 */

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode, AuthError } from 'firebase/auth';
import { auth } from '../services/firebase';
import PasswordInput from '../components/PasswordInput';
import './Auth.css';

function ResetPassword(): React.ReactElement {
    // useSearchParams hook to read URL query parameters
    // This is how we get the oobCode from the reset link
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Form state
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [validCode, setValidCode] = useState<boolean>(false);
    const [verifying, setVerifying] = useState<boolean>(true);
    const [email, setEmail] = useState<string>('');

    // Get the oobCode from URL
    const oobCode = searchParams.get('oobCode');

    // Verify the reset code when component mounts
    useEffect(() => {
        const verifyCode = async (): Promise<void> => {
            if (!oobCode) {
                setError('Invalid password reset link. Please request a new one.');
                setVerifying(false);
                return;
            }

            try {
                // Verify the code is valid and get the email it's for
                const userEmail = await verifyPasswordResetCode(auth, oobCode);
                setEmail(userEmail);
                setValidCode(true);
            } catch (err) {
                console.error('Invalid reset code:', err);
                const authError = err as AuthError;
                switch (authError.code) {
                    case 'auth/expired-action-code':
                        setError('This password reset link has expired. Please request a new one.');
                        break;
                    case 'auth/invalid-action-code':
                        setError('This password reset link is invalid or has already been used.');
                        break;
                    default:
                        setError('Invalid password reset link. Please request a new one.');
                }
            } finally {
                setVerifying(false);
            }
        };

        verifyCode();
    }, [oobCode]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validation
        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);

            // Complete the password reset using Firebase
            await confirmPasswordReset(auth, oobCode!, password);

            setMessage('Password reset successful! Redirecting to login...');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            console.error('Password reset error:', err);
            const authError = err as AuthError;

            switch (authError.code) {
                case 'auth/expired-action-code':
                    setError('This reset link has expired. Please request a new one.');
                    break;
                case 'auth/invalid-action-code':
                    setError('This reset link is invalid or has already been used.');
                    break;
                case 'auth/weak-password':
                    setError('Password is too weak. Please use a stronger password.');
                    break;
                default:
                    setError('Failed to reset password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading while verifying the code
    if (verifying) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h1>🔐 Verifying...</h1>
                    <p className="auth-subtitle">Please wait while we verify your reset link.</p>
                </div>
            </div>
        );
    }

    // Show error if code is invalid
    if (!validCode) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h1>❌ Invalid Link</h1>
                    {error && <div className="auth-error">{error}</div>}
                    <p className="auth-switch">
                        <Link to="/forgot-password">Request a new reset link</Link>
                    </p>
                </div>
            </div>
        );
    }

    // Show the reset form
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>🔐 Reset Password</h1>
                <p className="auth-subtitle">
                    Enter a new password for {email}
                </p>

                {error && <div className="auth-error">{error}</div>}
                {message && <div className="auth-success">{message}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <PasswordInput
                        id="password"
                        value={password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        disabled={loading || !!message}
                        label="New Password"
                    />

                    <PasswordInput
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                        placeholder="Type password again"
                        disabled={loading || !!message}
                        label="Confirm New Password"
                    />

                    <button type="submit" className="auth-button" disabled={loading || !!message}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="auth-switch">
                    Remember your password? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}

export default ResetPassword;
