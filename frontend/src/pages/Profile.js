import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import './Profile.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nickName: '',
    gender: '',
    country: '',
    language: '',
    timezone: '',
    avatarUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found' });
        setLoading(false);
        return;
      }
      
      const decoded = jwtDecode(token);
      const userId = decoded.id;
      
      if (!userId) {
        setMessage({ type: 'error', text: 'Invalid token - no user ID found' });
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE}/api/users/${userId}`, {
        headers: authHeader()
      });
      
      setUser(response.data);
      setFormData({
        name: response.data.name || '',
        nickName: response.data.nickName || '',
        gender: response.data.gender || '',
        country: response.data.country || '',
        language: response.data.language || '',
        timezone: response.data.timezone || '',
        avatarUrl: response.data.avatarUrl || ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to load profile data' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      const userId = decoded.id;

      await axios.put(`${API_BASE}/api/users/${userId}`, formData, {
        headers: authHeader()
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      await loadUserProfile();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      nickName: user.nickName || '',
      gender: user.gender || '',
      country: user.country || '',
      language: user.language || '',
      timezone: user.timezone || '',
      avatarUrl: user.avatarUrl || ''
    });
    setEditing(false);
    setMessage({ type: '', text: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="profile-page-new">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const getCurrentDate = () => {
    const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  if (!user && !loading) {
    return (
      <div className="profile-page-new">
        <div className="profile-header-new">
          <div className="profile-welcome">
            <h1>Profile Error</h1>
            <p className="profile-date">{getCurrentDate()}</p>
          </div>
        </div>
        <div className="profile-content-card">
          <div className="error-container" style={{ padding: '4rem', textAlign: 'center' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Unable to Load Profile</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              {message.text || 'Failed to load profile data. Please try again.'}
            </p>
            <button 
              onClick={loadUserProfile}
              style={{
                padding: '0.875rem 2rem',
                background: '#5F72BD',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-new">
      {/* Header */}
      <div className="profile-header-new">
        <div className="profile-welcome">
          <h1>Welcome, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="profile-date">{getCurrentDate()}</p>
        </div>
        <div className="profile-header-actions-new">
          <div className="search-box-profile">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Search" />
          </div>
          <button className="notification-btn">🔔</button>
          <div className="user-avatar-header">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="User" />
            ) : (
              <span>{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="profile-content-card">
        {/* Cover Banner */}
        <div className="profile-banner">
          <div className="banner-gradient"></div>
        </div>

        {/* Profile Info Section */}
        <div className="profile-info-section">
          <div className="profile-avatar-container">
            <div className="profile-avatar-circle">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Profile" />
              ) : (
                <span className="avatar-placeholder">
                  {(formData.name || user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
          
          <div className="profile-user-info">
            <h2>{user?.name || 'User Name'}</h2>
            <p className="user-email">{user?.email}</p>
          </div>

          {!editing && (
            <button className="btn-edit-new" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`alert-new alert-${message.type}`}>
            <span className="alert-icon-new">{message.type === 'success' ? '✅' : '❌'}</span>
            {message.text}
            <button className="alert-close-new" onClick={() => setMessage({ type: '', text: '' })}>×</button>
          </div>
        )}

        {/* Profile Form */}
        <div className="profile-form-container">
          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your First Name"
                  disabled={!editing}
                />
              </div>
              <div className="form-field">
                <label>Nick Name</label>
                <input
                  type="text"
                  name="nickName"
                  value={formData.nickName}
                  onChange={handleChange}
                  placeholder="Your First Name"
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Gender</label>
                <div className="select-wrapper">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={!editing}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Country</label>
                <div className="select-wrapper">
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    disabled={!editing}
                  >
                    <option value="">Select Country</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label>Language</label>
                <div className="select-wrapper">
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    disabled={!editing}
                  >
                    <option value="">Select Language</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Time Zone</label>
                <div className="select-wrapper">
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    disabled={!editing}
                  >
                    <option value="">Select Timezone</option>
                    <option value="UTC-12:00">UTC-12:00</option>
                    <option value="UTC-11:00">UTC-11:00</option>
                    <option value="UTC-10:00">UTC-10:00</option>
                    <option value="UTC-09:00">UTC-09:00</option>
                    <option value="UTC-08:00">UTC-08:00</option>
                    <option value="UTC-07:00">UTC-07:00</option>
                    <option value="UTC-06:00">UTC-06:00</option>
                    <option value="UTC-05:00">UTC-05:00</option>
                    <option value="UTC-04:00">UTC-04:00</option>
                    <option value="UTC-03:00">UTC-03:00</option>
                    <option value="UTC-02:00">UTC-02:00</option>
                    <option value="UTC-01:00">UTC-01:00</option>
                    <option value="UTC+00:00">UTC+00:00</option>
                    <option value="UTC+01:00">UTC+01:00</option>
                    <option value="UTC+02:00">UTC+02:00</option>
                    <option value="UTC+03:00">UTC+03:00</option>
                    <option value="UTC+04:00">UTC+04:00</option>
                    <option value="UTC+05:00">UTC+05:00</option>
                    <option value="UTC+05:30">UTC+05:30</option>
                    <option value="UTC+06:00">UTC+06:00</option>
                    <option value="UTC+07:00">UTC+07:00</option>
                    <option value="UTC+08:00">UTC+08:00</option>
                    <option value="UTC+09:00">UTC+09:00</option>
                    <option value="UTC+10:00">UTC+10:00</option>
                    <option value="UTC+11:00">UTC+11:00</option>
                    <option value="UTC+12:00">UTC+12:00</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Email Section */}
            <div className="email-section">
              <h3>My email Address</h3>
              <div className="email-item">
                <div className="email-icon">📧</div>
                <div className="email-details">
                  <p className="email-address">
                    {user?.email}
                    {user?.isEmailVerified && (
                      <span className="verified-badge">✓ Verified</span>
                    )}
                  </p>
                  <p className="email-time">
                    {user?.createdAt 
                      ? `${Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30))} month${Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30)) !== 1 ? 's' : ''} ago`
                      : '1 month ago'
                    }
                  </p>
                </div>
              </div>
              {editing && (
                <button type="button" className="btn-add-email">
                  + Add Email Address
                </button>
              )}
            </div>

            {/* Account Status Cards - Mentor Specific */}
            {user?.role === 'Mentor' && (
              <div className="account-status-section">
                <h3>Account Status</h3>
                <div className="status-cards-grid">
                  <div className={`status-card ${user?.isEmailVerified ? 'verified' : 'pending'}`}>
                    <div className="status-icon">
                      {user?.isEmailVerified ? '✓' : '⏳'}
                    </div>
                    <div className="status-content">
                      <h4>Email Verification</h4>
                      <p className="status-label">
                        {user?.isEmailVerified ? 'Verified' : 'Pending Verification'}
                      </p>
                      <p className="status-desc">
                        {user?.isEmailVerified 
                          ? 'Your email is verified and secure'
                          : 'Please verify your email address'
                        }
                      </p>
                    </div>
                  </div>

                  <div className={`status-card ${!user?.isBlocked ? 'verified' : 'blocked'}`}>
                    <div className="status-icon">
                      {!user?.isBlocked ? '🛡️' : '🚫'}
                    </div>
                    <div className="status-content">
                      <h4>Account Security</h4>
                      <p className="status-label">
                        {!user?.isBlocked ? 'Secured' : 'Blocked'}
                      </p>
                      <p className="status-desc">
                        {!user?.isBlocked 
                          ? 'Your account is secure and active'
                          : 'Account has been restricted'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="status-card verified">
                    <div className="status-icon">👨‍🏫</div>
                    <div className="status-content">
                      <h4>Mentor Status</h4>
                      <p className="status-label">Approved</p>
                      <p className="status-desc">
                        You can create resources and help traders
                      </p>
                    </div>
                  </div>

                  <div className={`status-card ${user?.isEmailVerified && !user?.isBlocked ? 'verified' : 'pending'}`}>
                    <div className="status-icon">
                      {user?.isEmailVerified && !user?.isBlocked ? '✅' : '📋'}
                    </div>
                    <div className="status-content">
                      <h4>Profile Completion</h4>
                      <p className="status-label">
                        {user?.isEmailVerified && !user?.isBlocked ? 'Complete' : 'Incomplete'}
                      </p>
                      <p className="status-desc">
                        {user?.isEmailVerified && !user?.isBlocked
                          ? 'All requirements met'
                          : 'Complete verification steps'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Status Cards - Trader Specific */}
            {user?.role === 'Trader' && (
              <div className="account-status-section">
                <h3>Account Status</h3>
                <div className="status-cards-grid">
                  <div className={`status-card ${user?.isEmailVerified ? 'verified' : 'pending'}`}>
                    <div className="status-icon">
                      {user?.isEmailVerified ? '✓' : '⏳'}
                    </div>
                    <div className="status-content">
                      <h4>Email Verification</h4>
                      <p className="status-label">
                        {user?.isEmailVerified ? 'Verified' : 'Pending Verification'}
                      </p>
                      <p className="status-desc">
                        {user?.isEmailVerified 
                          ? 'Your email is verified and secure'
                          : 'Please verify your email address'
                        }
                      </p>
                    </div>
                  </div>

                  <div className={`status-card ${!user?.isBlocked ? 'verified' : 'blocked'}`}>
                    <div className="status-icon">
                      {!user?.isBlocked ? '🛡️' : '🚫'}
                    </div>
                    <div className="status-content">
                      <h4>Account Security</h4>
                      <p className="status-label">
                        {!user?.isBlocked ? 'Secured' : 'Blocked'}
                      </p>
                      <p className="status-desc">
                        {!user?.isBlocked 
                          ? 'Your account is secure and active'
                          : 'Account has been restricted'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="status-card verified">
                    <div className="status-icon">📈</div>
                    <div className="status-content">
                      <h4>Trader Status</h4>
                      <p className="status-label">Active</p>
                      <p className="status-desc">
                        Access resources and connect with mentors
                      </p>
                    </div>
                  </div>

                  <div className={`status-card ${user?.isEmailVerified && !user?.isBlocked ? 'verified' : 'pending'}`}>
                    <div className="status-icon">
                      {user?.isEmailVerified && !user?.isBlocked ? '✅' : '📋'}
                    </div>
                    <div className="status-content">
                      <h4>Profile Completion</h4>
                      <p className="status-label">
                        {user?.isEmailVerified && !user?.isBlocked ? 'Complete' : 'Incomplete'}
                      </p>
                      <p className="status-desc">
                        {user?.isEmailVerified && !user?.isBlocked
                          ? 'All requirements met'
                          : 'Complete verification steps'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {editing && (
              <div className="form-actions-new">
                <button 
                  type="button" 
                  className="btn-cancel-new" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-save-new" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
