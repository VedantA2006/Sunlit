import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';

export const UserManagement = () => {
  const navigate = useNavigate();
  const { logout, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Add User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    address: '',
    companyName: '',
    gstNumber: ''
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user accounts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle user status
  const handleToggleStatus = async (user) => {
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      const updatedStatus = !user.isActive;
      await api.put(`/users/${user._id}/status`, { isActive: updatedStatus });
      setSuccess(`Status of user "${user.name}" updated successfully to ${updatedStatus ? 'Active' : 'Inactive'}.`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"? All associated profiles will be removed.`)) return;
    setActionLoading(true);
    setSuccess('');
    setError('');
    try {
      await api.delete(`/users/${id}`);
      setSuccess(`User "${name}" deleted successfully.`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/users', newUser);
      setSuccess(`User "${newUser.name}" registered successfully!`);
      setIsModalOpen(false);
      // Reset form
      setNewUser({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        address: '',
        companyName: '',
        gstNumber: ''
      });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = searchQuery 
      ? u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery))
      : true;
    const matchesRole = filterRole ? u.role === filterRole : true;
    const matchesStatus = filterStatus 
      ? (filterStatus === 'Active' ? u.isActive === true : u.isActive === false)
      : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats Counters
  const totalUsersCount = users.length;
  const activeTechniciansCount = users.filter(u => u.role === 'technician' && u.isActive).length;
  const activeCustomersCount = users.filter(u => u.role === 'customer' && u.isActive).length;

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden min-h-screen flex">
      {/* SideBar Shared Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface border-r border-outline-variant flex flex-col justify-between p-6 z-30">
        <div className="space-y-6">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl font-variation-settings-[('FILL'_1)]">bolt</span>
            <span className="font-display-lg text-headline-md text-primary font-bold tracking-tight">ARENQ</span>
          </Link>

          {/* Quick User Status Info */}
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col gap-1.5 text-left">
            <span className="font-label-md text-label-md text-on-surface-variant font-bold">Hello, {currentUser?.name || 'Admin'}!</span>
            <span className="font-caption text-caption text-outline">System Control Portal</span>
            <span className="font-caption text-caption font-mono text-primary bg-primary-fixed/50 px-2 py-0.5 rounded self-start mt-1">Role: {currentUser?.role}</span>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold transition-all text-on-surface-variant hover:bg-surface-container-low hover:text-primary text-left"
            >
              <span className="material-symbols-outlined">dashboard</span>
              Admin Overview
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold transition-all bg-primary text-on-primary shadow-md text-left"
            >
              <span className="material-symbols-outlined">group</span>
              User Management
            </Link>
          </div>
        </div>

        {/* Log Out */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-label-md text-label-md font-bold text-error hover:bg-error-container/30 transition-all mt-auto"
        >
          <span className="material-symbols-outlined">logout</span>
          Log Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[280px] flex-1 min-h-screen bg-surface-container-lowest p-8 flex flex-col text-left">
        
        {/* Page Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display-lg text-headline-lg text-on-surface">User Access Management</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Manage corporate staff roles, customer registrations, and service access privileges.</p>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={fetchUsers}
              className="flex items-center gap-1.5 bg-surface border border-outline-variant px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all"
            >
              <span className="material-symbols-outlined text-sm">sync</span> Refresh List
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all hover:bg-secondary-container"
            >
              <span className="material-symbols-outlined text-sm">person_add</span> Add New User
            </button>
          </div>
        </header>

        {/* Success / Error Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-brand-success text-sm rounded-xl flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-brand-error text-sm rounded-xl flex items-center gap-2 font-medium">
            <span className="material-symbols-outlined text-red-600">warning</span>
            {error}
          </div>
        )}

        {/* Stats Summary Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-outline text-xxs font-semibold uppercase tracking-wider mb-1">Total System Users</p>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{totalUsersCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-2xl font-variation-settings-[('FILL'_1)]">group</span>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-outline text-xxs font-semibold uppercase tracking-wider mb-1">Active Technicians</p>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{activeTechniciansCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-2xl font-variation-settings-[('FILL'_1)]">engineering</span>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant p-6 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-outline text-xxs font-semibold uppercase tracking-wider mb-1">Active Customers</p>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{activeCustomersCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-2xl font-variation-settings-[('FILL'_1)]">verified_user</span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-5 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-semibold text-on-surface bg-surface-container-low"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant focus:outline-none text-xs font-semibold text-on-surface bg-surface-container-low"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
              <option value="customer">Customer</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-outline-variant focus:outline-none text-xs font-semibold text-on-surface bg-surface-container-low"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Table list */}
        <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden mb-8">
          {isLoading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-outline text-sm">
              No matching accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-[10px] font-bold text-outline uppercase tracking-wider">
                    <th className="py-3.5 px-6">User Name</th>
                    <th className="py-3.5 px-6">Email / Phone</th>
                    <th className="py-3.5 px-6">System Role</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs">
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="hover:bg-surface-container-low/35 transition-colors">
                      <td className="py-4 px-6 font-bold text-on-surface flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center uppercase font-black border border-outline-variant">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <span>{user.name}</span>
                          <span className="block text-[10px] text-outline font-normal">Registered {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-outline">mail</span> {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="material-symbols-outlined text-sm text-outline">call</span> {user.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          user.role === 'technician' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={actionLoading}
                          className={`px-3 py-1 rounded text-xxs font-bold transition-all shadow-sm ${
                            user.isActive 
                              ? 'bg-surface-container-high hover:bg-outline-variant/35 text-on-surface'
                              : 'bg-secondary hover:bg-secondary-container text-on-secondary'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          disabled={actionLoading}
                          className="text-outline hover:text-error transition-colors p-1"
                        >
                          <span className="material-symbols-outlined text-sm align-middle">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 border border-outline-variant relative max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">Register System Account</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                >
                  <option value="customer">Customer</option>
                  <option value="technician">Technician</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Installation Address</label>
                <textarea
                  value={newUser.address}
                  onChange={(e) => setNewUser(prev => ({ ...prev, address: e.target.value }))}
                  rows="2"
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                />
              </div>

              {newUser.role === 'customer' && (
                <div className="grid grid-cols-2 gap-4 border-t border-outline-variant/30 pt-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Company Name</label>
                    <input
                      type="text"
                      value={newUser.companyName}
                      onChange={(e) => setNewUser(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">GST Number</label>
                    <input
                      type="text"
                      value={newUser.gstNumber}
                      onChange={(e) => setNewUser(prev => ({ ...prev, gstNumber: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs font-medium text-on-surface bg-surface-container-low"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-high hover:bg-outline-variant/35 text-on-surface text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl transition-all shadow-sm hover:bg-primary-container"
                >
                  {actionLoading ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
