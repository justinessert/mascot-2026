// Redesigned TeamDetail Component - "Your Champion" Style
import { useParams, Link } from 'react-router-dom';
import { useDataAudit } from '../hooks/useDataAudit';

function TeamDetail() {
    const { teamKey } = useParams<{ teamKey: string }>();
    const { data, loading } = useDataAudit();

    if (loading) return (
        <div className="page-container">
            <div className="loading-message" style={{ marginTop: '2rem', textAlign: 'center' }}>
                <h3>Loading Team Details...</h3>
            </div>
        </div>
    );

    const team = data.find(t => t.teamKey === teamKey);

    if (!team) {
        return (
            <div className="page-container">
                <div className="empty-message" style={{ background: 'var(--secondary-bg)', padding: '40px', borderRadius: '16px', maxWidth: '500px', margin: '40px auto' }}>
                    <h3>Team Not Found</h3>
                    <p>The team "{teamKey}" could not be found.</p>
                    <Link to="/" className="back-btn" style={{ justifyContent: 'center', marginTop: '1rem' }}>← Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <Link to="/" className="back-btn" style={{ display: 'inline-flex', marginBottom: '0' }}>← Back to Dashboard</Link>

            <div className="champion-display">
                <h2>{team.teamKey}</h2>

                {!team.isComplete && (
                    <div className="info-banner" style={{ justifyContent: 'center', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: '#f59e0b' }}>
                        ⚠️ Incomplete Data
                    </div>
                )}

                {/* Team Image */}
                {team.hasImage ? (
                    <img
                        src={`/assets/teams/${team.teamKey}.jpg`}
                        alt={team.teamKey}
                        className="champion-image"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            // Note: text fallback might interfere with layout if image is hidden, 
                            // maybe show a placeholder div instead if needed, but for now simple hide.
                        }}
                    />
                ) : (
                    <div className="champion-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2a2a2a', borderRadius: '50%' }}>
                        <span style={{ fontSize: '3rem' }}>🖼️</span>
                    </div>
                )}

                <div className="bracket-form">
                    {/* Unique Key */}
                    <div className="form-group">
                        <label>Unique Team Key</label>
                        <input
                            type="text"
                            value={team.teamKey}
                            readOnly
                            disabled
                        />
                    </div>

                    {/* Nickname Status */}
                    <div className="form-group">
                        <label>
                            Mascot Nickname
                            {team.hasNickname && <span style={{ float: 'right', color: 'var(--accent-success)', fontSize: '0.8rem' }}>✓ verified</span>}
                        </label>
                        <input
                            type="text"
                            value={team.hasNickname ? "Nickname exists in JSON" : "Missing"}
                            style={{ fontStyle: team.hasNickname ? 'normal' : 'italic' }}
                            readOnly
                        />
                    </div>

                    {/* NCAA Mapping */}
                    <div className="form-group">
                        <label>
                            NCAA Mapping
                            {team.isValidNcaaName
                                ? <span style={{ float: 'right', color: 'var(--accent-success)', fontSize: '0.8rem' }}>✓ valid match</span>
                                : <span style={{ float: 'right', color: 'var(--accent-danger)', fontSize: '0.8rem' }}>✗ invalid</span>
                            }
                        </label>
                        <input
                            type="text"
                            value={team.mappedNcaaName || `Default: ${team.teamKey.replace(/_/g, '-')}`}
                            readOnly
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: '6px' }}>
                            {team.isValidNcaaName ? "Matches school database." : "No matching school found."}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="button-group">
                        <button className="secondary-btn" disabled>Edit Details</button>
                        <button className="primary-btn" disabled>Save Changes</button>
                    </div>
                </div>
            </div>

            {/* Participating Years (Outside card or at bottom) */}
            <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--secondary-text)' }}>
                <p style={{ marginBottom: '10px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Tournament History</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {team.years.map(year => (
                        <span key={year} style={{
                            background: 'var(--secondary-bg)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            border: '1px solid var(--border-color)'
                        }}>
                            {year}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default TeamDetail;
