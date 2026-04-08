import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { db } from '../firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [recentFilms, setRecentFilms] = useState([]);
  const [recentSeries, setRecentSeries] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchRecentContent() {
      try {
        const filmsRef = collection(db, 'films');
        const qFilms = query(filmsRef, where('published', '==', true), limit(4));
        const qfSnap = await getDocs(qFilms);
        setRecentFilms(qfSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const seriesRef = collection(db, 'series');
        const qSeries = query(seriesRef, where('published', '==', true), limit(4));
        const qsSnap = await getDocs(qSeries);
        setRecentSeries(qsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Error fetching content', e);
      }
    }
    fetchRecentContent();
  }, []);

  // Calculate opacity based on scroll. It fades out after 500px of scrolling.
  const heroOpacity = Math.max(1 - scrollY / 500, 0);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" style={{ opacity: heroOpacity, transform: `translateY(${scrollY * 0.5}px)` }}>
        <div className="hero-content fade-in">
          <h1 className="hero-title">
            <span className="text-gradient">CAPTURE</span> REAL MOMENTS
          </h1>
          <p className="hero-subtitle">
            Welcome to Extreme Studios. We are dedicated to bringing your vision to life through high-quality visual storytelling. Let us capture your story, frame by frame.
          </p>
          <div className="hero-actions">
            <Link to="/films" className="btn-primary">Explore Films</Link>
            <Link to="/services" className="btn-secondary">Our Services</Link>
          </div>
        </div>
        <div className="hero-overlay"></div>
      </section>

      {/* Content Sections */}
      <div className="content-sections container">
        <section className="content-row">
          <div className="section-header">
            <h2>Recent Feature Films</h2>
            <Link to="/films?type=Feature Film" className="see-all">See All</Link>
          </div>
          <div className="grid-feed">
            {recentFilms.length > 0 ? recentFilms.map(film => (
              <Link to={`/films/${film.id}`} key={film.id} className="feed-card">
                <div className="card-image" style={{ backgroundImage: `url(${film.thumbnail})` }}></div>
                <div className="card-info">
                  <h3>{film.title}</h3>
                  <span className="tag text-gradient">{film.type}</span>
                </div>
              </Link>
            )) : <p className="empty-state">No feature films yet.</p>}
          </div>
        </section>

        <section className="content-row">
          <div className="section-header">
            <h2>Recent Series</h2>
            <Link to="/series" className="see-all">See All</Link>
          </div>
          <div className="grid-feed">
             {recentSeries.length > 0 ? recentSeries.map(series => (
              <Link to={`/series/${series.id}`} key={series.id} className="feed-card">
                <div className="card-image" style={{ backgroundImage: `url(${series.thumbnail})` }}></div>
                <div className="card-info">
                  <h3>{series.title}</h3>
                </div>
              </Link>
            )) : <p className="empty-state">No series yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
