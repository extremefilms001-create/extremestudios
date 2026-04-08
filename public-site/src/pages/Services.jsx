import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Misc.css'; // Shared CSS for Contact/Services

function Services() {
  const [services, setServices] = useState([
    { title: 'Photography', description: 'Capturing high-quality images for events, portraits, and commercial needs.' },
    { title: 'Video Production', description: 'Planning, shooting, and editing engaging videos that tell your story.' },
    { title: 'Creative Direction', description: 'Guiding the visual style of your project from the first idea to the final product.' }
  ]);
  const [contacts, setContacts] = useState({ whatsapp: '+250790920396', email: 'bookextremestudio@gmail.com' });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'site_settings', 'services');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.list && data.list.length > 0) setServices(data.list);
        }

        const contactRef = doc(db, 'site_settings', 'contacts');
        const cSnap = await getDoc(contactRef);
        if (cSnap.exists()) {
          const cData = cSnap.data();
          if (cData.whatsapp) setContacts(prev => ({...prev, whatsapp: cData.whatsapp }));
          if (cData.email) setContacts(prev => ({...prev, email: cData.email }));
        }
      } catch (e) {
        console.error('Error fetching services setting', e);
      }
    }
    fetchSettings();
  }, []);

  const handleBookEmail = (s) => {
    window.open(`mailto:${contacts.email}?subject=Booking Query: ${s.title}`);
  };

  const handleBookWa = (s) => {
    // Strip non-numeric from whatsapp
    const waClean = contacts.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${waClean}?text=Hello, I would like to book the ${s.title} service.`);
  };

  return (
    <div className="misc-page pt-offset">
      <div className="container">
        <h1 className="text-gradient page-title">Our Services</h1>
        <p className="page-subtitle">At Extreme Studios, we focus on delivering top-tier creative services tailored to your needs.</p>
        
        <div className="services-grid">
          {services.map((s, idx) => (
            <div key={idx} className="service-card glass">
              <h2>{s.title}</h2>
              <p>{s.description}</p>
              
              <div className="booking-actions">
                <button className="btn-primary" onClick={() => handleBookWa(s)}>Book via WhatsApp</button>
                <button className="btn-secondary" onClick={() => handleBookEmail(s)}>Book via Email</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Services;
