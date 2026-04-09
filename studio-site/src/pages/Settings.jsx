import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Settings() {
  const { userData } = useAuth();
  
  const canEditBranding = ['CEO', 'SECRETARY'].includes(userData?.role?.toUpperCase());
  const canEditServices = ['HUMAN RESOURCES', 'MANAGING DIRECTOR', 'ASS. MANAGING DIRECTOR', 'SECRETARY'].includes(userData?.role?.toUpperCase());

  const [contacts, setContacts] = useState({ whatsapp: '', email: '' });
  const [branding, setBranding] = useState({ 
    headerTitle: 'EXTREME STUDIOS', 
    footerTitle: 'EXTREME STUDIOS', 
    footerAbout: 'We are a passionate creative team dedicated to bringing your vision to life through high-quality visual storytelling. Whether we are capturing a special event, producing a commercial project, or shooting a creative film, we put our skills and energy into every single frame.' 
  });
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const contactRef = doc(db, 'site_settings', 'contacts');
    const cSnap = await getDoc(contactRef);
    if (cSnap.exists()) setContacts(cSnap.data());

    const brandingRef = doc(db, 'site_settings', 'branding');
    const bSnap = await getDoc(brandingRef);
    if (bSnap.exists()) {
      setBranding((prev) => ({ ...prev, ...bSnap.data() }));
    }
  }

  const showSuccess = () => {
    setSaveStatus('Settings Saved!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleSaveContacts = async (e) => {
    e.preventDefault();
    if (!canEditServices) return alert('Unauthorized');
    
    setSaveStatus('Saving Contacts...');
    await setDoc(doc(db, 'site_settings', 'contacts'), contacts);
    showSuccess();
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    if (!canEditBranding) return alert('Unauthorized');
    
    setSaveStatus('Saving Branding...');
    await setDoc(doc(db, 'site_settings', 'branding'), branding);
    showSuccess();
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
            <h3>Branding, Header & Footer (CEO/SECRETARY)</h3>
            <p style={{color: 'var(--color-white-dim)', marginBottom: '1rem'}}>
              Update the main text used to brand the Public Site.
            </p>

            <form onSubmit={handleSaveBranding} style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px'}}>
              <div className="form-group">
                <label>Header Title Bar (e.g. EXTREME STUDIOS)</label>
                <input 
                  value={branding.headerTitle} 
                  onChange={e => setBranding({...branding, headerTitle: e.target.value})} 
                  placeholder="EXTREME STUDIOS" 
                />
              </div>
              <div className="form-group">
                <label>Footer Brand Title</label>
                <input 
                  value={branding.footerTitle} 
                  onChange={e => setBranding({...branding, footerTitle: e.target.value})} 
                  placeholder="EXTREME STUDIOS" 
                />
              </div>
              <div className="form-group">
                <label>Footer 'About' Description Paragraph</label>
                <textarea 
                  value={branding.footerAbout} 
                  onChange={e => setBranding({...branding, footerAbout: e.target.value})} 
                  rows={5}
                  placeholder="We are a passionate team..." 
                />
              </div>
              <button type="submit" className="btn-primary" style={{alignSelf: 'flex-start'}}>Save Branding</button>
            </form>
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
