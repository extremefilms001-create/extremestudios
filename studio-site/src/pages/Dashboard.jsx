import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Dashboard() {
  const { userData } = useAuth();
  const showAlert = useAlert();
  
  const [stats, setStats] = useState({ films: 0, series: 0, users: 0, transactions: 0 });
  const [content, setContent] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Specific Edit Privileges
  const canEdit = ['CEO', 'SECRETARY', 'PRESIDENT', 'CREATIVE MANAGER'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const filmsSnap = await getDocs(collection(db, 'films'));
      const seriesSnap = await getDocs(collection(db, 'series'));
      const usersSnap = await getDocs(collection(db, 'users'));
      const transSnap = await getDocs(collection(db, 'transactions'));
      
      setStats({
        films: filmsSnap.size,
        series: seriesSnap.size,
        users: usersSnap.size,
        transactions: transSnap.size
      });

      const fData = filmsSnap.docs.map(d => ({id: d.id, _col: 'films', ...d.data()}));
      const sData = seriesSnap.docs.map(d => ({id: d.id, _col: 'series', ...d.data()}));
      setContent([...fData, ...sData]);
    } catch (e) {
      console.error(e);
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return showAlert('Unauthorized to edit content variables.');
    
    try {
      const updatePayload = {
        title: editingItem.title,
        description: editingItem.description,
        thumbnail: editingItem.thumbnail,
      };
      // films have videoUrl on the root doc. Series has episodes.
      if (editingItem.videoUrl !== undefined) {
          updatePayload.videoUrl = editingItem.videoUrl;
      }

      await updateDoc(doc(db, editingItem._col, editingItem.id), updatePayload);
      showAlert('Content data successfully modified!', 'success');
      setEditingItem(null);
      loadData();
    } catch(err) {
      console.error(err);
      showAlert('Failed to apply edits.');
    }
  };

  const upcomingItems = content.filter(c => c.type === 'Upcoming');
  const distributedItems = content.filter(c => c.type !== 'Upcoming');

  const renderContentTable = (data, tableTitle) => {
    const filteredData = data.filter(item => item.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
    <div className="admin-card" style={{marginBottom: '2rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem'}}>
        <h3 style={{margin: 0}}>{tableTitle}</h3>
        <input 
            type="text" 
            placeholder={`Search ${tableTitle.toLowerCase()}...`} 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            style={{background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem 1rem'}} 
        />
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Views</th>
            <th style={{color: '#00ff00'}}>Likes 👍</th>
            <th style={{color: 'var(--color-red)'}}>Dislikes 👎</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(item => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td><span className="badge">{item.type}</span></td>
              <td style={{fontWeight: 'bold', color: 'white'}}>{(item.views || 0).toLocaleString()}</td>
              <td style={{color: '#00ff00'}}>{item.likes || 0}</td>
              <td style={{color: 'var(--color-red)'}}>{item.dislikes || 0}</td>
              <td>
                {canEdit && (
                  <button className="btn-secondary" style={{padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderColor: 'var(--color-gold)', color: 'var(--color-gold)'}} onClick={() => setEditingItem(item)}>
                    Edit Details
                  </button>
                )}
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', color:'var(--color-white-muted)'}}>No content found.</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1 className="text-gradient">Dashboard</h1>
        <p style={{color: 'var(--color-white-dim)'}}>Overview of Extreme Studios platform.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-card text-center" style={{padding: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', color: 'var(--color-gold)'}}>{stats.films}</h2>
          <p>Total Films</p>
        </div>
        <div className="admin-card text-center" style={{padding: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', color: 'var(--color-gold)'}}>{stats.series}</h2>
          <p>Total Series</p>
        </div>
        <div className="admin-card text-center" style={{padding: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', color: 'var(--color-white)'}}>{stats.users}</h2>
          <p>Registered Users</p>
        </div>
        <div className="admin-card text-center" style={{padding: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', color: '#00ff00'}}>{stats.transactions}</h2>
          <p>Transactions</p>
        </div>
      </div>

      {editingItem && (
        <div className="admin-card" style={{border: '1px solid var(--color-gold)', animation: 'slideUpFade 0.3s ease', marginBottom: '2rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{color: 'var(--color-gold)'}}>Editing: {editingItem.title}</h3>
            <button className="btn-secondary" onClick={() => setEditingItem(null)} style={{padding: '0.2rem 0.5rem', fontSize:'0.8rem'}}>Cancel</button>
          </div>
          <form onSubmit={handleEditSubmit} style={{marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem'}}>
            <div style={{display: 'flex', gap: '1rem'}}>
              <input required value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} style={{flex: 1}} placeholder="Title" />
              <input required value={editingItem.thumbnail} onChange={e => setEditingItem({...editingItem, thumbnail: e.target.value})} style={{flex: 1}} placeholder="Thumbnail Link" />
            </div>
            {editingItem.videoUrl !== undefined && (
              <input required value={editingItem.videoUrl} onChange={e => setEditingItem({...editingItem, videoUrl: e.target.value})} placeholder="Video Link" />
            )}
            <textarea required value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} style={{padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px'}} rows="3" placeholder="Description" />
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </div>
      )}

      {renderContentTable(upcomingItems, "Upcoming Content")}
      {renderContentTable(distributedItems, "Distributed Content (Live)")}

    </div>
  );
}

export default Dashboard;
