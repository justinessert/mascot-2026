/**
 * Navigation Blocker Hook
 * 
 * Provides a way to block navigation when there's unsaved data.
 * Used by WinnerSelection to prevent losing bracket progress.
 */

import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Create context for navigation blocking
const NavigationBlockerContext = createContext(null);

// Routes that should never be blocked (auth pages)
const ALLOWED_ROUTES = ['/login', '/signup'];

export function NavigationBlockerProvider({ children }) {
    const navigateOriginal = useNavigate();
    const location = useLocation();
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const pendingNavigation = useRef(null);
    const blockingCondition = useRef(null);
    const onConfirmCallback = useRef(null);

    // Set a blocking condition (returns true if should block)
    const setBlocker = useCallback((condition, message = 'You have unsaved changes. Are you sure you want to leave?') => {
        blockingCondition.current = condition;
        setWarningMessage(message);
    }, []);

    // Clear the blocking condition
    const clearBlocker = useCallback(() => {
        blockingCondition.current = null;
        setWarningMessage('');
    }, []);

    // Safe navigate function that checks blocking condition
    const safeNavigate = useCallback((to, options, onConfirm) => {
        // Extract the path from the navigation target
        const path = typeof to === 'string' ? to.split('?')[0] : to.pathname || '';

        // Don't block if going to allowed routes
        if (ALLOWED_ROUTES.some(route => path.startsWith(route))) {
            navigateOriginal(to, options);
            return;
        }

        // Check if we should block
        const shouldBlock = blockingCondition.current ? blockingCondition.current() : false;

        if (shouldBlock) {
            pendingNavigation.current = { to, options };
            onConfirmCallback.current = onConfirm || null;
            setShowWarning(true);
        } else {
            navigateOriginal(to, options);
        }
    }, [navigateOriginal]);

    // Confirm leaving (proceed with navigation)
    const confirmLeave = useCallback(() => {
        if (pendingNavigation.current) {
            navigateOriginal(pendingNavigation.current.to, pendingNavigation.current.options);
            pendingNavigation.current = null;
        }
        if (onConfirmCallback.current) {
            onConfirmCallback.current();
            onConfirmCallback.current = null;
        }
        setShowWarning(false);
    }, [navigateOriginal]);

    // Cancel leaving (abort navigation)
    const cancelLeave = useCallback(() => {
        pendingNavigation.current = null;
        onConfirmCallback.current = null;
        setShowWarning(false);
    }, []);

    // Check if navigation should be blocked (for external components)
    const shouldBlock = useCallback(() => {
        return blockingCondition.current ? blockingCondition.current() : false;
    }, []);

    const value = {
        safeNavigate,
        setBlocker,
        clearBlocker,
        showWarning,
        warningMessage,
        confirmLeave,
        cancelLeave,
        shouldBlock,
        currentPath: location.pathname
    };

    return (
        <NavigationBlockerContext.Provider value={value}>
            {children}
        </NavigationBlockerContext.Provider>
    );
}

export function useNavigationBlocker() {
    const context = useContext(NavigationBlockerContext);
    if (!context) {
        throw new Error('useNavigationBlocker must be used within a NavigationBlockerProvider');
    }
    return context;
}
