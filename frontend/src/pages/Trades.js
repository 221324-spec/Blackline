import React, { useEffect, useState } from 'react';
import api from '../api';
import './Trades.css';
import { io as ioClient } from 'socket.io-client';

function TradeModal({ isOpen, onClose, onCreate }) {
  const [symbol, setSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [riskReward, setRiskReward] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [timeframe, setTimeframe] = useState('H1');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        symbol,
        entryPrice: Number(entryPrice),
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        takeProfit: takeProfit ? Number(takeProfit) : undefined,
        timeframe,
        exitPrice: exitPrice ? Number(exitPrice) : undefined,
        riskReward: riskReward ? Number(riskReward) : undefined,
        notes
      };

      const createdTrade = await api.createTrade(payload);
      if (createdTrade) onCreate(createdTrade.trade);
      setSymbol(''); setEntryPrice(''); setExitPrice(''); setRiskReward(''); setNotes('');
      setStopLoss(''); setTakeProfit(''); setTimeframe('H1');
      onClose();
    } catch (err) {
      alert('Failed to create trade');
    }
    setLoading(false);
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Trade</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <div className="form-group">
            <label>Symbol</label>
            <input 
              placeholder="e.g. EURUSD, AAPL" 
              value={symbol} 
              onChange={e=>setSymbol(e.target.value)} 
              required 
              className="form-input"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Entry Price</label>
              <input 
                type="number" 
                step="0.00001" 
                placeholder="1.1000" 
                value={entryPrice} 
                onChange={e=>setEntryPrice(e.target.value)} 
                required 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Exit Price (optional)</label>
              <input 
                type="number" 
                step="0.00001" 
                placeholder="1.1200" 
                value={exitPrice} 
                onChange={e=>setExitPrice(e.target.value)} 
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Stop Loss</label>
              <input
                type="number"
                step="0.00001"
                placeholder="1.1200"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Take Profit (optional)</label>
              <input
                type="number"
                step="0.00001"
                placeholder="1.1300"
                value={takeProfit}
                onChange={e => setTakeProfit(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Timeframe</label>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              required
              className="form-input"
            >
              <option value="H1">H1</option>
              <option value="1H">1H</option>
              <option value="daily">Daily</option>
              {/* Add more as needed */}
            </select>
          </div>
          <div className="form-group">
            <label>Risk:Reward Ratio</label>
            <input 
              type="number" 
              step="0.1" 
              placeholder="2.0" 
              value={riskReward} 
              onChange={e=>setRiskReward(e.target.value)} 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea 
              placeholder="Trade setup notes..." 
              value={notes} 
              onChange={e=>setNotes(e.target.value)} 
              className="form-textarea"
              rows="3"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Adding...' : 'Add Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Trade Modal
function EditTradeModal({ isOpen, onClose, onUpdate, trade }) {
  const [symbol, setSymbol] = useState(trade?.symbol || '');
  const [entryPrice, setEntryPrice] = useState(trade?.entryPrice || '');
  const [exitPrice, setExitPrice] = useState(trade?.exitPrice || '');
  const [riskReward, setRiskReward] = useState(trade?.riskReward || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [stopLoss, setStopLoss] = useState(trade?.stopLoss || '');
  const [takeProfit, setTakeProfit] = useState(trade?.takeProfit || '');
  const [timeframe, setTimeframe] = useState(trade?.timeframe || 'H1');

  useEffect(() => {
    if (trade) {
      setSymbol(trade.symbol || '');
      setEntryPrice(trade.entryPrice || '');
      setExitPrice(trade.exitPrice || '');
      setRiskReward(trade.riskReward || '');
      setStopLoss(trade.stopLoss || '');
      setTakeProfit(trade.takeProfit || '');
      setTimeframe(trade.timeframe || 'H1');
      setNotes('');
    }
  }, [trade]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        symbol,
        entryPrice: Number(entryPrice),
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        takeProfit: takeProfit ? Number(takeProfit) : undefined,
        timeframe,
        exitPrice: exitPrice ? Number(exitPrice) : undefined,
        riskReward: riskReward ? Number(riskReward) : undefined,
        notes
      };

      const updatedTrade = await api.updateTrade(trade._id, payload);
      if (updatedTrade) onUpdate(updatedTrade.trade);
      onClose();
    } catch (err) {
      alert('Failed to update trade');
    }
    setLoading(false);
  }

  if (!isOpen || !trade) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Trade</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label>Symbol</label>
              <input 
                type="text" 
                placeholder="EURUSD" 
                value={symbol} 
                onChange={e=>setSymbol(e.target.value.toUpperCase())} 
                required 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Entry Price</label>
              <input 
                type="number" 
                step="0.00001" 
                placeholder="1.1200" 
                value={entryPrice} 
                onChange={e=>setEntryPrice(e.target.value)} 
                required 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Exit Price</label>
              <input 
                type="number" 
                step="0.00001" 
                placeholder="1.1200" 
                value={exitPrice} 
                onChange={e=>setExitPrice(e.target.value)} 
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Stop Loss</label>
              <input
                type="number"
                step="0.00001"
                placeholder="1.1200"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Take Profit</label>
              <input
                type="number"
                step="0.00001"
                placeholder="1.1200"
                value={takeProfit}
                onChange={e => setTakeProfit(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Timeframe</label>
              <select 
                value={timeframe} 
                onChange={e=>setTimeframe(e.target.value)} 
                className="form-select"
              >
                <option value="H1">H1</option>
                <option value="1H">1H</option>
                <option value="daily">Daily</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Risk:Reward Ratio</label>
            <input 
              type="number" 
              step="0.1" 
              placeholder="2.0" 
              value={riskReward} 
              onChange={e=>setRiskReward(e.target.value)} 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Notes (will be added to existing notes)</label>
            <textarea 
              placeholder="Additional notes..." 
              value={notes} 
              onChange={e=>setNotes(e.target.value)} 
              className="form-textarea"
              rows="3"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Updating...' : 'Update Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Automated Trade Sync (MT5) ---
function MT5SyncForm({ onSync, syncing }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('MetaQuotes-Demo');
  const [accountType, setAccountType] = useState('demo');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const credentials = {};
    if (login) credentials.login = parseInt(login);
    if (password) credentials.password = password;
    if (server) credentials.server = server;
    if (Object.keys(credentials).length === 0) {
      setError('At least one field must be provided');
      return;
    }
    if (login && login.length < 5) {
      setError('Login must be at least 5 characters');
      return;
    }
    try {
      await onSync(credentials);
      setLogin(''); setPassword('');
    } catch (err) {
      setError(err?.response?.data?.error || 'Sync failed');
    }
  };

  const toggleForm = () => {
    setShowForm(!showForm);
    if (!showForm) {
      setError('');
    }
  };

  return (
    <div className="mt5-sync-card">
      <div className="mt5-sync-header" onClick={toggleForm}>
        <h3>🤖 Automated Trade Sync (MetaTrader 5)</h3>
        <div className="mt5-toggle">
          <span className="toggle-text">{showForm ? 'Hide' : 'Show'} Form</span>
          <div className={`toggle-switch ${showForm ? 'active' : ''}`}>
            <div className="toggle-slider"></div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mt5-sync-content">
          <div className="mt5-account-type">
            <label className="account-type-label">Account Type:</label>
            <div className="account-type-buttons">
              <button
                type="button"
                className={`account-type-btn ${accountType === 'demo' ? 'active' : ''}`}
                onClick={() => {
                  setAccountType('demo');
                  setServer('MetaQuotes-Demo');
                }}
              >
                📊 Demo Account
              </button>
              <button
                type="button"
                className={`account-type-btn ${accountType === 'live' ? 'active' : ''}`}
                onClick={() => {
                  setAccountType('live');
                  setServer('');
                }}
              >
                💰 Live Account
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt5-sync-form">
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">
                  <span className="label-icon">🔑</span>
                  MT5 Login ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12345678"
                  value={login}
                  onChange={e => setLogin(e.target.value.replace(/\D/g, ''))}
                  disabled={syncing}
                  className="form-input"
                  maxLength="10"
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  <span className="label-icon">🔒</span>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your MT5 password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={syncing}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  <span className="label-icon">🌐</span>
                  Server
                </label>
                <input
                  type="text"
                  placeholder={accountType === 'demo' ? 'MetaQuotes-Demo' : 'e.g. YourBroker-Server'}
                  value={server}
                  onChange={e => setServer(e.target.value)}
                  disabled={syncing}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary sync-btn" disabled={syncing}>
                <span className="btn-icon">{syncing ? '⏳' : '🔄'}</span>
                {syncing ? 'Syncing Trades...' : 'Sync My Trades'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={toggleForm} disabled={syncing}>
                Cancel
              </button>
            </div>

            {error && (
              <div className="form-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </form>

          <div className="mt5-security-notice">
            <div className="security-icon">🔐</div>
            <div className="security-text">
              <strong>Security Notice:</strong> Your MT5 credentials are used only for this sync session and are not stored on our servers. We recommend using read-only API access if available from your broker.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastCredentials, setLastCredentials] = useState(() => {
    const stored = localStorage.getItem('mt5Credentials');
    return stored ? JSON.parse(stored) : null;
  });
  const [syncedAccount, setSyncedAccount] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);

  async function handleRefresh() {
    if (!lastCredentials) {
      // If no last credentials, just refresh from DB
      setRefreshing(true);
      try {
        const updatedTrades = await api.getTrades();
        setTrades((Array.isArray(updatedTrades) ? updatedTrades : (updatedTrades?.trades || [])).filter(trade => !trade.mt5));
      } catch (err) {
        console.error('Refresh failed:', err);
      }
      setRefreshing(false);
      return;
    }
    // Re-sync with last credentials to update P&L
    setRefreshing(true);
    try {
      const res = await api.post('/api/mt5/sync', lastCredentials);
      setSyncMsg(`Refreshed: ${res.data.imported} updated trades. Account Balance: $${res.data.account?.balance || 'N/A'}, Equity: $${res.data.account?.equity || 'N/A'}`);
      setSyncedAccount(res.data.account);
      localStorage.setItem('syncedAccount', JSON.stringify(res.data.account));
      const updatedTrades = await api.getTrades();
      setTrades((Array.isArray(updatedTrades) ? updatedTrades : (updatedTrades?.trades || [])).filter(trade => trade.mt5));
    } catch (err) {
      setSyncMsg('Refresh sync failed.');
      console.error('Refresh sync failed:', err);
    }
    setRefreshing(false);
  }
    // Automated Trade Sync handler
    async function handleMT5Sync(credentials) {
      setSyncing(true);
      setSyncMsg('');
      try {
        // POST to backend /api/mt5/sync
        const res = await api.post('/api/mt5/sync', credentials);
        setSyncMsg(`Imported ${res.data.imported} new trades from MT5. Account Balance: $${res.data.account?.balance || 'N/A'}, Equity: $${res.data.account?.equity || 'N/A'}`);
        setSyncedAccount(res.data.account);
        localStorage.setItem('syncedAccount', JSON.stringify(res.data.account));
        setLastCredentials(credentials);  // Store for refresh
        localStorage.setItem('mt5Credentials', JSON.stringify(credentials));
        // Refresh trades (unwrap axios response)
        try {
          const updatedTrades = await api.getTrades();
          setTrades((Array.isArray(updatedTrades) ? updatedTrades : (updatedTrades?.trades || [])).filter(trade => trade.mt5));
        } catch (refreshErr) {
          console.error('Failed to refresh trades after sync:', refreshErr);
          // Don't fail the sync if refresh fails
        }
      } catch (err) {
        setSyncMsg(err?.response?.data?.error || err?.response?.data?.details || 'MT5 sync failed.');
        throw err;
      } finally {
        setSyncing(false);
      }
    }
  
  // Filter states
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterResult, setFilterResult] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // date, profit, symbol

  useEffect(() => {
    // Load manual trades only, MT5 trades only after sync
    api.getTrades()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.trades || []);
        // Filter to show only manual trades initially
        setTrades(list.filter(trade => !trade.mt5));
      })
      .catch(() => setTrades([]))
      .finally(() => setLoading(false));
  }, []);

  // Removed auto sync on load

  useEffect(() => {
    const socket = ioClient(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

    socket.on('connect', () => {
      console.log('Socket connected', socket.id);
    });

    socket.on('trade.created', (trade) => {
      console.log('socket trade.created', trade._id);
      // ensure trade belongs to current user in case server emits global events
      setTrades(prev => {
        // avoid duplicate if already present
        if (prev.find(t => String(t._id) === String(trade._id))) return prev;
        return [trade, ...prev];
      });
    });

    socket.on('prediction.updated', ({ tradeId, prediction }) => {
      console.log('socket prediction.updated', tradeId, prediction);
      setTrades(prev => prev.map(t => {
        if (String(t._id) === String(tradeId)) {
          return { ...t, prediction };
        }
        return t;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function handleTradeCreated(newTrade) {
    setTrades(prev => [newTrade, ...prev]);
  }

  function handleEditTrade(trade) {
    setEditingTrade(trade);
    setEditModalOpen(true);
  }

  function handleTradeUpdated(updatedTrade) {
    setTrades(prev => prev.map(t => t._id === updatedTrade._id ? updatedTrade : t));
    setEditModalOpen(false);
    setEditingTrade(null);
  }

  // Filter and sort trades
  const filteredTrades = trades
    .filter(trade => {
      if (filterSymbol && !trade.symbol.toLowerCase().includes(filterSymbol.toLowerCase())) {
        return false;
      }
      if (filterResult !== 'all' && trade.result !== filterResult) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'profit') {
        return (b.profitPct || 0) - (a.profitPct || 0);
      } else if (sortBy === 'symbol') {
        return a.symbol.localeCompare(b.symbol);
      }
      return 0;
    });

  // Separate active and recent trades
  const activeTrades = filteredTrades.filter(trade => trade.result === 'open' || !trade.result);
  const recentTrades = filteredTrades.filter(trade => trade.result !== 'open' && trade.result);

  // Calculate summary stats
  const stats = {
    total: trades.length,
    wins: trades.filter(t => t.result === 'win').length,
    losses: trades.filter(t => t.result === 'loss').length,
    winRate: trades.length > 0 
      ? ((trades.filter(t => t.result === 'win').length / trades.length) * 100).toFixed(1)
      : 0,
    avgRR: trades.length > 0
      ? (trades.reduce((sum, t) => sum + (t.riskReward || 0), 0) / trades.length).toFixed(2)
      : 0
  };

  if (loading) {
    return (
      <div className="modern-trades-page">
        <div className="loading-spinner">Loading trades...</div>
      </div>
    );
  }

  return (
    <div className="modern-trades-page">
      {/* Page Header */}
      <div className="trades-page-header">
        <div className="header-content">
          <h1>📝 Trading Journal</h1>
          <p className="page-description">Track, analyze, and improve your trading performance</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-refresh" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <span className="btn-icon">{refreshing ? '⏳' : '🔄'}</span>
            {refreshing ? 'Refreshing...' : 'Refresh Trades'}
          </button>
          <button 
            className="btn-add-trade" 
            onClick={() => setModalOpen(true)}
          >
            <span className="btn-icon">+</span>
            Add Trade
          </button>
        </div>
      </div>

      {/* Automated Trade Sync (MT5) */}
      <MT5SyncForm onSync={handleMT5Sync} syncing={syncing} />
      {syncMsg && <div className="mt5-sync-msg">{syncMsg}</div>}
      {syncedAccount && (
        <div className="mt5-account-section">
          <h2>🔗 Linked MT5 Account</h2>
          <div className="account-info-grid">
            <div className="account-info-item">
              <span className="info-label">Login:</span>
              <span className="info-value">{syncedAccount.login}</span>
            </div>
            <div className="account-info-item">
              <span className="info-label">Balance:</span>
              <span className="info-value">${syncedAccount.balance?.toFixed(2)}</span>
            </div>
            <div className="account-info-item">
              <span className="info-label">Equity:</span>
              <span className="info-value">${syncedAccount.equity?.toFixed(2)}</span>
            </div>
            <div className="account-info-item">
              <span className="info-label">Margin:</span>
              <span className="info-value">${syncedAccount.margin?.toFixed(2)}</span>
            </div>
            <div className="account-info-item">
              <span className="info-label">Free Margin:</span>
              <span className="info-value">${syncedAccount.free_margin?.toFixed(2)}</span>
            </div>
            <div className="account-info-item">
              <span className="info-label">Profit:</span>
              <span className="info-value">${syncedAccount.profit?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {trades.length === 0 ? (
        <div className="modern-empty-state">
          <div className="empty-icon">📝</div>
          <h3>No trades yet</h3>
          <p>Start building your trading journal by adding your first trade</p>
          <button className="btn-add-trade" onClick={() => setModalOpen(true)}>
            <span className="btn-icon">+</span>
            Add Your First Trade
          </button>
        </div>
      ) : (
        <>
          {/* Filters Section */}
          <div className="trades-filters-card">
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">
                  <span className="filter-icon">🔍</span>
                  Search Symbol
                </label>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search by symbol..."
                  value={filterSymbol}
                  onChange={(e) => setFilterSymbol(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <span className="filter-icon">📊</span>
                  Result
                </label>
                <select
                  className="filter-select"
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                >
                  <option value="all">All Results</option>
                  <option value="win">Wins Only</option>
                  <option value="loss">Losses Only</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <span className="filter-icon">↕️</span>
                  Sort By
                </label>
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date (Newest)</option>
                  <option value="profit">Profit %</option>
                  <option value="symbol">Symbol</option>
                </select>
              </div>

              {(filterSymbol || filterResult !== 'all') && (
                <button
                  className="btn-clear-filters"
                  onClick={() => {
                    setFilterSymbol('');
                    setFilterResult('all');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="filter-results-info">
              Showing <strong>{activeTrades.length}</strong> active and <strong>{recentTrades.length}</strong> recent trades
            </div>
          </div>

{/* Active Trades Section */}
          {activeTrades.length > 0 && (
            <div className="trades-section">
              <h2 className="section-title">🔥 Active Trades</h2>
              <div className="trades-content-card">
                <div className="trades-table-wrapper">
                  <table className="modern-trades-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Position ID</th>
                        <th>Symbol</th>
                        <th>Volume</th>
                        <th>Entry</th>
                        <th>SL</th>
                        <th>TP</th>
                        <th>Exit</th>
                        <th>Result</th>
                        <th>P&L</th>
                        <th>Profit %</th>
                        <th>Prediction</th>
                        <th>Notes</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTrades.map(trade => {
                        const profit = trade.profitPct || 0;
                        const isProfit = profit > 0;
                        
                        return (
                          <tr key={trade._id} className={`trade-row ${trade.mt5 && !trade.mt5.close_time ? 'open-trade-row' : trade.mt5 ? 'closed-trade-row' : ''}`}>
                            <td>
                              <span className={`trade-source-badge ${trade.mt5 ? 'mt5-source' : 'manual-source'}`}>
                                {trade.mt5 ? '🤖 MT5' : '📝 Manual'}
                              </span>
                            </td>
                            <td>
                              <span className="position-id">{trade.mt5 ? trade.mt5.position_id : '-'}</span>
                            </td>
                            <td>
                              <span className="trade-symbol-badge">{trade.symbol}</span>
                            </td>
                            <td className="trade-volume">
                              {trade.mt5?.volume || '-'}
                            </td>
                            <td className="trade-price">
                              <span className="price-value">{trade.entryPrice}</span>
                            </td>
                            <td className="trade-price">
                              <span className="price-value">{trade.mt5?.sl || trade.stopLoss || '-'}</span>
                            </td>
                            <td className="trade-price">
                              <span className="price-value">{trade.mt5?.tp || trade.takeProfit || '-'}</span>
                            </td>
                            <td className="trade-price">
                              <span className="price-value">{trade.exitPrice || '-'}</span>
                            </td>
                            <td>
                              <span className={`modern-result-badge result-${trade.result?.toLowerCase() || 'open'}`}>
                                {trade.result === 'win' && '✅ '}
                                {trade.result === 'loss' && '❌ '}
                                {!trade.result && '⏳ '}
                                {trade.result || 'Open'}
                              </span>
                            </td>
                            <td>
                              <span className={`p-and-l ${trade.profitLoss > 0 ? 'positive' : trade.profitLoss < 0 ? 'negative' : ''}`}>
                                ${trade.profitLoss?.toFixed(2) || '0.00'}
                              </span>
                            </td>
                            <td>
                              <span className={`profit-badge ${isProfit ? 'profit-positive' : 'profit-negative'}`}>
                                {isProfit ? '📈' : '📉'} {profit.toFixed(2)}%
                              </span>
                            </td>
                            <td className="trade-prediction-cell">
                              {trade.prediction ? (
                                <div className="prediction-display">
                                  <div className="prediction-probability">
                                    <span className={`prediction-badge confidence-${trade.prediction.confidence > 0.7 ? 'high' : trade.prediction.confidence > 0.4 ? 'medium' : 'low'}`}>
                                      🎯 {(trade.prediction.winProbability * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="prediction-details">
                                    <small className="prediction-recommendation">
                                      {trade.prediction.recommendation === 'buy' && '🟢 Buy'}
                                      {trade.prediction.recommendation === 'sell' && '🔴 Sell'}
                                      {trade.prediction.recommendation === 'hold' && '🟡 Hold'}
                                      {trade.prediction.recommendation === 'neutral' && '⚪ Neutral'}
                                    </small>
                                  </div>
                                </div>
                              ) : (
                                <span className="no-prediction">No prediction</span>
                              )}
                            </td>
                            <td className="trade-notes-cell">
                              {trade.notes?.map(n=>n.text).join(' | ') || 
                                <span className="no-notes">No notes</span>
                              }
                            </td>
                            <td>
                              <span className={`status-badge ${trade.mt5 && !trade.mt5.close_time ? 'status-open' : 'status-closed'}`}>
                                {trade.mt5 && !trade.mt5.close_time ? '🟢 Open' : '🔴 Closed'}
                              </span>
                            </td>
                            <td className="trade-date-cell">
                              {new Date(trade.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="trade-actions-cell">
                              <button 
                                className="btn-edit-small" 
                                onClick={() => handleEditTrade(trade)}
                                title="Edit trade"
                              >
                                ✏️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Recent Trades Section */}
          {recentTrades.length > 0 && (
            <div className="trades-section">
              <h2 className="section-title">📚 Recent Trades</h2>
              <div className="trades-content-card">
                <div className="trades-table-wrapper">
                  <table className="modern-trades-table">
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Position ID</th>
                        <th>Symbol</th>
                        <th>Volume</th>
                        <th>Entry</th>
                        <th>SL</th>
                        <th>TP</th>
                        <th>Exit</th>
                        <th>Result</th>
                        <th>P&L</th>
                        <th>Profit %</th>
                        <th>Prediction</th>
                        <th>Notes</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTrades.map(trade => {
                        const profit = trade.profitPct || 0;
                        const isProfit = profit > 0;
                        
                        return (
                          <tr key={trade._id} className={`trade-row ${trade.mt5 && !trade.mt5.close_time ? 'open-trade-row' : trade.mt5 ? 'closed-trade-row' : ''}`}>
                            <td>
                              <span className={`trade-source-badge ${trade.mt5 ? 'mt5-source' : 'manual-source'}`}>
                                {trade.mt5 ? '🤖 MT5' : '📝 Manual'}
                              </span>
                            </td>
                            <td>
                              <span className="position-id">{trade.mt5 ? trade.mt5.position_id : '-'}</span>
                            </td>
                            <td>
                              <span className="trade-symbol-badge">{trade.symbol}</span>
                            </td>
                            <td className="trade-volume">
                              {trade.mt5?.volume || '-'}
                            </td>
                            <td className="trade-price">
                              <span className="price-value">{trade.entryPrice}</span>
                            </td>
                            <td className="trade-price">
                              <span className="price-value">{trade.mt5?.sl || trade.stopLoss || '-'}</span>
                            </td>
                            <td className="trade-price">
                              <span className="price-value">{trade.mt5?.tp || trade.takeProfit || '-'}</span>
                            </td>
                            <td className="trade-price">
                              <span className="price-value">{trade.exitPrice || '-'}</span>
                            </td>
                            <td>
                              <span className={`modern-result-badge result-${trade.result?.toLowerCase() || 'open'}`}>
                                {trade.result === 'win' && '✅ '}
                                {trade.result === 'loss' && '❌ '}
                                {!trade.result && '⏳ '}
                                {trade.result || 'Open'}
                              </span>
                            </td>
                            <td>
                              <span className={`p-and-l ${trade.profitLoss > 0 ? 'positive' : trade.profitLoss < 0 ? 'negative' : ''}`}>
                                ${trade.profitLoss?.toFixed(2) || '0.00'}
                              </span>
                            </td>
                            <td>
                              <span className={`profit-badge ${isProfit ? 'profit-positive' : 'profit-negative'}`}>
                                {isProfit ? '📈' : '📉'} {profit.toFixed(2)}%
                              </span>
                            </td>
                            <td className="trade-prediction-cell">
                              {trade.prediction ? (
                                <div className="prediction-display">
                                  <div className="prediction-probability">
                                    <span className={`prediction-badge confidence-${trade.prediction.confidence > 0.7 ? 'high' : trade.prediction.confidence > 0.4 ? 'medium' : 'low'}`}>
                                      🎯 {(trade.prediction.winProbability * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="prediction-details">
                                    <small className="prediction-recommendation">
                                      {trade.prediction.recommendation === 'buy' && '🟢 Buy'}
                                      {trade.prediction.recommendation === 'sell' && '🔴 Sell'}
                                      {trade.prediction.recommendation === 'hold' && '🟡 Hold'}
                                      {trade.prediction.recommendation === 'neutral' && '⚪ Neutral'}
                                    </small>
                                  </div>
                                </div>
                              ) : (
                                <span className="no-prediction">No prediction</span>
                              )}
                            </td>
                            <td className="trade-notes-cell">
                              {trade.notes?.map(n=>n.text).join(' | ') || 
                                <span className="no-notes">No notes</span>
                              }
                            </td>
                            <td>
                              <span className={`status-badge ${trade.mt5 && !trade.mt5.close_time ? 'status-open' : 'status-closed'}`}>
                                {trade.mt5 && !trade.mt5.close_time ? '🟢 Open' : '🔴 Closed'}
                              </span>
                            </td>
                            <td className="trade-date-cell">
                              {new Date(trade.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="trade-actions-cell">
                              <button 
                                className="btn-edit-small" 
                                onClick={() => handleEditTrade(trade)}
                                title="Edit trade"
                              >
                                ✏️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {trades.length === 0 && (
            <div className="modern-empty-state">
              <div className="empty-icon">📝</div>
              <h3>No trades yet</h3>
              <p>Start building your trading journal by adding your first trade</p>
              <button className="btn-add-trade" onClick={() => setModalOpen(true)}>
                <span className="btn-icon">+</span>
                Add Your First Trade
              </button>
            </div>
          )}
        </>
      )}

      <TradeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onCreate={handleTradeCreated}
      />

      <EditTradeModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onUpdate={handleTradeUpdated}
        trade={editingTrade}
      />
    </div>
  );
}
