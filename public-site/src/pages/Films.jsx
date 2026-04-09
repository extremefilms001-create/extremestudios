import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
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
    async function fetchFilms() {
      const q = query(collection(db, 'films'), where('published', '==', true));
      const snap = await getDocs(q);
      setFilms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchFilms();
  }, []);

  // View Counter Timer
  useEffect(() => {
    let timer;
    if (selectedFilm) {
       const hasAccess = selectedFilm.isFree || (userData?.access && userData.access.includes(selectedFilm.id)) || (userData?.role && userData.role !== 'user');
       if (hasAccess && selectedFilm.type !== 'Upcoming') {
           timer = setTimeout(async () => {
               try {
                 await updateDoc(doc(db, 'films', selectedFilm.id), {
                    views: increment(1)
                 });
               } catch (e) {
                 console.error("View tracking error:", e);
               }
           }, 10000); // 10 seconds
       }
    }
    return () => clearTimeout(timer);
  }, [selectedFilm, userData]);

  const filteredFilms = filter === 'All' ? films : films.filter(f => f.type === filter);

  const handleSelect = (film) => {
    if (!currentUser && !film.isFree) {
      showAlert("Please log in or sign up first to access premium content.", "error");
      return;
    }
    setSelectedFilm(film);
    setPaymentMsg('');
  };

  const handleClose = () => {
    setSelectedFilm(null);
  };

  const handleInteraction = async (type) => {
    if (!currentUser) return showAlert("Please log in to react to films.", "error");

    const ref = doc(db, 'films', selectedFilm.id);
    const hasLiked = selectedFilm.likedBy?.includes(currentUser.uid);
    const hasDisliked = selectedFilm.dislikedBy?.includes(currentUser.uid);
    
    try {
        if (type === 'like') {
            if (hasLiked) return;
            let updates = { likes: increment(1), likedBy: arrayUnion(currentUser.uid) };
            if (hasDisliked) {
                updates.dislikes = increment(-1);
                updates.dislikedBy = arrayRemove(currentUser.uid);
            }
            await updateDoc(ref, updates);
            setSelectedFilm({...selectedFilm, 
                likedBy: [...(selectedFilm.likedBy||[]), currentUser.uid], 
                dislikedBy: (selectedFilm.dislikedBy||[]).filter(id=>id!==currentUser.uid), 
                likes: (selectedFilm.likes||0)+1, 
                dislikes: hasDisliked ? ((selectedFilm.dislikes||1)-1) : (selectedFilm.dislikes||0) 
            });
        } else {
            if (hasDisliked) return;
            let updates = { dislikes: increment(1), dislikedBy: arrayUnion(currentUser.uid) };
            if (hasLiked) {
                updates.likes = increment(-1);
                updates.likedBy = arrayRemove(currentUser.uid);
            }
            await updateDoc(ref, updates);
            setSelectedFilm({...selectedFilm, 
                dislikedBy: [...(selectedFilm.dislikedBy||[]), currentUser.uid], 
                likedBy: (selectedFilm.likedBy||[]).filter(id=>id!==currentUser.uid), 
                dislikes: (selectedFilm.dislikes||0)+1, 
                likes: hasLiked ? ((selectedFilm.likes||1)-1) : (selectedFilm.likes||0) 
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
        contentId: selectedFilm.id,
        contentTitle: selectedFilm.title,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        access: arrayUnion(selectedFilm.id)
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
            
            {selectedFilm.type === 'Upcoming' ? (
              <div className="upcoming-view flex-center">
                <h2>{selectedFilm.title}</h2>
                <p>Releasing soon! Stay tuned.</p>
                <div className="countdown">[Countdown Placeholder]</div>
              </div>
            ) : 
            (selectedFilm.isFree || (userData?.access && userData.access.includes(selectedFilm.id)) || (userData?.role && userData.role !== 'user')) ? (
              <div className="video-player">
                <iframe 
                  src={getEmbedUrl(selectedFilm.videoUrl)} 
                  title={selectedFilm.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
                <div className="video-info">
                  <h2>{selectedFilm.title}</h2>
                  <p>{selectedFilm.description}</p>
                  
                  <div className="interactions" style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
                    <button className="btn-secondary" onClick={() => handleInteraction('like')} style={{color: selectedFilm.likedBy?.includes(currentUser?.uid) ? '#00ff00' : 'var(--color-white)', borderColor: selectedFilm.likedBy?.includes(currentUser?.uid) ? '#00ff00' : 'var(--color-white-muted)'}}>
                       👍 {(selectedFilm.likes || 0)}
                    </button>
                    <button className="btn-secondary" onClick={() => handleInteraction('dislike')} style={{color: selectedFilm.dislikedBy?.includes(currentUser?.uid) ? 'var(--color-red)' : 'var(--color-white)', borderColor: selectedFilm.dislikedBy?.includes(currentUser?.uid) ? 'var(--color-red)' : 'var(--color-white-muted)'}}>
                       👎 {(selectedFilm.dislikes || 0)}
                    </button>
                  </div>
                </div>
              </div>
            ) : 
            (
              <div className="payment-view">
                <h2 className="text-gradient">Unlock Content</h2>
                <p>"{selectedFilm.title}" is a premium film.</p>
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

export default Films;
