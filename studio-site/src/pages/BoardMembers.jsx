import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const ROLES = [
  'CEO', 'SECRETARY', 'PRESIDENT', 'MANAGING DIRECTOR', 'ASS. MANAGING DIRECTOR', 
  'PROJECT MANAGER', 'ASS. PROJECT MANAGER', 'CREATIVE MANAGER', 'HUMAN RESOURCES', 
  'ASS. HUMAN RESOURCES', 'SOCIAL PLATFORM MANAGER', 'EXECUTIVE MANAGER', 'user'
];

function BoardMembers() {
  const { userData } = useAuth();
  const [members, setMembers] = useState([]);
  
  const canManage = ['CEO', 'SECRETARY'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    // Only load admins and pending_admins
    const q = query(collection(db, 'users'), where('role', '!=', 'user'));
    const snap = await getDocs(q);
    setMembers(snap.docs.map(d => ({id: d.id, ...d.data()})));
  }

  const handleApprove = async (id) => {
    if (!canManage) return alert('Unauthorized');
    await updateDoc(doc(db, 'users', id), { approved: true });
    loadMembers();
  };

  const handleRoleChange = async (id, newRole) => {
    if (!canManage) return;
    await updateDoc(doc(db, 'users', id), { role: newRole });
    loadMembers();
  };

  return (
    <div className="admin-board">
      <div className="admin-page-header">
        <h1 className="text-gradient">Board Members Management</h1>
        <p style={{color: 'var(--color-white-dim)'}}>Approve administrators and assign roles.</p>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td>{m.firstName} {m.lastName}</td>
                <td>{m.email}</td>
                <td>
                  <span className={`badge ${m.approved ? 'badge-approved' : 'badge-pending'}`}>
                    {m.approved ? 'Approved' : 'Pending'}
                  </span>
                </td>
                <td>
                  {canManage ? (
                    <select 
                      value={m.role} 
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      style={{background: 'var(--color-black)', padding: '0.2rem', color: 'white', border: '1px solid #333'}}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span>{m.role}</span>
                  )}
                </td>
                <td>
                  {canManage && !m.approved && (
                    <button className="btn-secondary" style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem', borderColor: '#00ff00', color: '#00ff00'}} onClick={() => handleApprove(m.id)}>
                      Approve Match
                    </button>
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

export default BoardMembers;
