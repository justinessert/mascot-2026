// Redesigned TeamDetail Component - "Your Champion" Style
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDataAudit } from '../hooks/useDataAudit';
import ImageUploadModal from '../components/ImageUploadModal';
import schoolsDataRaw from '@shared/schools.json';

const schools = schoolsDataRaw as Array<{ slug: string }>;

function TeamDetail() {
    const { teamKey } = useParams<{ teamKey: string }>();
    const navigate = useNavigate();
    const { data } = useDataAudit();
    const [team, setTeam] = useState<any | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [nicknameInput, setNicknameInput] = useState('');
    const [mappedNameInput, setMappedNameInput] = useState('');
    const [pendingImage, setPendingImage] = useState<{ blob: Blob, url: string } | null>(null);

    useEffect(() => {
        if (data && teamKey) {
            const foundTeam = data.find(t => t.teamKey === teamKey);
            setTeam(foundTeam || null);
            if (foundTeam) {
                setNicknameInput(foundTeam.nickname || '');
                setMappedNameInput(foundTeam.mappedNcaaName || '');
            }
        }
    }, [data, teamKey]);

    // Handle image selection from modal (don't download yet)
    const handleImageQueue = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        setPendingImage({ blob, url });
        setIsUploadModalOpen(false); // Close modal
    };

    // Staging Submit
    const handleStageChanges = async () => {
        if (!team) return;

        // 0. Validate Mapped NCAA Name
        const trimmedMapping = mappedNameInput.trim();
        if (trimmedMapping) {
            const isValid = schools.some(s => s.slug === trimmedMapping);
            if (!isValid) {
                alert(`Invalid Mapped NCAA Name: "${trimmedMapping}".\n\nThis name does not exist in the schools database. Please check the spelling or validity.`);
                return;
            }
        }

        // 1. Process Image - Upload to Temp
        if (pendingImage) {
            try {
                // Convert Blob to Base64
                const reader = new FileReader();
                reader.readAsDataURL(pendingImage.blob);
                reader.onloadend = async () => {
                    const base64data = reader.result;

                    const response = await fetch('/api/stage-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            teamKey: team.teamKey,
                            imageBase64: base64data
                        })
                    });

                    if (!response.ok) {
                        alert('Failed to stage image on server!');
                    } else {
                        finalizeStage();
                    }
                };
            } catch (err) {
                console.error(err);
                alert('Error processing image');
                return;
            }
        } else {
            finalizeStage();
        }

        function finalizeStage() {
            if (!team) return;
            // 2. Persist to LocalStorage (Staging)
            const stagedDataStr = localStorage.getItem('mascot_admin_staged_changes');
            const stagedData = stagedDataStr ? JSON.parse(stagedDataStr) : {};

            stagedData[team.teamKey] = {
                nickname: nicknameInput,
                mappedNcaaName: mappedNameInput,
                // Track visual state
                hasImage: !!pendingImage || team.hasImage
            };

            localStorage.setItem('mascot_admin_staged_changes', JSON.stringify(stagedData));

            // 3. Redirect to Dashboard
            navigate('/');
        }
    };

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            if (pendingImage) URL.revokeObjectURL(pendingImage.url);
        };
    }, [pendingImage]);

    if (!team) {
        return (
            <div className="page-container">
                <div className="loading-message" style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <h3>Loading Team Details...</h3>
                </div>
            </div>
        );
    }

    // Use pending image if available, else current or fallback
    const displayImageUrl = pendingImage
        ? pendingImage.url
        : (team.hasImage ? `/assets/teams/${team.teamKey}.jpg` : null);

    // Validation for "Stage Changes" button
    const hasImage = !!displayImageUrl;
    const hasNickname = nicknameInput.trim().length > 0;


    // Check validation completeness
    const canStage = hasImage && hasNickname;


    return (
        <div className="page-container">
            <div className="container">
                <Link to="/" className="back-btn">← Back to Dashboard</Link>

                {/* Champion Display Card */}
                <div className="champion-display">
                    {/* Header with Status Badge */}
                    {/* Header */}
                    <h2>{team.teamKey}</h2>

                    {/* Status Badge */}
                    {!team.isComplete && (
                        <div style={{ marginBottom: '20px' }}>
                            <span className="status-badge error">Incomplete Data</span>
                        </div>
                    )}

                    {/* Team Image (Centered) or Missing Icon */}
                    {displayImageUrl ? (
                        <img
                            src={displayImageUrl}
                            alt={team.teamKey}
                            className="champion-image"
                        />
                    ) : (
                        <div
                            className="champion-image"
                            onClick={() => setIsUploadModalOpen(true)}
                            title="Click to upload image"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#2a2a2a',
                                borderRadius: '50%',
                                margin: '20px auto',
                                border: '4px solid #333',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s, border-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                                e.currentTarget.style.backgroundColor = '#3a3a3a';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#333';
                                e.currentTarget.style.backgroundColor = '#2a2a2a';
                            }}
                        >
                            <span style={{ fontSize: '4rem' }}>🖼️</span>
                        </div>
                    )}

                    {/* Nickname / Mascot Name Input */}
                    <div className="bracket-form" style={{ marginTop: '10px' }}>
                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center' }}>
                                Mascot Nickname
                                <div className="tooltip-container">
                                    <span>ℹ️</span>
                                    <div className="tooltip-text">
                                        Formatting Rules:
                                        <ul className="tooltip-list">
                                            <li>all lower case</li>
                                            <li>use spaces to separate words</li>
                                            <li>no "the" (eg. "eagles" not "the eagles")</li>
                                        </ul>
                                    </div>
                                </div>
                            </label>
                            <input
                                type="text"
                                value={nicknameInput}
                                onChange={(e) => setNicknameInput(e.target.value)}
                                placeholder="Enter Mascot Nickname"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: 'var(--accent-color)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Input Form Area */}
                    <div className="bracket-form">
                        <div className="form-group">
                            <label>
                                Mapped NCAA Name
                                {team.isValidNcaaName && (
                                    <span style={{ color: 'var(--accent-success)', marginLeft: '8px' }}>✓</span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={mappedNameInput}
                                onChange={(e) => setMappedNameInput(e.target.value)}
                                placeholder={team.ncaaName || 'Enter NCAA Name Mapping'}
                                style={{
                                    fontStyle: 'normal',
                                    color: 'var(--primary-text)',
                                    opacity: team.isValidNcaaName ? 0.9 : 1,
                                    // backgroundColor: team.isValidNcaaName ? 'rgba(255,255,255,0.05)' : 'var(--input-bg)'
                                }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: '0.25rem' }}>
                                Mapped from: <code>{team.teamKey}</code>.
                                {team.mappedNcaaName
                                    ? ' Uses explicit mapping.'
                                    : ' Uses default mapping (hyphenated key).'}
                                {team.isValidNcaaName
                                    ? ' Matches a known school.'
                                    : ' No match found in schools database.'}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="button-group">
                            <button className="secondary-button" onClick={() => setIsUploadModalOpen(true)}>
                                {pendingImage ? "Change Pending Photo" : (team.hasImage ? "Update Photo" : "Upload Photo")}
                            </button>
                            <button
                                className="primary-button"
                                onClick={handleStageChanges}
                                disabled={!canStage}
                                title={!canStage ? "Image and Nickname are required" : "Download image and stage data"}
                            >
                                Stage Changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tournament History Section */}
                <div className="team-history" style={{ marginTop: '40px' }}>
                    <h3>Tournament History</h3>
                    <div className="stats-grid">
                        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px', justifyContent: 'center' }}>
                                {team.years.map((year: string) => (
                                    <span key={year} className="year-tag" style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: 'rgba(255,255,255,0.1)',
                                        fontSize: '0.9rem'
                                    }}>
                                        {year}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Upload Modal */}
                <ImageUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSave={handleImageQueue}
                />
            </div>
        </div>
    );
}

export default TeamDetail;
