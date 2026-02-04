import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logAnalyticsEvent } from '../utils/analytics';

/**
 * Hook to track page views automatically
 * Should be used inside a Router context
 */
export const usePageTracking = () => {
    const location = useLocation();

    useEffect(() => {
        // Delay slightly to allow the page component's useTitle to update document.title
        // Increased to 200ms to be safer
        const timeoutId = setTimeout(() => {
            logAnalyticsEvent('page_view', {
                page_location: window.location.href,
                page_path: location.pathname + location.search,
                page_title: document.title
            });
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [location]);
};
