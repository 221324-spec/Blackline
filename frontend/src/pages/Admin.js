import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Admin.css';
import './TraderDashboard.css'; 

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/users`, { headers: authHeader() }),
        axios.get(`${API_BASE}/api/admin/stats`, { headers: authHeader() })
      ]);
      setUsers(usersRes.data.users || []);
      setStats(statsRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admin data. You may not have admin permissions.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBlockUser(userId, shouldBlock) {
    try {
      const endpoint = shouldBlock ? 'block' : 'unblock';
      await axios.post(`${API_BASE}/api/admin/users/${userId}/${endpoint}`, {}, { headers: authHeader() });
      await loadData();
    } catch (err) {
      alert('Failed to update user status: ' + (err.response?.data?.error || err.message));
    }
  }

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading admin panel...</p>
    </div>
  );
  if (error) return <div className="error-state"><p>{error}</p></div>;

  return (
    <div className="role-dashboard admin-dashboard">
      <div className="dashboard-welcome">
        <div>
          <h1>Admin Control Panel</h1>
          <p>System management and moderation</p>
        </div>
      </div>

      {stats && (
        <div className="metrics-grid-modern">
          <div className="metric-card-modern admin-primary">
            <div className="metric-icon">👥</div>
            <div className="metric-info">
              <span className="metric-label">Total Users</span>
              <span className="metric-value">{stats.totalUsers || 0}</span>
            </div>
          </div>
          <div className="metric-card-modern admin-success">
            <div className="metric-icon">📊</div>
            <div className="metric-info">
              <span className="metric-label">Total Trades</span>
              <span className="metric-value">{stats.totalTrades || 0}</span>
            </div>
          </div>
          <div className="metric-card-modern admin-info">
            <div className="metric-icon">📚</div>
            <div className="metric-info">
              <span className="metric-label">Resources</span>
              <span className="metric-value">{stats.totalResources || 0}</span>
            </div>
          </div>
          <div className="metric-card-modern admin-gradient">
            <div className="metric-icon">💬</div>
            <div className="metric-info">
              <span className="metric-label">Forum Posts</span>
              <span className="metric-value">{stats.totalPosts || 0}</span>
            </div>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="users-section-modern">
          <div className="section-header">
            <h3>User Management</h3>
          </div>
          {users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p>No users found in the system.</p>
            </div>
          ) : (
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td className="user-name">{user.name || 'N/A'}</td>
                      <td className="email-cell">{user.email}</td>
                      <td>
                        <span className={`role-badge-modern ${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge-modern ${user.isBlocked ? 'blocked' : 'active'}`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        {user.role !== 'Admin' && (
                          <button 
                            className={`action-btn ${user.isBlocked ? 'btn-unblock' : 'btn-block'}`}
                            onClick={() => handleBlockUser(user._id, !user.isBlocked)}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
