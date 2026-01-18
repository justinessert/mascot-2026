/**
 * Layout Component
 * 
 * This component wraps all pages and provides:
 * - Navigation header
 * - Year selector dropdown
 * - User authentication status display
 * - Consistent page structure
 */

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTournament } from '../hooks/useTournament.jsx';
import './Layout.css';

function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectorOpen, setSelectorOpen] = useState(false);
    const navigate = useNavigate();

    // Get user and logout function from our auth hook
    const { user, logout } = useAuth();

    // Get year/gender selection from our year hook
    const {
        selectedYear,
        setSelectedYear,
        selectedGender,
        setSelectedGender,
        availableYears,
        getDisplayLabel
    } = useTournament();

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    const toggleSelector = () => setSelectorOpen(!selectorOpen);
    const closeSelector = () => setSelectorOpen(false);

    const handleNavigation = (path) => {
        navigate(path);
        closeMenu();
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            closeMenu();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleYearChange = (e) => {
        setSelectedYear(Number(e.target.value));
    };

    const handleGenderChange = (gender) => {
        setSelectedGender(gender);
    };

    // Close selector when clicking outside
    const handleSelectorBlur = (e) => {
        // Only close if the click is outside the selector
        if (!e.currentTarget.contains(e.relatedTarget)) {
            closeSelector();
        }
    };

    return (
        <div className="app-container">
            {/* Navigation Header */}
            <header className="app-header">
                <div className="header-content">
                    <Link to="/" className="logo" onClick={closeMenu}>
                        🏀 Mascot Madness
                    </Link>

                    {/* Year/Gender Selector */}
                    <div
                        className="year-gender-selector"
                        onBlur={handleSelectorBlur}
                        tabIndex={-1}
                    >
                        <button
                            className="selector-toggle"
                            onClick={toggleSelector}
                            aria-label="Select tournament year and gender"
                        >
                            {getDisplayLabel()} ▾
                        </button>

                        {selectorOpen && (
                            <div className="selector-panel">
                                <div className="gender-toggle">
                                    <button
                                        className={`gender-btn ${selectedGender === 'M' ? 'active' : ''}`}
                                        onClick={() => handleGenderChange('M')}
                                    >
                                        Men
                                    </button>
                                    <button
                                        className={`gender-btn ${selectedGender === 'W' ? 'active' : ''}`}
                                        onClick={() => handleGenderChange('W')}
                                    >
                                        Women
                                    </button>
                                </div>
                                <select
                                    value={selectedYear}
                                    onChange={handleYearChange}
                                    aria-label="Select tournament year"
                                    className="year-dropdown"
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

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

                        {/* Conditional rendering based on auth state */}
                        {user ? (
                            // User is logged in - show their name and logout
                            <>
                                <Link to="/profile" className="user-display" onClick={closeMenu}>
                                    👤 {user.displayName || user.email}
                                </Link>
                                <button onClick={handleLogout} className="logout-btn">
                                    Logout
                                </button>
                            </>
                        ) : (
                            // User is not logged in - show login button
                            <button onClick={() => handleNavigation('/login')}>Login</button>
                        )}
                    </nav>
                </div>
            </header>

            {/* Main Content Area - child routes render here */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
