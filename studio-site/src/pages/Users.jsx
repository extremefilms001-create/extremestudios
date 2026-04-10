import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [genderFilter, setGenderFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { userData } = useAuth();
  const showAlert = useAlert();

  const canView = ['CEO', 'SECRETARY', 'PRESIDENT', 'MANAGING DIRECTOR', 'CREATIVE MANAGER'].includes(userData?.role?.toUpperCase());

  useEffect(() => {
    async function fetchUsers() {
      if (!canView) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'users'));
        const usersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by newest first
        usersData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setUsers(usersData);
      } catch (err) {
        console.error(err);
        showAlert('Failed to load users');
      }
      setLoading(false);
    }
    fetchUsers();
  }, [canView]);

  if (!canView) return <div className="admin-page-header"><h2>Unauthorized to view Users.</h2></div>;
  if (loading) return <div className="admin-page-header"><h2>Loading Users...</h2></div>;

  // Filter Logic
  const filteredUsers = users.filter(u => {
    // Gender Filter
    if (genderFilter !== 'All' && u.gender !== genderFilter) return false;
    
    // Time span Filter
    if (startDate || endDate) {
      const uDate = new Date(u.createdAt || 0);
      if (startDate && uDate < new Date(startDate)) return false;
      if (endDate && uDate > new Date(endDate + 'T23:59:59')) return false; // up to end of the day
    }
    
    return true;
  });

  return (
    <div className="admin-users">
      <div className="admin-page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
        <h1 className="text-gradient">Users Management</h1>
        <div className="badge badge-approved" style={{fontSize: '1.2rem', padding: '0.5rem 1rem'}}>
          Total Users: {filteredUsers.length}
        </div>
      </div>

      <div className="admin-card" style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '2rem'}}>
        <div style={{flex: '1', minWidth: '150px'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--color-white-muted)'}}>Gender Filter</label>
          <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} style={{background: 'rgba(255,255,255,0.05)', color: 'white'}}>
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div style={{flex: '1', minWidth: '150px'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--color-white-muted)'}}>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{background: 'rgba(255,255,255,0.05)', color: 'white'}} />
        </div>
        <div style={{flex: '1', minWidth: '150px'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', color: 'var(--color-white-muted)'}}>End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{background: 'rgba(255,255,255,0.05)', color: 'white'}} />
        </div>
        <button className="btn-secondary" onClick={() => {setGenderFilter('All'); setStartDate(''); setEndDate('');}} style={{padding: '0.75rem 1rem'}}>Clear Filters</button>
      </div>

      <div className="admin-card" style={{overflowX: 'auto'}}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Country</th>
              <th>Role</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.gender || 'N/A'}</td>
                <td>{u.residency || 'N/A'}</td>
                <td><span className={u.role === 'user' ? 'badge badge-pending' : 'badge badge-approved'}>{u.role || 'user'}</span></td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem', color: 'var(--color-white-muted)'}}>No users found matching filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;
