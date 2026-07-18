import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, MapPin, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('normal');
  
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const errs = [];

    // Name: Min 2, Max 60 characters
    if (name.trim().length < 2 || name.trim().length > 60) {
      errs.push('Name must be between 2 to 60 characters long.');
    }

    // Email: Standard validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errs.push('Please enter a valid email address.');
    }

    // Address: Max 400 characters
    if (!address.trim()) {
      errs.push('Address is required.');
    } else if (address.length > 400) {
      errs.push('Address cannot exceed 400 characters.');
    }

    // Password: 8-16 characters, must include at least one uppercase letter and one special character
    if (password.length < 8 || password.length > 16) {
      errs.push('Password must be between 8 and 16 characters.');
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasUppercase) {
      errs.push('Password must include at least one uppercase letter.');
    }
    if (!hasSpecialChar) {
      errs.push('Password must include at least one special character.');
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccess('');

    const formErrors = validateForm();
    if (formErrors.length > 0) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, address, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (data.errors ? data.errors.join(' ') : 'Registration failed.'));
      }

      setSuccess('Registration successful! Please check your email for the verification code. Redirecting to verification page...');
      setTimeout(() => {
        navigate('/verify', { state: { email } });
      }, 2500);
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setLoading(false);
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

      {/* Right side: Register Form */}
      <div className="auth-form-side" style={{ padding: '1.5rem' }}>
        <div className="auth-form-card" style={{ padding: '2.5rem 2rem', maxWidth: '520px' }}>
          <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-glow)', color: 'var(--accent-primary)', marginBottom: '0.75rem' }}>
              <User size={28} />
            </div>
            <h2 className="auth-title" style={{ fontSize: '1.8rem' }}>Create User Account</h2>
            <p className="auth-subtitle">Join us as a User to start reviewing local stores</p>
          </div>

          {errors.length > 0 && (
            <div className="alert alert-error" style={{ flexDirection: 'column', gap: '0.4rem', padding: '0.75rem' }}>
              {errors.map((err, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ padding: '0.75rem' }}>
              <CheckCircle size={20} style={{ flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Johnathan Alexander Doe (min 20 chars)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
              <p className="form-hint" style={{ fontSize: '0.75rem' }}>Name must be 2 to 60 characters long.</p>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>



            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Address</label>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', minHeight: '75px' }}
                  placeholder="Enter your residence address (max 400 chars)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={400}
                  required
                />
                <MapPin size={18} style={{ position: 'absolute', left: '0.85rem', top: '0.75rem', color: 'var(--text-muted)' }} />
              </div>
              <p className="form-hint" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Address cannot exceed 400 characters.</span>
                <span>{address.length}/400</span>
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
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
              <p className="form-hint" style={{ fontSize: '0.75rem' }}>8-16 chars, at least 1 uppercase and 1 special character.</p>
            </div>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600', textDecoration: 'underline' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
