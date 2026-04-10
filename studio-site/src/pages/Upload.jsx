import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Upload() {
  const { userData } = useAuth();
  const showAlert = useAlert();
  const [file, setFile] = useState(null);
  const [motherFolder, setMotherFolder] = useState('PRE-PRODUCTION');
  const [projectFolder, setProjectFolder] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const folders = ['PRE-PRODUCTION', 'PRODUCTION', 'POST-PRODUCTION', 'Reports'];
  
  const canUpload = ['CEO', 'SECRETARY', 'PRESIDENT', 'CREATIVE MANAGER', 'MANAGING DIRECTOR', 'PROJECT MANAGER'].includes(userData?.role?.toUpperCase());

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleClickZone = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!canUpload) return showAlert('Unauthorized to upload files directly.');
    if (!file) return showAlert('Please select a file to upload.');

    setLoading(true);
    setStatus('Uploading... Please wait (this can take a while for large videos).');

    // Prepare Multipart form
    const formData = new FormData();
    formData.append('motherFolder', motherFolder);
    if (projectFolder.trim()) {
      formData.append('projectFolder', projectFolder.trim());
    }
    formData.append('file', file);

    try {
      const response = await fetch('/api/uploadToDrive', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`Success! File uploaded to ${projectFolder ? projectFolder : motherFolder}. Response: ` + JSON.stringify(data));
        setFile(null); // Reset
      } else {
        setStatus(`Upload Failed: ${data.error || 'Unknown error.'} ${data.details ? '- ' + data.details : ''} ${data.rawError ? '(' + data.rawError + ')' : ''}`);
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
        <p style={{color: 'var(--color-white-dim)'}}>Upload files directly to Extreme Studios Drive Folders.</p>
      </div>

      <div className="admin-card">
        <h3>Upload File to Drive</h3>
        {status && <div className="auth-alert" style={{marginBottom: '1rem', borderColor: loading ? 'var(--color-gold)' : status.includes('Success') ? '#00ff00' : 'var(--color-red)'}}>
          {status}
        </div>}
        
        <form onSubmit={handleUpload} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', marginTop: '1.5rem'}}>
          
          <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Select Mother Folder</label>
              <select value={motherFolder} onChange={e => setMotherFolder(e.target.value)}>
                {folders.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Project Folder (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Dark Waters" 
                value={projectFolder} 
                onChange={e => setProjectFolder(e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Drop File Here or Click</label>
            <div 
              className="dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClickZone}
              style={{
                padding: '3rem',
                textAlign: 'center',
                background: isDragging ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: isDragging ? '2px dashed var(--color-gold)' : '2px dashed var(--color-white-dim)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={e => setFile(e.target.files[0])} 
                style={{ display: 'none' }} 
              />
              {file ? (
                <div>
                  <h4 style={{ color: 'var(--color-gold)' }}>Selected Source:</h4>
                  <p>{file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)</p>
                </div>
              ) : (
                <p style={{ color: 'var(--color-white-dim)' }}>Drag & Drop your file here, or click to browse</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{alignSelf: 'flex-start'}}>
            {loading ? 'Uploading...' : 'Upload File securely'}
          </button>
        </form>
      </div>
      
      <div className="admin-card mt-2">
        <h3>Drive Shortcuts</h3>
        <p style={{color: 'var(--color-white-dim)', marginBottom: '1rem'}}>Need to manage the files? Open the mother folders directly:</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="https://drive.google.com/drive/folders/1r05SAKg-5IWO_EhG6XecgkAabM34wx-B" target="_blank" rel="noreferrer" className="btn-secondary">PRE-PRODUCTION</a>
          <a href="https://drive.google.com/drive/folders/1hTEDfi-Pa_8MmW7aXqAzFHU7n2Q-ysSf" target="_blank" rel="noreferrer" className="btn-secondary">PRODUCTION</a>
          <a href="https://drive.google.com/drive/folders/14u-vmJm1koq2el6l9BaNF5ocE3DlMHk3" target="_blank" rel="noreferrer" className="btn-secondary">POST-PRODUCTION</a>
          <a href="https://drive.google.com/drive/folders/12W7zvv7ZfKdUsUBjSCwmDr7vzBBJPHpp" target="_blank" rel="noreferrer" className="btn-secondary">REPORTS</a>
        </div>
      </div>
    </div>
  );
}

export default Upload;
