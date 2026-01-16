/**
 * Layout Component
 * 
 * This component wraps all pages and provides:
 * - Navigation header
 * - User authentication status display
 * - Consistent page structure
 * 
 * KEY CONCEPT: Outlet
 * The <Outlet /> component from React Router renders the matched child route.
 * It's similar to Angular's <router-outlet>.
 */

import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import './Layout.css';

function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Get user and logout function from our auth hook
    const { user, logout } = useAuth();

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

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

                        {/* Conditional rendering based on auth state */}
                        {/* This is the React equivalent of *ngIf */}
                        {user ? (
                            // User is logged in - show their name and logout
                            <>
                                <span className="user-display">
                                    👤 {user.displayName || user.email}
                                </span>
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
