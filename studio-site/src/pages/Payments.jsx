import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Payments() {
  const { userData, currentUser } = useAuth();
  const showAlert = useAlert();
  const [contributions, setContributions] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({ txId: '', amount: '10000', month: new Date().toLocaleString('default', { month: 'long' }) });
  
  const canVerify = ['CEO', 'SECRETARY', 'FINANCIAL MANAGER', 'ASSISTANT FINANCIAL MANAGER'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadContributions();
    loadAdmins();
  }, []);

  async function loadContributions() {
    const snap = await getDocs(collection(db, 'contributions'));
    setContributions(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }

  async function loadAdmins() {
    const q = query(collection(db, 'users'), where('role', '!=', 'user'));
    const snap = await getDocs(q);
    setAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'contributions'), {
        adminId: currentUser.uid,
        adminName: `${userData.firstName} ${userData.lastName}`,
        adminRole: userData.role,
        txId: formData.txId,
        amount: Number(formData.amount),
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
    if (!canVerify) return showAlert('Unauthorized');
    await updateDoc(doc(db, 'contributions', id), { status });
    loadContributions();
  };

  // Aggregations
  const totalApproved = contributions.filter(c => c.status === 'approved').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalPending = contributions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalDeclined = contributions.filter(c => c.status === 'declined').reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  // Unpaid Admins for selected month
  const currentMonthContributions = contributions.filter(c => c.month === formData.month && c.status === 'approved');
  const unpaidAdmins = admins.filter(admin => !currentMonthContributions.some(c => c.adminId === admin.id));

  return (
    <div className="admin-payments">
      <div className="admin-page-header">
        <h1 className="text-gradient">Monthly Contributions</h1>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem'}}>
        <div style={{background: 'rgba(0, 255, 0, 0.1)', border: '1px solid #00ff00', padding: '1.5rem', borderRadius: '8px'}}>
          <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--color-white-dim)'}}>Total Approved</p>
          <h2 style={{margin: 0, color: '#00ff00'}}>{totalApproved.toLocaleString()} RWF</h2>
        </div>
        <div style={{background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--color-gold)', padding: '1.5rem', borderRadius: '8px'}}>
          <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--color-white-dim)'}}>Total Pending</p>
          <h2 style={{margin: 0, color: 'var(--color-gold)'}}>{totalPending.toLocaleString()} RWF</h2>
        </div>
        <div style={{background: 'rgba(255, 0, 0, 0.1)', border: '1px solid var(--color-red)', padding: '1.5rem', borderRadius: '8px'}}>
          <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--color-white-dim)'}}>Total Declined</p>
          <h2 style={{margin: 0, color: 'var(--color-red)'}}>{totalDeclined.toLocaleString()} RWF</h2>
        </div>
      </div>

      <div style={{display: 'flex', gap: '2rem', alignItems: 'flex-start'}}>
        <div className="admin-card" style={{flex: 2}}>
          <h3>Submit Your Payment</h3>
          <form onSubmit={handleSubmit} style={{marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            <input required placeholder="Transaction ID (TxID)" value={formData.txId} onChange={e => setFormData({...formData, txId: e.target.value})} style={{flex: 2}} />
            <input required type="number" placeholder="Amount (e.g. 10000)" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} style={{flex: 1}} readOnly={!canVerify} />
            <select value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} style={{flex: 1}}>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary" style={{flex: 1}}>Submit</button>
          </form>
          {canVerify && <p style={{fontSize: '0.8rem', color: 'var(--color-gold)', marginTop: '0.5rem'}}>* As a financial verifier, you can adjust the contribution baseline amount.</p>}
        </div>

        <div className="admin-card" style={{flex: 1}}>
          <h3>Unpaid for {formData.month}</h3>
          <ul style={{listStyle: 'none', padding: 0, marginTop: '1rem'}}>
            {unpaidAdmins.map(admin => (
              <li key={admin.id} style={{padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                {admin.firstName} {admin.lastName} <br/>
                <span style={{fontSize: '0.75rem', color: 'var(--color-white-muted)'}}>{admin.role}</span>
              </li>
            ))}
            {unpaidAdmins.length === 0 && <li style={{color: '#00ff00'}}>All admins have paid!</li>}
          </ul>
        </div>
      </div>

      <div className="admin-card" style={{marginTop: '2rem'}}>
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
