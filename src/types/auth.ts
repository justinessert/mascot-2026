/**
 * Authentication and User Types
 */

import { User as FirebaseUser } from 'firebase/auth';

// Extended user type that includes our app-specific properties
export interface AppUser extends FirebaseUser {
    // Firebase User already includes displayName, email, uid, etc.
    // Add any app-specific user properties here in the future
}

// Auth context value type
export interface AuthContextValue {
    user: AppUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    signup: (email: string, password: string, displayName: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}
