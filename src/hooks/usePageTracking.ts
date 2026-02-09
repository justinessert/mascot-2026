import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logAnalyticsEvent } from '../utils/analytics';
import { useTournament } from './useTournament';
import { useAuth } from './useAuth';
import { hasSavedBracket } from '../services/bracketService';
import type { Gender } from '../types/bracket';

/**
 * Hook to track page views automatically
 * Should be used inside a Router context
 */
export const usePageTracking = () => {
    const location = useLocation();
    const { selectedYear, selectedGender } = useTournament();
    const { user } = useAuth();
    const [userHasBracket, setUserHasBracket] = useState<boolean>(false);
    const prevCheckRef = useRef<string>('');

    // Check bracket status when user/year/gender changes
    useEffect(() => {
        const checkKey = `${user?.uid}_${selectedYear}_${selectedGender}`;
        if (checkKey === prevCheckRef.current) return;
        prevCheckRef.current = checkKey;

        const check = async () => {
            const genderPath: Gender = selectedGender === 'W' ? 'women' : 'men';
            const has = await hasSavedBracket(user, selectedYear, genderPath);
            setUserHasBracket(has);
        };
        check();
    }, [user, selectedYear, selectedGender]);

    useEffect(() => {
        // Delay slightly to allow the page component's useTitle to update document.title
        // Increased to 200ms to be safer
        const genderPath: Gender = selectedGender === 'W' ? 'women' : 'men';
        const timeoutId = setTimeout(() => {
            logAnalyticsEvent('page_view', {
                page_location: window.location.href,
                page_path: location.pathname + location.search,
                page_title: document.title,
                tournament_year: selectedYear,
                gender: genderPath,
                has_saved_bracket: userHasBracket,
            });
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [location, selectedYear, selectedGender, userHasBracket]);
};
