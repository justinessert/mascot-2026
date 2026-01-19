import { Link } from 'react-router-dom';

function Info() {
    return (
        <div className="page-container">
            <div className="container" style={{ maxWidth: '1000px' }}>
                <Link to="/" className="back-btn" style={{ display: 'inline-flex', marginBottom: '1rem' }}>← Back to Dashboard</Link>

                <h2>How to Add a Team</h2>
                <p style={{ color: 'var(--secondary-text)', marginTop: '-10px', marginBottom: '2rem' }}>
                    Follow these steps to ensure all team data is correctly formatted for the tournament.
                </p>

                <div className="info-grid">
                    <div className="info-card">
                        <span className="step-number">1</span>
                        <h3>Define in Tournaments</h3>
                        <p>
                            Ensure the team is listed in the <code>tournaments.json</code> file for the current year.
                            This is the source of truth for which teams are competing.
                        </p>
                    </div>

                    <div className="info-card">
                        <span className="step-number">2</span>
                        <h3>Add Nickname</h3>
                        <p>
                            A nickname must be added for the team in <code>nicknames.json</code>.
                            <br />
                            <em>Example: Wisconsin's nickname is the Badgers.</em>
                        </p>
                    </div>

                    <div className="info-card">
                        <span className="step-number">3</span>
                        <h3>Add Mascot Image</h3>
                        <p>
                            An image of the team's mascot must be added.
                            Requirements: <strong>4:3 aspect ratio</strong> and a <strong>minimum height of 400px</strong>.
                        </p>
                    </div>

                    <div className="info-card">
                        <span className="step-number">4</span>
                        <h3>NCAA Name Mapping</h3>
                        <p>
                            Data is pulled from the NCAA website. We automatically replace "_" with "-" and "state" with "st",
                            but some teams require manual mapping in <code>specialNcaaNames.json</code>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Info;
