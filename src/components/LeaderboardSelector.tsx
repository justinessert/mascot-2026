/**
 * Leaderboard Selector Component
 * Dropdown for selecting between global and custom leaderboards
 */

import { useState, useMemo } from 'react';
import type { CustomLeaderboardMeta } from '../services/leaderboardService';
import './LeaderboardSelector.css';

interface LeaderboardSelectorProps {
    customLeaderboards: CustomLeaderboardMeta[];
    selectedId: string | null; // null = global leaderboard
    onSelect: (leaderboardId: string | null) => void;
    loading?: boolean;
}

function LeaderboardSelector({
    customLeaderboards,
    selectedId,
    onSelect,
    loading = false
}: LeaderboardSelectorProps): React.ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter leaderboards by search term
    const filteredLeaderboards = useMemo(() => {
        if (!searchTerm.trim()) return customLeaderboards;
        const lower = searchTerm.toLowerCase();
        return customLeaderboards.filter(lb =>
            lb.name.toLowerCase().includes(lower) ||
            lb.description.toLowerCase().includes(lower)
        );
    }, [customLeaderboards, searchTerm]);

    // Check if global leaderboard should be shown (no search, or search matches "global")
    const showGlobalLeaderboard = useMemo(() => {
        if (!searchTerm.trim()) return true;
        return 'global leaderboard'.includes(searchTerm.toLowerCase());
    }, [searchTerm]);

    // Get display name for currently selected
    const selectedName = useMemo(() => {
        if (selectedId === null) return 'Global Leaderboard';
        const found = customLeaderboards.find(lb => lb.id === selectedId);
        return found?.name || 'Unknown';
    }, [selectedId, customLeaderboards]);

    const handleSelect = (id: string | null) => {
        onSelect(id);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="leaderboard-selector">
            <button
                className="selector-toggle"
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
            >
                <span className="selector-label">{selectedName}</span>
                <svg
                    className={`selector-arrow ${isOpen ? 'open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {isOpen && (
                <div className="selector-dropdown">
                    {/* Search Input */}
                    <div className="selector-search">
                        <input
                            type="text"
                            placeholder="Search leaderboards..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Options List */}
                    <div className="selector-options">
                        {/* Global Leaderboard (first, unless filtered out by search) */}
                        {showGlobalLeaderboard && (
                            <button
                                className={`selector-option ${selectedId === null ? 'selected' : ''}`}
                                onClick={() => handleSelect(null)}
                            >
                                <span className="option-name">🌐 Global Leaderboard</span>
                                <span className="option-meta">All published brackets</span>
                            </button>
                        )}

                        {/* Custom Leaderboards */}
                        {filteredLeaderboards.length > 0 && (
                            <div className="selector-divider">Custom Leaderboards</div>
                        )}

                        {filteredLeaderboards.map(lb => (
                            <button
                                key={lb.id}
                                className={`selector-option ${selectedId === lb.id ? 'selected' : ''}`}
                                onClick={() => handleSelect(lb.id)}
                            >
                                <span className="option-name">
                                    {lb.hasPassword && '🔒 '}
                                    {lb.name}
                                </span>
                                <span className="option-meta">
                                    {lb.memberCount} member{lb.memberCount !== 1 ? 's' : ''}
                                    {lb.description && ` • ${lb.description.slice(0, 30)}${lb.description.length > 30 ? '...' : ''}`}
                                </span>
                            </button>
                        ))}

                        {filteredLeaderboards.length === 0 && searchTerm && (
                            <div className="selector-empty">No leaderboards match "{searchTerm}"</div>
                        )}

                        {customLeaderboards.length === 0 && !searchTerm && (
                            <div className="selector-empty">No custom leaderboards yet</div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop to close dropdown */}
            {isOpen && <div className="selector-backdrop" onClick={() => setIsOpen(false)} />}
        </div>
    );
}

export default LeaderboardSelector;
