import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAlert } from '../contexts/AlertContext';
import ContentModal from '../components/ContentModal';
import './Content.css';

function Films() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilm, setSelectedFilm] = useState(null);
  const showAlert = useAlert();
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchFilms() {
      setLoading(true);
      const q = query(collection(db, 'films'), where('published', '==', true));
      const snap = await getDocs(q);
      setFilms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchFilms();
  }, []);

  const filteredFilms = films.filter(f => {
    const matchType = filter === 'All' || f.type === filter;
    const matchSearch = f.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  const handleSelect = (film) => {
    if (!currentUser && !film.isFree) {
      showAlert("Please log in or sign up first to access premium content.", "error");
      return;
    }
    setSelectedFilm(film);
  };

  const handleUpdateItem = (updatedItem) => {
      setFilms(prev => prev.map(f => f.id === updatedItem.id ? updatedItem : f));
      if (selectedFilm?.id === updatedItem.id) {
          setSelectedFilm(updatedItem);
      }
  };

  return (
    <div className="content-page pt-offset">
      <div className="container">
        <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
          <h1 className="text-gradient">Films</h1>
          <div style={{display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center'}}>
            <input 
                type="text" 
                placeholder="Search films..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.4rem 1rem'}} 
            />
            <div className="filters">
              {['All', 'Feature Film', 'Short Film', 'Upcoming'].map(f => (
                <button 
                  key={f} 
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid-feed">
          {loading ? (
             <p className="empty-state">Loading films...</p>
          ) : filteredFilms.length > 0 ? filteredFilms.map(film => (
            <div key={film.id} className="feed-card" onClick={() => handleSelect(film)}>
              <div className="card-image" style={{ backgroundImage: `url(${film.thumbnail})` }}>
                {film.type === 'Upcoming' && <div className="upcoming-tag">Upcoming</div>}
              </div>
              <div className="card-info">
                <h3>{film.title}</h3>
                <span className="tag">{film.type}</span>
                {film.isFree ? <span className="price-tag free">Free</span> : <span className="price-tag premium">Premium</span>}
              </div>
            </div>
          )) : <p className="empty-state">No films available for this category.</p>}
        </div>
      </div>

      {selectedFilm && (
        <ContentModal 
            item={selectedFilm} 
            type="film" 
            onClose={() => setSelectedFilm(null)} 
            onUpdateItem={handleUpdateItem} 
        />
      )}
    </div>
  );
}

export default Films;
