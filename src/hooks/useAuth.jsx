/**
 * Authentication hook for React
 * Provides current user state and auth functions
 */

import { useState, useEffect, createContext, useContext } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider component - wrap your app with this
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Cleanup subscription
        return unsubscribe;
    }, []);

    // Login with email/password
    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Sign up with email/password
    const signup = async (email, password, displayName) => {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name after account creation
        if (displayName) {
            await updateProfile(result.user, { displayName });
        }
        return result;
    };

    // Sign out
    const logout = async () => {
        return signOut(auth);
    };

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
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
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
