import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  React.useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  return (
    <div className="landing-page">
      {/* Landing Page Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <div className="brand">
            <Link to="/">Blackline Matrix</Link>
          </div>
          <nav className="landing-nav">
            <Link to="/resources">Resources</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn-primary">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Master Your Trading
              <span className="gradient-text"> Journey</span>
            </h1>
            <p className="hero-subtitle">
              Track, analyze, and improve your trading performance with AI-powered insights and a supportive community
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-hero-primary">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn btn-hero-secondary">
                Sign In
              </Link>
            </div>
            <p className="hero-note">No credit card required • 30-day free trial</p>
          </div>
          <div className="hero-image">
            <div className="chart-mockup">
              <div className="chart-bars">
                <div className="bar" style={{ height: '60%', animationDelay: '0s' }}></div>
                <div className="bar" style={{ height: '80%', animationDelay: '0.1s' }}></div>
                <div className="bar" style={{ height: '45%', animationDelay: '0.2s' }}></div>
                <div className="bar" style={{ height: '90%', animationDelay: '0.3s' }}></div>
                <div className="bar" style={{ height: '70%', animationDelay: '0.4s' }}></div>
              </div>
              <div className="grade-badge-mockup">Grade A</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <p className="section-subtitle">Powerful tools designed for serious traders</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Trading Journal</h3>
            <p>Log every trade with detailed notes, entry/exit prices, and risk management data</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Performance Analytics</h3>
            <p>Get real-time insights with win rate, R:R ratios, and automated A-E grading</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Educational Resources</h3>
            <p>Access curated learning materials on strategy, psychology, and risk management</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Community Forum</h3>
            <p>Connect with traders, share insights, and learn from experienced mentors</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Insights</h3>
            <p>Coming soon: Pattern recognition and trade analysis powered by AI</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Mentorship Program</h3>
            <p>Learn from successful traders or become a mentor yourself</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">10,000+</div>
            <div className="stat-label">Active Traders</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">500K+</div>
            <div className="stat-label">Trades Logged</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">98%</div>
            <div className="stat-label">Satisfaction Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Trading?</h2>
          <p>Join thousands of traders improving their performance every day</p>
          <Link to="/register" className="btn btn-cta">
            Get Started Now →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Blackline Matrix</h3>
            <p>Professional trading journal and community platform</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#roadmap">Roadmap</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
              <a href="#careers">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Blackline Matrix. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
