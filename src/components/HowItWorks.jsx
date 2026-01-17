/**
 * HowItWorks Component
 * 
 * Reusable component showing the 4 steps of how Mascot Madness works.
 * Used on both the Home page and Info page.
 */

import './HowItWorks.css';

function HowItWorks() {
    return (
        <div className="how-it-works">
            <h2>How It Works</h2>
            <div className="steps-grid">
                <div className="step-card">
                    <span className="step-number">1</span>
                    <h3>Pick Your Winners</h3>
                    <p>Choose which mascot you think would win in each matchup</p>
                </div>
                <div className="step-card">
                    <span className="step-number">2</span>
                    <h3>Complete Your Bracket</h3>
                    <p>Work through all rounds until you crown a champion</p>
                </div>
                <div className="step-card">
                    <span className="step-number">3</span>
                    <h3>Save & Publish</h3>
                    <p>Save your bracket and publish it to compete on the leaderboard</p>
                </div>
                <div className="step-card">
                    <span className="step-number">4</span>
                    <h3>Watch & Compete</h3>
                    <p>Follow the tournament and see how your picks stack up!</p>
                </div>
            </div>
        </div>
    );
}

export default HowItWorks;
