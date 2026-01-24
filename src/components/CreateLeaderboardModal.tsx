/**
 * Create Leaderboard Modal
 * Form for creating a new custom leaderboard
 */

import { useState } from 'react';
import PasswordInput from './PasswordInput';
import './LeaderboardModals.css';

interface CreateLeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, description: string, password: string) => Promise<void>;
}

function CreateLeaderboardModal({
    isOpen,
    onClose,
    onCreate
}: CreateLeaderboardModalProps): React.ReactElement | null {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('Leaderboard name is required');
            return;
        }

        if (name.trim().length < 3) {
            setError('Name must be at least 3 characters');
            return;
        }

        if (name.trim().length > 50) {
            setError('Name must be less than 50 characters');
            return;
        }

        setLoading(true);
        try {
            await onCreate(name.trim(), description.trim(), password.trim());
            // Reset form on success
            setName('');
            setDescription('');
            setPassword('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError(null);
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create Leaderboard</h2>
                    <button className="modal-close" onClick={handleClose} disabled={loading}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="modal-error">{error}</div>}

                        <div className="form-group">
                            <label htmlFor="lb-name">Leaderboard Name *</label>
                            <input
                                id="lb-name"
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g., Office Pool 2026"
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lb-description">Description (optional)</label>
                            <textarea
                                id="lb-description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Add a short description..."
                                disabled={loading}
                                rows={3}
                            />
                        </div>

                        <PasswordInput
                            id="lb-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Leave empty for public access"
                            disabled={loading}
                            label="Password (optional)"
                        />
                        <p className="form-hint">
                            Set a password to require it when others join
                        </p>
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
                            disabled={loading || !name.trim()}
                        >
                            {loading ? 'Creating...' : 'Create Leaderboard'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateLeaderboardModal;
