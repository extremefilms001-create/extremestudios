import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function Transactions() {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  
  const canVerify = ['CEO', 'SECRETARY', 'FINANCIAL MANAGER', 'ASSISTANT FINANCIAL MANAGER'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    const snap = await getDocs(collection(db, 'transactions'));
    setTransactions(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }

  const handleApprove = async (tx) => {
    if (!canVerify) return alert('Unauthorized');
    
    // Update Transaction status
    await updateDoc(doc(db, 'transactions', tx.id), { status: 'approved' });
    
    // Grant access to the user for this content
    await updateDoc(doc(db, 'users', tx.userId), {
      access: arrayUnion(tx.contentId)
    });
    
    loadTransactions();
  };

  const handleTerminate = async (tx) => {
    if (!canVerify) return alert('Unauthorized');
    
    // Update Transaction status
    await updateDoc(doc(db, 'transactions', tx.id), { status: 'declined' });
    
    // Remove access from user if previously approved
    await updateDoc(doc(db, 'users', tx.userId), {
      access: arrayRemove(tx.contentId)
    });
    
    loadTransactions();
  };

  return (
    <div className="admin-transactions">
      <div className="admin-page-header">
        <h1 className="text-gradient">Transactions</h1>
        <p style={{color: 'var(--color-white-dim)'}}>Verify user payments for premium content access.</p>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User Name</th>
              <th>Payee Name</th>
              <th>TxID</th>
              <th>Content</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                <td>{tx.userName}</td>
                <td>{tx.payeeFirstName} {tx.payeeLastName}</td>
                <td style={{fontFamily: 'monospace', color: 'var(--color-gold)'}}>{tx.txId}</td>
                <td>{tx.contentTitle}</td>
                <td>
                  <span className={`badge badge-${tx.status}`}>
                    {tx.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  {canVerify && tx.status === 'pending' && (
                    <>
                      <button className="btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', marginRight: '0.5rem', borderColor: '#00ff00', color: '#00ff00'}} onClick={() => handleApprove(tx)}>Approve</button>
                      <button className="btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', borderColor: 'var(--color-red)', color: 'var(--color-red)'}} onClick={() => handleTerminate(tx)}>Decline/Terminate</button>
                    </>
                  )}
                  {canVerify && tx.status === 'approved' && (
                    <button className="btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', borderColor: 'var(--color-red)', color: 'var(--color-red)'}} onClick={() => handleTerminate(tx)}>Terminate Access</button>
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

export default Transactions;
