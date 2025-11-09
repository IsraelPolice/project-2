import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Layout() {
  const { userProfile, signOut } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/keter-logo.png" alt="Keter" className="logo-image" />
            <h1 className="app-title">מנהלת ידע</h1>
          </div>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              דף הבית
            </NavLink>
            <NavLink to="/knowledge" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              מאגר ידע
            </NavLink>
            <NavLink to="/procedures" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              נהלים
            </NavLink>
            <NavLink to="/scripts" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              תסריטי שיחה
            </NavLink>
            <NavLink to="/simulations" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              סימולציות
            </NavLink>
            <NavLink to="/systems" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              מערכות
            </NavLink>
          </nav>
          <div className="user-section">
            <span className="user-name">{userProfile?.full_name}</span>
            <span className="user-role badge badge-info">{userProfile?.role}</span>
            <button onClick={signOut} className="btn btn-secondary">
              יציאה
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2025 Keter Plastic Ltd. כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  );
}
