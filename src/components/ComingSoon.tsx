/**
 * Coming Soon Component
 * 
 * Displayed when bracket data is not yet available for the selected year.
 */

import './ComingSoon.css';

interface ComingSoonProps {
    year: number;
    selectionSundayTime?: Date;
}

/**
 * Format a date for display in the Coming Soon message
 * e.g., "6:00 PM ET on Sunday, March 15th, 2026"
 */
function formatSelectionSundayDate(date: Date | undefined): string | null {
    if (!date) return null;

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York',
        timeZoneName: 'short'
    };

    return date.toLocaleString('en-US', options);
}

function ComingSoon({ year, selectionSundayTime }: ComingSoonProps): React.ReactElement {
    const formattedDate = formatSelectionSundayDate(selectionSundayTime);

    return (
        <div className="coming-soon-container">
            <div className="coming-soon-box">
                <h2>🏀 {year} Bracket Coming Soon</h2>
                <p>
                    The teams for the {year} March Madness tournament have not yet been selected.
                </p>
                <p>
                    The teams participating in the tournament will be announced
                    {formattedDate ? (
                        <strong> on {formattedDate}</strong>
                    ) : (
                        <strong> on Selection Sunday</strong>
                    )}.
                </p>
                <p className="update-note">
                    This website will be updated within 24 hours of that announcement.
                </p>
            </div>
        </div>
    );
}

export default ComingSoon;
