import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Layout.css';

/**
 * Layout component that wraps all pages
 * Provides navigation header and consistent page structure
 */
function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    const handleNavigation = (path) => {
        navigate(path);
        closeMenu();
    };

    return (
        <div className="app-container">
            {/* Navigation Header */}
            <header className="app-header">
                <div className="header-content">
                    <Link to="/" className="logo" onClick={closeMenu}>
                        🏀 Mascot Madness
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        className="menu-toggle"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        ☰
                    </button>


                    {/* Desktop & Mobile Navigation */}
                    <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
                        <button onClick={() => handleNavigation('/')}>Home</button>
                        <button onClick={() => handleNavigation('/bracket/pick')}>Pick Winners</button>
                        <button onClick={() => handleNavigation('/bracket/view/full')}>View Bracket</button>
                        <button onClick={() => handleNavigation('/leaderboard')}>Leaderboard</button>
                        <button onClick={() => handleNavigation('/info')}>Info</button>
                        <button onClick={() => handleNavigation('/login')}>Login</button>
                    </nav>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
