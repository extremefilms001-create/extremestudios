import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAlert } from '../contexts/AlertContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Reuse existing forms CSS

function Account() {
  const { currentUser, userData } = useAuth();
  const showAlert = useAlert();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        birthday: userData.birthday || ''
      });
    }
  }, [currentUser, userData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), formData);
      showAlert("Profile updated successfully!", "success");
    } catch (error) {
      console.error(error);
      showAlert("Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="auth-page pt-offset">
      <div className="auth-container glass fade-in">
        <h2 className="text-gradient">My Account</h2>
        <p className="auth-subtitle">Update your personal information below.</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={currentUser.email} 
              disabled 
              style={{opacity: 0.7, cursor: 'not-allowed'}}
            />
            <small style={{color: 'var(--color-white-dim)', marginTop: '0.2rem'}}>Email addresses cannot be changed.</small>
          </div>
          <div className="form-group">
            <label>First Name</label>
            <input 
              type="text" 
              value={formData.firstName} 
              onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              type="text" 
              value={formData.lastName} 
              onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
              required
            />
          </div>
          <div className="form-group">
            <label>Birthday</label>
            <input 
              type="date" 
              value={formData.birthday} 
              onChange={(e) => setFormData({...formData, birthday: e.target.value})} 
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Account;
