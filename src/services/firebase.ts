/**
 * Firebase initialization and exports
 * Provides access to Firebase Auth and Firestore throughout the app
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { firebaseConfig } from '../config/firebase.config';

// Initialize Firebase app
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize and export Firebase services
// Initialize and export Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

// Initialize Analytics conditionally to avoid errors in environments without window/indexedDB
// Skip entirely on localhost so no analytics data is sent during local development
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

let analytics: Analytics | null = null;
const analyticsReady: Promise<Analytics | null> = isLocalhost
    ? Promise.resolve(null)
    : isSupported().then(supported => {
        if (supported) {
            analytics = getAnalytics(app);
            return analytics;
        }
        return null;
    });

export { analytics, analyticsReady };

export default app;
