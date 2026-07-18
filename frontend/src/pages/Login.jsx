import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.unverified) {
          setError('OTP verification code has been sent to your email! Redirecting...');
          setTimeout(() => {
            navigate('/verify', { state: { email: data.email || email } });
          }, 2500);
          return;
        }
        throw new Error(data.error || 'Authentication failed. Please check credentials.');
      }

      // Successful Login
      onLoginSuccess(data.user, data.token);

      // Redirect based on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    setForgotLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send temporary password.');
      }

      setForgotSuccessMsg('Temporary password sent successfully! Please check your email for the new credentials.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccessMsg('');
        setForgotEmail('');
      }, 3500);
    } catch (err) {
      setForgotErrorMsg(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left side: Brand presentation */}
      <div className="auth-brand-side">
        <div className="auth-brand-content">
          <div className="auth-brand-logo">
            <span>⭐</span>
            <span>StoreRating</span>
          </div>
          <h1 className="auth-brand-title">Objective Data.<br />Transparent Feedback.</h1>
          <p className="auth-brand-subtitle">
            Explore and rate local stores, access clear statistics, and discover reliable outlets powered by community reviews.
          </p>
          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🛡️</div>
              <span>Authentic ratings from verified local users</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">📊</div>
              <span>Real-time analytics and performance tracking</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">✨</div>
              <span>Streamlined feedback for owners and customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-header">
            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
              <Shield size={28} />
            </div>
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Log in to manage ratings and explore stores</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
                <button type="button" onClick={() => { setShowForgotModal(true); setForgotErrorMsg(''); setForgotSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>
                  Forgot password?
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'underline' }}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>
      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '450px', background: 'white', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Reset Password</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Enter your email address and we'll send you a temporary password.</p>
            
            {forgotErrorMsg && (
              <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
                <span>{forgotErrorMsg}</span>
              </div>
            )}
            
            {forgotSuccessMsg && (
              <div className="alert alert-success" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForgotModal(false)} disabled={forgotLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={forgotLoading}>
                  {forgotLoading ? 'Sending...' : 'Send Temporary Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
