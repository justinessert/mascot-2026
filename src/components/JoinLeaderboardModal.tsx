/**
 * Join Leaderboard Modal
 * Password entry modal for joining a protected leaderboard
 */

import { useState } from 'react';
import './LeaderboardModals.css';

interface JoinLeaderboardModalProps {
    isOpen: boolean;
    leaderboardName: string;
    onClose: () => void;
    onJoin: (password: string) => Promise<{ success: boolean; error?: string }>;
}

function JoinLeaderboardModal({
    isOpen,
    leaderboardName,
    onClose,
    onJoin
}: JoinLeaderboardModalProps): React.ReactElement | null {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const result = await onJoin(password.trim());
            if (result.success) {
                setPassword('');
                onClose();
            } else {
                setError(result.error || 'Failed to join leaderboard');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError(null);
            setPassword('');
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Join Leaderboard</h2>
                    <button className="modal-close" onClick={handleClose} disabled={loading}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p className="modal-message">
                            Enter the password to join <strong>{leaderboardName}</strong>
                        </p>

                        {error && <div className="modal-error">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="join-password">Password</label>
                            <input
                                id="join-password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Joining...' : 'Join'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default JoinLeaderboardModal;
