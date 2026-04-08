import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function PendingApproval() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (userData?.approved) {
    navigate('/');
  }

  return (
    <div className="auth-page">
      <div className="auth-box glass">
        <h2 className="text-gradient">Approval Pending</h2>
        <p className="auth-subtitle" style={{marginTop: '1rem'}}>
          Your account has been created successfully, but it requires approval from the CEO, PRESIDENT, or SECRETARY before you can access the dashboard.
        </p>
        <p className="auth-subtitle">Please check back later.</p>
        
        <button className="btn-secondary auth-submit" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}

export default PendingApproval;
