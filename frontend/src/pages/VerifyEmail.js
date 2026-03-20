import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); 
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  async function verifyEmail(token) {
    try {
      const response = await axios.get(`${API_BASE}/api/auth/verify-email?token=${token}`);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Email verification failed. The link may be expired or invalid.');
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
        <div className="verification-container">
          {status === 'verifying' && (
            <>
              <div className="verification-icon">⏳</div>
              <h2 className="verification-title">Verifying Your Email</h2>
              <p className="verification-message">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="verification-icon">✅</div>
              <h2 className="verification-title">Email Verified!</h2>
              <p className="verification-message">{message}</p>
              <p className="verification-instructions">
                Your account is now active. You can log in to access your dashboard.
              </p>
              <div className="verification-actions">
                <button onClick={() => navigate('/login')} className="submit-btn">
                  Go to Login
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="verification-icon">❌</div>
              <h2 className="verification-title">Verification Failed</h2>
              <p className="verification-message error-message">{message}</p>
              <div className="verification-actions">
                <button onClick={() => navigate('/register')} className="submit-btn">
                  Back to Registration
                </button>
                <a href="/login" className="login-link">
                  Go to Login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
