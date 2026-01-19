/**
 * Navigation Blocker Hook
 * 
 * Provides a way to block navigation when there's unsaved data.
 * Used by WinnerSelection to prevent losing bracket progress.
 */

import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation, NavigateOptions, To } from 'react-router-dom';

// Navigation blocker context value interface
interface NavigationBlockerContextValue {
    safeNavigate: (to: To, options?: NavigateOptions, onConfirm?: () => void) => void;
    setBlocker: (condition: () => boolean, message?: string) => void;
    clearBlocker: () => void;
    showWarning: boolean;
    warningMessage: string;
    confirmLeave: () => void;
    cancelLeave: () => void;
    shouldBlock: () => boolean;
    currentPath: string;
}

// Create context for navigation blocking
const NavigationBlockerContext = createContext<NavigationBlockerContextValue | null>(null);

// Routes that should never be blocked (auth pages)
const ALLOWED_ROUTES = ['/login', '/signup'];

interface PendingNavigation {
    to: To;
    options?: NavigateOptions;
}

interface NavigationBlockerProviderProps {
    children: ReactNode;
}

export function NavigationBlockerProvider({ children }: NavigationBlockerProviderProps): React.ReactElement {
    const navigateOriginal = useNavigate();
    const location = useLocation();
    const [showWarning, setShowWarning] = useState<boolean>(false);
    const [warningMessage, setWarningMessage] = useState<string>('');
    const pendingNavigation = useRef<PendingNavigation | null>(null);
    const blockingCondition = useRef<(() => boolean) | null>(null);
    const onConfirmCallback = useRef<(() => void) | null>(null);

    // Set a blocking condition (returns true if should block)
    const setBlocker = useCallback((condition: () => boolean, message: string = 'You have unsaved changes. Are you sure you want to leave?'): void => {
        blockingCondition.current = condition;
        setWarningMessage(message);
    }, []);

    // Clear the blocking condition
    const clearBlocker = useCallback((): void => {
        blockingCondition.current = null;
        setWarningMessage('');
    }, []);

    // Safe navigate function that checks blocking condition
    const safeNavigate = useCallback((to: To, options?: NavigateOptions, onConfirm?: () => void): void => {
        // Extract the path from the navigation target
        const path = typeof to === 'string' ? to.split('?')[0] : (to as { pathname?: string }).pathname || '';

        // Don't block if going to allowed routes
        if (ALLOWED_ROUTES.some(route => path.startsWith(route))) {
            navigateOriginal(to, options);
            return;
        }

        // Check if we should block
        const shouldBlockNav = blockingCondition.current ? blockingCondition.current() : false;

        if (shouldBlockNav) {
            pendingNavigation.current = { to, options };
            onConfirmCallback.current = onConfirm || null;
            setShowWarning(true);
        } else {
            navigateOriginal(to, options);
        }
    }, [navigateOriginal]);

    // Confirm leaving (proceed with navigation)
    const confirmLeave = useCallback((): void => {
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
    const cancelLeave = useCallback((): void => {
        pendingNavigation.current = null;
        onConfirmCallback.current = null;
        setShowWarning(false);
    }, []);

    // Check if navigation should be blocked (for external components)
    const shouldBlock = useCallback((): boolean => {
        return blockingCondition.current ? blockingCondition.current() : false;
    }, []);

    const value: NavigationBlockerContextValue = {
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

export function useNavigationBlocker(): NavigationBlockerContextValue {
    const context = useContext(NavigationBlockerContext);
    if (!context) {
        throw new Error('useNavigationBlocker must be used within a NavigationBlockerProvider');
    }
    return context;
}
