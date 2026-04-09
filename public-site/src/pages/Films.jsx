import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAlert } from '../contexts/AlertContext';
import './Content.css';

function Films() {
  const [films, setFilms] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selectedFilm, setSelectedFilm] = useState(null);
  const showAlert = useAlert();
  
  // Payment Form State
  const [txId, setTxId] = useState('');
  const [payFirst, setPayFirst] = useState('');
  const [payLast, setPayLast] = useState('');
  const [paymentMsg, setPaymentMsg] = useState('');
  
  const { currentUser, userData } = useAuth();

  useEffect(() => {
    async function fetchFilms() {
      const q = query(collection(db, 'films'), where('published', '==', true));
      const snap = await getDocs(q);
      setFilms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchFilms();
  }, []);

  const filteredFilms = filter === 'All' ? films : films.filter(f => f.type === filter);

  const handleSelect = (film) => {
    if (!currentUser) {
      showAlert("Please log in or sign up first to access this content.", "error");
      return;
    }
    setSelectedFilm(film);
    setPaymentMsg('');
  };

  const handleClose = () => {
    setSelectedFilm(null);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        userName: `${userData?.firstName} ${userData?.lastName}`,
        payeeFirstName: payFirst,
        payeeLastName: payLast,
        txId,
        contentId: selectedFilm.id,
        contentTitle: selectedFilm.title,
        status: 'approved',
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'users', currentUser.uid), {
        access: arrayUnion(selectedFilm.id)
      });
      setPaymentMsg('Payment submitted successfully! Unlocking content...');
      setTxId(''); setPayFirst(''); setPayLast('');
    } catch (err) {
      setPaymentMsg('Failed to submit, try again. ' + err.message);
    }
  };

  return (
    <div className="content-page pt-offset">
      <div className="container">
        <div className="page-header">
          <h1 className="text-gradient">Films</h1>
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

        <div className="grid-feed">
          {filteredFilms.length > 0 ? filteredFilms.map(film => (
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

      {/* Modal / Video Player Layer */}
      {selectedFilm && (
        <div className="modal-overlay">
          <div className={`modal-content glass ${selectedFilm.type !== 'Upcoming' && (selectedFilm.isFree || (userData?.access && userData.access.includes(selectedFilm.id)) || userData?.role !== 'user') ? 'video-modal' : 'payment-modal'}`}>
            <span className="close-btn" onClick={handleClose}>&times;</span>
            
            {/* If Upcoming */}
            {selectedFilm.type === 'Upcoming' ? (
              <div className="upcoming-view flex-center">
                <h2>{selectedFilm.title}</h2>
                <p>Releasing soon! Stay tuned.</p>
                <div className="countdown">[Countdown Placeholder]</div>
              </div>
            ) : 
            /* If Accessible (Free or unlocked) */
            (selectedFilm.isFree || (userData?.access && userData.access.includes(selectedFilm.id)) || (userData?.role && userData.role !== 'user')) ? (
              <div className="video-player">
                <iframe 
                  src={selectedFilm.videoUrl} 
                  title={selectedFilm.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
                <div className="video-info">
                  <h2>{selectedFilm.title}</h2>
                  <p>{selectedFilm.description}</p>
                </div>
              </div>
            ) : 
            /* If Requires Payment */
            (
              <div className="payment-view">
                <h2 className="text-gradient">Unlock Content</h2>
                <p>"{selectedFilm.title}" is a premium film.</p>
                <p className="payment-instructions">Please send the money to the studio's numbers via MoMo, and enter the transaction details below to get access.</p>
                
                {paymentMsg && <div className="auth-alert">{paymentMsg}</div>}
                
                <form onSubmit={submitPayment} className="auth-form mt-2">
                  <div className="form-group">
                    <label>TxID (Transaction ID)</label>
                    <input required value={txId} onChange={e => setTxId(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Payee First Name</label>
                      <input required value={payFirst} onChange={e => setPayFirst(e.target.value)} />
                    </div>
                    <div className="form-group half">
                      <label>Payee Last Name</label>
                      <input required value={payLast} onChange={e => setPayLast(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary auth-submit">Verify Payment</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Films;
