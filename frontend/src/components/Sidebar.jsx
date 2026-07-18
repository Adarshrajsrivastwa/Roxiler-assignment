import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Store, LayoutDashboard, Users, Key, Award, Star } from 'lucide-react';

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'System Admin';
      case 'owner': return 'Store Owner';
      default: return 'User';
    }
  };

  const renderNavLinks = () => {
    if (!user) return null;

    if (user.role === 'admin') {
      return (
        <>
          <button 
            className={`sidebar-link ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Users</span>
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <Store size={18} />
            <span>Stores</span>
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Profile</span>
          </button>
        </>
      );
    }

    if (user.role === 'owner') {
      return (
        <>
          <button 
            className={`sidebar-link ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            <Award size={18} />
            <span>Performance</span>
          </button>
          <button 
            className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <Key size={18} />
            <span>Credentials</span>
          </button>
        </>
      );
    }

    // Normal User
    return (
      <>
        <button 
          className={`sidebar-link ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          <Store size={18} />
          <span>Outlets</span>
        </button>
        <button 
          className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Key size={18} />
          <span>Credentials</span>
        </button>
      </>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span style={{ color: 'var(--accent-primary)', fontSize: '1.4rem' }}>⭐</span>
          <span>StoreRating</span>
        </div>
      </div>
      
      <nav className="sidebar-menu">
        {renderNavLinks()}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user-badge">
            <User size={16} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap', 
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
          
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
