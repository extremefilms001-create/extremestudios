import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Settings() {
  const { userData } = useAuth();
  
  const canEditBranding = ['CEO', 'SECRETARY'].includes(userData?.role?.toUpperCase());
  const canEditServices = ['HUMAN RESOURCES', 'MANAGING DIRECTOR', 'ASS. MANAGING DIRECTOR', 'SECRETARY'].includes(userData?.role?.toUpperCase());

  const [contacts, setContacts] = useState({ whatsapp: '', email: '' });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const contactRef = doc(db, 'site_settings', 'contacts');
    const cSnap = await getDoc(contactRef);
    if (cSnap.exists()) setContacts(cSnap.data());
  }

  const handleSaveContacts = async (e) => {
    e.preventDefault();
    if (!canEditServices) return alert('Unauthorized');
    
    setSaveStatus('Saving...');
    await setDoc(doc(db, 'site_settings', 'contacts'), contacts);
    setSaveStatus('Settings Saved!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="admin-settings">
      <div className="admin-page-header">
        <h1 className="text-gradient">Site Settings</h1>
      </div>

      {saveStatus && <div className="auth-alert" style={{borderColor: '#00ff00', color: '#00ff00', background: 'rgba(0,255,0,0.1)'}}>{saveStatus}</div>}

      <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
        {canEditBranding && (
          <div className="admin-card">
            <h3>Branding & General (Available for CEO/SECRETARY)</h3>
            <p style={{color: 'var(--color-white-dim)', marginTop: '1rem'}}>
              Currently, Branding is hardcoded to "Extreme Studios" per the requirements. 
              In the future, Logo links, Heading, and Footer overrides can be configured here.
            </p>
          </div>
        )}

        {canEditServices && (
          <div className="admin-card">
            <h3>Contact Information & Services</h3>
            <p style={{color: 'var(--color-white-dim)', marginBottom: '1rem'}}>Update the numbers and emails shown on the Public Site Services/Contact pages.</p>
            
            <form onSubmit={handleSaveContacts} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px'}}>
              <div className="form-group">
                <label>WhatsApp Number (With Country Code)</label>
                <input value={contacts.whatsapp} onChange={e => setContacts({...contacts, whatsapp: e.target.value})} placeholder="+250790920396" />
              </div>
              <div className="form-group">
                <label>Booking Email</label>
                <input type="email" value={contacts.email} onChange={e => setContacts({...contacts, email: e.target.value})} placeholder="bookextremestudio@gmail.com" />
              </div>
              <button type="submit" className="btn-primary">Save Contacts</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
