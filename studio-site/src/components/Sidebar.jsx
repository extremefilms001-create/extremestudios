import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, FaUpload, FaCloudUploadAlt, FaProjectDiagram, 
  FaMoneyBillWave, FaHistory, FaUsers, FaBullhorn, FaCog 
} from 'react-icons/fa';
import './Admin.css';

function Sidebar() {
  const loc = useLocation();
  const path = loc.pathname;

  const links = [
    { to: '/', label: 'Dashboard', icon: <FaHome /> },
    { to: '/upload', label: 'Upload', icon: <FaUpload /> },
    { to: '/deploy', label: 'Deploy & Manage', icon: <FaCloudUploadAlt /> },
    { to: '/projects', label: 'Project Tracking', icon: <FaProjectDiagram /> },
    { to: '/transactions', label: 'Transactions', icon: <FaMoneyBillWave /> },
    { to: '/payments', label: 'Payment Records', icon: <FaHistory /> },
    { to: '/board', label: 'Board Members', icon: <FaUsers /> },
    { to: '/users', label: 'Users Data', icon: <FaUsers /> },
    { to: '/announcements', label: 'Announcements', icon: <FaBullhorn /> },
    { to: '/settings', label: 'Settings', icon: <FaCog /> }
  ];

  return (
    <div className="sidebar glass">
      <div className="sidebar-brand">
        <h2 className="text-gradient" style={{fontSize: '1.2rem', margin: 0}}>EXTREME STUDIO</h2>
      </div>
      <div className="sidebar-links">
        {links.map(link => (
          <Link 
            key={link.to} 
            to={link.to} 
            className={`side-link ${path === link.to ? 'active' : ''}`}
          >
            <span className="icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
