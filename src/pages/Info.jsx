/**
 * Info Page
 * 
 * Contains information about the site, how it works, and how scoring works.
 */

import { Link } from 'react-router-dom';
import HowItWorks from '../components/HowItWorks';
import './Info.css';

function Info() {
    return (
        <div className="info-container">
            <h1>🏀 About Mascot Madness</h1>

            <p className="intro-text">
                Welcome to <strong>Mascot Madness</strong>! Fill out your March Madness
                bracket based on which mascot you like better — not basketball performance!
            </p>

            {/* How It Works Section */}
            <HowItWorks />

            {/* How Scoring Works Section */}
            <div className="info-section">
                <h2>📊 How Scoring Works</h2>
                <p className="scoring-intro">
                    Points are awarded for each correct pick based on the round.
                    The further into the tournament, the more each pick is worth!
                </p>
                <div className="scoring-table-wrapper">
                    <table className="scoring-table">
                        <thead>
                            <tr>
                                <th>Round</th>
                                <th>Games</th>
                                <th>Points per Pick</th>
                                <th>Max Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Round of 64</td>
                                <td>32 games</td>
                                <td>10 pts</td>
                                <td>320 pts</td>
                            </tr>
                            <tr>
                                <td>Round of 32</td>
                                <td>16 games</td>
                                <td>20 pts</td>
                                <td>320 pts</td>
                            </tr>
                            <tr>
                                <td>Sweet 16</td>
                                <td>8 games</td>
                                <td>40 pts</td>
                                <td>320 pts</td>
                            </tr>
                            <tr>
                                <td>Elite 8</td>
                                <td>4 games</td>
                                <td>80 pts</td>
                                <td>320 pts</td>
                            </tr>
                            <tr>
                                <td>Final Four</td>
                                <td>2 games</td>
                                <td>160 pts</td>
                                <td>320 pts</td>
                            </tr>
                            <tr className="championship-row">
                                <td>Championship</td>
                                <td>1 game</td>
                                <td>320 pts</td>
                                <td>320 pts</td>
                            </tr>
                            <tr className="total-row">
                                <td><strong>Total</strong></td>
                                <td><strong>63 games</strong></td>
                                <td>—</td>
                                <td><strong>1,920 pts</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* How It Started Section */}
            <div className="info-section">
                <h2>📖 How It Started</h2>
                <p>
                    The origin of this project started when I was in high school and wanted to get my sister
                    to create a March Madness bracket. To convince her, we decided to create a shared bracket
                    where we picked which mascot we liked the best.
                </p>
                <p>
                    After a few years of moving Google Images windows around as we manually filled out a bracket,
                    I decided to create some utilities to make this process easier. For the first couple of years,
                    it was something that could only run on my laptop and was quite clunky to set up.
                </p>
                <p>
                    After requests from other friends and family to get access to the tool, I decided to port it
                    into a website. This website represents the latest iteration of that tool.
                </p>
            </div>

            {/* Contact Section */}
            <div className="info-section">
                <h2>📬 Contact</h2>
                <p>
                    Created by <strong>Justin Essert</strong>. Have feedback or questions?
                    Reach out at <a href="mailto:justinkessert@gmail.com">justinkessert@gmail.com</a>.
                </p>
            </div>

            {/* Call to Action */}
            <div className="cta-section">
                <Link to="/bracket/pick" className="primary-button">
                    Start Picking! 🏆
                </Link>
            </div>
        </div>
    );
}

export default Info;
