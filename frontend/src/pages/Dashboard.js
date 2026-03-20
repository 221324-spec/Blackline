import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [userData, metricsData, tradesData, postsData] = await Promise.all([
        api.getMe().catch(() => null),
        api.getMetrics().catch(() => null),
        api.getTrades().catch(() => ({ trades: [] })),
        api.getPosts().catch(() => ({ posts: [] }))
      ]);

      setUser(userData);
      setMetrics(metricsData);
      setRecentTrades((tradesData.trades || []).slice(0, 5));
      setRecentPosts((postsData.posts || []).slice(0, 3));
    } catch (error) {
      // Failed to load dashboard
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="modern-dashboard">
        <div className="loading-spinner">Loading your dashboard...</div>
      </div>
    );
  }

  const userName = user?.name || user?.email?.split('@')[0] || 'Trader';
  const greeting = getGreeting();

  return (
    <div className="modern-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome-card">
        <div className="welcome-content">
          <h1 className="welcome-title">
            {greeting}, {userName}! 👋
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening with your trading today
          </p>
        </div>
        {user && (
          <div className="user-avatar-section">
            <div className="user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="user-info-mini">
              <span className="user-name-mini">{userName}</span>
              <span className={`role-badge-mini ${user.role?.toLowerCase()}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {metrics && (
        <div className="quick-stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">📈</div>
            <div className="stat-details">
              <span className="stat-label">Total Trades</span>
              <span className="stat-value">{metrics.total || 0}</span>
              <span className="stat-change positive">+5 this week</span>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">🎯</div>
            <div className="stat-details">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">{metrics.winRate || 0}%</span>
              <span className="stat-change positive">+2.5% vs last month</span>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">⚖️</div>
            <div className="stat-details">
              <span className="stat-label">Avg R:R</span>
              <span className="stat-value">{metrics.avgRR || 0}</span>
              <span className="stat-change neutral">Stable</span>
            </div>
          </div>

          <div className="stat-card stat-grade">
            <div className="stat-icon">🏆</div>
            <div className="stat-details">
              <span className="stat-label">Current Grade</span>
              <span className={`grade-badge-large grade-${metrics.grade?.toLowerCase()}`}>
                {metrics.grade || 'N/A'}
              </span>
              <span className="stat-change positive">Keep it up!</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Recent Activity */}
        <div className="dashboard-card recent-activity-card">
          <div className="card-header">
            <h3>
              <span className="card-icon">📊</span>
              Recent Trades
            </h3>
            <Link to="/trades" className="view-all-link">View All →</Link>
          </div>
          
          {recentTrades.length > 0 ? (
            <div className="activity-list">
              {recentTrades.map(trade => {
                const profit = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2);
                const isProfit = parseFloat(profit) > 0;
                
                return (
                  <div key={trade._id} className="activity-item">
                    <div className="activity-icon-wrapper">
                      <span className="activity-icon">{isProfit ? '📈' : '📉'}</span>
                    </div>
                    <div className="activity-details">
                      <span className="activity-title">{trade.symbol}</span>
                      <span className="activity-time">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`activity-badge ${isProfit ? 'positive' : 'negative'}`}>
                      {isProfit ? '+' : ''}{profit}%
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-card-state">
              <span className="empty-icon">📝</span>
              <p>No trades yet</p>
              <Link to="/trades" className="btn-secondary-small">Add Trade</Link>
            </div>
          )}
        </div>

        {/* Community Activity */}
        <div className="dashboard-card community-card">
          <div className="card-header">
            <h3>
              <span className="card-icon">💬</span>
              Community
            </h3>
            <Link to="/forum" className="view-all-link">View All →</Link>
          </div>
          
          {recentPosts.length > 0 ? (
            <div className="community-list">
              {recentPosts.map(post => (
                <div key={post._id} className="community-item">
                  <div className="community-avatar">
                    {post.author?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="community-details">
                    <span className="community-title">{post.title}</span>
                    <span className="community-meta">
                      by {post.author?.name || 'User'} • {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="community-stats">
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-card-state">
              <span className="empty-icon">💬</span>
              <p>No recent posts</p>
              <Link to="/forum" className="btn-secondary-small">Browse Forum</Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card quick-actions-card full-width">
          <div className="card-header">
            <h3>
              <span className="card-icon">⚡</span>
              Quick Actions
            </h3>
          </div>
          <div className="quick-actions-grid">
            <Link to="/trades" className="quick-action-btn">
              <span className="action-icon">📝</span>
              <span className="action-label">Log Trade</span>
              <span className="action-desc">Record new trade</span>
            </Link>
            
            <Link to="/analytics" className="quick-action-btn">
              <span className="action-icon">📊</span>
              <span className="action-label">Analytics</span>
              <span className="action-desc">View insights</span>
            </Link>
            
            <Link to="/resources" className="quick-action-btn">
              <span className="action-icon">📚</span>
              <span className="action-label">Learn</span>
              <span className="action-desc">Browse resources</span>
            </Link>
            
            <Link to="/forum" className="quick-action-btn">
              <span className="action-icon">💬</span>
              <span className="action-label">Community</span>
              <span className="action-desc">Join discussion</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="tips-section">
        <div className="tip-card">
          <span className="tip-icon">💡</span>
          <div className="tip-content">
            <strong>Trading Tip:</strong> Maintain a minimum 2:1 risk-reward ratio for consistent profitability
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
