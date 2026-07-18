import React, { useState, useEffect } from 'react';
import { Award, Star, Users, ArrowUpDown, Key, CheckCircle, ShieldAlert, Store, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Sidebar from '../components/Sidebar';

export default function OwnerDashboard({ user, token, onLogout }) {
  const [store, setStore] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [hasStore, setHasStore] = useState(true);
  const [message, setMessage] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Tabs: 'performance' or 'profile'
  const [activeTab, setActiveTab] = useState('performance');

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/owner/dashboard?sortBy=${sortBy}&sortOrder=${sortOrder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setHasStore(data.hasStore);
        if (data.hasStore) {
          setStore(data.store);
          setReviewers(data.reviewers);
        } else {
          setMessage(data.message);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [sortBy, sortOrder]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  // Change Password submit
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

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              Owner Dashboard / {activeTab === 'performance' ? 'Analytics' : 'Credentials'}
            </span>
          </div>
          <div className="header-user-info">
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Store: <strong style={{ color: 'var(--text-primary)' }}>{store ? store.name : 'Not Assigned'}</strong>
            </span>
          </div>
        </header>

        <div className="content-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 className="page-title">{activeTab === 'performance' ? 'Store Performance' : 'Security Settings'}</h1>
              <p className="page-subtitle">
                {activeTab === 'performance' 
                  ? 'Monitor review logs, rating distributions, and average feedback scores' 
                  : 'Manage your credentials and update password settings'}
              </p>
            </div>
          </div>

          {activeTab === 'performance' ? (
            /* PERFORMANCE DASHBOARD */
            !hasStore ? (
              <div className="glass-card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', padding: '2.5rem' }}>
                <AlertCircle size={32} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>No Store Assigned</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
                </div>
              </div>
            ) : !store ? (
              <div className="glass-card" style={{ padding: '2.5rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Loading store performance analytics...
              </div>
            ) : (
              <div>
                {/* Outlet Profile & Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  
                  {/* Store Details Card */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                      {store.logoUrl ? (
                        <img src={`http://localhost:5000${store.logoUrl}`} alt={store.name} className="store-logo-img" style={{ width: '64px', height: '64px' }} />
                      ) : (
                        <div className="store-logo-placeholder" style={{ width: '64px', height: '64px', fontSize: '1.6rem', borderStyle: 'solid' }}>
                          {store.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {store.name}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', wordBreak: 'break-word' }}>{store.address}</p>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                      Linked Owner Account: <strong style={{ color: 'var(--text-secondary)' }}>{user.email}</strong>
                    </div>
                  </div>

                  {/* Score Stats Grid */}
                  <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 0 }}>
                    <div className="stat-card" style={{ padding: '1.75rem' }}>
                      <div className="stat-icon" style={{ color: 'var(--warning)', background: '#fffbeb' }}>
                        <Star size={26} fill="var(--warning)" />
                      </div>
                      <div>
                        <div className="stat-value">{store.averageRating}</div>
                        <div className="stat-label">Average Rating</div>
                      </div>
                    </div>

                    <div className="stat-card" style={{ padding: '1.75rem' }}>
                      <div className="stat-icon" style={{ color: 'var(--accent-primary)', background: 'var(--accent-glow-strong)' }}>
                        <Users size={26} />
                      </div>
                      <div>
                        <div className="stat-value">{store.totalRatings}</div>
                        <div className="stat-label">Total Reviews</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviewers List */}
                <div className="glass-card">
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                    Recent User Ratings & Feedback
                  </h3>
                  
                  <div className="table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th onClick={() => toggleSort('reviewer_name')}>
                            <div className="th-content">User Name <ArrowUpDown size={14} /></div>
                          </th>
                          <th onClick={() => toggleSort('reviewer_email')}>
                            <div className="th-content">Email Address <ArrowUpDown size={14} /></div>
                          </th>
                          <th onClick={() => toggleSort('rating')}>
                            <div className="th-content">Rating Score <ArrowUpDown size={14} /></div>
                          </th>
                          <th onClick={() => toggleSort('created_at')}>
                            <div className="th-content">Submitted At <ArrowUpDown size={14} /></div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewers.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                              No users have reviewed your outlet yet.
                            </td>
                          </tr>
                        ) : (
                          reviewers.map((rev) => (
                            <tr key={rev.rating_id}>
                              <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{rev.reviewer_name}</td>
                              <td>{rev.reviewer_email}</td>
                              <td>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#d97706', fontWeight: '700', fontSize: '0.8rem' }}>
                                  <Star size={12} fill="#d97706" />
                                  <span>{rev.rating}.0 / 5.0</span>
                                </div>
                              </td>
                              <td>{formatDate(rev.created_at)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* SETTINGS / CHANGE PASSWORD INTERFACE */
            <div style={{ maxWidth: '600px', margin: '1rem 0' }}>
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                  <div style={{ background: 'var(--accent-glow-strong)', color: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '8px' }}>
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>Update Credentials</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Modify your login password below</p>
                  </div>
                </div>

                {passwordErrors.length > 0 && (
                  <div className="alert alert-error" style={{ flexDirection: 'column', gap: '0.3rem', padding: '0.75rem' }}>
                    {passwordErrors.map((err, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="alert alert-success" style={{ padding: '0.75rem' }}>
                    <CheckCircle size={20} style={{ flexShrink: 0 }} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChangeSubmit}>
                  <div className="form-group">
                    <label className="form-label">Old Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className="form-control"
                        style={{ paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-control"
                        style={{ paddingRight: '2.5rem' }}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="form-hint">Must be 8-16 characters, with 1 uppercase letter and 1 special symbol.</p>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={passwordLoading}>
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
