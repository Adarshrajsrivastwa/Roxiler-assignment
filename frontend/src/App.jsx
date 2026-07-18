import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || '';
  });

  const handleLoginSuccess = (loggedInUser, userToken) => {
    setUser(loggedInUser);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    localStorage.setItem('token', userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          } 
        />
        
        <Route 
          path="/register" 
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Register />
            )
          } 
        />

        <Route 
          path="/verify" 
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <VerifyEmail />
            )
          } 
        />

        {/* Dashboard Protects */}
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <AdminDashboard user={user} token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/user"
          element={
            user && user.role === 'normal' ? (
              <UserDashboard user={user} token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/owner"
          element={
            user && user.role === 'owner' ? (
              <OwnerDashboard user={user} token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Root fallback redirects */}
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : user.role === 'owner' ? (
              <Navigate to="/owner" replace />
            ) : (
              <Navigate to="/user" replace />
            )
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
