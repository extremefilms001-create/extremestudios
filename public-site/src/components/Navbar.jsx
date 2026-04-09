import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { FaUserCircle } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [headerTitle, setHeaderTitle] = useState('EXTREME STUDIOS');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_settings', 'branding'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().headerTitle) {
        setHeaderTitle(docSnap.data().headerTitle);
      }
    });
    return () => unsub();
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  return (
    <nav className="navbar glass">
      <div className="container nav-container">
        <Link to="/" className="nav-brand text-gradient">{headerTitle}</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/films">Films</Link>
          <Link to="/series">Series</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact Us</Link>
        </div>
        <div className="nav-auth">
          {currentUser ? (
            <div className="user-menu">
              <span className="welcome-text">Welcome, {userData?.firstName || 'User'}</span>
              <FaUserCircle className="user-icon" size={24} title="View Profile" />
              <button onClick={handleLogout} className="btn-secondary btn-small">Log Out</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-secondary">Log In</Link>
              <Link to="/signup" className="btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
