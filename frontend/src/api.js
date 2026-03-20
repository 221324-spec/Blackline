import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = {
  async register(payload) {
    const res = await axios.post(`${API_BASE}/api/auth/register`, payload);
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  },

  async login(payload) {
    const res = await axios.post(`${API_BASE}/api/auth/login`, payload);
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  },

  async verifyOTP(payload) {
    const res = await axios.post(`${API_BASE}/api/auth/verify-otp`, payload);
    if (res.data.token) localStorage.setItem('token', res.data.token);
    return res.data;
  },

  async resendVerification(payload) {
    const res = await axios.post(`${API_BASE}/api/auth/resend-verification`, payload);
    return res.data;
  },

  async getMe() {
    try {
      const res = await axios.get(`${API_BASE}/api/auth/me`, { headers: authHeader() });
      return res.data.user;
    } catch (err) {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('mt5Credentials');
  },

  async getResources() {
    const res = await axios.get(`${API_BASE}/api/resources`, { headers: authHeader() });
    return res.data.resources;
  },

  async getTrades() {
    const res = await axios.get(`${API_BASE}/api/trades`, { headers: authHeader() });
    return res.data.trades;
  },

  async createTrade(payload) {
    const res = await axios.post(`${API_BASE}/api/trades`, payload, { headers: authHeader() });
    return res.data.trade;
  },

  async updateTrade(id, payload) {
    const res = await axios.put(`${API_BASE}/api/trades/${id}`, payload, { headers: authHeader() });
    return res.data.trade;
  },

  async getMetrics() {
    const res = await axios.get(`${API_BASE}/api/metrics`, { headers: authHeader() });
    return res.data;
  },

  async getPosts() {
    const res = await axios.get(`${API_BASE}/api/community`);
    return res.data.posts;
  },

  async createPost(payload) {
    const res = await axios.post(`${API_BASE}/api/community`, payload, { headers: authHeader() });
    return res.data.post;
  },

  async analyzeTrade(tradeId) {
    const res = await axios.post(`${API_BASE}/api/ai/analyze-trade/${tradeId}`, {}, { headers: authHeader() });
    return res.data;
  },

  async analyzePatterns() {
    const res = await axios.get(`${API_BASE}/api/ai/pattern-analysis`, { headers: authHeader() });
    return res.data;
  },

  async getDailyAdvice() {
    const res = await axios.get(`${API_BASE}/api/ai/daily-advice`, { headers: authHeader() });
    return res.data;
  },

  async identifyMistakes(tradeId) {
    const res = await axios.post(`${API_BASE}/api/ai/identify-mistakes/${tradeId}`, {}, { headers: authHeader() });
    return res.data;
  },

  async bulkAnalyze() {
    const res = await axios.post(`${API_BASE}/api/ai/bulk-analyze`, {}, { headers: authHeader() });
    return res.data;
  },

  async getAIInsight() {
    const res = await axios.get(`${API_BASE}/api/ai/dashboard-insight`, { headers: authHeader() });
    return res.data;
  },

  async getComprehensiveAnalysis() {
    const res = await axios.get(`${API_BASE}/api/ai/comprehensive-analysis`, { headers: authHeader() });
    return res.data;
  },

  async getQuickTip() {
    const res = await axios.get(`${API_BASE}/api/ai/quick-tip`, { headers: authHeader() });
    return res.data;
  },

  async get(endpoint) {
    const res = await axios.get(`${API_BASE}${endpoint}`, { headers: authHeader() });
    return res;
  },

  async post(endpoint, payload) {
    const res = await axios.post(`${API_BASE}${endpoint}`, payload, { headers: authHeader() });
    return res;
  }
};

export default api;
