import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';

function Dashboard() {
  const [stats, setStats] = useState({
    films: 0,
    series: 0,
    users: 0,
    transactions: 0
  });

  useEffect(() => {
    async function loadStats() {
      // Very basic counter for dashboard stats
      try {
        const filmsSnap = await getDocs(collection(db, 'films'));
        const seriesSnap = await getDocs(collection(db, 'series'));
        const usersSnap = await getDocs(collection(db, 'users'));
        const transSnap = await getDocs(collection(db, 'transactions'));
        
        setStats({
          films: filmsSnap.size,
          series: seriesSnap.size,
          users: usersSnap.size,
          transactions: transSnap.size
        });
      } catch (e) {
        console.error(e);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1 className="text-gradient">Dashboard</h1>
        <p style={{color: 'var(--color-white-dim)'}}>Overview of Extreme Studios platform.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="admin-card text-center" style={{padding: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', color: 'var(--color-gold)'}}>{stats.films}</h2>
          <p>Total Films</p>
        </div>
        <div className="admin-card text-center" style={{padding: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', color: 'var(--color-red)'}}>{stats.series}</h2>
          <p>Total Series</p>
        </div>
        <div className="admin-card text-center" style={{padding: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', color: 'var(--color-white)'}}>{stats.users}</h2>
          <p>Registered Users</p>
        </div>
        <div className="admin-card text-center" style={{padding: '2rem'}}>
          <h2 style={{fontSize: '2.5rem', color: '#00ff00'}}>{stats.transactions}</h2>
          <p>Transactions</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
