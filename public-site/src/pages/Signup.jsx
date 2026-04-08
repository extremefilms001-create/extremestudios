import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Auth.css';

// Simple list of countries for demonstration
const COUNTRIES = [
  { name: 'Rwanda', code: '+250' },
  { name: 'United States', code: '+1' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'Canada', code: '+1' },
  { name: 'Australia', code: '+61' },
  { name: 'Kenya', code: '+254' },
  { name: 'Nigeria', code: '+234' },
  { name: 'South Africa', code: '+27' },
  { name: 'Other', code: '' }
];

function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: 'Male',
    residency: 'Rwanda',
    phoneCode: '+250',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    const country = COUNTRIES.find(c => c.name === countryName);
    setFormData({ ...formData, residency: countryName, phoneCode: country ? country.code : '' });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setError('');
      setLoading(true);
      
      const additionalData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        residency: formData.residency,
        phone: `${formData.phoneCode} ${formData.phone}`
      };
      
      await signup(formData.email, formData.password, additionalData);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-box glass signup-box">
        <h2 className="text-gradient">Join Us</h2>
        <p className="auth-subtitle">Create your Extreme Studios account.</p>
        
        {error && <div className="auth-alert fade-in">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group half">
              <label>First Name</label>
              <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="form-group half">
              <label>Last Name</label>
              <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Gender</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group half">
              <label>Residency (Country)</label>
              <select value={formData.residency} onChange={handleCountryChange}>
                {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div className="phone-input">
              <input 
                className="phone-code" 
                value={formData.phoneCode} 
                onChange={e => setFormData({...formData, phoneCode: e.target.value})} 
                placeholder="Code"
              />
              <input 
                required 
                className="phone-number"
                type="tel" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label>Password</label>
              <div className="password-input">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <div className="form-group half">
              <label>Confirm Password</label>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              />
            </div>
          </div>
          
          <button disabled={loading} type="submit" className="btn-primary auth-submit mt-2">
            Sign Up
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="text-gradient">Log in here</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
