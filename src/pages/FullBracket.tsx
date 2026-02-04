/**
 * FullBracket Page
 * 
 * Displays the complete bracket with all 4 regions and the Final Four.
 * Layout: Left regions | Final Four + Champion | Right regions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useAuth } from '../hooks/useAuth';
import { initializeBracket, loadBracket, Region, loadTemporaryBracket, deleteBracket, saveTemporaryBracket } from '../services/bracketService';
import { loadCorrectBracket, CorrectBracket } from '../services/correctBracketService';
import ComingSoon from '../components/ComingSoon';
import FullBracketDisplay from '../components/FullBracketDisplay';
import type { Gender } from '../types/bracket';
import { useTitle } from '../hooks/useTitle';
import './FullBracket.css';

function FullBracket(): React.ReactElement {
    useTitle('Full Bracket');
    const { selectedYear, selectedGender, getBracketData, getRegionOrder, getFirstFourMapping, hasBracketData, getSelectionSundayTime } = useTournament();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Convert UI gender ('M'/'W') to service gender ('men'/'women')
    const genderPath: Gender = selectedGender === 'W' ? 'women' : 'men';

    const [regions, setRegions] = useState<Record<string, Region>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [bracketName, setBracketName] = useState<string>('');
    const [correctBracket, setCorrectBracket] = useState<CorrectBracket | null>(null);
    const [hasSavedBracket, setHasSavedBracket] = useState<boolean>(false);

    // Load bracket on mount and when year/gender/user changes
    useEffect(() => {
        loadBracketData();
        loadCorrectBracket(selectedYear, genderPath).then(setCorrectBracket);
    }, [selectedYear, selectedGender, user]);

    // Load bracket state from memory
    const loadFromMemory = (): { regions: Record<string, Region>; bracketName: string } | null => {
        try {
            const memoryData = loadTemporaryBracket(selectedYear, genderPath);
            if (!memoryData) return null;

            const loadedRegions: Record<string, Region> = {};
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

    const loadBracketData = async (): Promise<void> => {
        setLoading(true);

        const bracketData = getBracketData();

        // Check if we have data for this year (first region has teams)
        if (!bracketData) {
            setLoading(false);
            return;
        }

        const firstRegionKey = Object.keys(bracketData)[0];
        if (!firstRegionKey || !bracketData[firstRegionKey]?.length) {
            setLoading(false);
            return;
        }

        // First, try to load saved bracket from Firebase if user is logged in
        if (user) {
            try {
                const savedBracket = await loadBracket(user, selectedYear, genderPath);
                if (savedBracket) {
                    setRegions(savedBracket.regions);
                    setBracketName(savedBracket.name || '');
                    setHasSavedBracket(true);
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
        const bracketDataForYear = getBracketData();
        const regionOrderForYear = getRegionOrder();
        const firstFourMappingForYear = getFirstFourMapping();
        const newRegions = initializeBracket(selectedYear, bracketDataForYear, regionOrderForYear, firstFourMappingForYear);
        setRegions(newRegions);
        setBracketName('');
        setHasSavedBracket(false);
        setLoading(false);
    };

    // Handle deleting the bracket
    const handleDeleteBracket = async (): Promise<void> => {
        if (!user) return;

        const confirmed = window.confirm(
            'Are you sure you want to delete this bracket? This action cannot be undone and will also remove your entry from the leaderboard.'
        );

        if (!confirmed) return;

        const result = await deleteBracket(user, selectedYear, genderPath);

        if (result.success) {
            alert('Your bracket has been deleted.');
            // Clear local state
            saveTemporaryBracket(selectedYear, null, genderPath);
            navigate('/');
        } else {
            alert(result.error || 'Failed to delete bracket. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="full-bracket-container">
                <p>Loading bracket...</p>
            </div>
        );
    }

    if (!hasBracketData()) {
        return <ComingSoon year={selectedYear} selectionSundayTime={getSelectionSundayTime()} />;
    }

    return (
        <FullBracketDisplay
            regions={regions}
            bracketName={bracketName}
            year={selectedYear}
            regionOrder={getRegionOrder() || []}
            correctBracket={correctBracket}
            showCorrectAnswers={true}
            isOwner={!!user && hasSavedBracket}
            onDeleteBracket={handleDeleteBracket}
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
