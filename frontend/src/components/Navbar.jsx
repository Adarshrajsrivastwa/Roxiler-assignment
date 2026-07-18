import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Store } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const getRoleClass = (role) => {
    switch (role) {
      case 'admin': return 'user-role-admin';
      case 'owner': return 'user-role-owner';
      default: return 'user-role-normal';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'System Admin';
      case 'owner': return 'Store Owner';
      default: return 'User';
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        ⭐ StoreRating
      </div>
      
      {user && (
        <div className="nav-user">
          <div className={`user-badge ${getRoleClass(user.role)}`}>
            {user.role === 'admin' ? (
              <User size={16} />
            ) : user.role === 'owner' ? (
              <Store size={16} />
            ) : (
              <User size={16} />
            )}
            <span>{user.name.split(' ')[0]} ({getRoleLabel(user.role)})</span>
          </div>
          
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}
