import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Announcements() {
  const { userData } = useAuth();
  const showAlert = useAlert();
  const [announcements, setAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', content: '' });
  
  const canPost = ['CEO', 'SECRETARY', 'PRESIDENT', 'MANAGING DIRECTOR'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    const snap = await getDocs(collection(db, 'announcements'));
    // Sort by createdAt descending
    const items = snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    setAnnouncements(items);
  }

  const filteredAnnouncements = announcements.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePost = async (e) => {
    e.preventDefault();
    if (!canPost) return showAlert('Unauthorized');
    
    await addDoc(collection(db, 'announcements'), {
      title: formData.title,
      content: formData.content,
      author: `${userData.firstName} ${userData.lastName}`,
      role: userData.role,
      createdAt: new Date().toISOString()
    });
    setFormData({ title: '', content: '' });
    loadAnnouncements();
  };

  const handleDelete = async (id) => {
    if (!canPost) return;
    await deleteDoc(doc(db, 'announcements', id));
    loadAnnouncements();
  };

  return (
    <div className="admin-announcements">
      <div className="admin-page-header" style={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'}}>
        <h1 className="text-gradient">Board Announcements</h1>
        <input 
            type="text" 
            placeholder="Search announcements..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            style={{background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem 1rem'}} 
        />
      </div>

      {canPost && (
        <div className="admin-card">
          <h3>Post Announcement</h3>
          <form onSubmit={handlePost} style={{marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            <input required placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <textarea required rows="4" placeholder="Announcement Details..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} style={{whiteSpace: 'pre-wrap'}} />
            <button type="submit" className="btn-primary" style={{alignSelf: 'flex-start'}}>Post</button>
          </form>
        </div>
      )}

      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        {filteredAnnouncements.map(ann => (
          <div key={ann.id} className="admin-card" style={{position: 'relative'}}>
            {canPost && <button className="close-btn" style={{position: 'absolute', top: '10px', right: '10px'}} onClick={() => handleDelete(ann.id)}>&times;</button>}
            <h3 style={{color: 'var(--color-gold)', marginBottom: '0.5rem'}}>{ann.title}</h3>
            <p style={{fontSize: '0.8rem', color: 'var(--color-white-muted)', marginBottom: '1rem'}}>Posted by {ann.author} ({ann.role}) on {new Date(ann.createdAt).toLocaleString()}</p>
            <p style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>{ann.content}</p>
          </div>
        ))}
        {announcements.length === 0 && <p style={{color: 'var(--color-white-muted)'}}>No announcements yet.</p>}
      </div>
    </div>
  );
}

export default Announcements;
