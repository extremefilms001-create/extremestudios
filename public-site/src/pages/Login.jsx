import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-box glass">
        <h2 className="text-gradient">Welcome Back</h2>
        <p className="auth-subtitle">Log in to your Extreme Studios account.</p>
        
        {error && <div className="auth-alert fade-in">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="you@example.com"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <div className="password-input">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              <span 
                className="eye-icon" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          
          <button disabled={loading} type="submit" className="btn-primary auth-submit">
            Log In
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account yet? <Link to="/signup" className="text-gradient">Sign up here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
