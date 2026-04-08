import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <header className="admin-header glass">
      <div className="admin-user-info">
        <span className="admin-role">{userData?.role?.replace(/_/g, ' ').toUpperCase() || 'ADMIN'}</span>
        <span>{userData?.firstName} {userData?.lastName}</span>
        <button className="btn-secondary" style={{padding: '0.4rem 1rem', fontSize: '0.85rem'}} onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Header;
