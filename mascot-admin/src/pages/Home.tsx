import { useNavigate } from 'react-router-dom';
import { useDataAudit } from '../hooks/useDataAudit';

function Home() {
    const navigate = useNavigate();
    const { data, loading } = useDataAudit();

    const incompleteTeams = data.filter(team => !team.isComplete);
    const completeCount = data.length - incompleteTeams.length;
    const progress = Math.round((completeCount / data.length) * 100) || 0;

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
                        {incompleteTeams.map((team) => (
                            <tr
                                key={team.teamKey}
                                onClick={() => navigate(`/team/${team.teamKey}`)}
                            >
                                <td>
                                    <strong style={{ color: 'var(--text-primary)' }}>{team.teamKey}</strong>
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
                                        <span className="status-badge error">Missing</span>
                                    )}
                                </td>
                                <td>
                                    {team.hasImage ? (
                                        <span className="status-badge success">Found</span>
                                    ) : (
                                        <span className="status-badge error">Missing</span>
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
                        ))}
                    </tbody>
                </table>
            </div>

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
