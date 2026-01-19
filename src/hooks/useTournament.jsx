/**
 * Tournament Context
 * 
 * Manages the currently selected tournament year and gender across the app.
 * Provides access to the correct bracket data based on gender (Men/Women).
 */

import { createContext, useContext, useState } from 'react';
import {
    bracketData,
    womensBracketData,
    regionOrder,
    womensRegionOrder,
    firstFourMapping,
    womensFirstFourMapping,
    selectionSundayTimes,
    womensSelectionSundayTimes
} from '../constants/bracketData';

const TournamentContext = createContext(null);

// Get all available years for a given gender
const getAvailableYears = (gender) => {
    const data = gender === 'W' ? womensBracketData : bracketData;
    return Object.keys(data)
        .map(Number)
        .sort((a, b) => b - a); // Most recent first
};

// Check if a year has actual bracket data for a given gender
const yearHasData = (year, gender) => {
    const data = gender === 'W' ? womensBracketData[year] : bracketData[year];
    if (!data) return false;

    // Check first region key to see if it has data
    const firstRegionKey = Object.keys(data)[0];
    return firstRegionKey && data[firstRegionKey].length > 0;
};

export function TournamentProvider({ children }) {
    const [selectedGender, setSelectedGender] = useState('M'); // 'M' for Men, 'W' for Women

    // Get all available years for current gender
    const availableYears = getAvailableYears(selectedGender);

    // Determine default year: current year if available, otherwise most recent
    const getDefaultYear = () => {
        const currentYear = new Date().getFullYear();
        const years = getAvailableYears(selectedGender);
        if (years.includes(currentYear)) {
            return currentYear;
        }
        // Fallback to most recent year (list is sorted descending)
        return years[0] || 2025;
    };

    const [selectedYear, setSelectedYear] = useState(getDefaultYear());

    // Handle gender change - may need to adjust year if not available
    const handleGenderChange = (newGender) => {
        setSelectedGender(newGender);
        const yearsForGender = getAvailableYears(newGender);
        if (!yearsForGender.includes(selectedYear)) {
            // Current year not available for this gender, switch to most recent
            setSelectedYear(yearsForGender[0] || 2025);
        }
    };

    // Get display label for collapsed selector (e.g., "2026 - M")
    const getDisplayLabel = () => {
        return `${selectedYear} - ${selectedGender}`;
    };

    // Get bracket data for the selected year and gender
    const getBracketData = () => {
        if (selectedGender === 'W') {
            return womensBracketData[selectedYear] || womensBracketData[2025] || {};
        }
        return bracketData[selectedYear] || bracketData[2025];
    };

    // Get region order for the selected year and gender
    const getRegionOrder = () => {
        if (selectedGender === 'W') {
            return womensRegionOrder[selectedYear] || womensRegionOrder[2025] || [];
        }
        return regionOrder[selectedYear] || regionOrder[2025];
    };

    // Get first four mapping for the selected year and gender
    const getFirstFourMapping = () => {
        if (selectedGender === 'W') {
            return womensFirstFourMapping[selectedYear] || {};
        }
        return firstFourMapping[selectedYear] || {};
    };

    // Check if the selected year/gender has bracket data
    const hasBracketData = () => {
        return yearHasData(selectedYear, selectedGender);
    };

    // Get Selection Sunday announcement time for current year/gender
    const getSelectionSundayTime = () => {
        if (selectedGender === 'W') {
            return womensSelectionSundayTimes[selectedYear] || selectionSundayTimes[selectedYear];
        }
        return selectionSundayTimes[selectedYear];
    };

    const value = {
        selectedYear,
        setSelectedYear,
        selectedGender,
        setSelectedGender: handleGenderChange,
        availableYears,
        getDisplayLabel,
        getBracketData,
        getRegionOrder,
        getFirstFourMapping,
        hasBracketData,
        getSelectionSundayTime,
    };

    return (
        <TournamentContext.Provider value={value}>
            {children}
        </TournamentContext.Provider>
    );
}

export function useTournament() {
    const context = useContext(TournamentContext);
    if (!context) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
}

// Backwards compatibility alias
export const useYear = useTournament;
export const YearProvider = TournamentProvider;
