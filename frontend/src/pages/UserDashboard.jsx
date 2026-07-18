import React, { useState, useEffect } from 'react';
import { Search, MapPin, CheckCircle, ShieldAlert, Sparkles, Key, ArrowUpDown, Eye, EyeOff, Lock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StarRating from '../components/StarRating';

export default function UserDashboard({ user, token, onLogout }) {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  
  // Tabs: 'stores' or 'settings'
  const [activeTab, setActiveTab] = useState('stores');

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // General Notification Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStores = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/stores?search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStores(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [search, sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  // Submit or Modify Rating handler
  const handleRatingChange = async (storeId, userRating, ratingId, newRatingValue) => {
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let url = 'http://localhost:5000/api/user/ratings';
      let method = 'POST';
      let body = { storeId, rating: newRatingValue };

      // If user has already rated this store, modify it
      if (userRating !== null && ratingId) {
        url = `http://localhost:5000/api/user/ratings/${ratingId}`;
        method = 'PUT';
        body = { rating: newRatingValue };
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit rating.');
      }

      setSuccessMsg(userRating !== null ? 'Rating updated successfully!' : 'Rating submitted successfully!');
      fetchStores();
      
      // Auto-hide alert after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Change Password validation and submit
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors([]);
    setPasswordSuccess('');

    // Validations
    const errs = [];
    if (newPassword.length < 8 || newPassword.length > 16) {
      errs.push('New password must be between 8 and 16 characters.');
    }
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    if (!hasUppercase) {
      errs.push('New password must include at least one uppercase letter.');
    }
    if (!hasSpecialChar) {
      errs.push('New password must include at least one special character.');
    }

    if (errs.length > 0) {
      setPasswordErrors(errs);
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordErrors([err.message]);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
      />

      <main className="main-area">
        <header className="top-header">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              User Dashboard / {activeTab === 'stores' ? 'Outlets' : 'Credentials'}
            </span>
          </div>
          <div className="header-user-info">
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{user.name.split(' ')[0]}</strong>
            </span>
          </div>
        </header>

        <div className="content-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 className="page-title">{activeTab === 'stores' ? 'Discover Outlets' : 'Security Settings'}</h1>
              <p className="page-subtitle">
                {activeTab === 'stores' 
                  ? 'Explore registered stores, verify ratings, and provide your feedback' 
                  : 'Manage your authentication credentials and update your password'}
              </p>
            </div>
          </div>

          {/* Success / Error Alerts */}
          {successMsg && (
            <div className="alert alert-success">
              <Sparkles size={20} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="alert alert-error">
              <ShieldAlert size={20} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'stores' ? (
            /* STORES INTERFACE */
            <div>
              {/* Search and Sort controls */}
              <div className="controls-row">
                <div className="search-box">
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search outlets by name or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Search size={18} className="search-icon" />
                </div>
                
                <div className="filter-group">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Sort By:</span>
                  <button
                    className={`btn ${sortBy === 'name' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => toggleSort('name')}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </button>
                  <button
                    className={`btn ${sortBy === 'address' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => toggleSort('address')}
                  >
                    Address {sortBy === 'address' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </button>
                  <button
                    className={`btn ${sortBy === 'rating' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => toggleSort('rating')}
                  >
                    Rating {sortBy === 'rating' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </button>
                </div>
              </div>

              {/* Stores Grid Layout */}
              {stores.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>No outlets registered matching your search query.</p>
                </div>
              ) : (
                <div className="stores-grid">
                  {stores.map((store) => (
                    <div key={store.id} className="store-card">
                      <div className="store-card-header">
                        {store.logo_url ? (
                          <img src={`http://localhost:5000${store.logo_url}`} alt={store.name} className="store-logo-img" />
                        ) : (
                          <div className="store-logo-placeholder">
                            {store.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <h3 className="store-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {store.name}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {store.email}
                          </p>
                        </div>
                      </div>

                      <div className="store-info-text">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <MapPin size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                          <span>{store.address}</span>
                        </div>
                      </div>

                      <div className="store-meta-row">
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                            Community Rating
                          </div>
                          <StarRating rating={store.overall_rating} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.4rem', fontWeight: 500 }}>
                            ({store.rating_count} reviews)
                          </span>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                            {store.user_rating !== null ? 'Your Rating' : 'Rate Store'}
                          </div>
                          <StarRating
                            rating={store.user_rating || 0}
                            interactive={true}
                            onChange={(val) => handleRatingChange(store.id, store.user_rating, store.rating_id, val)}
                            size={18}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* SETTINGS / CHANGE PASSWORD INTERFACE */
            <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1rem 0' }}>
              <div className="glass-card" style={{ padding: '2.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                  <div style={{ background: 'var(--accent-glow-strong)', color: 'var(--accent-primary)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Update Credentials</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Modify your login password below</p>
                  </div>
                </div>

                {passwordErrors.length > 0 && (
                  <div className="alert alert-error" style={{ flexDirection: 'column', gap: '0.4rem', padding: '0.85rem 1rem', marginBottom: '1.5rem' }}>
                    {passwordErrors.map((err, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="alert alert-success" style={{ padding: '0.85rem 1rem', marginBottom: '1.5rem' }}>
                    <CheckCircle size={18} style={{ flexShrink: 0, marginRight: '0.5rem' }} />
                    <span style={{ fontSize: '0.88rem' }}>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChangeSubmit}>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">Old Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className="form-control"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                      <Lock size={16} style={{ position: 'absolute', left: '0.88rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        style={{ position: 'absolute', right: '0.88rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                    <label className="form-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-control"
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <Lock size={16} style={{ position: 'absolute', left: '0.88rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '0.88rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Must be 8-16 characters, with at least 1 uppercase letter and 1 special symbol.
                    </p>
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={passwordLoading}>
                    {passwordLoading ? 'Updating Password...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
