import React, { useEffect, useState } from 'react';
import api from '../api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './TraderDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function TraderDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Trader');
  const [aiInsight, setAiInsight] = useState(null);
  const [realtimeData, setRealtimeData] = useState({
    profitHistory: [],
    riskRewardHistory: [],
    winRateHistory: [],
    volumeData: []
  });

  useEffect(() => {
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserName(decoded.name?.split(' ')[0] || 'Trader');
      } catch (err) {
        console.error('Token decode error:', err);
      }
    }

    Promise.all([
      api.getMetrics().catch(() => null),
      api.getTrades().catch(() => []),
      api.getAIInsight().catch(() => null)
    ]).then(([metricsData, tradesData, aiInsightData]) => {
      setMetrics(metricsData);
      setTrades(tradesData.slice(0, 10));
      setAiInsight(aiInsightData);
      
  
      if (tradesData && tradesData.length > 0) {
        processRealtimeData(tradesData);
      }
      
      setLoading(false);
    });
  }, []);

  const processRealtimeData = (tradesData) => {
   
    const validTrades = tradesData.filter(trade => 
      trade && trade.date && trade.result && trade.profitPct !== undefined
    );

    if (validTrades.length === 0) {
      setRealtimeData({
        profitHistory: [],
        riskRewardHistory: [],
        winRateHistory: [],
        volumeData: []
      });
      return;
    }

   
    const sortedTrades = [...validTrades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    
    let cumulativeProfit = 0;
    const profitHistory = sortedTrades.map((trade) => {
      const profit = parseFloat(trade.profitPct) || 0;
      cumulativeProfit += profit;
      return cumulativeProfit;
    });

    const winRateHistory = sortedTrades.map((_, index) => {
      const last10 = sortedTrades.slice(Math.max(0, index - 9), index + 1);
      const wins = last10.filter(t => t.result === 'win').length;
      return last10.length > 0 ? (wins / last10.length) * 100 : 0;
    });

    
    const riskRewardHistory = sortedTrades.map(trade => parseFloat(trade.rr) || 0);

    
    const volumeData = processVolumeData(sortedTrades);

    setRealtimeData({
      profitHistory,
      riskRewardHistory,
      winRateHistory,
      volumeData
    });
  };

  const processVolumeData = (trades) => {
    if (!trades || trades.length === 0) {
      return [
        { wins: 0, losses: 0 },
        { wins: 0, losses: 0 },
        { wins: 0, losses: 0 },
        { wins: 0, losses: 0 }
      ];
    }

    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const tradesPerWeek = Math.ceil(trades.length / 4);
    
    return weeks.map((_, index) => {
      const weekTrades = trades.slice(index * tradesPerWeek, (index + 1) * tradesPerWeek);
      const wins = weekTrades.filter(t => t && t.result === 'win').length;
      const losses = weekTrades.filter(t => t && t.result === 'loss').length;
      return { wins, losses };
    });
  };

  if (loading) return <div className="dashboard-loading">Loading your trading dashboard...</div>;

  
  const createGradient = (ctx, color1, color2) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(0.4, color2);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    return gradient;
  };

  // Premium professional gradient for enhanced visualization
  const createProfessionalGradient = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    // Multi-stop gradient for premium look
    gradient.addColorStop(0, 'rgba(52, 211, 153, 1)');      // Bright emerald at top
    gradient.addColorStop(0.15, 'rgba(52, 211, 153, 0.9)');
    gradient.addColorStop(0.3, 'rgba(52, 211, 153, 0.7)');
    gradient.addColorStop(0.5, 'rgba(52, 211, 153, 0.4)');
    gradient.addColorStop(0.7, 'rgba(52, 211, 153, 0.15)');
    gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');      // Transparent at bottom
    return gradient;
  };

  
  const cumulativeProfitData = {
    labels: (realtimeData.profitHistory || []).map((_, i) => `T${i + 1}`),
    datasets: [{
      label: 'Cumulative Profit %',
      data: realtimeData.profitHistory || [],
      borderColor: '#10b981',
      backgroundColor: (context) => {
        if (!context.chart.ctx) return 'rgba(52, 211, 153, 0.4)';
        const ctx = context.chart.ctx;
        return createProfessionalGradient(ctx);
      },
      borderWidth: 4,
      tension: 0.5,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 10,
      pointHoverBackgroundColor: '#34d399',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 3,
      clip: false
    }]
  };


  const winRateTrendData = {
    labels: (realtimeData.winRateHistory || []).map((_, i) => `T${i + 1}`),
    datasets: [{
      label: 'Win Rate %',
      data: realtimeData.winRateHistory || [],
      borderColor: '#0ea5e9',
      backgroundColor: (context) => {
        if (!context.chart.ctx) return 'rgba(14, 165, 233, 0.3)';
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(14, 165, 233, 0.8)');
        gradient.addColorStop(0.3, 'rgba(14, 165, 233, 0.5)');
        gradient.addColorStop(0.7, 'rgba(14, 165, 233, 0.2)');
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
        return gradient;
      },
      borderWidth: 3.5,
      tension: 0.45,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: '#0ea5e9',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2.5
    }]
  };

 
  const riskRewardData = {
    labels: (realtimeData.riskRewardHistory || []).map((_, i) => `T${i + 1}`),
    datasets: [{
      label: 'Risk:Reward Ratio',
      data: realtimeData.riskRewardHistory || [],
      backgroundColor: (realtimeData.riskRewardHistory || []).map(rr => 
        rr >= 2 ? 'rgba(16, 185, 129, 0.8)' : rr >= 1.5 ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)'
      ),
      borderColor: (realtimeData.riskRewardHistory || []).map(rr => 
        rr >= 2 ? '#10b981' : rr >= 1.5 ? '#3b82f6' : '#ef4444'
      ),
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false
    }]
  };

  
  const volumeChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Wins',
        data: (realtimeData.volumeData || []).map(d => d?.wins || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.9)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 8
      },
      {
        label: 'Losses',
        data: (realtimeData.volumeData || []).map(d => d?.losses || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        borderColor: '#ef4444',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  };

 
  const winLossData = metrics ? {
    labels: ['Wins', 'Losses'],
    datasets: [{
      data: [metrics.wins, metrics.losses],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 0,
      cutout: '75%'
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 2,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: 16,
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 2,
        titleColor: '#fff',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyColor: '#e2e8f0',
        bodyFont: {
          size: 13
        },
        displayColors: true,
        boxPadding: 6,
        callbacks: {
          label: function(context) {
            const value = context.parsed?.y ?? context.parsed;
            if (value === null || value === undefined) return '';
            return ` ${context.dataset.label}: ${typeof value === 'number' ? value.toFixed(2) : value}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          drawBorder: false,
          color: 'rgba(148, 163, 184, 0.15)'
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.25)',
          drawBorder: false,
          lineWidth: 1.5
        },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          callback: function(value) {
            return typeof value === 'number' ? value.toFixed(1) : value;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      line: {
        borderWidth: 3
      },
      point: {
        radius: 0,
        hoverRadius: 8,
        hitRadius: 30
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales.x,
        stacked: true
      },
      y: {
        ...chartOptions.scales.y,
        stacked: true
      }
    }
  };

  const doughnutCenterText = {
    id: 'doughnutCenterText',
    beforeDraw: (chart) => {
      if (chart.config.type === 'doughnut' && metrics) {
        const { ctx, chartArea: { top, width, height } } = chart;
        ctx.save();
        
        const centerX = width / 2;
        const centerY = top + height / 2;
        
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${metrics.winRate}%`, centerX, centerY - 10);
        
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('Win Rate', centerX, centerY + 20);
        
        ctx.restore();
      }
    }
  };

  return (
    <div className="role-dashboard trader-dashboard">
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <div>
          <h1>Welcome Back, {userName}!</h1>
          <p>Here's your trading performance overview</p>
        </div>
        <Link to="/profile" className="btn btn-secondary">
          <span>👤</span> My Profile
        </Link>
      </div>

      {/* Key Metrics Cards */}
      {metrics ? (
        <div className="metrics-grid-modern">
          <div className="metric-card-modern primary">
            <div className="metric-icon">🎯</div>
            <div className="metric-info">
              <span className="metric-label">Total Trades</span>
              <span className="metric-value">{metrics.total}</span>
            </div>
          </div>

          <div className="metric-card-modern success">
            <div className="metric-icon">📊</div>
            <div className="metric-info">
              <span className="metric-label">Win Rate</span>
              <span className="metric-value">{metrics.winRate}%</span>
            </div>
          </div>

          <div className="metric-card-modern info">
            <div className="metric-icon">⚖️</div>
            <div className="metric-info">
              <span className="metric-label">Avg Risk:Reward</span>
              <span className="metric-value">{metrics.avgRR}</span>
            </div>
          </div>

          <div className="metric-card-modern gradient">
            <div className="metric-icon">🏆</div>
            <div className="metric-info">
              <span className="metric-label">Your Grade</span>
              <span className={`grade-badge-large grade-${metrics.grade.toLowerCase()}`}>
                {metrics.grade}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state-modern">
          <div className="empty-icon">📈</div>
          <h3>Start Your Trading Journey</h3>
          <p>Add your first trade to unlock powerful analytics and insights</p>
          <Link to="/trades" className="btn btn-primary">Get Started</Link>
        </div>
      )}

      {/* AI Insight Card */}
      {aiInsight && aiInsight.hasData && (
        <div className={`ai-insight-card ${aiInsight.sentiment}`}>
          <div className="ai-insight-header">
            <div className="ai-badge">
              <span className="ai-icon">{aiInsight.icon}</span>
              <span className="ai-label">AI Insights</span>
            </div>
            <Link to="/ai-analysis" className="btn-view-full">
              View Full Analysis →
            </Link>
          </div>
          <div className="ai-insight-content">
            <p className="ai-message">{aiInsight.insight}</p>
            <div className="ai-stats">
              <span className="ai-stat">
                <strong>{aiInsight.recentWinRate}%</strong> Recent Win Rate
              </span>
              <span className="ai-stat-divider">•</span>
              <span className="ai-stat">
                Based on <strong>{aiInsight.tradeCount}</strong> recent trades
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Essential Trading Charts */}
      {trades.length > 0 && realtimeData.profitHistory.length > 0 ? (
        <div className="charts-section-advanced">
          <div className="section-header-charts">
            <h2>Trading Performance</h2>
            <div className="live-indicator">
              <span className="pulse-dot"></span>
              <span className="live-text">Live</span>
            </div>
          </div>

          <div className="charts-grid-essential">
            {/* Performance Chart - Main */}
            <div className="chart-card-essential main-chart">
              <div className="chart-header-essential">
                <div className="chart-title-group">
                  <h3>Performance Curve</h3>
                  <span className="chart-subtitle">Cumulative profit over time</span>
                </div>
                <div className="chart-stats-inline">
                  <div className="stat-mini success">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">
                      {realtimeData.profitHistory.length > 0 
                        ? `${realtimeData.profitHistory[realtimeData.profitHistory.length - 1].toFixed(2)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="chart-wrapper-essential">
                <Line data={cumulativeProfitData} options={chartOptions} />
              </div>
            </div>

            {/* Win/Loss Distribution */}
            {winLossData && (
              <div className="chart-card-essential">
                <div className="chart-header-essential">
                  <h3>Win/Loss Ratio</h3>
                  <span className="chart-subtitle">All time</span>
                </div>
                <div className="chart-wrapper-essential chart-center">
                  <Doughnut 
                    data={winLossData} 
                    options={{ 
                      ...chartOptions, 
                      cutout: '75%',
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false }
                      }
                    }} 
                    plugins={[doughnutCenterText]}
                  />
                </div>
                <div className="chart-legend-custom">
                  <div className="legend-item-custom">
                    <span className="legend-dot-custom" style={{backgroundColor: '#10b981'}}></span>
                    <span className="legend-label-custom">Wins</span>
                    <span className="legend-value-custom">{metrics?.wins || 0}</span>
                  </div>
                  <div className="legend-item-custom">
                    <span className="legend-dot-custom" style={{backgroundColor: '#ef4444'}}></span>
                    <span className="legend-label-custom">Losses</span>
                    <span className="legend-value-custom">{metrics?.losses || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Win Rate Trend */}
            <div className="chart-card-essential">
              <div className="chart-header-essential">
                <h3>Win Rate Trend</h3>
                <span className="chart-subtitle">Last 10 trades</span>
              </div>
              <div className="chart-wrapper-essential">
                <Line data={winRateTrendData} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent Trades */}
      <div className="recent-section-modern">
        <div className="section-header-modern">
          <h3>Recent Trades</h3>
          <div className="section-actions">
            <button 
              className="btn-refresh-small" 
              onClick={() => {
                // Refresh trades
                api.getTrades().then(data => {
                  setTrades(data.slice(0, 10));
                  if (data && data.length > 0) {
                    processRealtimeData(data);
                  }
                }).catch(err => console.error('Refresh failed:', err));
              }}
            >
              ↻ Refresh
            </button>
            <Link to="/trades" className="view-all-link">View All →</Link>
          </div>
        </div>
        {trades.length > 0 ? (
          <div className="trades-list-modern">
            {trades.map(trade => (
              <div key={trade._id} className="trade-item-modern">
                <div className="trade-symbol-badge">{trade.symbol}</div>
                <div className="trade-details">
                  <span className="trade-entry">Entry: {trade.entryPrice}</span>
                  <span className="trade-exit">Exit: {trade.exitPrice || 'Open'}</span>
                  <span className="trade-time">{formatTimeAgo(trade.date)}</span>
                </div>
                <span className={`result-pill ${trade.result}`}>
                  {trade.result || 'Open'}
                </span>
                <span className={`profit-value ${trade.profitPct > 0 ? 'positive' : 'negative'}`}>
                  {trade.profitPct ? `${trade.profitPct.toFixed(2)}%` : '-'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text-modern">No trades yet. Start logging your trades!</p>
        )}
      </div>
    </div>
  );
}
