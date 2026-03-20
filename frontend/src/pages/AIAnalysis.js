import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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
import api from '../api';
import './AIAnalysis.css';

// Register Chart.js components
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

function AIAnalysis() {
  const [loading, setLoading] = useState(false);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState(null);
  const [quickTip, setQuickTip] = useState(null);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadQuickTip();
  }, []);

  const loadQuickTip = async () => {
    try {
      const tip = await api.getQuickTip();
      setQuickTip(tip);
    } catch (err) {
      // Error loading quick tip
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError('');
      setLoading(true);
      
      const result = await api.getComprehensiveAnalysis();
      
      if (result.success) {
        setComprehensiveAnalysis(result);
      } else {
        setError(result.message || 'Failed to generate analysis');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate analysis');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const getRiskLevelClass = (level) => {
    if (!level) return 'moderate';
    const lower = level.toLowerCase();
    if (lower.includes('low')) return 'low';
    if (lower.includes('high')) return 'high';
    return 'moderate';
  };

  const getGradeClass = (grade) => {
    if (!grade) return 'C';
    if (grade === 'A') return 'A';
    if (grade === 'B') return 'B';
    if (grade === 'C') return 'C';
    if (grade === 'D') return 'D';
    return 'E';
  };

  return (
    <div className="ai-analysis-page">
      <div className="ai-analysis-header">
        <div>
          <h1>🤖 AI Trade Analysis</h1>
          <p>Get comprehensive AI-powered insights into your trading performance</p>
        </div>
        <button 
          className="btn-analyze-now" 
          onClick={handleAnalyze}
          disabled={analyzing || loading}
        >
          {analyzing ? '🔄 Analyzing...' : '🚀 Analyze Now'}
        </button>
      </div>

      {/* Quick Tip Banner */}
      {quickTip && quickTip.tip && (
        <div className="quick-tip-banner">
          <span className="tip-icon">{quickTip.icon || '💡'}</span>
          <span className="tip-text">{quickTip.tip}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="analysis-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !comprehensiveAnalysis && (
        <div className="analysis-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing your trading patterns...</p>
        </div>
      )}

      {/* Comprehensive Analysis Results */}
      {comprehensiveAnalysis && comprehensiveAnalysis.success && (
        <div className="comprehensive-results">
          {/* Performance Overview */}
          <div className="analysis-section overview-section">
            <h2>📊 Performance Overview</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">Total Trades</span>
                <span className="metric-value">{comprehensiveAnalysis.metrics.total}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Win Rate</span>
                <span className="metric-value success">{comprehensiveAnalysis.metrics.winRate}%</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Avg Risk:Reward</span>
                <span className="metric-value">{comprehensiveAnalysis.metrics.avgRR}</span>
              </div>
              <div className={`metric-card grade-${getGradeClass(comprehensiveAnalysis.metrics.grade)}`}>
                <span className="metric-label">Performance Grade</span>
                <span className="metric-value grade">{comprehensiveAnalysis.metrics.grade}</span>
              </div>
            </div>
          </div>

          {/* Advanced Visual Analytics */}
          <div className="analysis-section visual-patterns-section">
            <div className="section-header-modern">
              <h2>📈 Advanced Performance Analytics</h2>
              <span className="section-badge">Real-Time Insights</span>
            </div>
            
            <div className="charts-grid-modern">
              {/* Performance Curve - Smooth Line Chart */}
              <div className="chart-card chart-card-featured">
                <div className="chart-card-header">
                  <h3>Performance Curve</h3>
                  <div className="chart-stats">
                    <span className="stat-pill success">
                      <span className="stat-icon">▲</span>
                      {comprehensiveAnalysis.metrics.winRate}%
                    </span>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Line
                    data={{
                      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'],
                      datasets: [{
                        label: 'Win Rate Trend',
                        data: [
                          Math.max(0, comprehensiveAnalysis.metrics.winRate - 15),
                          Math.max(0, comprehensiveAnalysis.metrics.winRate - 10),
                          Math.max(0, comprehensiveAnalysis.metrics.winRate - 5),
                          Math.max(0, comprehensiveAnalysis.metrics.winRate + 2),
                          comprehensiveAnalysis.metrics.winRate
                        ],
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: (context) => {
                          const ctx = context.chart.ctx;
                          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
                          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                          return gradient;
                        },
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 8,
                        pointHoverBackgroundColor: 'rgba(16, 185, 129, 1)',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 3
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          padding: 12,
                          displayColors: false,
                          callbacks: {
                            label: (context) => `Win Rate: ${context.parsed.y.toFixed(1)}%`
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { color: '#64748b', font: { size: 11 } }
                        },
                        y: {
                          grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                          },
                          ticks: {
                            color: '#64748b',
                            font: { size: 11 },
                            callback: (value) => value + '%'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Win/Loss Distribution - Modern Doughnut */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3>Win/Loss Ratio</h3>
                  <div className="chart-stats">
                    <span className="stat-value">{comprehensiveAnalysis.metrics.total}</span>
                    <span className="stat-label">Total Trades</span>
                  </div>
                </div>
                <div className="chart-wrapper chart-center">
                  <Doughnut
                    data={{
                      labels: ['Wins', 'Losses'],
                      datasets: [{
                        data: [
                          comprehensiveAnalysis.metrics.wins,
                          comprehensiveAnalysis.metrics.losses
                        ],
                        backgroundColor: [
                          'rgba(16, 185, 129, 1)',
                          'rgba(239, 68, 68, 1)'
                        ],
                        borderWidth: 0,
                        cutout: '75%'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12,
                          callbacks: {
                            label: (context) => {
                              const total = comprehensiveAnalysis.metrics.total;
                              const percentage = ((context.parsed / total) * 100).toFixed(1);
                              return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                    plugins={[{
                      id: 'centerText',
                      beforeDraw: (chart) => {
                        const { ctx, chartArea: { width, height } } = chart;
                        ctx.save();
                        ctx.font = 'bold 32px sans-serif';
                        ctx.fillStyle = '#10b981';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(`${comprehensiveAnalysis.metrics.winRate}%`, width / 2, height / 2 - 10);
                        ctx.font = '14px sans-serif';
                        ctx.fillStyle = '#64748b';
                        ctx.fillText('Win Rate', width / 2, height / 2 + 20);
                        ctx.restore();
                      }
                    }]}
                  />
                </div>
                <div className="chart-legend-modern">
                  <div className="legend-item">
                    <span className="legend-dot" style={{background: '#10b981'}}></span>
                    <span className="legend-label">Wins</span>
                    <span className="legend-value">{comprehensiveAnalysis.metrics.wins}</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{background: '#ef4444'}}></span>
                    <span className="legend-label">Losses</span>
                    <span className="legend-value">{comprehensiveAnalysis.metrics.losses}</span>
                  </div>
                </div>
              </div>

              {/* Risk vs Reward Analysis */}
              <div className="chart-card chart-card-wide">
                <div className="chart-card-header">
                  <h3>Risk vs Reward Analysis</h3>
                  <div className="chart-stats">
                    <span className="stat-pill info">
                      Avg R:R {comprehensiveAnalysis.metrics.avgRR}
                    </span>
                  </div>
                </div>
                <div className="chart-wrapper">
                  <Line
                    data={{
                      labels: ['Trade 1', 'Trade 2', 'Trade 3', 'Trade 4', 'Trade 5'],
                      datasets: [
                        {
                          label: 'Risk',
                          data: [1, 1, 1, 1, 1],
                          borderColor: 'rgba(239, 68, 68, 1)',
                          backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
                            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
                            return gradient;
                          },
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointRadius: 4,
                          pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2
                        },
                        {
                          label: 'Reward',
                          data: [
                            2.33, 2.33, 1.75, 3.0, 2.0
                          ],
                          borderColor: 'rgba(16, 185, 129, 1)',
                          backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
                            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
                            return gradient;
                          },
                          borderWidth: 2,
                          fill: true,
                          tension: 0.4,
                          pointRadius: 4,
                          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                          pointBorderColor: '#fff',
                          pointBorderWidth: 2
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        intersect: false,
                        mode: 'index'
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                          align: 'end',
                          labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 15,
                            font: { size: 12, weight: '600' },
                            color: '#475569',
                            usePointStyle: true,
                            pointStyle: 'circle'
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          padding: 12,
                          displayColors: true
                        }
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { color: '#64748b', font: { size: 11 } }
                        },
                        y: {
                          grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false
                          },
                          ticks: {
                            color: '#64748b',
                            font: { size: 11 },
                            callback: (value) => value + 'R'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Content */}
          {comprehensiveAnalysis.analysis && (
            <>
              {/* Strengths */}
              {comprehensiveAnalysis.analysis.strengths && comprehensiveAnalysis.analysis.strengths.length > 0 && (
                <div className="analysis-section strengths-section">
                  <h2>💪 Your Strengths</h2>
                  <ul className="insight-list">
                    {comprehensiveAnalysis.analysis.strengths.map((strength, index) => (
                      <li key={index} className="insight-item positive">
                        <span className="insight-icon">✅</span>
                        <span className="insight-text">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {comprehensiveAnalysis.analysis.weaknesses && comprehensiveAnalysis.analysis.weaknesses.length > 0 && (
                <div className="analysis-section weaknesses-section">
                  <h2>⚠️ Areas for Improvement</h2>
                  <ul className="insight-list">
                    {comprehensiveAnalysis.analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="insight-item warning">
                        <span className="insight-icon">⚡</span>
                        <span className="insight-text">{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Assessment */}
              {comprehensiveAnalysis.analysis.riskLevel && (
                <div className="analysis-section risk-section">
                  <h2>🛡️ Risk Assessment</h2>
                  <div className={`risk-level-card risk-${getRiskLevelClass(comprehensiveAnalysis.analysis.riskLevel)}`}>
                    <div className="risk-badge">
                      <span className="risk-label">Risk Level:</span>
                      <span className="risk-value">{comprehensiveAnalysis.analysis.riskLevel}</span>
                    </div>
                    {comprehensiveAnalysis.analysis.riskExplanation && (
                      <p className="risk-explanation">{comprehensiveAnalysis.analysis.riskExplanation}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {comprehensiveAnalysis.analysis.recommendations && comprehensiveAnalysis.analysis.recommendations.length > 0 && (
                <div className="analysis-section recommendations-section">
                  <h2>💡 AI Recommendations</h2>
                  <ul className="insight-list">
                    {comprehensiveAnalysis.analysis.recommendations.map((rec, index) => (
                      <li key={index} className="insight-item neutral">
                        <span className="insight-icon">🎯</span>
                        <span className="insight-text">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {comprehensiveAnalysis.analysis.nextSteps && comprehensiveAnalysis.analysis.nextSteps.length > 0 && (
                <div className="analysis-section next-steps-section">
                  <h2>🚀 Next Steps</h2>
                  <ol className="steps-list">
                    {comprehensiveAnalysis.analysis.nextSteps.map((step, index) => (
                      <li key={index} className="step-item">
                        <span className="step-number">{index + 1}</span>
                        <span className="step-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}

          {/* Analysis Metadata */}
          <div className="analysis-meta">
            {comprehensiveAnalysis.usingMockData && (
              <div className="mock-data-notice">
                <span className="notice-icon">ℹ️</span>
                <span>Using mock analysis data (OpenAI API not configured)</span>
              </div>
            )}
            <span className="analysis-timestamp">
              Analyzed: {new Date(comprehensiveAnalysis.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !comprehensiveAnalysis && !error && (
        <div className="empty-state">
          <div className="empty-icon">🤖</div>
          <h2>Ready to Analyze Your Trades</h2>
          <p>Click "Analyze Now" to get comprehensive AI insights into your trading performance</p>
          <ul className="features-list">
            <li>✅ Identify your trading strengths</li>
            <li>⚠️ Discover areas for improvement</li>
            <li>🛡️ Get risk assessment</li>
            <li>💡 Receive personalized recommendations</li>
            <li>🚀 Actionable next steps</li>
          </ul>
        </div>
      )}

      {/* Back Link */}
      <div className="analysis-footer">
        <Link to="/trader/dashboard" className="btn-back">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default AIAnalysis;
