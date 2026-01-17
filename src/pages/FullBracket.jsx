/**
 * FullBracket Page
 * 
 * Displays the complete bracket with all 4 regions and the Final Four.
 * Layout: Left regions | Final Four + Champion | Right regions
 */

import { useState, useEffect } from 'react';
import { useYear } from '../hooks/useYear.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { formatTeamName, getMascotName } from '../constants/nicknames';
import { initializeBracket, loadBracket, Region, loadTemporaryBracket } from '../services/bracketService';
import ComingSoon from '../components/ComingSoon';
import FullBracketDisplay from '../components/FullBracketDisplay';
import './FullBracket.css';

function FullBracket() {
    const { selectedYear, getBracketData } = useYear();
    const { user } = useAuth();

    const [regions, setRegions] = useState({});
    const [loading, setLoading] = useState(true);
    const [bracketName, setBracketName] = useState('');

    // Load bracket on mount and when year/user changes
    useEffect(() => {
        loadBracketData();
    }, [selectedYear, user]);

    // Load bracket state from memory
    const loadFromMemory = () => {
        try {
            const memoryData = loadTemporaryBracket(selectedYear);
            if (!memoryData) return null;

            const loadedRegions = {};
            Object.keys(memoryData.regions).forEach(key => {
                if (memoryData.regions[key]) {
                    loadedRegions[key] = Region.fromDict(memoryData.regions[key], selectedYear);
                }
            });

            return {
                regions: loadedRegions,
                bracketName: memoryData.bracketName || ''
            };
        } catch (error) {
            console.error('Error loading from memory:', error);
            return null;
        }
    };

    const loadBracketData = async () => {
        setLoading(true);

        const bracketData = getBracketData();

        // Check if we have data for this year
        if (!bracketData.south.length && !bracketData.east.length) {
            setLoading(false);
            return;
        }

        // First, try to load saved bracket from Firebase if user is logged in
        if (user) {
            try {
                const savedBracket = await loadBracket(user, selectedYear);
                if (savedBracket) {
                    setRegions(savedBracket.regions);
                    setBracketName(savedBracket.name || '');
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error loading bracket:', error);
            }
        }

        // No Firebase bracket - try memory
        const memoryBracket = loadFromMemory();
        if (memoryBracket && Object.keys(memoryBracket.regions).length > 0) {
            setRegions(memoryBracket.regions);
            setBracketName(memoryBracket.bracketName || '');
            setLoading(false);
            return;
        }

        // No saved bracket anywhere - create empty structure
        const newRegions = initializeBracket(selectedYear);
        setRegions(newRegions);
        setBracketName('');
        setLoading(false);
    };



    if (loading) {
        return (
            <div className="full-bracket-container">
                <p>Loading bracket...</p>
            </div>
        );
    }

    const bracketData = getBracketData();
    if (!bracketData.south.length && !bracketData.east.length) {
        return <ComingSoon year={selectedYear} />;
    }

    return (
        <FullBracketDisplay
            regions={regions}
            bracketName={bracketName}
            year={selectedYear}
        // No back link for main bracket view
        >
            {!user && (
                <div className="info-banner">
                    ℹ️ Log in to view your saved bracket
                </div>
            )}
        </FullBracketDisplay>
    );
}

export default FullBracket;
