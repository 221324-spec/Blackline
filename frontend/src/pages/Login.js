import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState(''); // Store password for auto-login
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

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
      await api.login({ email, password });
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      const requiresVerification = err.response?.data?.requiresVerification;
      
      if (requiresVerification) {
        setUserEmail(email);
        setUserPassword(password); // Store password for auto-login
        setVerificationSent(true);
        setError('Email not verified. Please verify your account to continue.');
      } else {
        setError(errorMsg);
      }
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
    setSuccessMessage('');
    try {
      const result = await api.verifyOTP({ email: userEmail, otp });
      // OTP verification successful
      setSuccessMessage('✓ Email verified successfully! Welcome back!');
      setTimeout(() => {
        navigate('/');
      }, 2000); // Give user more time to see the success message
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
      setVerifying(false);
    }
  }

  async function resendVerification() {
    setError('');
    try {
      const response = await api.resendVerification({ email: userEmail });
      console.log('✓ Resend response:', response);
      setError('✓ Verification email resent! Please check your inbox.');
    } catch (err) {
      console.error('Resend error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.statusText || 
                          err.message || 
                          'Failed to resend verification email';
      console.log('Error message to display:', errorMessage);
      setError(errorMessage);
    }
  }

  function handleBack() {
    if (verificationSent) {
      // If user is in verification mode, just go back to login form without resetting verification data
      setVerificationSent(false);
      setOtp('');
      setError('');
      setSuccessMessage('');
    } else {
      // Reset everything if going back to role selection
      setShowForm(false);
      setSelectedRole(null);
      setEmail('');
      setPassword('');
      setError('');
      setVerificationSent(false);
      setUserEmail('');
      setUserPassword('');
      setOtp('');
      setVerifying(false);
      setSuccessMessage('');
    }
  }

  return (
    <div className="modern-auth-container">
      <div className="auth-background">
        <div className="auth-gradient-1"></div>
        <div className="auth-gradient-2"></div>
        <div className="auth-gradient-3"></div>
      </div>

      <div className="auth-content">
        {!showForm ? (
          // Role Selection Screen
          <div className="role-selection-container">
            <div className="auth-header">
              <h1 className="auth-title">Welcome to Blackline Matrix</h1>
              <p className="auth-description">
                Select your role to sign in
              </p>
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
                  <button className="role-btn">
                    Continue as {role.name} →
                  </button>
                </div>
              ))}
            </div>

            <div className="auth-footer">
              <p className="auth-link">
                Don't have an account? <a href="/register">Create one now</a>
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
              <h2 className="form-title">Sign in as {selectedRole.name}</h2>
              <p className="form-subtitle">{selectedRole.description}</p>
            </div>

            {!verificationSent ? (
              <form onSubmit={submit} className="modern-auth-form">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📧</span>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="modern-form-input"
                    placeholder="Enter your password"
                  />
                  <div className="forgot-password-link">
                    <a href="/request-reset">Forgot Password?</a>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="submit-btn">
                  Sign In
                </button>
              </form>
            ) : (
              <div className="verification-section">
                <h3 className="verification-title">Verify Your Email</h3>
                <p className="verification-description">
                  We've sent a 4-digit OTP to <strong>{userEmail}</strong>. Please enter it below to verify your account.
                </p>
                
                <form onSubmit={verifyOTP} className="otp-form">
                  <div className="form-group">
                    <label className="form-label">
                      <span className="label-icon">🔢</span>
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                      className="modern-form-input otp-input"
                      placeholder="1234"
                      maxLength="4"
                    />
                  </div>
                  
                  <button type="submit" className="submit-btn" disabled={verifying}>
                    {verifying ? 'Verifying...' : 'Verify Email'}
                  </button>
                </form>
                
                {error && <div className="error-message">{error}</div>}
                
                {successMessage && <div className="success-message">{successMessage}</div>}
                
                <div className="resend-section">
                  <p>Didn't receive the email?</p>
                  <button 
                    type="button" 
                    className="resend-btn" 
                    onClick={resendVerification}
                  >
                    Resend Verification Email
                  </button>
                </div>
              </div>
            )}

            <div className="form-footer-link">
              <p>
                Don't have an account? <a href="/register">Sign up as {selectedRole.name}</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
