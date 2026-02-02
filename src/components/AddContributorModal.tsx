/**
 * AddContributorModal Component
 * 
 * Modal for adding a contributor to a published bracket.
 * Validates the username and displays appropriate error messages.
 */

import { useState } from 'react';
import './LeaderboardModals.css';

interface AddContributorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (username: string) => Promise<{ success: boolean; error?: string }>;
    existingContributors: string[];
}

function AddContributorModal({
    isOpen,
    onClose,
    onSubmit,
    existingContributors
}: AddContributorModalProps): React.ReactElement | null {
    const [username, setUsername] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await onSubmit(username.trim());
            if (result.success) {
                setUsername('');
                onClose();
            } else {
                setError(result.error || 'Failed to add contributor');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        }

        setLoading(false);
    };

    const handleClose = (): void => {
        if (!loading) {
            setUsername('');
            setError('');
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add a Contributor</h2>
                    <button
                        className="modal-close"
                        onClick={handleClose}
                        disabled={loading}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p className="modal-message">
                            Adding a contributor gives them <strong>shared ownership</strong> of this bracket.
                            They will be credited alongside you on the leaderboard and bracket views,
                            and this bracket will appear in their history.
                        </p>
                        <p className="modal-message">
                            <strong>Note:</strong> Contributors cannot edit, save, or delete the bracket – only view it.
                        </p>

                        {error && <div className="modal-error">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="contributor-username">Username</label>
                            <input
                                type="text"
                                id="contributor-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter their display name"
                                disabled={loading}
                                autoComplete="off"
                            />
                            <p className="form-hint">
                                Enter the exact display name of the user you want to add.
                            </p>
                        </div>

                        {existingContributors.length > 0 && (
                            <div className="form-group">
                                <label>Current Contributors</label>
                                <p className="modal-message" style={{ margin: 0 }}>
                                    {existingContributors.join(', ')}
                                </p>
                            </div>
                        )}
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
                            disabled={loading || !username.trim()}
                        >
                            {loading ? 'Adding...' : 'Add Contributor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddContributorModal;
