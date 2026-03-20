import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './Header.css';

export default function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    api.getMe().then(u => { if (mounted) setUser(u); }).catch(()=>{});
    return () => { mounted = false; };
  }, []);

  function doLogout() {
    api.logout();
    setUser(null);
    navigate('/'); 
  }

  return (
    <header className="site-header">
      <div className="container">
        <div className="brand"><Link to="/">Blackline Matrix</Link></div>
        <nav className="main-nav">
          {user ? (
            <>
              <Link to="/dashboard">
                <span className="nav-icon">🏠</span>
                <span>Home</span>
              </Link>
              
              {/* Trader Navigation */}
              {user.role === 'Trader' && (
                <>
                  <Link to="/trades">
                    <span className="nav-icon">📝</span>
                    <span>Trades</span>
                  </Link>
                  <Link to="/analytics">
                    <span className="nav-icon">📊</span>
                    <span>Analytics</span>
                  </Link>
                  <Link to="/resources">
                    <span className="nav-icon">📚</span>
                    <span>Learn</span>
                  </Link>
                  <Link to="/forum">
                    <span className="nav-icon">💬</span>
                    <span>Community</span>
                  </Link>
                </>
              )}
              
              {/* Mentor Navigation */}
              {user.role === 'Mentor' && (
                <>
                  <Link to="/forum">
                    <span className="nav-icon">💬</span>
                    <span>Community</span>
                  </Link>
                  <Link to="/resources">
                    <span className="nav-icon">📚</span>
                    <span>Resources</span>
                  </Link>
                  <Link to="/trades">
                    <span className="nav-icon">📝</span>
                    <span>My Trades</span>
                  </Link>
                  <Link to="/analytics">
                    <span className="nav-icon">📊</span>
                    <span>Analytics</span>
                  </Link>
                </>
              )}
              
              {/* Admin Navigation */}
              {user.role === 'Admin' && (
                <>
                  <Link to="/admin">
                    <span className="nav-icon">⚙️</span>
                    <span>Users</span>
                  </Link>
                  <Link to="/resources">
                    <span className="nav-icon">📚</span>
                    <span>Content</span>
                  </Link>
                  <Link to="/forum">
                    <span className="nav-icon">💬</span>
                    <span>Forum</span>
                  </Link>
                  <Link to="/analytics">
                    <span className="nav-icon">📊</span>
                    <span>Reports</span>
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/resources">Resources</Link>
            </>
          )}
        </nav>
        <div className="user-area">
          {user ? (
            <>
              <span className="user-name">{user.email}</span>
              <span className={`user-role-badge ${user.role?.toLowerCase()}`}>{user.role}</span>
              <button className="btn-link small" onClick={doLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-link">Login</Link>
              <Link to="/register" className="btn-primary-small">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
