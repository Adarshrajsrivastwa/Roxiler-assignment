import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowUpDown, ShieldAlert, Store, UserCheck, Star, Sparkles, Filter, User, Key, CheckCircle, Eye, EyeOff, Trash2, Calendar, Lock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

export default function AdminDashboard({ user, token, onLogout }) {
  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  
  // Lists
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [unassignedOwners, setUnassignedOwners] = useState([]);
  const [ratings, setRatings] = useState([]);

  // Active Tab (stats, users, stores, ratings, profile)
  const [activeTab, setActiveTab] = useState('stats');

  // Filters and Sorting
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userSortBy, setUserSortBy] = useState('name');
  const [userSortOrder, setUserSortOrder] = useState('ASC');

  const [storeSearch, setStoreSearch] = useState('');
  const [storeSortBy, setStoreSortBy] = useState('name');
  const [storeSortOrder, setStoreSortOrder] = useState('ASC');

  const [ratingsSearch, setRatingsSearch] = useState('');
  const [ratingsSortBy, setRatingsSortBy] = useState('created_at');
  const [ratingsSortOrder, setRatingsSortOrder] = useState('DESC');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Edit User modal state
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);
  const [editUserRole, setEditUserRole] = useState('normal');
  const [editUserFormErrors, setEditUserFormErrors] = useState([]);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState('normal');
  const [userFormErrors, setUserFormErrors] = useState([]);

  // New Store Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreEmail, setNewStoreEmail] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreOwner, setNewStoreOwner] = useState('');
  const [newStoreLogo, setNewStoreLogo] = useState(null);
  const [storeFormErrors, setStoreFormErrors] = useState([]);

  // Edit Store Form State
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [editStoreId, setEditStoreId] = useState('');
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreAddress, setEditStoreAddress] = useState('');
  const [editStoreOwner, setEditStoreOwner] = useState('');
  const [editStoreLogo, setEditStoreLogo] = useState(null);
  const [initialOwnerEmail, setInitialOwnerEmail] = useState('');
  const [editStoreFormErrors, setEditStoreFormErrors] = useState([]);

  // Change Password Form State (Admin Profile)
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // General Notification alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users?search=${userSearch}&role=${userRole}&sortBy=${userSortBy}&sortOrder=${userSortOrder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Stores
  const fetchStores = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/stores?search=${storeSearch}&sortBy=${storeSortBy}&sortOrder=${storeSortOrder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setStores(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Unassigned Store Owners
  const fetchUnassignedOwners = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/unassigned-owners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUnassignedOwners(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [userSearch, userRole, userSortBy, userSortOrder]);

  useEffect(() => {
    fetchStores();
  }, [storeSearch, storeSortBy, storeSortOrder]);

  // Fetch Ratings
  const fetchRatings = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/ratings?search=${ratingsSearch}&sortBy=${ratingsSortBy}&sortOrder=${ratingsSortOrder}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRatings(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [ratingsSearch, ratingsSortBy, ratingsSortOrder]);

  useEffect(() => {
    if (isStoreModalOpen) {
      fetchUnassignedOwners();
    }
  }, [isStoreModalOpen]);

  // Handle User Sorting change
  const toggleUserSort = (field) => {
    if (userSortBy === field) {
      setUserSortOrder(userSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setUserSortBy(field);
      setUserSortOrder('ASC');
    }
  };

  // Handle Store Sorting change
  const toggleStoreSort = (field) => {
    if (storeSortBy === field) {
      setStoreSortOrder(storeSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setStoreSortBy(field);
      setStoreSortOrder('ASC');
    }
  };

  // Handle Rating Sorting change
  const toggleRatingSort = (field) => {
    if (ratingsSortBy === field) {
      setRatingsSortOrder(ratingsSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setRatingsSortBy(field);
      setRatingsSortOrder('DESC');
    }
  };

  // Delete Rating
  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('Are you sure you want to delete this rating? This action cannot be undone.')) {
      return;
    }
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`http://localhost:5000/api/admin/ratings/${ratingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete rating.');
      }
      setSuccessMsg('Rating deleted successfully!');
      fetchRatings();
      fetchStats();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // View Details Modal
  const viewUserDetails = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedUserDetails(data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User form validations
  const validateUserForm = () => {
    const errs = [];
    if (newUserName.trim().length < 2 || newUserName.trim().length > 60) {
      errs.push('Name must be 2 to 60 characters long.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      errs.push('Please enter a valid email address.');
    }
    if (!newUserAddress.trim()) {
      errs.push('Address is required.');
    } else if (newUserAddress.length > 400) {
      errs.push('Address cannot exceed 400 characters.');
    }
    if (newUserPassword.length < 8 || newUserPassword.length > 16) {
      errs.push('Password must be between 8 and 16 characters.');
    }
    const hasUppercase = /[A-Z]/.test(newUserPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newUserPassword);
    if (!hasUppercase) {
      errs.push('Password must include at least one uppercase letter.');
    }
    if (!hasSpecialChar) {
      errs.push('Password must include at least one special character.');
    }
    return errs;
  };

  // Add User Submission
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setUserFormErrors([]);
    setSuccessMsg('');
    setErrorMsg('');

    const formErrors = validateUserForm();
    if (formErrors.length > 0) {
      setUserFormErrors(formErrors);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          address: newUserAddress,
          role: newUserRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.errors ? data.errors.join(' ') : 'Failed to add user.'));
      }

      setSuccessMsg('User added successfully! Credentials and account details emailed.');
      setIsUserModalOpen(false);
      fetchUsers();
      fetchStats();

      // Clear input fields
      setNewUserName('');
      setNewUserEmail('');
      setNewUserAddress('');
      setNewUserPassword('');
      setNewUserRole('normal');
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setUserFormErrors([err.message]);
    }
  };

  const startEditUser = (usr) => {
    setEditUserName(usr.name);
    setEditUserEmail(usr.email);
    setEditUserAddress(usr.address);
    setEditUserRole(usr.role);
    setEditUserPassword('');
    setShowEditUserPassword(false);
    setEditUserFormErrors([]);
    setIsDetailModalOpen(false);
    setIsEditUserModalOpen(true);
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditUserFormErrors([]);
    setSuccessMsg('');
    setErrorMsg('');

    const errs = [];
    if (editUserName.trim().length < 2 || editUserName.trim().length > 60) {
      errs.push('Name must be between 2 and 60 characters long.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUserEmail)) {
      errs.push('Please enter a valid email address.');
    }
    if (!editUserAddress.trim()) {
      errs.push('Address is required.');
    } else if (editUserAddress.length > 400) {
      errs.push('Address cannot exceed 400 characters.');
    }
    if (editUserPassword.trim().length > 0) {
      if (editUserPassword.length < 8 || editUserPassword.length > 16) {
        errs.push('Password must be between 8 and 16 characters.');
      }
      const hasUppercase = /[A-Z]/.test(editUserPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(editUserPassword);
      if (!hasUppercase) {
        errs.push('Password must include at least one uppercase letter.');
      }
      if (!hasSpecialChar) {
        errs.push('Password must include at least one special character.');
      }
    }

    if (errs.length > 0) {
      setEditUserFormErrors(errs);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${selectedUserDetails.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editUserName,
          email: editUserEmail,
          password: editUserPassword,
          address: editUserAddress,
          role: editUserRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user details.');
      }

      setSuccessMsg('User details updated successfully!');
      setIsEditUserModalOpen(false);
      fetchUsers();
      fetchStats();

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setEditUserFormErrors([err.message]);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account? This action cannot be undone.')) {
      return;
    }

    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user.');
      }

      setSuccessMsg('User deleted successfully!');
      setIsDetailModalOpen(false);
      fetchUsers();
      fetchStats();

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Store form validations
  const validateStoreForm = () => {
    const errs = [];
    if (newStoreName.trim().length < 2 || newStoreName.trim().length > 60) {
      errs.push('Store name must be 2 to 60 characters.');
    }
    if (!newStoreOwner) {
      errs.push('Please select a Store Owner.');
    }
    if (!newStoreAddress.trim()) {
      errs.push('Store address is required.');
    } else if (newStoreAddress.length > 400) {
      errs.push('Store address cannot exceed 400 characters.');
    }
    return errs;
  };

  const startEditStore = (store) => {
    setEditStoreId(store.id);
    setEditStoreName(store.name);
    setEditStoreAddress(store.address);
    setEditStoreOwner(store.owner_id || '');
    setInitialOwnerEmail(store.email || '');
    setEditStoreLogo(null);
    setEditStoreFormErrors([]);
    setIsEditStoreModalOpen(true);
  };

  const getEditStoreOwnerOptions = () => {
    const options = [...unassignedOwners];
    const hasCurrentOwner = options.some(o => o.id === parseInt(editStoreOwner));
    if (!hasCurrentOwner && editStoreOwner && initialOwnerEmail) {
      const matchedUser = users.find(u => u.id === parseInt(editStoreOwner));
      const ownerName = matchedUser ? matchedUser.name : 'Current Owner';
      options.unshift({
        id: parseInt(editStoreOwner),
        name: ownerName,
        email: initialOwnerEmail
      });
    }
    return options;
  };

  const handleEditStoreSubmit = async (e) => {
    e.preventDefault();
    setEditStoreFormErrors([]);
    setSuccessMsg('');
    setErrorMsg('');

    if (editStoreName.trim().length < 2 || editStoreName.trim().length > 60) {
      setEditStoreFormErrors(['Store name must be 2 to 60 characters.']);
      return;
    }
    if (!editStoreOwner) {
      setEditStoreFormErrors(['Please select a Store Owner.']);
      return;
    }
    if (!editStoreAddress.trim()) {
      setEditStoreFormErrors(['Store address is required.']);
      return;
    }

    const formData = new FormData();
    formData.append('name', editStoreName);
    formData.append('address', editStoreAddress);
    formData.append('ownerId', editStoreOwner);
    if (editStoreLogo) {
      formData.append('logo', editStoreLogo);
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/stores/${editStoreId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.errors ? data.errors.join(' ') : 'Failed to update store outlet.'));
      }

      setSuccessMsg('Store outlet updated successfully!');
      setIsEditStoreModalOpen(false);
      fetchStores();
      fetchStats();

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setEditStoreFormErrors([err.message]);
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm('Are you sure you want to delete this store outlet? This action will permanently remove all related ratings.')) {
      return;
    }

    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch(`http://localhost:5000/api/admin/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete store outlet.');
      }

      setSuccessMsg('Store outlet deleted successfully!');
      fetchStores();
      fetchStats();

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Add Store Submission
  const handleAddStoreSubmit = async (e) => {
    e.preventDefault();
    setStoreFormErrors([]);
    setSuccessMsg('');
    setErrorMsg('');

    const formErrors = validateStoreForm();
    if (formErrors.length > 0) {
      setStoreFormErrors(formErrors);
      return;
    }

    const formData = new FormData();
    formData.append('name', newStoreName);
    formData.append('address', newStoreAddress);
    formData.append('ownerId', newStoreOwner);
    if (newStoreLogo) {
      formData.append('logo', newStoreLogo);
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/stores', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.errors ? data.errors.join(' ') : 'Failed to create store.'));
      }

      setSuccessMsg('Store created successfully!');
      setIsStoreModalOpen(false);
      fetchStores();
      fetchStats();

      // Clear input fields
      setNewStoreName('');
      setNewStoreEmail('');
      setNewStoreAddress('');
      setNewStoreOwner('');
      setNewStoreLogo(null);
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setStoreFormErrors([err.message]);
    }
  };

  // Change Password submit (Admin profile tab)
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

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'admin';
      case 'owner': return 'owner';
      default: return 'normal';
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'owner': return 'Store Owner';
      case 'normal': return 'User';
      default: return role;
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
              System Admin / {activeTab === 'stats' ? 'Overview' : activeTab === 'users' ? 'Users' : activeTab === 'stores' ? 'Stores' : activeTab === 'ratings' ? 'Ratings' : 'Profile'}
            </span>
          </div>
          <div className="header-user-info">
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Welcome, <strong style={{ color: 'var(--text-primary)' }}>Admin</strong>
            </span>
          </div>
        </header>

        <div className="content-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 className="page-title">
                {activeTab === 'stats' ? 'Overview & Analytics' : activeTab === 'users' ? 'User Accounts' : activeTab === 'stores' ? 'Store Outlets' : activeTab === 'ratings' ? 'Ratings Log' : 'System Profile'}
              </h1>
              <p className="page-subtitle">
                {activeTab === 'stats' 
                  ? 'Overview of registered users, outlets, and logs across the platform'
                  : activeTab === 'users'
                  ? 'Manage system user accounts, verify roles, and create new profiles'
                  : activeTab === 'stores'
                  ? 'Monitor registered outlet details, logos, and global review statistics'
                  : activeTab === 'ratings'
                  ? 'View all ratings submitted by users across store outlets'
                  : 'Manage system administrator settings and credentials'}
              </p>
            </div>
            
            {(activeTab === 'stats' || activeTab === 'users' || activeTab === 'stores') && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setIsUserModalOpen(true)}>
                  <Plus size={16} /> Add User
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setIsStoreModalOpen(true)}
                  style={{ background: 'var(--accent-secondary)' }}
                >
                  <Plus size={16} /> Add Store
                </button>
              </div>
            )}
          </div>

          {/* Global Notifications */}
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

          {activeTab === 'stats' && (
            /* OVERVIEW TAB */
            <div>
              {/* Metrics Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalUsers}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ color: 'var(--accent-secondary)', background: 'rgba(6, 182, 212, 0.08)' }}>
                    <Store size={24} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalStores}</div>
                    <div className="stat-label">Total Stores</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon" style={{ color: 'var(--warning)', background: 'rgba(254, 243, 199, 0.5)' }}>
                    <Star size={24} />
                  </div>
                  <div>
                    <div className="stat-value">{stats.totalRatings}</div>
                    <div className="stat-label">Total Ratings Logged</div>
                  </div>
                </div>
              </div>

              {/* Recent Ratings Panel */}
              <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                      ⭐ Recent Ratings
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Latest ratings submitted by users across all stores</p>
                  </div>
                  <div className="search-box" style={{ maxWidth: '280px', minWidth: '200px' }}>
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search ratings..."
                      value={ratingsSearch}
                      onChange={(e) => setRatingsSearch(e.target.value)}
                    />
                    <Search size={16} className="search-icon" />
                  </div>
                </div>

                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th onClick={() => toggleRatingSort('store_name')}>
                          <div className="th-content">Shop Name <ArrowUpDown size={13} /></div>
                        </th>
                        <th onClick={() => toggleRatingSort('user_name')}>
                          <div className="th-content">Rater <ArrowUpDown size={13} /></div>
                        </th>
                        <th onClick={() => toggleRatingSort('rating')}>
                          <div className="th-content">Rating <ArrowUpDown size={13} /></div>
                        </th>
                        <th onClick={() => toggleRatingSort('created_at')}>
                          <div className="th-content">Date <ArrowUpDown size={13} /></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratings.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                            No ratings submitted yet.
                          </td>
                        </tr>
                      ) : (
                        ratings.map((rt) => (
                          <tr key={rt.id}>
                            <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{rt.store_name}</td>
                            <td>{rt.user_name}</td>
                            <td>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    size={14}
                                    fill={s <= rt.rating ? '#f59e0b' : 'none'}
                                    color={s <= rt.rating ? '#f59e0b' : '#d1d5db'}
                                    strokeWidth={1.5}
                                  />
                                ))}
                                <span style={{ marginLeft: '0.3rem', fontWeight: '700', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                                  {rt.rating}/5
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {new Date(rt.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setActiveTab('users')} style={{ flex: 1 }}>
                  👤 Manage Users
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab('stores')} style={{ flex: 1 }}>
                  🏪 Manage Stores
                </button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            /* USERS PANEL */
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div className="controls-row">
                <div className="search-box">
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search by Name, Email, Address..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <Search size={18} className="search-icon" />
                </div>
                <div className="filter-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Filter size={16} /> Role:
                  </div>
                  <select className="select-control" value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="admin">Administrator</option>
                    <option value="owner">Store Owner</option>
                    <option value="normal">User</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th onClick={() => toggleUserSort('name')}>
                        <div className="th-content">Name <ArrowUpDown size={14} /></div>
                      </th>
                      <th onClick={() => toggleUserSort('email')}>
                        <div className="th-content">Email Address <ArrowUpDown size={14} /></div>
                      </th>
                      <th onClick={() => toggleUserSort('address')}>
                        <div className="th-content">Address <ArrowUpDown size={14} /></div>
                      </th>
                      <th onClick={() => toggleUserSort('role')}>
                        <div className="th-content">System Role <ArrowUpDown size={14} /></div>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          No user accounts match current filters.
                        </td>
                      </tr>
                    ) : (
                      users.map((usr) => (
                        <tr key={usr.id}>
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{usr.name}</td>
                          <td>{usr.email}</td>
                          <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {usr.address}
                          </td>
                          <td>
                            <span className={`role-badge ${getRoleLabel(usr.role)}`}>
                              {getRoleDisplayName(usr.role)}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600 }} 
                              onClick={() => viewUserDetails(usr.id)}
                            >
                              <Eye size={12} style={{ marginRight: '2px' }} /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stores' && (
            /* STORES PANEL */
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div className="controls-row">
                <div className="search-box">
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search outlets by Name, Email, Location..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                  />
                  <Search size={18} className="search-icon" />
                </div>
              </div>

              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Logo</th>
                      <th onClick={() => toggleStoreSort('name')}>
                        <div className="th-content">Store Name <ArrowUpDown size={14} /></div>
                      </th>
                      <th onClick={() => toggleStoreSort('email')}>
                        <div className="th-content">Email <ArrowUpDown size={14} /></div>
                      </th>
                      <th onClick={() => toggleStoreSort('address')}>
                        <div className="th-content">Location Address <ArrowUpDown size={14} /></div>
                      </th>
                      <th onClick={() => toggleStoreSort('rating')}>
                        <div className="th-content">Average Rating <ArrowUpDown size={14} /></div>
                      </th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                          No store outlets registered on this platform.
                        </td>
                      </tr>
                    ) : (
                      stores.map((str) => (
                        <tr key={str.id}>
                          <td>
                            {str.logo_url ? (
                              <img src={`http://localhost:5000${str.logo_url}`} alt={str.name} className="store-logo-img" style={{ width: '40px', height: '40px' }} />
                            ) : (
                              <div className="store-logo-placeholder" style={{ width: '40px', height: '40px', fontSize: '1rem', borderStyle: 'solid' }}>
                                {str.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{str.name}</td>
                          <td>{str.email}</td>
                          <td>{str.address}</td>
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '6px', color: '#d97706', fontWeight: '700', fontSize: '0.8rem' }}>
                              <Star size={12} fill="#d97706" />
                              <span>{parseFloat(str.rating).toFixed(1)} ({str.ratingCount})</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                type="button" 
                                className="btn btn-primary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                onClick={() => startEditStore(str)}
                              >
                                Edit
                              </button>
                              <button 
                                type="button" 
                                className="btn"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: '#ef4444', color: 'white' }}
                                onClick={() => handleDeleteStore(str.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            /* ADMIN PROFILE CHANGE PASSWORD */
            <div style={{ maxWidth: '560px', margin: '0 auto', padding: '1rem 0' }}>
              <div className="glass-card" style={{ padding: '2.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                  <div style={{ background: 'var(--accent-glow-strong)', color: 'var(--accent-primary)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Update Credentials</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Modify your admin account login password</p>
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

      {/* MODAL 1: ADD USER */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Create User Account">
        <form onSubmit={handleAddUserSubmit}>
          {userFormErrors.length > 0 && (
            <div className="alert alert-error" style={{ flexDirection: 'column', gap: '0.3rem', padding: '0.75rem' }}>
              {userFormErrors.map((err, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Johnathan Alexander Doe (min 2 characters)"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="select-control" style={{ width: '100%' }} value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
              <option value="normal">User</option>
              <option value="owner">Store Owner</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              placeholder="Enter residence address (max 400 characters)"
              value={newUserAddress}
              onChange={(e) => setNewUserAddress(e.target.value)}
              maxLength={400}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewUserPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingRight: '2.5rem' }}
                placeholder="Set initial password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showNewUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="form-hint">8-16 chars, at least 1 uppercase and 1 special character.</p>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register User
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADD STORE */}
      <Modal isOpen={isStoreModalOpen} onClose={() => setIsStoreModalOpen(false)} title="Register Store Outlet">
        <form onSubmit={handleAddStoreSubmit}>
          {storeFormErrors.length > 0 && (
            <div className="alert alert-error" style={{ flexDirection: 'column', gap: '0.3rem', padding: '0.75rem' }}>
              {storeFormErrors.map((err, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Store Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Vibrant Bakery and Confectionery Store (min 2 chars)"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              placeholder="Enter store location address (max 400 characters)"
              value={newStoreAddress}
              onChange={(e) => setNewStoreAddress(e.target.value)}
              maxLength={400}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Store Owner</label>
            <select className="select-control" style={{ width: '100%' }} value={newStoreOwner} onChange={(e) => setNewStoreOwner(e.target.value)} required>
              <option value="">Select Store Owner...</option>
              {unassignedOwners.map((own) => (
                <option key={own.id} value={own.id}>
                  {own.name} ({own.email})
                </option>
              ))}
            </select>
            <p className="form-hint">Only lists Store Owners who are not currently assigned to any outlet.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Store Logo / Cover Image (Stored Locally)</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => setNewStoreLogo(e.target.files[0])}
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStoreModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Store
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: VIEW PROFILE DETAILS */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="User Account Details">
        {selectedUserDetails && (
          <div className="user-details-card">
            <div className="details-row">
              <div className="details-label">ID</div>
              <div className="details-val">{selectedUserDetails.id}</div>
            </div>
            <div className="details-row">
              <div className="details-label">Name</div>
              <div className="details-val">{selectedUserDetails.name}</div>
            </div>
            <div className="details-row">
              <div className="details-label">Email</div>
              <div className="details-val">{selectedUserDetails.email}</div>
            </div>
            <div className="details-row">
              <div className="details-label">Address</div>
              <div className="details-val">{selectedUserDetails.address}</div>
            </div>
            <div className="details-row">
              <div className="details-label">Role</div>
              <div className="details-val">{getRoleDisplayName(selectedUserDetails.role)}</div>
            </div>
            
            {selectedUserDetails.role === 'owner' && (
              <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '700' }}>
                  <Store size={16} /> Assigned Store Performance
                </h4>
                {selectedUserDetails.store ? (
                  <>
                    <div className="details-row" style={{ border: 'none', padding: '0.2rem 0' }}>
                      <div className="details-label">Store Name</div>
                      <div className="details-val">{selectedUserDetails.store.store_name}</div>
                    </div>
                    <div className="details-row" style={{ border: 'none', padding: '0.2rem 0' }}>
                      <div className="details-label">Average Score</div>
                      <div className="details-val">
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#fef3c7', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#d97706', fontWeight: '700', fontSize: '0.8rem' }}>
                          <Star size={11} fill="#d97706" />
                          <span>{parseFloat(selectedUserDetails.store.average_rating).toFixed(1)} / 5.0</span>
                        </div>
                      </div>
                    </div>
                    <div className="details-row" style={{ border: 'none', padding: '0.2rem 0' }}>
                      <div className="details-label">Total Votes</div>
                      <div className="details-val">{selectedUserDetails.store.total_ratings} ratings</div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No store outlet currently linked to this owner.</p>
                )}
              </div>
            )}
            
            <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
              <button type="button" className="btn btn-primary" onClick={() => startEditUser(selectedUserDetails)}>
                Edit Profile
              </button>
              <button type="button" className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={() => handleDeleteUser(selectedUserDetails.id)}>
                Delete User
              </button>
              <button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: EDIT USER */}
      <Modal isOpen={isEditUserModalOpen} onClose={() => setIsEditUserModalOpen(false)} title="Edit User Account">
        <form onSubmit={handleEditUserSubmit}>
          {editUserFormErrors.length > 0 && (
            <div className="alert alert-error" style={{ flexDirection: 'column', gap: '0.3rem', padding: '0.75rem' }}>
              {editUserFormErrors.map((err, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Johnathan Alexander Doe (min 2 characters)"
              value={editUserName}
              onChange={(e) => setEditUserName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={editUserEmail}
              onChange={(e) => setEditUserEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="select-control" style={{ width: '100%' }} value={editUserRole} onChange={(e) => setEditUserRole(e.target.value)}>
              <option value="normal">User</option>
              <option value="owner">Store Owner</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              placeholder="Enter residence address (max 400 characters)"
              value={editUserAddress}
              onChange={(e) => setEditUserAddress(e.target.value)}
              maxLength={400}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (Leave blank to keep current)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showEditUserPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingRight: '2.5rem' }}
                placeholder="Set new password (optional)"
                value={editUserPassword}
                onChange={(e) => setEditUserPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showEditUserPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="form-hint">8-16 chars, at least 1 uppercase and 1 special character.</p>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditUserModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: EDIT STORE */}
      <Modal isOpen={isEditStoreModalOpen} onClose={() => setIsEditStoreModalOpen(false)} title="Edit Store Outlet">
        <form onSubmit={handleEditStoreSubmit}>
          {editStoreFormErrors.length > 0 && (
            <div className="alert alert-error" style={{ flexDirection: 'column', gap: '0.3rem', padding: '0.75rem' }}>
              {editStoreFormErrors.map((err, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Store Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Vibrant Bakery and Confectionery Store (min 2 chars)"
              value={editStoreName}
              onChange={(e) => setEditStoreName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              placeholder="Enter store location address (max 400 characters)"
              value={editStoreAddress}
              onChange={(e) => setEditStoreAddress(e.target.value)}
              maxLength={400}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Store Owner</label>
            <select className="select-control" style={{ width: '100%' }} value={editStoreOwner} onChange={(e) => setEditStoreOwner(e.target.value)} required>
              <option value="">Select Store Owner...</option>
              {getEditStoreOwnerOptions().map((own) => (
                <option key={own.id} value={own.id}>
                  {own.name} ({own.email})
                </option>
              ))}
            </select>
            <p className="form-hint">Only lists Store Owners who are not currently assigned to any outlet.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Store Logo / Cover Image (Leave blank to keep current)</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => setEditStoreLogo(e.target.files[0])}
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditStoreModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
