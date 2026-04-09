import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useAlert } from '../contexts/AlertContext';
import './Content.css';

function Series() {
  const [series, setSeries] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const showAlert = useAlert();
  
  // Payment Form State
  const [txId, setTxId] = useState('');
  const [payFirst, setPayFirst] = useState('');
  const [payLast, setPayLast] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [channel, setChannel] = useState('MTN MoMo');
  const [amount, setAmount] = useState('');
  const [paymentMsg, setPaymentMsg] = useState('');
  
  const { currentUser, userData } = useAuth();

  // Helper to convert raw links into iframe-friendly embed links
  const getEmbedUrl = (url) => {
    if (!url) return '';
    try {
      if (url.includes('youtube.com/watch')) {
        const v = new URL(url).searchParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}` : url;
      }
      if (url.includes('youtu.be/')) {
        const v = url.split('youtu.be/')[1]?.split('?')[0];
        return v ? `https://www.youtube.com/embed/${v}` : url;
      }
      if (url.includes('drive.google.com') && url.includes('/view')) {
        return url.split('/view')[0] + '/preview';
      }
      if (url.includes('mega.nz/file/')) {
        return url.replace('/file/', '/embed/');
      }
    } catch(e) {}
    return url; // fallback to raw string
  };

  useEffect(() => {
    async function fetchSeries() {
      const q = query(collection(db, 'series'), where('published', '==', true));
      const snap = await getDocs(q);
      setSeries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchSeries();
  }, []);

  // View Counter Timer
  useEffect(() => {
    let timer;
    if (selectedSeries) {
       const hasAccess = selectedSeries.isFree || (userData?.access && userData.access.includes(selectedSeries.id)) || (userData?.role && userData.role !== 'user');
       if (hasAccess && selectedSeries.type !== 'Upcoming' && activeEpisode) {
           timer = setTimeout(async () => {
               try {
                 await updateDoc(doc(db, 'series', selectedSeries.id), {
                    views: increment(1)
                 });
               } catch (e) {
                 console.error("View tracking error:", e);
               }
           }, 10000); // 10 seconds
       }
    }
    return () => clearTimeout(timer);
  }, [selectedSeries, activeEpisode, userData]);

  const handleSelect = (s) => {
    if (!currentUser && !s.isFree) {
      showAlert("Please log in or sign up first to access premium content.", "error");
      return;
    }
    setSelectedSeries(s);
    if (s.episodes && s.episodes.length > 0) {
      setActiveEpisode(s.episodes[0]);
    }
    setPaymentMsg('');
  };

  const handleClose = () => {
    setSelectedSeries(null); setActiveEpisode(null);
  };

  const handleInteraction = async (type) => {
    if (!currentUser) return showAlert("Please log in to react to series.", "error");

    const ref = doc(db, 'series', selectedSeries.id);
    const hasLiked = selectedSeries.likedBy?.includes(currentUser.uid);
    const hasDisliked = selectedSeries.dislikedBy?.includes(currentUser.uid);
    
    try {
        if (type === 'like') {
            if (hasLiked) return;
            let updates = { likes: increment(1), likedBy: arrayUnion(currentUser.uid) };
            if (hasDisliked) {
                updates.dislikes = increment(-1);
                updates.dislikedBy = arrayRemove(currentUser.uid);
            }
            await updateDoc(ref, updates);
            setSelectedSeries({...selectedSeries, 
                likedBy: [...(selectedSeries.likedBy||[]), currentUser.uid], 
                dislikedBy: (selectedSeries.dislikedBy||[]).filter(id=>id!==currentUser.uid), 
                likes: (selectedSeries.likes||0)+1, 
                dislikes: hasDisliked ? ((selectedSeries.dislikes||1)-1) : (selectedSeries.dislikes||0) 
            });
        } else {
            if (hasDisliked) return;
            let updates = { dislikes: increment(1), dislikedBy: arrayUnion(currentUser.uid) };
            if (hasLiked) {
                updates.likes = increment(-1);
                updates.likedBy = arrayRemove(currentUser.uid);
            }
            await updateDoc(ref, updates);
            setSelectedSeries({...selectedSeries, 
                dislikedBy: [...(selectedSeries.dislikedBy||[]), currentUser.uid], 
                likedBy: (selectedSeries.likedBy||[]).filter(id=>id!==currentUser.uid), 
                dislikes: (selectedSeries.dislikes||0)+1, 
                likes: hasLiked ? ((selectedSeries.likes||1)-1) : (selectedSeries.likes||0) 
            });
        }
    } catch(err) {
        console.error(err);
        showAlert("Failed to record your reaction.", "error");
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    
    const cleanTxId = txId.trim();
    if (!/^\d+$/.test(cleanTxId)) {
      setPaymentMsg('TxID must contain strictly numbers.');
      return;
    }
    if (cleanTxId.length < 11) {
      setPaymentMsg('TxID must be at least 11 digits long.');
      return;
    }

    try {
      const q = query(collection(db, 'transactions'), where('txId', '==', cleanTxId));
      const existingSnaps = await getDocs(q);
      const isUsed = existingSnaps.docs.some(d => d.data().status !== 'declined');
      
      if (isUsed) {
        setPaymentMsg('This TxID is already in use or pending! Cannot be reused.');
        return;
      }

      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        userName: `${payFirst} ${payLast}`,
        userEmail: payEmail,
        channel,
        amount: Number(amount) || 0,
        txId: cleanTxId,
        contentId: selectedSeries.id,
        contentTitle: selectedSeries.title,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'users', currentUser.uid), {
        access: arrayUnion(selectedSeries.id)
      });
      setPaymentMsg('Transaction recorded successfully! Unlocking content...');
      setTxId(''); setPayFirst(''); setPayLast(''); setPayEmail(''); setAmount('');
    } catch (err) {
      console.error(err);
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
            
            {selectedSeries.type === 'Upcoming' ? (
              <div className="upcoming-view flex-center">
                <h2>{selectedSeries.title}</h2>
                <p>Releasing soon! Stay tuned.</p>
                <div className="countdown">[Countdown Placeholder]</div>
              </div>
            ) : 
            (selectedSeries.isFree || (userData?.access && userData.access.includes(selectedSeries.id)) || (userData?.role && userData.role !== 'user')) ? (
              <div className="series-player-layout">
                <div className="series-video-area">
                  {activeEpisode ? (
                    <>
                      <iframe 
                        src={getEmbedUrl(activeEpisode.videoUrl)} 
                        title={activeEpisode.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                      <div className="video-info">
                        <h2>{activeEpisode.title}</h2>
                        <p>{activeEpisode.description}</p>
                        <div className="interactions" style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
                          <button className="btn-secondary" onClick={() => handleInteraction('like')} style={{color: selectedSeries.likedBy?.includes(currentUser?.uid) ? '#00ff00' : 'var(--color-white)', borderColor: selectedSeries.likedBy?.includes(currentUser?.uid) ? '#00ff00' : 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg> 
                             {(selectedSeries.likes || 0)}
                          </button>
                          <button className="btn-secondary" onClick={() => handleInteraction('dislike')} style={{color: selectedSeries.dislikedBy?.includes(currentUser?.uid) ? 'var(--color-red)' : 'var(--color-white)', borderColor: selectedSeries.dislikedBy?.includes(currentUser?.uid) ? 'var(--color-red)' : 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg> 
                             {(selectedSeries.dislikes || 0)}
                          </button>
                        </div>
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
            (
              <div className="payment-view">
                <h2 className="text-gradient">Unlock Content</h2>
                <div style={{marginBottom: '1rem', marginTop: '0.5rem'}}>
                   <span className="price-tag premium" style={{fontSize: '1.2rem', padding: '0.4rem 1rem'}}>{selectedSeries.price ? `Price: ${selectedSeries.price} RWF` : 'Premium Content'}</span>
                </div>
                <p>"{selectedSeries.title}" is a premium series.</p>
                <p className="payment-instructions">Please send the money to the studio's numbers via MoMo, and enter the transaction details below to get access.</p>
                
                {paymentMsg && <div className="auth-alert">{paymentMsg}</div>}
                
                <form onSubmit={submitPayment} className="auth-form mt-2">
                  <div className="form-group">
                    <label>TxID (Transaction ID)</label>
                    <input required value={txId} onChange={e => setTxId(e.target.value)} placeholder="e.g. 11-digit code" />
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>First Name</label>
                      <input required value={payFirst} onChange={e => setPayFirst(e.target.value)} />
                    </div>
                    <div className="form-group half">
                      <label>Last Name</label>
                      <input required value={payLast} onChange={e => setPayLast(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                      <label>Email</label>
                      <input required type="email" value={payEmail} onChange={e => setPayEmail(e.target.value)} />
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Channel</label>
                      <select value={channel} onChange={e => setChannel(e.target.value)} style={{background: 'rgba(255,255,255,0.05)', color: 'white', padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius:'6px'}}>
                        <option value="MTN MoMo">MTN MoMo</option>
                        <option value="Airtel Money">Airtel Money</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash / Other</option>
                      </select>
                    </div>
                    <div className="form-group half">
                      <label>Amount (RWF)</label>
                      <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} />
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
