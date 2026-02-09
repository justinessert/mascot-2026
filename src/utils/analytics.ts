import { analytics, analyticsReady } from '../services/firebase';
import { logEvent as firebaseLogEvent } from 'firebase/analytics';

// Internal queue for events sent before analytics is initialized
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventQueue: { eventName: string; eventParams?: { [key: string]: any } }[] = [];
let isProcessingQueue = false;

const flushQueue = async () => {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    try {
        const activeAnalytics = await analyticsReady;
        if (activeAnalytics) {
            while (eventQueue.length > 0) {
                const event = eventQueue.shift();
                if (event) {
                    firebaseLogEvent(activeAnalytics, event.eventName, event.eventParams);
                    if (import.meta.env.DEV) {
                        console.log(`[Analytics] Flushed from queue: ${event.eventName}`, event.eventParams);
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Analytics] Error flushing queue:', error);
    } finally {
        isProcessingQueue = false;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logAnalyticsEvent = (eventName: string, eventParams?: { [key: string]: any }) => {
    // Log to console in development for debugging
    if (import.meta.env.DEV) {
        console.log(`[Analytics] ${eventName}`, eventParams);
    }

    if (analytics) {
        firebaseLogEvent(analytics, eventName, eventParams);
    } else {
        // Queue the event and try to flush
        eventQueue.push({ eventName, eventParams });
        if (import.meta.env.DEV) {
            console.log(`[Analytics] Queued event: ${eventName}`);
        }
        flushQueue();
    }
};

// Set user ID for tracking
export const setAnalyticsUserId = (userId: string | null) => {
    if (import.meta.env.DEV) {
        console.log('[Analytics] Setting User ID:', userId);
    }

    analyticsReady.then(activeAnalytics => {
        if (activeAnalytics) {
            import('firebase/analytics').then(({ setUserId }) => {
                setUserId(activeAnalytics, userId);
            });
        }
    });
};

// Set user properties (e.g., plan_type, is_logged_in)
export const setAnalyticsUserProperty = (properties: { [key: string]: string }) => {
    if (import.meta.env.DEV) {
        console.log(`[Analytics] Setting User Properties:`, properties);
    }

    analyticsReady.then(activeAnalytics => {
        if (activeAnalytics) {
            import('firebase/analytics').then(({ setUserProperties }) => {
                setUserProperties(activeAnalytics, properties);
            });
        }
    });
};
