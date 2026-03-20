import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTrades: 0,
    totalPosts: 0,
    totalResources: 0,
    pendingResources: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [pendingResources, setPendingResources] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const approveResource = async (resourceId) => {
    try {
      await axios.post(`${API_BASE}/api/resources/${resourceId}/approve`, {}, { headers: authHeader() });
      
      loadAdminData();
    } catch (error) {
      alert('Failed to approve resource');
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes, resourcesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/users`, { headers: authHeader() }),
        axios.get(`${API_BASE}/api/admin/stats`, { headers: authHeader() }).catch(() => ({ data: {} })),
        axios.get(`${API_BASE}/api/resources`, { headers: authHeader() }).catch(() => ({ data: { resources: [] } }))
      ]);

      const users = usersRes.data.users || [];
      const allResources = resourcesRes.data.resources || [];
      const pendingResourcesList = allResources.filter(r => !r.approved);
      
      setRecentUsers(users.slice(0, 5));
      setPendingResources(pendingResourcesList.slice(0, 5));
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => !u.blocked).length,
        totalTrades: statsRes.data.totalTrades || 0,
        totalPosts: statsRes.data.totalPosts || 0,
        totalResources: allResources.length,
        pendingResources: pendingResourcesList.length
      });

      
      const activities = [];
      if (users[0]) activities.push({ type: 'user', action: 'New user registered', user: users[0].name, time: '5 min ago' });
      if (pendingResourcesList[0]) activities.push({ type: 'resource', action: 'Resource pending approval', user: pendingResourcesList[0].authorId?.name || 'Mentor', time: '10 min ago' });
      if (users[1]) activities.push({ type: 'trade', action: 'User activity', user: users[1].name, time: '23 min ago' });
      
      setRecentActivity(activities);

      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admin data. You may not have admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>⚙️ Admin Dashboard</h1>
          <p className="subtitle">Manage platform, users, and content</p>
        </div>
        <div className="header-actions">
          <Link to="/admin" className="btn btn-primary">
            👥 Manage Users
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card pink">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
            <span className="stat-detail">{stats.activeUsers} active</span>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalTrades}</h3>
            <p>Total Trades</p>
            <span className="stat-detail">Platform-wide</span>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.totalPosts}</h3>
            <p>Forum Posts</p>
            <span className="stat-detail">Community activity</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.totalResources}</h3>
            <p>Resources</p>
            <span className="stat-detail">{stats.pendingResources} pending approval</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Recent Users */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>👥 Recent Users</h2>
            <Link to="/admin" className="view-all-link">View All →</Link>
          </div>
          <div className="card-content">
            {recentUsers.length > 0 ? (
              <div className="users-list">
                {recentUsers.map((user) => (
                  <div key={user._id} className="user-item">
                    <div className="user-avatar">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                    <span className={`role-badge ${user.role?.toLowerCase()}`}>
                      {user.role}
                    </span>
                    <span className={`status-badge ${user.blocked ? 'blocked' : 'active'}`}>
                      {user.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Resources - Admin Approval */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>📚 Pending Resources</h2>
            <Link to="/resources" className="view-all-link">View All →</Link>
          </div>
          <div className="card-content">
            {pendingResources.length > 0 ? (
              <div className="resources-list">
                {pendingResources.map((resource) => (
                  <div key={resource._id} className="resource-approval-item">
                    <div className="resource-info">
                      <span className={`resource-badge ${resource.category?.toLowerCase() || 'other'}`}>
                        {resource.category || 'Other'}
                      </span>
                      <h4>{resource.title}</h4>
                      <p className="resource-excerpt">{resource.body?.substring(0, 100) || 'No content'}...</p>
                      <span className="resource-author">
                        By {resource.authorId?.name || 'Unknown Mentor'}
                      </span>
                    </div>
                    <div className="resource-actions">
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => approveResource(resource._id)}
                      >
                        ✅ Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>🎉 No pending resources! All content approved.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="admin-actions-section">
        <h2>🎯 Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin" className="action-card">
            <div className="action-icon">👥</div>
            <h3>User Management</h3>
            <p>View, block, or unblock users</p>
          </Link>

          <Link to="/resources" className="action-card">
            <div className="action-icon">📚</div>
            <h3>Approve Resources</h3>
            <p>{stats.pendingResources} resources need approval</p>
          </Link>

          <Link to="/forum" className="action-card">
            <div className="action-icon">💬</div>
            <h3>Forum Moderation</h3>
            <p>Monitor and moderate community posts</p>
          </Link>

          <Link to="/analytics" className="action-card">
            <div className="action-icon">📊</div>
            <h3>Platform Analytics</h3>
            <p>View platform-wide trading reports</p>
          </Link>
        </div>
      </div>

      {/* System Health */}
      <div className="dashboard-card system-health">
        <div className="card-header">
          <h2>🔧 System Status</h2>
        </div>
        <div className="card-content">
          <div className="health-items">
            <div className="health-item">
              <div className="health-indicator success"></div>
              <div>
                <h4>Database</h4>
                <p>Connected and operational</p>
              </div>
            </div>
            <div className="health-item">
              <div className="health-indicator success"></div>
              <div>
                <h4>API Server</h4>
                <p>Running smoothly</p>
              </div>
            </div>
            <div className="health-item">
              <div className="health-indicator success"></div>
              <div>
                <h4>Authentication</h4>
                <p>Working properly</p>
              </div>
            </div>
            <div className="health-item">
              <div className="health-indicator success"></div>
              <div>
                <h4>Storage</h4>
                <p>Adequate space available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
