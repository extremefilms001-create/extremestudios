import { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { FaInstagram, FaTwitter, FaTiktok, FaWhatsapp, FaYoutube, FaEnvelope, FaGlobe } from 'react-icons/fa';
import './Misc.css';

function Contact() {
  const [formData, setFormData] = useState({ name: '', comment: '' });
  const [status, setStatus] = useState('');

  const submitComment = async (e) => {
    e.preventDefault();
    try {
      setStatus('Sending...');
      await addDoc(collection(db, 'comments'), {
        name: formData.name,
        comment: formData.comment,
        createdAt: new Date().toISOString()
      });
      setFormData({ name: '', comment: '' });
      setStatus('Your idea/comment has been sent to Extreme Studios!');
    } catch(err) {
      setStatus('Failed to send comment. Please try again.');
    }
  };

  return (
    <div className="misc-page pt-offset">
      <div className="container view-split">
        <div className="contact-info glass">
          <h1 className="text-gradient page-title">About Extreme Studios</h1>
          <p className="about-desc">
            Welcome to Extreme Studios! We are a passionate creative team dedicated to bringing your vision to life through high-quality visual storytelling.
            Our mission is simple: to capture real moments and create visual stories that connect with people. We believe in doing great work, paying attention to the details, and making sure our clients are thrilled with the final results.
          </p>
          
          <h2 className="mt-2 text-gradient">Connect With Us</h2>
          <div className="big-social-icons">
            <a href="https://www.instagram.com/extreme.film" target="_blank" rel="noreferrer" title="Instagram"><FaInstagram /></a>
            <a href="https://x.com/extremefilm" target="_blank" rel="noreferrer" title="X (Twitter)"><FaTwitter /></a>
            <a href="https://www.tiktok.com/@_extreme8" target="_blank" rel="noreferrer" title="TikTok"><FaTiktok /></a>
            <a href="https://youtube.com/@extremestudio-i4l" target="_blank" rel="noreferrer" title="YouTube"><FaYoutube /></a>
            <a href="https://wa.me/250790920396" target="_blank" rel="noreferrer" title="WhatsApp"><FaWhatsapp /></a>
            <a href="mailto:bookextremestudio@gmail.com" target="_blank" rel="noreferrer" title="Email"><FaEnvelope /></a>
            <a href="https://extremestudios.netlify.app/" target="_blank" rel="noreferrer" title="Official Website"><FaGlobe /></a>
          </div>
        </div>

        <div className="contact-form glass">
          <h2 className="text-gradient page-title">Share an Idea or Comment</h2>
          <p className="about-desc">We'd love to hear from you!</p>
          
          {status && <div className="status-msg">{status}</div>}
          
          <form onSubmit={submitComment}>
            <div className="form-group">
              <label>First & Last Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
            </div>
            
            <div className="form-group">
              <label>Your Idea / Comment</label>
              <textarea 
                required 
                rows="6"
                value={formData.comment} 
                onChange={e => setFormData({...formData, comment: e.target.value})} 
                placeholder="Write your thoughts here..."
                style={{ whiteSpace: "pre-wrap" }}
              ></textarea>
            </div>
            
            <button type="submit" className="btn-primary auth-submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Contact;
