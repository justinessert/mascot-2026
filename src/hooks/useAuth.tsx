/**
 * Authentication hook for React
 * Provides current user state and auth functions
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail,
    User,
    UserCredential
} from 'firebase/auth';
import { auth } from '../services/firebase';

// Auth context value interface
interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<UserCredential>;
    signup: (email: string, password: string, displayName: string) => Promise<UserCredential>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    isAuthenticated: boolean;
}

// Create Auth Context
const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Auth Provider component - wrap your app with this
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Cleanup subscription
        return unsubscribe;
    }, []);

    // Sign up with email/password
    const signup = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name after account creation
        if (displayName) {
            await updateProfile(result.user, { displayName });
        }

        // Create user document in Firestore for user lookup
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../services/firebase');

            const normalizedDisplayName = (displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '');

            await setDoc(doc(db, 'users', result.user.uid), {
                displayName: displayName || '',
                displayNameLower: (displayName || '').toLowerCase(),
                normalizedDisplayName,
                email: email,
                createdAt: new Date()
            });
        } catch (error) {
            console.error('Error creating user document:', error);
            // Don't fail signup if user document creation fails
        }

        return result;
    };

    // Login with email/password
    const login = async (email: string, password: string): Promise<UserCredential> => {
        const result = await signInWithEmailAndPassword(auth, email, password);

        // Self-healing: Update user search fields on login
        try {
            const user = result.user;
            if (user.displayName) {
                const { doc, setDoc } = await import('firebase/firestore');
                const { db } = await import('../services/firebase');

                const normalizedDisplayName = user.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');

                // Merge update to add search fields to existing users
                await setDoc(doc(db, 'users', user.uid), {
                    displayName: user.displayName,
                    displayNameLower: user.displayName.toLowerCase(),
                    normalizedDisplayName
                }, { merge: true });
            }
        } catch (error) {
            // Silently fail update - doesn't affect login
            console.error('Error updating user search fields:', error);
        }

        return result;
    };

    // Sign out
    const logout = async (): Promise<void> => {
        return signOut(auth);
    };

    // Send password reset email
    const resetPassword = async (email: string): Promise<void> => {
        return sendPasswordResetEmail(auth, email);
    };

    const value: AuthContextValue = {
        user,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

/**
 * Hook to access auth context
 * Usage: const { user, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
