import { Link } from 'react-router-dom';
import { FaInstagram, FaTwitter, FaTiktok, FaWhatsapp, FaYoutube, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-col">
          <h3 className="text-gradient">EXTREME STUDIOS</h3>
          <p className="about-text">
            We are a passionate creative team dedicated to bringing your vision to life through high-quality visual storytelling. Whether we are capturing a special event, producing a commercial project, or shooting a creative film, we put our skills and energy into every single frame.
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
        <p>&copy; {new Date().getFullYear()} Extreme Studios. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
