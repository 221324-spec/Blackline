import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api';
import './Auth.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState(''); // Store password for auto-login
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  // ✅ Updated roles to match login (trader, mentor, admin)
  const roles = [
    {
      id: 'trader',
      name: 'Trader',
      icon: '📈',
      color: '#3b82f6',
      description: 'Track trades, analyze performance, and grow your skills'
    },
    {
      id: 'mentor',
      name: 'Mentor',
      icon: '🎓',
      color: '#8b5cf6',
      description: 'Share knowledge, create resources, and guide traders'
    },
    {
      id: 'admin',
      name: 'Admin',
      icon: '⚙️',
      color: '#ec4899',
      description: 'Manage users, moderate content, and oversee the platform'
    }
  ];

  function handleRoleSelect(role) {
    setSelectedRole(role);
    setShowForm(true);
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        name,
        email,
        password,
        role: selectedRole.id
      });

      if (response.data.requiresVerification) {
        setUserEmail(email);
        setUserPassword(password); // Store password for auto-login
        setVerificationSent(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Register failed');
    }
  }

  async function verifyOTP(e) {
    e.preventDefault();
    if (otp.length !== 4) {
      setError('Please enter a 4-digit OTP');
      return;
    }

    setVerifying(true);
    setError('');
    try {
      const result = await api.verifyOTP({ email: userEmail, otp });
      setVerified(true);
      setError('✓ Email verified! Welcome to Blackline Matrix!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
      setVerifying(false);
    }
  }

  async function resendVerification() {
    setError('');
    try {
      await axios.post(`${API_BASE}/api/auth/resend-verification`, { email: userEmail });
      setError('✓ Verification email resent! Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification email');
    }
  }

  function handleBack() {
    setShowForm(false);
    setSelectedRole(null);
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setVerificationSent(false);
    setUserEmail('');
    setUserPassword('');
    setOtp('');
    setVerifying(false);
    setVerified(false);
  }

  return (
    <div className="modern-auth-container">
      <div className="auth-background">
        <div className="auth-gradient-1"></div>
        <div className="auth-gradient-2"></div>
        <div className="auth-gradient-3"></div>
      </div>

      <div className="auth-content">
        {verified ? (
          <div className="verification-container">
            <div className="verification-icon" style={{ fontSize: '4rem' }}>✅</div>
            <h2 className="verification-title">Email Verified!</h2>
            <p className="verification-message">Your account has been successfully verified.</p>
            <p className="verification-instructions">Redirecting you to login...</p>
          </div>
        ) : verificationSent ? (
          <div className="verification-container">
            <div className="verification-icon">🔐</div>
            <h2 className="verification-title">Enter Verification Code</h2>
            <p className="verification-message">
              We've sent a 4-digit OTP to <strong>{userEmail}</strong>
            </p>
            <p className="verification-instructions">
              Please check your inbox and enter the code below to complete your registration.
            </p>

            <form onSubmit={verifyOTP} style={{ marginTop: '30px' }}>
              <div className="form-group">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit OTP"
                  maxLength="4"
                  className="form-input"
                  style={{
                    fontSize: '32px',
                    textAlign: 'center',
                    letterSpacing: '10px',
                    fontWeight: 'bold'
                  }}
                  autoFocus
                />
              </div>

              {error && <div className="error-message" style={{ marginTop: '15px' }}>{error}</div>}

              <button
                type="submit"
                className="btn-primary"
                disabled={verifying || otp.length !== 4}
                style={{ marginTop: '20px', width: '100%' }}
              >
                {verifying ? 'Verifying...' : 'Verify Email'}
              </button>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={resendVerification}
                  className="resend-btn"
                  style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontSize: '14px' }}
                >
                  Didn't receive the code? Resend OTP
                </button>
              </div>
            </form>
          </div>
        ) : !showForm ? (
          // ✅ Dashboard selection screen (same as screenshot)
          <div className="role-selection-container">
            <div className="auth-header">
              <h1 className="auth-title">Welcome to Blackline Matrix</h1>
              <p className="auth-description">Select your role to get started</p>
            </div>

            <div className="roles-grid">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="role-card"
                  onClick={() => handleRoleSelect(role)}
                  style={{ '--role-color': role.color }}
                >
                  <div className="role-icon">{role.icon}</div>
                  <h3 className="role-name">{role.name}</h3>
                  <p className="role-description">{role.description}</p>
                </div>
              ))}
            </div>

            <div className="auth-footer">
              <p className="auth-link">
                Select your role to create an account
              </p>
              <p className="auth-link" style={{ marginTop: 10 }}>
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </div>
          </div>
        ) : (
          <div className="login-form-container">
            <button className="back-btn" onClick={handleBack}>
              ← Back to roles
            </button>

            <div className="form-header">
              <div className="selected-role-badge" style={{ backgroundColor: selectedRole.color }}>
                <span className="role-icon-large">{selectedRole.icon}</span>
              </div>
              <h2 className="form-title">Create {selectedRole.name} Account</h2>
              <p className="form-subtitle">{selectedRole.description}</p>
            </div>

            <form onSubmit={submit} className="modern-auth-form">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">👤</span>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="modern-form-input"
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="modern-form-input"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="modern-form-input"
                  placeholder="Create a strong password"
                  minLength="6"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn">
                Create Account
              </button>
            </form>

            <div className="form-footer-link">
              <p>
                Already have an account? <a href="/login">Sign in</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
