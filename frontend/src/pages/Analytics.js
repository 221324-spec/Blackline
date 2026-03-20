import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getUserRole() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.role?.toLowerCase();
  } catch (error) {
    return null;
  }
}

export default function Analytics() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [analyticsData, setAnalyticsData] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const role = getUserRole();
      setUserRole(role);
      
      
      if (role === 'admin') {
        const statsRes = await axios.get(`${API_BASE}/api/admin/stats`, { headers: authHeader() });
        
        setTrades([]);
        setAnalyticsData({
          isAdmin: true,
          totalUsers: statsRes.data.totalUsers || 0,
          totalTrades: statsRes.data.totalTrades || 0,
          totalPosts: statsRes.data.totalPosts || 0,
          totalResources: statsRes.data.totalResources || 0
        });
      } else {
        const allTrades = await api.getTrades();
        
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
        const filteredTrades = (allTrades || []).filter(t => new Date(t.createdAt || t.date) >= cutoffDate);
        
        setTrades(filteredTrades);
        calculateAnalytics(filteredTrades);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  function calculateAnalytics(tradesData) {
    if (!tradesData.length) {
      setAnalyticsData(null);
      return;
    }

    const symbolStats = {};
    tradesData.forEach(trade => {
      if (!symbolStats[trade.symbol]) {
        symbolStats[trade.symbol] = { wins: 0, losses: 0, totalProfit: 0, count: 0 };
      }
      const profit = (trade.exitPrice - trade.entryPrice) * (trade.entryPrice > trade.exitPrice ? -1 : 1);
      symbolStats[trade.symbol].count++;
      symbolStats[trade.symbol].totalProfit += profit;
      if (profit > 0) symbolStats[trade.symbol].wins++;
      else symbolStats[trade.symbol].losses++;
    });

    
    const dailyStats = {};
    tradesData.forEach(trade => {
      const date = new Date(trade.createdAt).toLocaleDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = { profit: 0, count: 0 };
      }
      const profit = (trade.exitPrice - trade.entryPrice) * (trade.entryPrice > trade.exitPrice ? -1 : 1);
      dailyStats[date].profit += profit;
      dailyStats[date].count++;
    });

   
    let cumulative = 0;
    const cumulativePL = tradesData.map(trade => {
      const profit = (trade.exitPrice - trade.entryPrice) * (trade.entryPrice > trade.exitPrice ? -1 : 1);
      cumulative += profit;
      return { date: new Date(trade.createdAt), value: cumulative };
    }).sort((a, b) => a.date - b.date);

    
    const rrBuckets = { '0-1': 0, '1-2': 0, '2-3': 0, '3+': 0 };
    tradesData.forEach(trade => {
      const rr = trade.riskReward || 0;
      if (rr < 1) rrBuckets['0-1']++;
      else if (rr < 2) rrBuckets['1-2']++;
      else if (rr < 3) rrBuckets['2-3']++;
      else rrBuckets['3+']++;
    });

    setAnalyticsData({
      symbolStats,
      dailyStats,
      cumulativePL,
      rrBuckets
    });
  }

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">Loading analytics...</div>
      </div>
    );
  }

  
  if (userRole === 'admin' && analyticsData?.isAdmin) {
    return (
      <div className="analytics-page">
        <div className="page-header-analytics">
          <h1>📊 Platform Analytics</h1>
          <p>Platform-wide statistics and reports</p>
        </div>
        
        <div className="admin-analytics-grid">
          <div className="admin-stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{analyticsData.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{analyticsData.totalTrades}</h3>
              <p>Total Trades</p>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>{analyticsData.totalPosts}</h3>
              <p>Forum Posts</p>
            </div>
          </div>
          
          <div className="admin-stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{analyticsData.totalResources}</h3>
              <p>Resources</p>
            </div>
          </div>
        </div>

        <div className="admin-info-box">
          <h3>📈 Platform Reports</h3>
          <p>This section shows platform-wide statistics for administrative oversight.</p>
          <p>For detailed trading analytics, please use a Trader account.</p>
        </div>
      </div>
    );
  }

  if (!trades.length) {
    return (
      <div className="analytics-page">
        <div className="page-header-analytics">
          <h1>📊 Advanced Analytics</h1>
          <p>Comprehensive trading performance analysis</p>
        </div>
        <div className="empty-analytics">
          <div className="empty-icon">📈</div>
          <p>No trades found for analysis</p>
          <a href="/trades" className="btn-primary">Add Your First Trade</a>
        </div>
      </div>
    );
  }


  const symbolLabels = Object.keys(analyticsData.symbolStats);
  const symbolProfits = symbolLabels.map(s => analyticsData.symbolStats[s].totalProfit);
  const symbolCounts = symbolLabels.map(s => analyticsData.symbolStats[s].count);

  const dailyLabels = Object.keys(analyticsData.dailyStats).slice(-14); // Last 14 days
  const dailyProfits = dailyLabels.map(d => analyticsData.dailyStats[d].profit);

  const cumulativeLabels = analyticsData.cumulativePL.map((_, i) => `Trade ${i + 1}`);
  const cumulativeValues = analyticsData.cumulativePL.map(p => p.value);

  const rrLabels = Object.keys(analyticsData.rrBuckets);
  const rrValues = Object.values(analyticsData.rrBuckets);

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="page-header-analytics">
        <div>
          <h1>📊 Advanced Analytics</h1>
          <p>Deep dive into your trading performance</p>
        </div>
        <div className="time-range-selector">
          <button 
            className={timeRange === '7' ? 'active' : ''}
            onClick={() => setTimeRange('7')}
          >
            7 Days
          </button>
          <button 
            className={timeRange === '30' ? 'active' : ''}
            onClick={() => setTimeRange('30')}
          >
            30 Days
          </button>
          <button 
            className={timeRange === '90' ? 'active' : ''}
            onClick={() => setTimeRange('90')}
          >
            90 Days
          </button>
          <button 
            className={timeRange === '365' ? 'active' : ''}
            onClick={() => setTimeRange('365')}
          >
            1 Year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-info">
            <span className="summary-label">Total Trades</span>
            <span className="summary-value">{trades.length}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-info">
            <span className="summary-label">Total P&L</span>
            <span className="summary-value">
              ${analyticsData.cumulativePL[analyticsData.cumulativePL.length - 1]?.value.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🎯</div>
          <div className="summary-info">
            <span className="summary-label">Best Symbol</span>
            <span className="summary-value">
              {symbolLabels[symbolProfits.indexOf(Math.max(...symbolProfits))] || 'N/A'}
            </span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-info">
            <span className="summary-label">Avg Trade/Day</span>
            <span className="summary-value">
              {(trades.length / parseInt(timeRange)).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-grid">
        {/* Cumulative P&L Chart */}
        <div className="analytics-chart-card full-width">
          <h3>Cumulative Profit & Loss</h3>
          <div className="chart-wrapper">
            <Line
              data={{
                labels: cumulativeLabels,
                datasets: [{
                  label: 'Cumulative P&L',
                  data: cumulativeValues,
                  borderColor: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  fill: true,
                  tension: 0.4
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => `P&L: $${context.parsed.y.toFixed(2)}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Symbol Performance */}
        <div className="analytics-chart-card">
          <h3>Performance by Symbol</h3>
          <div className="chart-wrapper">
            <Bar
              data={{
                labels: symbolLabels,
                datasets: [{
                  label: 'Profit/Loss',
                  data: symbolProfits,
                  backgroundColor: symbolProfits.map(p => p >= 0 ? '#10b981' : '#ef4444')
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        {/* Daily Performance */}
        <div className="analytics-chart-card">
          <h3>Daily Performance (Last 14 Days)</h3>
          <div className="chart-wrapper">
            <Line
              data={{
                labels: dailyLabels,
                datasets: [{
                  label: 'Daily P&L',
                  data: dailyProfits,
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.3
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>

        {/* Risk/Reward Distribution */}
        <div className="analytics-chart-card">
          <h3>Risk/Reward Distribution</h3>
          <div className="chart-wrapper">
            <Doughnut
              data={{
                labels: rrLabels,
                datasets: [{
                  data: rrValues,
                  backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' }
                }
              }}
            />
          </div>
        </div>

        {/* Symbol Trade Count */}
        <div className="analytics-chart-card">
          <h3>Trades per Symbol</h3>
          <div className="chart-wrapper">
            <Bar
              data={{
                labels: symbolLabels,
                datasets: [{
                  label: 'Number of Trades',
                  data: symbolCounts,
                  backgroundColor: '#8b5cf6'
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
