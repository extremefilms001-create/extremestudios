import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Deploy() {
  const { userData } = useAuth();
  const showAlert = useAlert();
  const [items, setItems] = useState([]);
  const [view, setView] = useState('films');
  const [formData, setFormData] = useState({ title: '', type: 'Feature Film', description: '', thumbnail: '', videoUrl: '', isFree: true, published: true });
  
  const canDeploy = ['CEO', 'SECRETARY', 'PRESIDENT', 'CREATIVE MANAGER', 'MANAGING DIRECTOR'].includes(userData?.role?.toUpperCase());
  const canHide = ['CEO', 'SECRETARY'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadItems();
  }, [view]);

  async function loadItems() {
    const snap = await getDocs(collection(db, view));
    setItems(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!canDeploy) return showAlert('Unauthorized');
    try {
      await addDoc(collection(db, view), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setFormData({ title: '', type: 'Feature Film', description: '', thumbnail: '', videoUrl: '', isFree: true, published: true });
      loadItems();
    } catch(err) {
      console.error(err);
    }
  };

  const togglePublish = async (item) => {
    if (!canHide) return showAlert('Only CEO and SECRETARY can hide/show content.');
    await updateDoc(doc(db, view, item.id), { published: !item.published });
    loadItems();
  };

  const handleDelete = async (id) => {
    if (!canHide) return showAlert('Unauthorized');
    await deleteDoc(doc(db, view, id));
    loadItems();
  };

  return (
    <div className="admin-deploy">
      <div className="admin-page-header">
        <h1 className="text-gradient">Deploy Content</h1>
      </div>

      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
        <button className={view === 'films' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('films')}>Manage Films</button>
        <button className={view === 'series' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('series')}>Manage Series</button>
      </div>

      {canDeploy && (
        <div className="admin-card">
          <h3>Add New {view === 'films' ? 'Film' : 'Series'}</h3>
          <form onSubmit={handleAdd} style={{marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <input required placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="Feature Film">Feature Film</option>
              <option value="Short Film">Short Film</option>
              <option value="Upcoming">Upcoming</option>
            </select>
            <input required placeholder="Thumbnail Link" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} />
            <input placeholder="Video Link (Drive, YT, etc)" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
            
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
              <label><input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked})}/> Is Free?</label>
              <label><input type="checkbox" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})}/> Initially Published?</label>
            </div>
            <button type="submit" className="btn-primary" style={{gridColumn: '1 / -1'}}>Add Content</button>
          </form>
        </div>
      )}

      <div className="admin-card">
        <h3>Deployed {view}</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Access</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td><span className="badge">{item.type}</span></td>
                <td>{item.isFree ? <span className="badge badge-approved">Free</span> : <span className="badge badge-pending">Premium</span>}</td>
                <td>{item.published ? <span className="badge badge-approved">Public</span> : <span className="badge badge-declined">Hidden</span>}</td>
                <td>
                  {canHide && (
                    <>
                      <button className="btn-secondary" style={{padding: '0.2rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem'}} onClick={() => togglePublish(item)}>
                        {item.published ? 'Hide' : 'Publish'}
                      </button>
                      <button className="btn-secondary" style={{padding: '0.2rem 0.6rem', fontSize: '0.8rem', color: 'var(--color-red)', borderColor: 'var(--color-red)'}} onClick={() => handleDelete(item.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Deploy;
