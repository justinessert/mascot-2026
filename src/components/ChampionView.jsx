/**
 * ChampionView Component
 * 
 * Displays the champion selection view after a user completes their bracket.
 * Shows the champion, bracket naming form, and save/publish buttons.
 */

import { formatTeamName, getMascotName } from '../constants/nicknames';

function ChampionView({
    champion,
    bracketName,
    setBracketName,
    isPastCutoff,
    saved,
    published,
    isModified,
    user,
    hasOtherGenderBracket,
    selectedGender,
    onEditPicks,
    onViewBracket,
    onLogin,
    onSignup,
    onSave,
    onPublish,
    onCreateOtherGender,
    setSaved,
    setIsModified
}) {
    return (
        <div className="winner-selection-container">
            <div className="champion-display">
                <h2>🏆 Your Champion</h2>

                {/* Cutoff warning banner */}
                {isPastCutoff && (
                    <div className="cutoff-warning-banner">
                        ⚠️ The tournament has started. Brackets are now locked and cannot be saved or published.
                    </div>
                )}

                <p>You have picked <strong>{formatTeamName(champion.name)}</strong> to win the tournament!</p>
                <p className="mascot-name">{getMascotName(champion.name)}</p>

                {champion.image && (
                    <img src={champion.image} alt={champion.name} className="champion-image" />
                )}

                <div className="bracket-form">
                    <div className="form-group">
                        <label htmlFor="bracketName">Bracket Name:</label>
                        <input
                            type="text"
                            id="bracketName"
                            value={bracketName}
                            onChange={(e) => {
                                setBracketName(e.target.value);
                                setSaved(false);
                                setIsModified(true);
                            }}
                            placeholder="My Bracket 2025"
                        />
                    </div>

                    <div className="button-group">
                        <button
                            onClick={onEditPicks}
                            className="secondary-btn"
                            disabled={isPastCutoff}
                            title={isPastCutoff ? 'Bracket locked - tournament has started' : ''}
                        >
                            {isPastCutoff ? 'Editing Locked 🔒' : 'Edit Picks'}
                        </button>
                        <button
                            onClick={onViewBracket}
                            className="secondary-btn"
                        >
                            View Bracket
                        </button>

                        {!user && (
                            <>
                                <button onClick={onLogin} className="secondary-btn">
                                    Log In
                                </button>
                                <button onClick={onSignup} className="secondary-btn">
                                    Sign Up
                                </button>
                            </>
                        )}

                        {user && (
                            <>
                                <button
                                    onClick={onSave}
                                    disabled={(saved && !isModified) || isPastCutoff}
                                    className="primary-btn"
                                    title={isPastCutoff ? 'Bracket lock - tournament has started' : ''}
                                >
                                    {isPastCutoff ? 'Locked 🔒' : (saved ? (isModified ? 'Update Changes' : 'Saved ✓') : 'Save Bracket')}
                                </button>
                                <button
                                    onClick={onPublish}
                                    disabled={published || isPastCutoff}
                                    className="primary-btn"
                                    title={isPastCutoff ? 'Bracket locked - tournament has started' : ''}
                                >
                                    {isPastCutoff ? 'Locked 🔒' : (published ? 'Published ✓' : 'Publish to Leaderboard')}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Cross-Gender Promotion */}
                    {user && !hasOtherGenderBracket && (
                        <div className="cross-gender-promo">
                            <p>You haven't filled out a {selectedGender === 'M' ? "Women's" : "Men's"} bracket yet!</p>
                            <p>First, save and/or publish your current bracket and then you can create a {selectedGender === 'M' ? "Women's" : "Men's"} bracket.</p>
                            <button
                                onClick={onCreateOtherGender}
                                className="create-bracket-btn"
                                style={{ marginTop: '10px', width: '100%' }}
                            >
                                Create {selectedGender === 'M' ? "Women's" : "Men's"} Bracket
                            </button>
                        </div>
                    )}

                    {!user && (
                        <div className="info-banner">
                            ℹ️ Log in to save and publish your bracket to the leaderboard
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChampionView;
