import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setError('Invalid reset link. No token provided.');
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/auth/reset-password`, { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed. The link may be expired or invalid.');
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
        {!success ? (
          <div className="login-form-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="form-header">
              <div className="verification-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
              <h2 className="form-title">Create New Password</h2>
              <p className="form-subtitle">
                Enter a new password for your account.
              </p>
            </div>

            <form onSubmit={submit} className="modern-auth-form">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="modern-form-input"
                  placeholder="Enter new password"
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="modern-form-input"
                  placeholder="Confirm new password"
                  minLength="6"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="submit-btn">
                Reset Password
              </button>
            </form>

            <div className="form-footer-link">
              <p>
                Remember your password? <a href="/login">Sign in</a>
              </p>
            </div>
          </div>
        ) : (
          <div className="verification-container">
            <div className="verification-icon">✅</div>
            <h2 className="verification-title">Password Reset Successful!</h2>
            <p className="verification-message">
              Your password has been reset successfully.
            </p>
            <p className="verification-instructions">
              Redirecting you to login page in 3 seconds...
            </p>
            <div className="verification-actions">
              <button onClick={() => navigate('/login')} className="submit-btn">
                Go to Login Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
