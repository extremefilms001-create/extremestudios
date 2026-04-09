import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAlert } from '../contexts/AlertContext';
import ContentModal from '../components/ContentModal';
import './Content.css';

function Series() {
  const [series, setSeries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState(null);
  const showAlert = useAlert();
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchSeries() {
      const q = query(collection(db, 'series'), where('published', '==', true));
      const snap = await getDocs(q);
      setSeries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchSeries();
  }, []);

  const filteredSeries = series.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelect = (s) => {
    if (!currentUser && !s.isFree) {
      showAlert("Please log in or sign up first to access premium content.", "error");
      return;
    }
    setSelectedSeries(s);
  };

  const handleUpdateItem = (updatedItem) => {
      setSeries(prev => prev.map(s => s.id === updatedItem.id ? updatedItem : s));
      if (selectedSeries?.id === updatedItem.id) {
          setSelectedSeries(updatedItem);
      }
  };

  return (
    <div className="content-page pt-offset">
      <div className="container">
        <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
          <h1 className="text-gradient">Series</h1>
          <input 
              type="text" 
              placeholder="Search series..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem 1rem'}} 
          />
        </div>

        <div className="grid-feed">
          {filteredSeries.length > 0 ? filteredSeries.map(s => (
            <div key={s.id} className="feed-card" onClick={() => handleSelect(s)}>
              <div className="card-image" style={{ backgroundImage: `url(${s.thumbnail})` }}>
                {s.type === 'Upcoming' && <div className="upcoming-tag">Upcoming</div>}
              </div>
              <div className="card-info">
                <h3>{s.title}</h3>
                <span className="tag">Ep: {s.episodes?.length || 0}</span>
                {s.isFree ? <span className="price-tag free">Free</span> : <span className="price-tag premium">Premium</span>}
              </div>
            </div>
          )) : <p className="empty-state">No series available.</p>}
        </div>
      </div>

      {selectedSeries && (
        <ContentModal 
            item={selectedSeries} 
            type="series" 
            onClose={() => setSelectedSeries(null)} 
            onUpdateItem={handleUpdateItem} 
        />
      )}
    </div>
  );
}

export default Series;
