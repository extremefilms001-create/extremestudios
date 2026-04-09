import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { FaInstagram, FaTwitter, FaTiktok, FaWhatsapp, FaYoutube, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  const [footerTitle, setFooterTitle] = useState('EXTREME STUDIOS');
  const [footerAbout, setFooterAbout] = useState('We are a passionate creative team dedicated to bringing your vision to life through high-quality visual storytelling. Whether we are capturing a special event, producing a commercial project, or shooting a creative film, we put our skills and energy into every single frame.');
  const [footerRights, setFooterRights] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_settings', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.footerTitle) setFooterTitle(data.footerTitle);
        if (data.footerAbout) setFooterAbout(data.footerAbout);
        if (data.headerTitle) setFooterRights(data.headerTitle);
      }
    });
    return () => unsub();
  }, []);

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-col">
          <h3 className="text-gradient">{footerTitle}</h3>
          <p className="about-text">
            {footerAbout}
          </p>
        </div>
        
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/films">Films</Link></li>
            <li><Link to="/series">Series</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>Services</h4>
          <ul>
            <li><Link to="/services">Photography</Link></li>
            <li><Link to="/services">Video Production</Link></li>
            <li><Link to="/services">Creative Direction</Link></li>
            <li><Link to="/services">Bookings</Link></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>Social Media</h4>
          <div className="social-icons">
            <a href="https://www.instagram.com/extreme.film" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="https://x.com/extremefilm" target="_blank" rel="noreferrer"><FaTwitter /></a>
            <a href="https://www.tiktok.com/@_extreme8" target="_blank" rel="noreferrer"><FaTiktok /></a>
            <a href="https://youtube.com/@extremestudio-i4l" target="_blank" rel="noreferrer"><FaYoutube /></a>
            <a href="https://wa.me/250790920396" target="_blank" rel="noreferrer"><FaWhatsapp /></a>
            <a href="mailto:bookextremestudio@gmail.com" target="_blank" rel="noreferrer"><FaEnvelope /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {footerRights || 'Extreme Studios'}. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
