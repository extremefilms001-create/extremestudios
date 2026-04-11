import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [headerTitle, setHeaderTitle] = useState('EXTREME STUDIOS');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_settings', 'branding'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().headerTitle) {
        setHeaderTitle(docSnap.data().headerTitle);
      }
    });
    return () => unsub();
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  async function handleLogout() {
    try {
      closeMobileMenu();
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  return (
    <nav className="navbar glass">
      <div className="container nav-container">
        <Link to="/" className="nav-brand text-gradient" onClick={closeMobileMenu}>{headerTitle}</Link>
        
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle navigation">
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        <div className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <Link to="/" onClick={closeMobileMenu}>Home</Link>
            <Link to="/films" onClick={closeMobileMenu}>Films</Link>
            <Link to="/series" onClick={closeMobileMenu}>Series</Link>
            <Link to="/services" onClick={closeMobileMenu}>Services</Link>
            <Link to="/contact" onClick={closeMobileMenu}>Contact Us</Link>
          </div>
          <div className="nav-auth">
            {currentUser ? (
              <div className="user-menu">
                <span className="welcome-text">Welcome, {userData?.firstName || 'User'}</span>
                <Link to="/account" onClick={closeMobileMenu} style={{display: 'flex', alignItems: 'center'}}>
                  <FaUserCircle className="user-icon" size={24} title="View Profile" />
                </Link>
                <button onClick={handleLogout} className="btn-secondary btn-small">Log Out</button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-secondary" onClick={closeMobileMenu}>Log In</Link>
                <Link to="/signup" className="btn-primary" onClick={closeMobileMenu}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
