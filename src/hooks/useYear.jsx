/**
 * Year Context
 * 
 * Manages the currently selected tournament year across the app.
 * Similar to how we use AuthContext for user state.
 */

import { createContext, useContext, useState } from 'react';
import { bracketData, regionOrder } from '../constants/bracketData';

const YearContext = createContext(null);

// Get all available years (including those without data yet)
const getAvailableYears = () => {
    return Object.keys(bracketData)
        .map(Number)
        .sort((a, b) => b - a); // Most recent first
};

// Check if a year has actual bracket data
const yearHasData = (year) => {
    const data = bracketData[year];
    return data && (data.south.length > 0 || data.east.length > 0);
};

export function YearProvider({ children }) {
    // Get all available years
    const availableYears = getAvailableYears();

    // Determine default year: current year if available, otherwise most recent
    const getDefaultYear = () => {
        const currentYear = new Date().getFullYear();
        if (availableYears.includes(currentYear)) {
            return currentYear;
        }
        // Fallback to most recent year (list is sorted descending)
        return availableYears[0];
    };

    const [selectedYear, setSelectedYear] = useState(getDefaultYear());

    // Get bracket data for the selected year
    const getBracketData = () => {
        return bracketData[selectedYear] || bracketData[2025];
    };

    // Get region order for the selected year
    const getRegionOrder = () => {
        return regionOrder[selectedYear] || regionOrder[2025];
    };

    // Check if the selected year has bracket data
    const hasBracketData = () => {
        return yearHasData(selectedYear);
    };

    const value = {
        selectedYear,
        setSelectedYear,
        availableYears,
        getBracketData,
        getRegionOrder,
        hasBracketData,
    };

    return (
        <YearContext.Provider value={value}>
            {children}
        </YearContext.Provider>
    );
}

export function useYear() {
    const context = useContext(YearContext);
    if (!context) {
        throw new Error('useYear must be used within a YearProvider');
    }
    return context;
}
