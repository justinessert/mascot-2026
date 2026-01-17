/**
 * Year Context
 * 
 * Manages the currently selected tournament year across the app.
 * Similar to how we use AuthContext for user state.
 */

import { createContext, useContext, useState } from 'react';
import { bracketData, regionOrder } from '../constants/bracketData';

const YearContext = createContext(null);

// Get available years that have bracket data
const getAvailableYears = () => {
    return Object.keys(bracketData)
        .map(Number)
        .filter(year => {
            const data = bracketData[year];
            // Only include years that have actual team data
            return data.south.length > 0 || data.east.length > 0;
        })
        .sort((a, b) => b - a); // Most recent first
};

export function YearProvider({ children }) {
    // Get available years with data
    const availableYears = getAvailableYears();

    // Default to most recent year with data
    const [selectedYear, setSelectedYear] = useState(
        availableYears.length > 0 ? availableYears[0] : new Date().getFullYear()
    );

    // Get bracket data for the selected year
    const getBracketData = () => {
        return bracketData[selectedYear] || bracketData[2025];
    };

    // Get region order for the selected year
    const getRegionOrder = () => {
        return regionOrder[selectedYear] || regionOrder[2025];
    };

    const value = {
        selectedYear,
        setSelectedYear,
        availableYears,
        getBracketData,
        getRegionOrder,
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
