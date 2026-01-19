import { Outlet, Link } from 'react-router-dom';
import './Layout.css';

function Layout() {
    return (
        <div className="app-container">
            <header className="app-header">
                <div className="header-content">
                    <Link to="/" className="logo">
                        🛠️ Mascot Admin
                    </Link>

                    <nav className="nav-menu">
                        <Link to="/" className="nav-link">Dashboard</Link>
                        <Link to="/info" className="nav-link">Info</Link>
                    </nav>
                </div>
            </header>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
