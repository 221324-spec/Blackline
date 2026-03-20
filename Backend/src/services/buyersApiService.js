const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

class BuyersApiService {
  constructor() {
    this.baseURL = 'http://localhost:8001';
  }

  /**
   * Map/normalize MT5 symbol formats to canonical tickers used by predictor
   * Handles common suffixes (USDT -> USD), strips non-alphanum, and applies
   * a small alias table for known mismatches.
   * @param {string} symbol
   * @returns {string}
   */
  mapSymbol(symbol) {
    if (!symbol) return '';
    let s = symbol.toString().toUpperCase();
    // remove separators commonly present in MT5 (/, -, .)
    s = s.replace(/[\/\-\.\s]/g, '');
    // keep only letters and numbers
    s = s.replace(/[^A-Z0-9]/g, '');

    // small alias map for known problematic tickers
    const ALIASES = {
      'BTCUSDT': 'BTCUSD',
      'ETHUSDT': 'ETHUSD',
      'USDTUSD': 'USD',
      'FATSUDT': 'FATSUSD',
      'FTTUSDT': 'FTTUSD',
      'XBTUSD': 'BTCUSD',
      'DOGEUSDT': 'DOGEUSD',
      'ADAUSDT': 'ADAUSD'
    };
    if (ALIASES[s]) return ALIASES[s];

    // normalize common stablecoin suffix
    s = s.replace(/USDT$/, 'USD');

    // if result is like USDUSD collapse to USD
    s = s.replace(/USDUSD$/, 'USD');

    return s;
  }

  /**
   * Get trade prediction from Buyer's API using standalone Python script
   * @param {Object} tradeData - Trade data for prediction
   * @returns {Promise<Object>} Prediction result
   */
  async getPrediction(tradeData) {
    // sanitize and normalize symbol for external APIs
    let symbol = this.mapSymbol(tradeData.symbol || '');

    const payload = {
      symbol,
      entryPrice: tradeData.entryPrice,
      stopLoss: tradeData.stopLoss,
      takeProfit: tradeData.takeProfit,
      timeframe: tradeData.timeframe || 'H1',
      // include MT5 bars/time series if provided to prefer MT5 as canonical input
      timeSeries: Array.isArray(tradeData.timeSeries) ? tradeData.timeSeries : undefined
    };

    // Try calling the Python predictor with retries/backoff
    const maxAttempts = 5;
    let attempt = 0;
    let lastError = null;
    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        console.log('DEBUG: calling python with payload:', JSON.stringify(payload));
        const result = await this.callPythonScript(payload);
        // If Python returned a neutral recommendation due to missing indicators,
        // try a simple heuristic using takeProfit/entryPrice when available.
        let final = {
          winProbability: result.winProbability,
          confidence: result.confidence,
          riskScore: result.riskScore,
          recommendation: result.recommendation,
          predictedAt: new Date(),
          apiResponse: result
        };

        if (result.recommendation === 'neutral' && payload.entryPrice && payload.takeProfit) {
          try {
            const ep = parseFloat(payload.entryPrice);
            const tp = parseFloat(payload.takeProfit);
            if (!isNaN(ep) && !isNaN(tp) && ep !== tp) {
              if (tp > ep) {
                final.recommendation = 'buy';
                final.winProbability = Math.max(final.winProbability, 0.55);
                final.confidence = Math.max(final.confidence, 0.25);
              } else if (tp < ep) {
                final.recommendation = 'sell';
                final.winProbability = Math.min(final.winProbability, 0.45);
                final.confidence = Math.max(final.confidence, 0.25);
              }
              final.apiResponse = { ...result, _heuristicApplied: true };
            }
          } catch (e) {
            // ignore heuristic errors
          }
        }

        return final;
      } catch (error) {
        lastError = error;
        console.error(`Buyers API attempt ${attempt} failed:`, (error && (error.message || error)).toString());
        // exponential-ish backoff
        const backoff = 1000 * attempt;
        await new Promise(r => setTimeout(r, backoff));
      }
    }

    console.error('Buyers API prediction failed after retries:', lastError && lastError.message);
    return {
      winProbability: 0.5,
      confidence: 0.3,
      riskScore: 0.5,
      recommendation: 'neutral',
      predictedAt: new Date(),
      apiResponse: { error: lastError ? lastError.message : 'unknown' }
    };
  }

  /**
   * Call the standalone Python prediction script
   * @param {Object} payload - Trade data payload
   * @returns {Promise<Object>} Prediction result
   */
  callPythonScript(payload) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [this.pythonScript], {
        cwd: path.dirname(this.pythonScript)
      });

      let stdout = '';
      let stderr = '';

      // Send JSON payload to stdin
      pythonProcess.stdin.write(JSON.stringify(payload));
      pythonProcess.stdin.end();

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        const out = stdout.trim();
        const response = { raw: out, stderr: stderr.trim() };
        if (code === 0) {
          try {
            const result = JSON.parse(out);
            // attach raw response and stderr for debugging
            result._raw = out;
            result._stderr = stderr.trim();
            resolve(result);
          } catch (parseError) {
            const err = new Error(`Failed to parse Python output: ${parseError.message}`);
            err.details = response;
            reject(err);
          }
        } else {
          const err = new Error(`Python script exited with code ${code}`);
          err.details = response;
          reject(err);
        }
      });

      pythonProcess.on('error', (error) => {
        const err = new Error(`Failed to start Python script: ${error.message}`);
        err.details = { stderr: error.stack || error.message };
        reject(err);
      });
    });
  }

  /**
   * Check if the prediction service is healthy
   * @returns {Promise<boolean>} Service health status
   */
  async isHealthy() {
    try {
      // For the standalone script, we can check if the script file exists
      const fs = require('fs');
      return fs.existsSync(this.pythonScript);
    } catch (error) {
      console.error('Buyers API health check failed:', error.message);
      return false;
    }
  }
}

/**
 * Normalize trade object from MetaTrader 5 (MT5) format to a standard format
 * used by the prediction service.
 * @param {Object} trade - Trade object from MT5
 * @returns {Object} Normalized trade object
 */
function normalizeTrade(trade) {
  return {
    symbol: trade.symbol,
    entryPrice: Number(trade.entryPrice || trade.price_open),
    stopLoss: Number(trade.stopLoss || trade.sl),
    takeProfit: trade.takeProfit ? Number(trade.takeProfit) : (trade.tp ? Number(trade.tp) : undefined),
    timeframe: trade.timeframe || "H1"
  };
}

module.exports = { BuyersApiService, normalizeTrade };