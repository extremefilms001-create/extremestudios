import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Payments() {
  const { userData, currentUser } = useAuth();
  const [contributions, setContributions] = useState([]);
  const [formData, setFormData] = useState({ txId: '', amount: '10000', month: new Date().toLocaleString('default', { month: 'long' }) });
  
  const canVerify = ['CEO', 'SECRETARY', 'FINANCIAL MANAGER', 'ASSISTANT FINANCIAL MANAGER'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadContributions();
  }, []);

  async function loadContributions() {
    const snap = await getDocs(collection(db, 'contributions'));
    setContributions(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'contributions'), {
        adminId: currentUser.uid,
        adminName: `${userData.firstName} ${userData.lastName}`,
        adminRole: userData.role,
        txId: formData.txId,
        amount: formData.amount,
        month: formData.month,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setFormData({ ...formData, txId: '' });
      loadContributions();
    } catch(err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!canVerify) return alert('Unauthorized');
    await updateDoc(doc(db, 'contributions', id), { status });
    loadContributions();
  };

  return (
    <div className="admin-payments">
      <div className="admin-page-header">
        <h1 className="text-gradient">Monthly Contributions</h1>
      </div>

      <div className="admin-card">
        <h3>Submit Your Payment</h3>
        <form onSubmit={handleSubmit} style={{marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
          <input required placeholder="Transaction ID (TxID)" value={formData.txId} onChange={e => setFormData({...formData, txId: e.target.value})} style={{flex: 2}} />
          <input required type="number" placeholder="Amount (e.g. 10000)" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{flex: 1}} />
          <select value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} style={{flex: 1}}>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary" style={{flex: 1}}>Submit</button>
        </form>
      </div>

      <div className="admin-card">
        <h3>Payment Records</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Admin Name</th>
              <th>Month</th>
              <th>Amount</th>
              <th>TxID</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contributions.map(c => (
              <tr key={c.id}>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td>{c.adminName} <br/><span style={{fontSize:'0.75rem', color:'var(--color-white-muted)'}}>{c.adminRole}</span></td>
                <td>{c.month}</td>
                <td>{c.amount} RWF</td>
                <td style={{fontFamily: 'monospace'}}>{c.txId}</td>
                <td><span className={`badge badge-${c.status}`}>{c.status.toUpperCase()}</span></td>
                <td>
                  {canVerify && c.status === 'pending' && (
                    <>
                      <button className="btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginRight: '0.5rem', borderColor: '#00ff00', color: '#00ff00'}} onClick={() => handleUpdateStatus(c.id, 'approved')}>Approve</button>
                      <button className="btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', borderColor: 'var(--color-red)', color: 'var(--color-red)'}} onClick={() => handleUpdateStatus(c.id, 'declined')}>Decline</button>
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

export default Payments;
