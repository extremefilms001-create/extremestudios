import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Upload() {
  const { userData } = useAuth();
  const [file, setFile] = useState(null);
  const [motherFolder, setMotherFolder] = useState('PRE-PRODUCTION');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const folders = ['PRE-PRODUCTION', 'PRODUCTION', 'POST-PRODUCTION', 'Reports'];
  
  const canUpload = ['CEO', 'SECRETARY', 'PRESIDENT', 'CREATIVE MANAGER', 'MANAGING DIRECTOR', 'PROJECT MANAGER'].includes(userData?.role?.toUpperCase());

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!canUpload) return alert('Unauthorized to upload files directly.');
    if (!file) return alert('Please select a file to upload.');

    setLoading(true);
    setStatus('Uploading... Please wait (this can take a while for large videos).');

    // Prepare Multipart form
    const formData = new FormData();
    formData.append('motherFolder', motherFolder);
    formData.append('file', file);

    try {
      const response = await fetch('/api/uploadToDrive', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`Success! File uploaded to ${motherFolder}. Response: ` + JSON.stringify(data));
        setFile(null); // Reset
      } else {
        setStatus(`Upload Failed: ${data.error || 'Unknown error. Check console and secrets.'}`);
      }
    } catch (err) {
      console.error(err);
      setStatus(`Network or Server Error: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="admin-upload">
      <div className="admin-page-header">
        <h1 className="text-gradient">Secure Drive Uploader</h1>
        <p style={{color: 'var(--color-white-dim)'}}>Upload files directly to Extreme Studios Drive Mother Folders.</p>
      </div>

      <div className="admin-card">
        <h3>Upload File to Drive</h3>
        {status && <div className="auth-alert" style={{marginBottom: '1rem', borderColor: loading ? 'var(--color-gold)' : status.includes('Success') ? '#00ff00' : 'var(--color-red)'}}>
          {status}
        </div>}
        
        <form onSubmit={handleUpload} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', marginTop: '1.5rem'}}>
          <div className="form-group">
            <label>Select Mother Folder Destination</label>
            <select value={motherFolder} onChange={e => setMotherFolder(e.target.value)}>
              {folders.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Choose File (Video, Image, PDF, etc.)</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} style={{padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--color-white-dim)'}} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{alignSelf: 'flex-start'}}>
            {loading ? 'Uploading...' : 'Upload File securely'}
          </button>
        </form>
      </div>
      
      <div className="admin-card mt-2">
        <h3>Drive Shortcuts</h3>
        <p style={{color: 'var(--color-white-dim)', marginBottom: '1rem'}}>Need to manage the files? Open the folders directly:</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="https://drive.google.com/drive/u/1/folders/1hTEDfi-Pa_8MmW7aXqAzFHU7n2Q-ysSf" target="_blank" rel="noreferrer" className="btn-secondary">PRE-PRODUCTION</a>
          <a href="https://drive.google.com/drive/u/1/folders/14u-vmJm1koq2el6l9BaNF5ocE3DlMHk3" target="_blank" rel="noreferrer" className="btn-secondary">PRODUCTION</a>
          <a href="https://drive.google.com/drive/u/1/folders/1r05SAKg-5IWO_EhG6XecgkAabM34wx-B" target="_blank" rel="noreferrer" className="btn-secondary">POST-PRODUCTION</a>
        </div>
      </div>
    </div>
  );
}

export default Upload;
