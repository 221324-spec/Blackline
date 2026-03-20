import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './MentorDashboard.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MentorDashboard() {
  const [stats, setStats] = useState({
    totalResources: 0,
    approvedResources: 0,
    pendingResources: 0,
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    helpfulRepliesCount: 0,
    unansweredQuestions: 0
  });
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mentorName, setMentorName] = useState('Mentor');

  useEffect(() => {
    // Get mentor name from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setMentorName(decoded.name?.split(' ')[0] || 'Mentor');
      } catch (err) {
        // Token decode error
      }
    }

    loadMentorData();
  }, []);

  const loadMentorData = async () => {
    try {
      setLoading(true);
      const [statsResponse, contentResponse] = await Promise.all([
        axios.get(`${API_BASE}/api/mentor/stats`, { headers: authHeader() }),
        axios.get(`${API_BASE}/api/mentor/content`, { headers: authHeader() })
      ]);

      setStats(statsResponse.data);
      setRecentQuestions(statsResponse.data.recentUnansweredQuestions || []);
      setMyResources(contentResponse.data.resources || []);
    } catch (error) {
      // Failed to load mentor data
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mentor-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading mentor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>👨‍🏫 Welcome Back, {mentorName}!</h1>
          <p className="subtitle">Guide and inspire the next generation of traders</p>
        </div>
        <div className="header-actions">
          <Link to="/profile" className="btn btn-secondary">
            👤 My Profile
          </Link>
          <Link to="/forum" className="btn btn-primary">
            ✍️ Create Post
          </Link>
          <Link to="/resources" className="btn btn-secondary">
            📚 Add Resource
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon">�</div>
          <div className="stat-content">
            <h3>{stats.totalResources}</h3>
            <p>Resources Created</p>
            <span className="stat-detail">{stats.approvedResources} approved</span>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">�️</div>
          <div className="stat-content">
            <h3>{stats.totalViews}</h3>
            <p>Total Views</p>
            <span className="stat-detail">On your content</span>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <h3>{stats.totalLikes}</h3>
            <p>Likes Received</p>
            <span className="stat-detail">Community appreciation</span>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <h3>{stats.helpfulRepliesCount}</h3>
            <p>Helpful Answers</p>
            <span className="stat-detail">Marked by traders</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Unanswered Questions - Mentors help traders */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>❓ Traders Need Help</h2>
            <Link to="/forum" className="view-all-link">View All →</Link>
          </div>
          <div className="card-content">
            {recentQuestions.length > 0 ? (
              <div className="posts-list">
                {recentQuestions.map((question) => (
                  <div key={question._id} className="post-item">
                    <div className="post-header">
                      <h4>{question.title}</h4>
                      <span className="post-date">
                        by {question.authorId?.name || 'Trader'} • {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="post-excerpt">{question.body?.substring(0, 100) || 'No content'}...</p>
                    <div className="post-stats">
                      <span className="stat unanswered">
                        ⏰ Unanswered
                      </span>
                      <Link to="/forum" className="btn btn-sm btn-primary">
                        Answer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>🎉 All questions answered! Great work!</p>
                <Link to="/forum" className="btn btn-sm btn-primary">
                  Check Forum
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Your Resources - What YOU created */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>📚 Your Resources</h2>
            <Link to="/resources" className="view-all-link">Manage →</Link>
          </div>
          <div className="card-content">
            {myResources.length > 0 ? (
              <div className="resources-grid">
                {myResources.slice(0, 4).map((resource) => (
                  <div key={resource._id} className="resource-item">
                    <span className={`resource-badge ${resource.category?.toLowerCase() || 'general'}`}>
                      {resource.category || 'General'}
                    </span>
                    <h4>{resource.title}</h4>
                    <p>{resource.body?.substring(0, 80) || 'No description'}...</p>
                    <div className="resource-stats">
                      <span>👁️ {resource.views || 0}</span>
                      <span>❤️ {resource.likes?.length || 0}</span>
                      <span className={resource.approved ? 'approved' : 'pending'}>
                        {resource.approved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No resources created yet. Start sharing your knowledge!</p>
                <Link to="/resources" className="btn btn-sm btn-primary">
                  Create Resource
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mentor Actions */}
      <div className="mentor-actions-section">
        <h2>🎯 Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/forum" className="action-card">
            <div className="action-icon">❓</div>
            <h3>Answer Questions</h3>
            <p>Help {stats.unansweredQuestions} traders waiting for answers</p>
          </Link>

          <Link to="/resources" className="action-card">
            <div className="action-icon">📚</div>
            <h3>Create Resource</h3>
            <p>Share educational content and guides</p>
          </Link>

          <Link to="/forum" className="action-card">
            <div className="action-icon">✍️</div>
            <h3>Write Article</h3>
            <p>Share your trading insights and strategies</p>
          </Link>

          <Link to="/resources" className="action-card">
            <div className="action-icon">📊</div>
            <h3>Teaching Impact</h3>
            <p>View your mentorship analytics and reach</p>
          </Link>
        </div>
      </div>

      {/* Mentor Tips */}
      <div className="dashboard-card mentor-tips">
        <div className="card-header">
          <h2>💡 Mentoring Best Practices</h2>
        </div>
        <div className="card-content">
          <ul className="tips-list">
            <li>
              <span className="tip-icon">✅</span>
              <div>
                <strong>Be Active:</strong> Regular engagement helps build trust with the community
              </div>
            </li>
            <li>
              <span className="tip-icon">✅</span>
              <div>
                <strong>Share Experiences:</strong> Real trading examples are more valuable than theory
              </div>
            </li>
            <li>
              <span className="tip-icon">✅</span>
              <div>
                <strong>Encourage Questions:</strong> Create a safe space for traders to learn
              </div>
            </li>
            <li>
              <span className="tip-icon">✅</span>
              <div>
                <strong>Stay Updated:</strong> Keep your resources current with market trends
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
