import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import ContentModal from '../components/ContentModal';
import CarouselRow from '../components/CarouselRow';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [mostLikedContent, setMostLikedContent] = useState([]);
  const [trendingContent, setTrendingContent] = useState([]);
  const [recentFilms, setRecentFilms] = useState([]);
  const [recentSeries, setRecentSeries] = useState([]);
  const [popularFilms, setPopularFilms] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  
  const [viewingItem, setViewingItem] = useState(null);

  const { currentUser } = useAuth();
  const showAlert = useAlert();

  const [branding, setBranding] = useState({
    heroTitleBold: 'CAPTURE',
    heroTitleNormal: 'REAL MOMENTS',
    heroSubtitle: 'Welcome to Extreme Studios. We are dedicated to bringing your vision to life through high-quality visual storytelling. Let us capture your story, frame by frame.'
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchAllContent() {
      try {
        setLoading(true);
        const filmsRef = collection(db, 'films');
        const qFilms = query(filmsRef, where('published', '==', true));
        const qfSnap = await getDocs(qFilms);
        const allFilms = qfSnap.docs.map(d => ({ id: d.id, _type: 'film', ...d.data() }));
        
        const seriesRef = collection(db, 'series');
        const qSeries = query(seriesRef, where('published', '==', true));
        const qsSnap = await getDocs(qSeries);
        const allSeries = qsSnap.docs.map(d => ({ id: d.id, _type: 'series', ...d.data() }));

        // 1. Most liked movies (Combines Films and Series)
        const combinedLiked = [...allFilms, ...allSeries].sort((a,b) => (b.likes || 0) - (a.likes || 0));
        setMostLikedContent(combinedLiked.slice(0, 4));

        // 2. Trending Movies (Combines Films and Series, sorted by views)
        const combinedTrending = [...allFilms, ...allSeries].sort((a,b) => (b.views || 0) - (a.views || 0));
        setTrendingContent(combinedTrending.slice(0, 4));

        // 3. Recent Films (Feature and Short Films)
        const dateSortedFilms = [...allFilms].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRecentFilms(dateSortedFilms.slice(0, 4));

        // 4. Recent Shows (Series and Short Series)
        const dateSortedSeries = [...allSeries].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRecentSeries(dateSortedSeries.slice(0, 4));

        // 5. Most Popular Film (Films with most views)
        const viewsSortedFilms = [...allFilms].sort((a,b) => (b.views || 0) - (a.views || 0));
        setPopularFilms(viewsSortedFilms.slice(0, 4));

        // 6. Most Popular Shows (Shows with most views)
        const viewsSortedSeries = [...allSeries].sort((a,b) => (b.views || 0) - (a.views || 0));
        setPopularSeries(viewsSortedSeries.slice(0, 4));

        // Branding
        const brandingRef = doc(db, 'site_settings', 'branding');
        const bSnap = await getDoc(brandingRef);
        if (bSnap.exists() && bSnap.data().heroTitleBold) {
            setBranding(prev => ({...prev, ...bSnap.data()}));
        }

      } catch (e) {
        console.error('Error fetching content', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAllContent();
  }, []);

  const handleSelect = (item, type) => {
    if (!currentUser && !item.isFree) {
      showAlert("Please log in or sign up first to access premium content.", "error");
      return;
    }
    setViewingItem({ data: item, type });
  };

  const handleUpdateItem = (updatedItem) => {
      // Opting not to heavily re-sort lists dynamically when scrolling on home page to save re-renders.
      if (viewingItem?.data?.id === updatedItem.id) {
          setViewingItem({ ...viewingItem, data: updatedItem });
      }
  };

  const heroOpacity = Math.max(1 - scrollY / 500, 0);

  return (
    <div className="home-page">
      <section className="hero-section" style={{ opacity: heroOpacity, transform: `translateY(${scrollY * 0.5}px)` }}>
        <div className="hero-content fade-in">
          <h1 className="hero-title">
            <span className="text-gradient">{branding.heroTitleBold}</span> {branding.heroTitleNormal}
          </h1>
          <p className="hero-subtitle">
            {branding.heroSubtitle}
          </p>
          <div className="hero-actions">
            <Link to="/films" className="btn-primary">Explore Films</Link>
            <Link to="/services" className="btn-secondary">Our Services</Link>
          </div>
        </div>
        <div className="hero-overlay"></div>
      </section>

      <div className="content-sections container">
        {loading ? (
             <p className="empty-state" style={{textAlign: 'center', marginTop: '2rem'}}>Loading content...</p>
        ) : (
          <>
            <CarouselRow title="Most Liked Movies" items={mostLikedContent} linkPath="/films" handleSelect={handleSelect} />
            <CarouselRow title="Trending Movies" items={trendingContent} linkPath="/films" handleSelect={handleSelect} />
            <CarouselRow title="Recent Films" items={recentFilms} linkPath="/films" itemTypeOverride="film" handleSelect={handleSelect} />
            <CarouselRow title="Recent Shows" items={recentSeries} linkPath="/series" itemTypeOverride="series" handleSelect={handleSelect} />
            <CarouselRow title="Most Popular Film" items={popularFilms} linkPath="/films" itemTypeOverride="film" handleSelect={handleSelect} />
            <CarouselRow title="Most Popular Shows" items={popularSeries} linkPath="/series" itemTypeOverride="series" handleSelect={handleSelect} />
          </>
        )}
      </div>

      {viewingItem && (
        <ContentModal 
            item={viewingItem.data} 
            type={viewingItem.type} 
            onClose={() => setViewingItem(null)} 
            onUpdateItem={handleUpdateItem} 
        />
      )}
    </div>
  );
}

export default Home;
