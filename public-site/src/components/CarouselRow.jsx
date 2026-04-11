import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './CarouselRow.css';

function CarouselRow({ title, items, linkPath, itemTypeOverride = null, handleSelect }) {
  const rowRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!rowRef.current || items.length === 0) return;

    const intervalId = setInterval(() => {
      if (!isHovered && rowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        let nextScrollLeft = scrollLeft + 300; // rough width of a card + gap

        // If at the end, snap back to start
        if (nextScrollLeft >= maxScroll + 100) { // adding slight buffer for end
            nextScrollLeft = 0;
        }

        rowRef.current.scrollTo({
          left: nextScrollLeft,
          behavior: 'smooth'
        });
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [isHovered, items]);

  const handleScrollClick = (direction) => {
    if (!rowRef.current) return;
    const scrollAmount = 600; // scroll two cards typically
    if (direction === 'left') {
      rowRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  return (
    <section 
      className="content-row carousel-section"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
    >
      <div className="section-header">
        <h2>{title}</h2>
        <Link to={linkPath} className="see-all">Explore More</Link>
      </div>
      
      <div className="carousel-container">
        <button className="carousel-ctrl left" onClick={() => handleScrollClick('left')}>
            <FaChevronLeft />
        </button>
        
        <div className="carousel-feed" ref={rowRef}>
          {items.map(item => {
            const actualType = itemTypeOverride || item._type;
            return (
              <div 
                key={item.id} 
                className="carousel-card" 
                onClick={() => handleSelect(item, actualType)}
              >
                <div className="card-image" style={{ backgroundImage: `url(${item.thumbnail})` }}>
                  {item.type === 'Upcoming' && <div className="upcoming-tag">Upcoming</div>}
                </div>
                <div className="card-info">
                  <h3>{item.title}</h3>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span className="tag text-gradient">{item.type}</span>
                    <span style={{fontSize: '0.8rem', color: '#a3a3a3'}}>
                      {actualType === 'series' && `Ep: ${item.episodes?.length || 0}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="carousel-ctrl right" onClick={() => handleScrollClick('right')}>
            <FaChevronRight />
        </button>
      </div>
    </section>
  );
}

export default CarouselRow;
