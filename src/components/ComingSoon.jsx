/**
 * Coming Soon Component
 * 
 * Displayed when bracket data is not yet available for the selected year.
 */

import './ComingSoon.css';

function ComingSoon({ year }) {
    return (
        <div className="coming-soon-container">
            <div className="coming-soon-box">
                <h2>🏀 {year} Bracket Coming Soon</h2>
                <p>
                    The teams for the {year} March Madness tournament have not yet been selected.
                </p>
                <p>
                    The teams participating in the tournament will be announced at
                    <strong> 6:00 PM ET on March 16th, {year}</strong>.
                </p>
                <p className="update-note">
                    This website will be updated within 24 hours of that announcement.
                </p>
            </div>
        </div>
    );
}

export default ComingSoon;
