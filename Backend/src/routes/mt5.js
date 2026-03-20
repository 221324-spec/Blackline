const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const mt5SyncService = require('../services/mt5SyncService');
const buyersApiService = require('../services/buyersApiService');
const predictionQueue = require('../services/predictionQueue');
const Trade = require('../models/Trade');

// POST /api/mt5/sync - Sync trades from MT5 for the authenticated user
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { login, password, server } = req.body;
    if (!login || !password || !server) {
      return res.status(400).json({ error: 'login, password, and server are required' });
    }
    // Fetch trades from MT5 microservice
    const mt5Response = await mt5SyncService.syncTrades({ login, password, server });
    const mt5Trades = mt5Response.trades;
    const accountInfo = mt5Response.account;
    // Save/sync trades to DB for this user
    const userId = req.user._id;
    let imported = 0;
    const createdIds = [];
    for (const t of mt5Trades) {
      // Check if trade already exists (by position_id and user)
      const exists = await Trade.findOne({ userId, 'mt5.position_id': t.position_id });
      if (!exists) {
        // Create new trade
        // Determine result based on trade status
        let result = 'open';
        if (t.close_price !== null && t.close_price !== undefined) {
          result = t.profit > 0 ? 'win' : 'loss';
        }

        const created = await Trade.create({
          userId,
          symbol: t.symbol,
          entryPrice: t.open_price,
          exitPrice: t.close_price,
          result: result,
          date: t.open_time ? new Date(t.open_time * 1000) : new Date(),
          profitLoss: t.profit,
          mt5: t,
          prediction: { recommendation: 'neutral' }
        });
        createdIds.push(created._id);
        imported++;

        // notify clients immediately about created trade
        try {
          const socketHelper = require('../services/socket');
          const io = socketHelper.getIo();
          if (io) io.emit('trade.created', created);
        } catch (e) {
          console.error('Socket emit error (mt5 created):', e && e.message);
        }
      } else {
        // Update existing trade (for open trades, update P&L)
        const updateData = {
          profitLoss: t.profit,
          profitPct: (t.profit / Math.abs(t.open_price || 1)) * 100,
          mt5: t
        };
        if (t.close_price !== null && t.close_price !== undefined) {
          updateData.exitPrice = t.close_price;
          updateData.result = t.profit > 0 ? 'win' : 'loss';
        }
        await Trade.findByIdAndUpdate(exists._id, updateData);
        // No new import for updates
      }
    }
    // Enqueue prediction updates for created trades to run in background queue (rate-limited by queue)
    for (const id of createdIds) {
      const idCopy = id; // capture
      predictionQueue.add(async () => {
        try {
          const tradeDoc = await Trade.findById(idCopy);
          if (!tradeDoc) return;

          // Prefer MT5 bars as canonical input for indicators when available
          let bars = [];
          try {
            bars = await mt5SyncService.getBars(tradeDoc.symbol, 'H1', 200);
            if (bars && bars.length) console.log('Fetched', bars.length, 'bars for', tradeDoc.symbol);
          } catch (bErr) {
            console.error('Error fetching bars for', tradeDoc.symbol, bErr && (bErr.message || bErr));
          }

          const pred = await buyersApiService.getPrediction({
            symbol: tradeDoc.symbol,
            entryPrice: tradeDoc.entryPrice,
            stopLoss: tradeDoc.mt5?.stop_price || tradeDoc.stopLoss || undefined,
            takeProfit: tradeDoc.mt5?.close_price || tradeDoc.takeProfit || undefined,
            timeframe: 'H1',
            timeSeries: bars
          });
          const updated = await Trade.findByIdAndUpdate(idCopy, { prediction: pred }, { new: true });
          console.log('Updated prediction for trade', idCopy);
          try {
            const socketHelper = require('../services/socket');
            const io = socketHelper.getIo();
            if (io) io.emit('prediction.updated', { tradeId: idCopy, prediction: updated.prediction });
          } catch (e) {
            console.error('Socket emit error (prediction.updated):', e && e.message);
          }
        } catch (uerr) {
          console.error('Failed to update prediction for trade', idCopy, uerr && (uerr.message || uerr));
          // persist minimal fallback and error details in apiResponse
          try {
            await Trade.findByIdAndUpdate(idCopy, { prediction: { recommendation: 'neutral', apiResponse: { error: uerr && (uerr.message || uerr), details: uerr && uerr.details } } });
          } catch (e) {
            console.error('Failed to persist fallback prediction for', idCopy, e && (e.message || e));
          }
        }
      });
    }

    return res.json({ imported, total: mt5Trades.length, account: accountInfo });
  } catch (err) {
    console.error('MT5 sync error:', err);
    // prefer detailed microservice response when available (for debugging)
    const details = (err && err.response && (err.response.data || err.response.statusText)) || err.message || String(err);
    return res.status(500).json({ error: 'MT5 sync failed', details });
  }
});

module.exports = router;
