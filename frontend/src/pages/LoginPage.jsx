import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const roleRedirects = {
    ADMIN: '/admin',
    FACULTY: '/faculty',
    STUDENT: '/student',
    PARENT: '/parent',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data.token, { email: data.email, role: data.role, userId: data.userId, prn: data.prn });
      navigate(roleRedirects[data.role] || '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const demos = {
      admin:   { email: 'admin@erp.com',       password: 'admin123' },
      faculty: { email: 'prof.sharma@erp.com', password: 'faculty123' },
      student: { email: 'ritu.patel@erp.com',  password: 'student123' },
      parent:  { email: 'parent@erp.com',      password: 'parent123' },
    };
    setEmail(demos[role].email);
    setPassword(demos[role].password);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <div className="login-wrapper">
        <div className="login-brand">
          <div className="brand-icon">⚡</div>
          <h1 className="brand-name">HyperCampus AI</h1>
          <p className="brand-tagline">Intelligent Campus Operating System</p>
        </div>

        <div className="login-card">
          <h2 className="login-heading">Welcome Back</h2>
          <p className="login-subheading">Sign in to access your intelligent campus workspace</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field-group">
              <label htmlFor="email" className="field-label">Email Address</label>
              <input
                id="email"
                type="email"
                className="field-input"
                placeholder="you@erp.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="field-group">
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="demo-section">
            <p className="demo-label">Quick 1-Click Demo Login</p>
            <div className="demo-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button className="demo-btn demo-admin"   onClick={() => fillDemo('admin')}> 🛡️ Admin </button>
              <button className="demo-btn demo-faculty" onClick={() => fillDemo('faculty')}> 👩‍🏫 Faculty </button>
              <button className="demo-btn demo-student" onClick={() => fillDemo('student')}> 🎓 Student </button>
              <button className="demo-btn" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }} onClick={() => fillDemo('parent')}> 👨‍👩‍👧 Parent </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
