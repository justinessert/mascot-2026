import { analytics } from '../services/firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logAnalyticsEvent = (eventName: string, eventParams?: { [key: string]: any }) => {
    // Always log to console in development
    if (import.meta.env.DEV) {
        console.log(`[Analytics] ${eventName}`, eventParams);
        return; // Don't send to GA in dev
    }

    if (analytics) {
        firebaseLogEvent(analytics, eventName, eventParams);
    }
};

// Set user ID for tracking
export const setAnalyticsUserId = (userId: string | null) => {
    if (import.meta.env.DEV) {
        console.log('[Analytics] Setting User ID:', userId);
        return; // Don't send in dev
    }

    if (analytics) {
        import('firebase/analytics').then(({ setUserId }) => {
            setUserId(analytics!, userId);
        });
    }
};

// Set user properties (e.g., plan_type, is_logged_in)
export const setAnalyticsUserProperty = (properties: { [key: string]: string }) => {
    if (import.meta.env.DEV) {
        console.log(`[Analytics] Setting User Properties:`, properties);
        return; // Don't send in dev
    }

    if (analytics) {
        import('firebase/analytics').then(({ setUserProperties }) => {
            setUserProperties(analytics!, properties);
        });
    }
};
