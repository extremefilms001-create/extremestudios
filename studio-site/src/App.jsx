import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import PendingApproval from './pages/PendingApproval';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Deploy from './pages/Deploy';
import Projects from './pages/Projects';
import Transactions from './pages/Transactions';
import Payments from './pages/Payments';
import BoardMembers from './pages/BoardMembers';
import Announcements from './pages/Announcements';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Account from './pages/Account';

function AdminRoute({ children }) {
  const { currentUser, userData } = useAuth();
  
  if (currentUser === undefined || userData === undefined) return <div className="loading">Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  if (userData && !userData.approved) return <Navigate to="/pending" />;
  
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Router basename="/studio">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pending" element={<PendingApproval />} />
            
            {/* Protected Admin Routes */}
            <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/upload" element={<AdminRoute><Upload /></AdminRoute>} />
            <Route path="/deploy" element={<AdminRoute><Deploy /></AdminRoute>} />
            <Route path="/projects" element={<AdminRoute><Projects /></AdminRoute>} />
            <Route path="/transactions" element={<AdminRoute><Transactions /></AdminRoute>} />
            <Route path="/payments" element={<AdminRoute><Payments /></AdminRoute>} />
            <Route path="/board" element={<AdminRoute><BoardMembers /></AdminRoute>} />
            <Route path="/announcements" element={<AdminRoute><Announcements /></AdminRoute>} />
            <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
            <Route path="/account" element={<AdminRoute><Account /></AdminRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;
