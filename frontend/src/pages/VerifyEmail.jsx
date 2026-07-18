import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, ShieldCheck, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from redirect state if available
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (code.trim().length !== 6 || isNaN(code)) {
      setError('Verification code must be a 6-digit number.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed. Please try again.');
      }

      setSuccess('Email verified successfully! Access granted, logging you in...');
      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setResendLoading(true);
    setResendMsg('');
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP.');
      }

      setResendMsg('New OTP sent to your email successfully!');
      setCode('');
      // Start 30 second cooldown
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
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
          <h1 className="auth-brand-title">Secure Verification.<br />Account Protection.</h1>
          <p className="auth-brand-subtitle">
            Please verify your email address to access rating submissions, dashboard analytics, and store details.
          </p>
          <div className="auth-features-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🛡️</div>
              <span>Verified accounts reduce fraud and spam feedback</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">🔒</div>
              <span>Secured backend communication channels</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Verification Form */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-header">
            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
              <ShieldCheck size={28} />
            </div>
            <h2 className="auth-title">Verify Email Address</h2>
            <p className="auth-subtitle">Enter the 6-digit verification code sent to your email</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={20} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {resendMsg && (
            <div className="alert alert-success" style={{ padding: '0.65rem 0.85rem' }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem' }}>{resendMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">6-Digit Verification Code</label>
              <input
                type="text"
                className="form-control"
                maxLength={6}
                placeholder="123456"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontWeight: '700' }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || resendCooldown > 0}
              style={{
                background: 'none',
                border: 'none',
                color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
                fontSize: '0.88rem',
                cursor: resendCooldown > 0 ? 'default' : 'pointer',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <RefreshCw size={14} className={resendLoading ? 'spin-animation' : ''} />
              {resendLoading
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend OTP (${resendCooldown}s)`
                : 'Resend OTP'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Back to{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'underline' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
