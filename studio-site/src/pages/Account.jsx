import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAlert } from '../contexts/AlertContext';
import './Auth.css';

function Account() {
  const { currentUser, userData } = useAuth();
  const showAlert = useAlert();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: ''
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        birthday: userData.birthday || ''
      });
    }
  }, [userData]);

  const showSuccess = () => {
    setSaveStatus('Profile updated successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    setSaveStatus('Saving...');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), formData);
      showSuccess();
    } catch (error) {
      console.error(error);
      showAlert("Failed to update profile", "error");
      setSaveStatus('');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="text-gradient">My Account</h1>
      </div>

      {saveStatus && <div className="auth-alert" style={{borderColor: '#00ff00', color: '#00ff00', background: 'rgba(0,255,0,0.1)'}}>{saveStatus}</div>}

      <div className="admin-card" style={{maxWidth: '600px'}}>
         <h3>Personal Information</h3>
         <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={currentUser.email} 
              disabled 
              style={{opacity: 0.7, cursor: 'not-allowed', width: '100%'}}
            />
          </div>
          <div className="form-group">
            <label>First Name</label>
            <input 
              type="text" 
              value={formData.firstName} 
              onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
              required
              style={{width: '100%'}}
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              type="text" 
              value={formData.lastName} 
              onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
              required
              style={{width: '100%'}}
            />
          </div>
          <div className="form-group">
            <label>Birthday</label>
            <input 
              type="date" 
              value={formData.birthday} 
              onChange={(e) => setFormData({...formData, birthday: e.target.value})} 
              style={{width: '100%'}}
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading} style={{alignSelf: 'flex-start'}}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Account;
