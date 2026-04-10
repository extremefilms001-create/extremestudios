import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Deploy() {
  const { userData } = useAuth();
  const showAlert = useAlert();
  const [items, setItems] = useState([]);
  const [seriesItems, setSeriesItems] = useState([]);
  const [view, setView] = useState('products'); // films, series, products
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', type: 'Feature Film', description: '', thumbnail: '', videoUrl: '', isFree: true, published: true, price: '' });
  
  // Episode state
  const [activeSeries, setActiveSeries] = useState(null);
  const [batchEpisodes, setBatchEpisodes] = useState([{ title: '', description: '', thumbnail: '', videoUrl: '', duration: '' }]);

  const canDeploy = ['CEO', 'SECRETARY', 'PRESIDENT', 'CREATIVE MANAGER', 'MANAGING DIRECTOR'].includes(userData?.role?.toUpperCase());
  const canHide = ['CEO', 'SECRETARY'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadItems();
    setActiveSeries(null); // Reset when switching views
  }, [view]);

  async function loadItems() {
    if (view === 'products') {
      const fSnap = await getDocs(collection(db, 'films'));
      const sSnap = await getDocs(collection(db, 'series'));
      setItems(fSnap.docs.map(d => ({id: d.id, _collection: 'films', ...d.data()})));
      setSeriesItems(sSnap.docs.map(d => ({id: d.id, _collection: 'series', ...d.data()})));
    } else {
      const snap = await getDocs(collection(db, view));
      setItems(snap.docs.map(d => ({id: d.id, ...d.data()})));
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!canDeploy) return showAlert('Unauthorized');
    try {
      const baseData = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        thumbnail: formData.thumbnail,
        isFree: formData.isFree,
        published: formData.published,
        price: formData.isFree ? 0 : Number(formData.price),
        views: 0,
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        createdAt: new Date().toISOString()
      };

      if (view === 'films') {
        baseData.videoUrl = formData.videoUrl;
      } else {
        baseData.episodes = []; // Init empty episodes array for Series
      }

      await addDoc(collection(db, view), baseData);
      setFormData({ title: '', type: view === 'films' ? 'Feature Film' : 'Series', description: '', thumbnail: '', videoUrl: '', isFree: true, published: true, price: '' });
      loadItems();
      showAlert('Content Deployed Successfully!', 'success');
    } catch(err) {
      console.error(err);
      showAlert('Failed to deploy content.');
    }
  };

  const handleAddEpisodeSubmit = async (e) => {
    e.preventDefault();
    if (!canDeploy) return showAlert('Unauthorized');
    try {
      await updateDoc(doc(db, 'series', activeSeries.id), {
        episodes: arrayUnion(...batchEpisodes)
      });
      setBatchEpisodes([{ title: '', description: '', thumbnail: '', videoUrl: '', duration: '' }]);
      setActiveSeries(null);
      loadItems();
      showAlert('Episodes Added Successfully!', 'success');
    } catch(err) {
      console.error(err);
      showAlert('Failed to add episodes.');
    }
  };

  const togglePublish = async (item, collectionName) => {
    if (!canHide) return showAlert('Only CEO and SECRETARY can hide/show content.');
    const targetCollection = collectionName || view;
    await updateDoc(doc(db, targetCollection, item.id), { published: !item.published });
    loadItems();
  };

  const handleDelete = async (id, collectionName) => {
    if (!canHide) return showAlert('Unauthorized');
    const targetCollection = collectionName || view;
    await deleteDoc(doc(db, targetCollection, id));
    loadItems();
  };

  // Render Table function
  const renderTable = (data, title, typeLabel) => {
    const filteredData = data.filter(item => item.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
    <div className="admin-card" style={{marginBottom: '2rem'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem'}}>
        <h3 style={{margin: 0}}>{title}</h3>
        <input 
            type="text" 
            placeholder={`Search ${title.toLowerCase()}...`} 
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
            {typeLabel === 'series' && <th>Episodes</th>}
            <th>Access</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(item => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td><span className="badge">{item.type}</span></td>
              {typeLabel === 'series' && <td><span className="badge badge-pending">{item.episodes?.length || 0}</span></td>}
              <td>{item.isFree ? <span className="badge badge-approved">Free</span> : <span className="badge badge-pending">Premium</span>}</td>
              <td>{item.published ? <span className="badge badge-approved">Public</span> : <span className="badge badge-declined">Hidden</span>}</td>
              <td>
                {typeLabel === 'series' && canDeploy && (
                  <button className="btn-secondary" style={{padding: '0.2rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem', borderColor: 'var(--color-gold)', color: 'var(--color-gold)'}} onClick={() => { setActiveSeries(item); setBatchEpisodes([{ title: '', description: '', thumbnail: '', videoUrl: '', duration: '' }]); }}>
                    + Episode
                  </button>
                )}
                {canHide && (
                  <>
                    <button className="btn-secondary" style={{padding: '0.2rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem'}} onClick={() => togglePublish(item, item._collection)}>
                      {item.published ? 'Hide' : 'Publish'}
                    </button>
                    <button className="btn-secondary" style={{padding: '0.2rem 0.6rem', fontSize: '0.8rem', color: 'var(--color-red)', borderColor: 'var(--color-red)'}} onClick={() => handleDelete(item.id, item._collection)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && (
            <tr><td colSpan="6" style={{textAlign: 'center', padding: '1rem', color: 'var(--color-white-muted)'}}>No content found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
    );
  };

  return (
    <div className="admin-deploy">
      <div className="admin-page-header">
        <h1 className="text-gradient">Deploy Content</h1>
      </div>

      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
        <button className={view === 'films' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('films')}>Manage Films</button>
        <button className={view === 'series' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('series')}>Manage Series</button>
        <button className={view === 'products' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('products')}>Current Products</button>
      </div>

      {(view === 'films' || view === 'series') && canDeploy && (
        <div className="admin-card">
          <h3>Add New {view === 'films' ? 'Film' : 'Series'}</h3>
          <form onSubmit={handleAdd} style={{marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
            <input required placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            
            {view === 'films' ? (
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Feature Film">Feature Film</option>
                <option value="Short Film">Short Film</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            ) : (
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Series">Series</option>
                <option value="Short Serie">Short Serie</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            )}

            <input required placeholder="General Thumbnail Link" value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} />
            
            {view === 'films' && (
              <input required placeholder="Video Link (Drive, YT, etc)" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
            )}

            <textarea required placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{gridColumn: '1 / -1', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px'}} rows="3" />
            
            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
              <label><input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked})}/> Is Free?</label>
              <label><input type="checkbox" checked={formData.published} onChange={e => setFormData({...formData, published: e.target.checked})}/> Initially Published?</label>
            </div>
            
            {!formData.isFree && (
              <input type="number" required placeholder="Price (RWF)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{gridColumn: '1 / -1'}} />
            )}
            
            <button type="submit" className="btn-primary" style={{gridColumn: '1 / -1'}}>Deploy {view === 'films' ? 'Film' : 'Series Shell'}</button>
          </form>
        </div>
      )}

      {/* Dynamic Episode Addition Form ONLY shows if activeSeries is set */}
      {activeSeries && canDeploy && (
        <div className="modal-overlay" style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div className="modal-content glass admin-card" style={{border: '1px solid var(--color-gold)', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem'}}>
            <button type="button" onClick={() => setActiveSeries(null)} style={{background: 'transparent', border: 'none', color: 'white', fontSize: '28px', cursor: 'pointer', position: 'absolute', top: '10px', right: '15px'}}>&times;</button>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={{color: 'var(--color-gold)', margin: 0}}>Adding Episodes to: {activeSeries.title}</h3>
            </div>
            
            <form onSubmit={handleAddEpisodeSubmit}>
              {batchEpisodes.map((epFormData, index) => (
                <div key={index} style={{marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                  <h4 style={{marginBottom: '1rem'}}>
                    Episode {index + 1} 
                    {batchEpisodes.length > 1 && (
                      <button type="button" onClick={() => setBatchEpisodes(batchEpisodes.filter((_, i) => i !== index))} style={{background: 'none', border: 'none', color: 'var(--color-red)', fontSize: '0.9rem', cursor: 'pointer', float: 'right'}}>Remove</button>
                    )}
                  </h4>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                    <input required placeholder="Episode Title" value={epFormData.title} onChange={e => {
                        const newBatch = [...batchEpisodes];
                        newBatch[index].title = e.target.value;
                        setBatchEpisodes(newBatch);
                    }} />
                    <input placeholder="Duration (e.g. 45 min)" value={epFormData.duration} onChange={e => {
                        const newBatch = [...batchEpisodes];
                        newBatch[index].duration = e.target.value;
                        setBatchEpisodes(newBatch);
                    }} />
                    <input required placeholder="Episode Thumbnail Link" value={epFormData.thumbnail} onChange={e => {
                        const newBatch = [...batchEpisodes];
                        newBatch[index].thumbnail = e.target.value;
                        setBatchEpisodes(newBatch);
                    }} />
                    <input required placeholder="Episode Video Link (Drive, YT, etc)" value={epFormData.videoUrl} onChange={e => {
                        const newBatch = [...batchEpisodes];
                        newBatch[index].videoUrl = e.target.value;
                        setBatchEpisodes(newBatch);
                    }} />
                    <textarea placeholder="Episode Description" value={epFormData.description} onChange={e => {
                        const newBatch = [...batchEpisodes];
                        newBatch[index].description = e.target.value;
                        setBatchEpisodes(newBatch);
                    }} style={{gridColumn: '1 / -1', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px'}} rows="2" />
                  </div>
                </div>
              ))}
              
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem'}}>
                  <button type="button" className="btn-secondary" onClick={() => setBatchEpisodes([...batchEpisodes, { title: '', description: '', thumbnail: '', videoUrl: '', duration: '' }])}>+ Add Another Episode</button>
                  <button type="submit" className="btn-primary">Upload All {batchEpisodes.length} Episode(s)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view === 'films' && (
        <>
          {renderTable(items, "Deployed Films", "films")}
        </>
      )}

      {view === 'series' && (
        <>
          {renderTable(seriesItems, "Deployed Series", "series")}
        </>
      )}

      {view === 'products' && (
        <>
          {renderTable(items, "Deployed Films", "films")}
          {renderTable(seriesItems, "Deployed Series", "series")}
        </>
      )}

    </div>
  );
}

export default Deploy;
