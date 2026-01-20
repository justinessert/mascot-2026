import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataAudit } from '../hooks/useDataAudit';

function Home() {
    const navigate = useNavigate();
    const { data, loading } = useDataAudit();

    const [stagedData, setStagedData] = useState<Record<string, any>>({});

    useEffect(() => {
        const stored = localStorage.getItem('mascot_admin_staged_changes');
        if (stored) {
            setStagedData(JSON.parse(stored));
        }
    }, []);

    const isStaged = (key: string) => !!stagedData[key];

    const incompleteTeams = data.filter(team => !team.isComplete || isStaged(team.teamKey));
    const completeCount = data.length - incompleteTeams.length;
    const progress = Math.round((completeCount / data.length) * 100) || 0;

    const handleCommit = async () => {
        if (Object.keys(stagedData).length === 0) return;

        if (!confirm(`Are you sure you want to save changes for ${Object.keys(stagedData).length} teams? This will update local files.`)) {
            return;
        }

        try {
            const response = await fetch('/api/commit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ changes: stagedData })
            });

            if (response.ok) {
                const result = await response.json();
                let message = 'Success! Data saved.';
                if (result.imagesMoved?.length) message += `\n- Moved ${result.imagesMoved.length} images.`;
                if (result.nicknamesUpdated) message += `\n- Updated nicknames.json.`;
                if (result.mappingsUpdated) message += `\n- Updated specialNcaaNames.json.`;
                if (result.imagesMissing?.length) message += `\nWarning: ${result.imagesMissing.length} images were missing from temp.`;

                alert(message);
                localStorage.removeItem('mascot_admin_staged_changes');
                // Refresh page/data
                window.location.reload();
            } else {
                const err = await response.json();
                alert(`Error: ${err.error || 'Unknown server error'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to connect to local server endpoint.');
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
                <h2>Loading audit data...</h2>
            </div>
        );
    }

    return (
        <div className="container">
            <div style={{ marginBottom: '2rem' }}>
                <h1>Mascot Madness Admin</h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Audit and manage team data for the tournament.
                </p>
            </div>

            <div className="flex-row" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-value">{data.length}</div>
                    <div className="stat-label">Total Teams</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>
                        {incompleteTeams.length}
                    </div>
                    <div className="stat-label">Action Needed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: 'var(--accent-success)' }}>
                        {progress}%
                    </div>
                    <div className="stat-label">Complete</div>
                </div>
                {Object.keys(stagedData).length > 0 && (
                    <div className="stat-card" style={{ borderColor: 'var(--accent-warning)' }}>
                        <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>
                            {Object.keys(stagedData).length}
                        </div>
                        <div className="stat-label">Staged Changes</div>
                    </div>
                )}
            </div>

            <div className="audit-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Team Key</th>
                            <th>Years</th>
                            <th>Nickname</th>
                            <th>Image</th>
                            <th>NCAA Match</th>
                            <th>Mapped NCAA Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incompleteTeams.map((team) => {
                            const staged = isStaged(team.teamKey);
                            return (
                                <tr
                                    key={team.teamKey}
                                    onClick={() => navigate(`/team/${team.teamKey}`)}
                                >
                                    <td>
                                        <strong style={{ color: 'var(--text-primary)' }}>{team.teamKey}</strong>
                                        {staged && <span className="status-badge warning" style={{ marginLeft: '10px' }}>Staged</span>}
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {team.years.join(', ')}
                                        </span>
                                    </td>
                                    <td>
                                        {team.hasNickname ? (
                                            <span className="status-badge success">Found</span>
                                        ) : (
                                            staged ? <span className="status-badge warning">Staged</span> : <span className="status-badge error">Missing</span>
                                        )}
                                    </td>
                                    <td>
                                        {team.hasImage ? (
                                            <span className="status-badge success">Found</span>
                                        ) : (
                                            staged ? <span className="status-badge warning">Staged</span> : <span className="status-badge error">Missing</span>
                                        )}
                                    </td>
                                    <td>
                                        {team.isValidNcaaName ? (
                                            <span className="status-badge success">Valid</span>
                                        ) : (
                                            <span className="status-badge error">Invalid</span>
                                        )}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        {team.mappedNcaaName}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {Object.keys(stagedData).length > 0 && (
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                    <button
                        className="primary-button"
                        style={{ background: 'var(--accent-warning)', fontSize: '1.2rem', padding: '12px 24px' }}
                        onClick={handleCommit}
                    >
                        Save Staged Data ({Object.keys(stagedData).length} Teams)
                    </button>
                </div>
            )}

            {incompleteTeams.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    <h3>🎉 All caught up!</h3>
                    <p>Every team has a nickname, image, and valid NCAA name mapping.</p>
                </div>
            )}
        </div>
    );
}

export default Home;
