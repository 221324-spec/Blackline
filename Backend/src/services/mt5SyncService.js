const axios = require('axios');

class Mt5SyncService {
  constructor() {
    this.baseURL = process.env.MT5_SYNC_SERVICE_URL || 'http://localhost:8006';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 20000,
    });
  }

  /**
   * Fetch recent bars (close prices) for a symbol/timeframe from MT5 mock
   * @param {string} symbol
   * @param {string} timeframe
   * @param {number} count
   * @returns {Promise<number[]>}
   */
  async getBars(symbol, timeframe = 'H1', count = 120) {
    try {
      const r = await this.client.post('/bars', { symbol, timeframe, count });
      return r.data && r.data.bars ? r.data.bars : [];
    } catch (error) {
      console.error('getBars error', error && (error.message || error));
      // fallback: synthesize a deterministic bar series locally
      try {
        let seed = (symbol || 'X').split('').reduce((s,c)=>s + c.charCodeAt(0), 0);
        const base = (seed % 100) + 1.0;
        const bars = [];
        let price = base;
        let rand = function() { var x = Math.sin(seed++) * 10000; seed++; return x - Math.floor(x); };
        for (let i=0;i<count;i++){
          price = +(price * (1 + (rand()-0.5) * 0.004)).toFixed(5);
          bars.push(price);
        }
        // return newest-first
        return bars.reverse();
      } catch (e2) {
        return [];
      }
    }
  }

  /**
   * Sync trades from MT5 for a user
   * @param {Object} credentials - { login, password, server }
   * @returns {Promise<Array>} List of trades
   */
  async syncTrades(credentials) {
    try {
      // Defensive copy and normalize login to integer when possible
      const payload = { ...credentials };

      if (payload.login !== undefined && payload.login !== null) {
        if (typeof payload.login === 'string') {
          // Extract digits only (frontend may send "100527079" as string)
          const digits = payload.login.replace(/\D/g, '');
          const parsed = digits ? parseInt(digits, 10) : NaN;
          if (!Number.isNaN(parsed)) payload.login = parsed;
        } else if (typeof payload.login === 'number') {
          payload.login = Math.floor(payload.login);
        }
      }

      const response = await this.client.post('/sync_trades', payload);
      return response.data;
    } catch (error) {
      // include microservice response body if present to aid debugging
      const respBody = error.response && (error.response.data || error.response.statusText);
      console.error('MT5 sync error:', error.message, respBody ? { mt5Response: respBody } : '');
      throw error;
    }
  }
}

module.exports = new Mt5SyncService();
