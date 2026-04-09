import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './Content.css';

function Series() {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  
  // Payment Form State
  const [txId, setTxId] = useState('');
  const [payFirst, setPayFirst] = useState('');
  const [payLast, setPayLast] = useState('');
  const [paymentMsg, setPaymentMsg] = useState('');
  
  const { currentUser, userData } = useAuth();

  useEffect(() => {
    async function fetchSeries() {
      const q = query(collection(db, 'series'), where('published', '==', true));
      const snap = await getDocs(q);
      setSeries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchSeries();
  }, []);

  const handleSelect = (s) => {
    if (!currentUser) {
      alert("Please log in or sign up first to access this content.");
      return;
    }
    setSelectedSeries(s);
    if (s.episodes && s.episodes.length > 0) {
      setActiveEpisode(s.episodes[0]);
    }
    setPaymentMsg('');
  };

  const handleClose = () => {
    setSelectedSeries(null); ActiveEpisode(null);
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
        contentId: selectedSeries.id,
        contentTitle: selectedSeries.title,
        status: 'approved',
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'users', currentUser.uid), {
        access: arrayUnion(selectedSeries.id)
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
          <h1 className="text-gradient">Series</h1>
        </div>

        <div className="grid-feed">
          {series.length > 0 ? series.map(s => (
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

      {/* Modal / Video Player Layer */}
      {selectedSeries && (
        <div className="modal-overlay">
          <div className={`modal-content glass ${selectedSeries.type !== 'Upcoming' && (selectedSeries.isFree || (userData?.access && userData.access.includes(selectedSeries.id)) || userData?.role !== 'user') ? 'video-modal' : 'payment-modal'}`}>
            <span className="close-btn" onClick={handleClose}>&times;</span>
            
            {/* If Upcoming */}
            {selectedSeries.type === 'Upcoming' ? (
              <div className="upcoming-view flex-center">
                <h2>{selectedSeries.title}</h2>
                <p>Releasing soon! Stay tuned.</p>
                <div className="countdown">[Countdown Placeholder]</div>
              </div>
            ) : 
            /* If Accessible (Free or unlocked) */
            (selectedSeries.isFree || (userData?.access && userData.access.includes(selectedSeries.id)) || (userData?.role && userData.role !== 'user')) ? (
              <div className="series-player-layout">
                <div className="series-video-area">
                  {activeEpisode ? (
                    <>
                      <iframe 
                        src={activeEpisode.videoUrl} 
                        title={activeEpisode.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                      <div className="video-info">
                        <h2>{activeEpisode.title}</h2>
                        <p>{activeEpisode.description}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex-center"><p>No episodes uploaded yet.</p></div>
                  )}
                </div>
                <div className="series-episodes-sidebar">
                  <div style={{padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                    <h3>{selectedSeries.title}</h3>
                    <p style={{fontSize: '0.85rem', color: '#a3a3a3'}}>{selectedSeries.episodes?.length || 0} Episodes</p>
                  </div>
                  {selectedSeries.episodes?.map((ep, idx) => (
                    <div 
                      key={idx} 
                      className={`episode-item ${activeEpisode === ep ? 'active' : ''}`}
                      onClick={() => setActiveEpisode(ep)}
                    >
                      <h4>{idx + 1}. {ep.title}</h4>
                      <p style={{fontSize: '0.8rem', color: '#a3a3a3'}}>{ep.duration || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : 
            /* If Requires Payment */
            (
              <div className="payment-view">
                <h2 className="text-gradient">Unlock Content</h2>
                <p>"{selectedSeries.title}" is a premium series.</p>
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

export default Series;
