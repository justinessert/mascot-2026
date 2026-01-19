/**
 * Tournament Context
 * 
 * Manages the currently selected tournament year and gender across the app.
 * Provides access to the correct bracket data based on gender (Men/Women).
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { mensTournaments, womensTournaments } from '../constants/bracketData';
import type { GenderCode, TournamentContextValue, TournamentConfig } from '../types/bracket';

const TournamentContext = createContext<TournamentContextValue | null>(null);

// Get tournament config for a given year and gender
const getTournamentConfig = (year: number, gender: GenderCode): TournamentConfig | undefined => {
    const tournaments = gender === 'W' ? womensTournaments : mensTournaments;
    return tournaments[year];
};

// Get all available years for a given gender
const getAvailableYears = (gender: GenderCode): number[] => {
    const tournaments = gender === 'W' ? womensTournaments : mensTournaments;
    return Object.keys(tournaments)
        .map(Number)
        .sort((a, b) => b - a); // Most recent first
};

// Check if a year has actual bracket data for a given gender
const yearHasData = (year: number, gender: GenderCode): boolean => {
    const config = getTournamentConfig(year, gender);
    if (!config || !config.regions) return false;

    // Check first region key to see if it has data
    const firstRegionKey = Object.keys(config.regions)[0];
    return !!firstRegionKey && config.regions[firstRegionKey].length > 0;
};

interface TournamentProviderProps {
    children: ReactNode;
}

export function TournamentProvider({ children }: TournamentProviderProps): React.ReactElement {
    const [selectedGender, setSelectedGender] = useState<GenderCode>('M');

    // Get all available years for current gender
    const availableYears = getAvailableYears(selectedGender);

    // Determine default year: current year if available, otherwise most recent
    const getDefaultYear = (): number => {
        const currentYear = new Date().getFullYear();
        const years = getAvailableYears(selectedGender);
        if (years.includes(currentYear)) {
            return currentYear;
        }
        // Fallback to most recent year (list is sorted descending)
        return years[0] || 2025;
    };

    const [selectedYear, setSelectedYear] = useState<number>(getDefaultYear());

    // Get current tournament config
    const getCurrentConfig = (): TournamentConfig | undefined => {
        return getTournamentConfig(selectedYear, selectedGender);
    };

    // Handle gender change - may need to adjust year if not available
    const handleGenderChange = (newGender: GenderCode): void => {
        setSelectedGender(newGender);
        const yearsForGender = getAvailableYears(newGender);
        if (!yearsForGender.includes(selectedYear)) {
            // Current year not available for this gender, switch to most recent
            setSelectedYear(yearsForGender[0] || 2025);
        }
    };

    // Get display label for collapsed selector (e.g., "2026 - M")
    const getDisplayLabel = (): string => {
        return `${selectedYear} - ${selectedGender}`;
    };

    // Get bracket data for the selected year and gender
    const getBracketData = (): Record<string, string[]> | null => {
        const config = getCurrentConfig();
        return config?.regions || null;
    };

    // Get region order for the selected year and gender
    const getRegionOrder = (): string[] | null => {
        const config = getCurrentConfig();
        return config?.regionOrder || null;
    };

    // Get first four mapping for the selected year and gender
    const getFirstFourMapping = (): Record<string, string> | null => {
        const config = getCurrentConfig();
        return config?.firstFourMapping || null;
    };

    // Get cutoff time for the selected year and gender
    const getCutoffTime = (): Date | undefined => {
        const config = getCurrentConfig();
        return config?.cutoffTime;
    };

    // Check if the selected year/gender has bracket data
    const hasBracketData = (): boolean => {
        return yearHasData(selectedYear, selectedGender);
    };

    // Get Selection Sunday announcement time for current year/gender
    const getSelectionSundayTime = (): Date | undefined => {
        const config = getCurrentConfig();
        return config?.selectionSundayTime;
    };

    const value: TournamentContextValue = {
        selectedYear,
        setSelectedYear,
        selectedGender,
        setSelectedGender: handleGenderChange,
        availableYears,
        getDisplayLabel,
        getBracketData,
        getRegionOrder,
        getFirstFourMapping,
        getCutoffTime,
        hasBracketData,
        getSelectionSundayTime,
    };

    return (
        <TournamentContext.Provider value={value}>
            {children}
        </TournamentContext.Provider>
    );
}

export function useTournament(): TournamentContextValue {
    const context = useContext(TournamentContext);
    if (!context) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
}

// Backwards compatibility alias
export const useYear = useTournament;
export const YearProvider = TournamentProvider;
