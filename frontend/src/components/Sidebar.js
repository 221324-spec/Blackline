import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import './Sidebar.css';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        // Token decode error
      }
    }
  }, []);

  // Close sidebar when route changes (on mobile)
  useEffect(() => {
    if (setSidebarOpen) setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  async function handleLogout() {
    try {
      await api.logout();
      localStorage.removeItem('token');
      navigate('/');
    } catch (err) {
      localStorage.removeItem('token');
      navigate('/');
    }
  }

  if (!user) return null;

  const role = user.role;

  const getNavItems = () => {
    switch (role) {
      case 'Trader':
        return [
          { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
          { path: '/trades', icon: '📝', label: 'Trades' },
          { path: '/analytics', icon: '📊', label: 'Analytics' },
          { path: '/ai-analysis', icon: '🤖', label: 'AI Insights' },
          { path: '/resources', icon: '📚', label: 'Learn' },
          { path: '/forum', icon: '💬', label: 'Community' }
        ];
      case 'Mentor':
        return [
          { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
          { path: '/resources', icon: '📚', label: 'Resources' },
          { path: '/forum', icon: '�', label: 'Community' },
          { path: '/profile', icon: '�', label: 'My Profile' }
        ];
      case 'Admin':
        return [
          { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
          { path: '/admin', icon: '⚙️', label: 'Users' },
          { path: '/resources', icon: '📚', label: 'Content' },
          { path: '/forum', icon: '💬', label: 'Forum' },
          { path: '/analytics', icon: '📊', label: 'Reports' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleBadgeClass = () => {
    switch (role) {
      case 'Trader': return 'role-badge-trader';
      case 'Mentor': return 'role-badge-mentor';
      case 'Admin': return 'role-badge-admin';
      default: return '';
    }
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${sidebarOpen ? 'active' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {!collapsed && (
            <>
              <div className="brand-logo">BM</div>
              <span className="brand-text">Blackline Matrix</span>
            </>
          )}
          {collapsed && <div className="brand-logo-small">BM</div>}
        </div>
        <button 
          className="sidebar-toggle" 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {/* User Profile Section */}
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        {!collapsed && (
          <div className="profile-info">
            <div className="profile-name">{user.name || 'User'}</div>
            <div className={`profile-role ${getRoleBadgeClass()}`}>
              {role}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <span className="nav-icon">🚪</span>
          {!collapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </div>
  );
}
