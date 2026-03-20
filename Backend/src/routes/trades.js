const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');
const { authMiddleware } = require('../middleware/auth');
const buyersApiService = require('../services/buyersApiService');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { symbol, entryPrice, exitPrice, result, date, riskReward, notes, stopLoss, takeProfit } = req.body;
    const trade = new Trade({
      userId: req.user._id,
      symbol,
      entryPrice,
      exitPrice,
      result: result || undefined,
      date: date || Date.now(),
      riskReward: typeof riskReward === 'number' ? riskReward : 0,
      notes: notes ? [{ text: notes }] : []
    });

    // Get prediction from Buyer's API if entry price is provided
    if (entryPrice) {
      try {
        const prediction = await buyersApiService.getPrediction({
          symbol: symbol || 'EURUSD',
          entryPrice,
          stopLoss,
          takeProfit,
          timeframe: 'H1'
        });
        trade.prediction = prediction;
      } catch (predictionError) {
        console.error('Prediction service error:', predictionError);
        // Continue without prediction - don't fail the trade creation
      }
    }

    await trade.save();

    // emit to connected clients
    try {
      const socketHelper = require('../services/socket');
      const io = socketHelper.getIo();
      if (io) io.emit('trade.created', trade);
    } catch (e) {
      console.error('Socket emit error (trade.created):', e && e.message);
    }

    return res.status(201).json({ trade });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { symbol, from, to } = req.query;
    const q = { userId: req.user._id };
    if (symbol) q.symbol = symbol.toUpperCase();
    if (from || to) q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to) q.date.$lte = new Date(to);

    const trades = await Trade.find(q).sort({ date: -1 }).limit(100);
    return res.json({ trades });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ error: 'Not found' });
    if (String(trade.userId) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    return res.json({ trade });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ error: 'Not found' });
    if (String(trade.userId) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });

    const up = ['symbol', 'entryPrice', 'exitPrice', 'result', 'date', 'riskReward'];
    up.forEach(k => { if (req.body[k] !== undefined) trade[k] = req.body[k]; });
    if (req.body.notes) trade.notes.push({ text: req.body.notes });

    // Update prediction if entry price or symbol changed
    const entryPriceChanged = req.body.entryPrice !== undefined && req.body.entryPrice !== trade.entryPrice;
    const symbolChanged = req.body.symbol !== undefined && req.body.symbol !== trade.symbol;

    if (entryPriceChanged || symbolChanged) {
      try {
        const prediction = await buyersApiService.getPrediction({
          symbol: req.body.symbol || trade.symbol,
          entryPrice: req.body.entryPrice || trade.entryPrice,
          stopLoss: req.body.stopLoss || trade.stopLoss,
          takeProfit: req.body.takeProfit || trade.takeProfit,
          timeframe: 'H1'
        });
        trade.prediction = prediction;
      } catch (predictionError) {
        console.error('Prediction service error:', predictionError);
        // Continue without updating prediction
      }
    }

    await trade.save();
    return res.json({ trade });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ error: 'Not found' });
    if (String(trade.userId) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    await trade.remove();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/predict', authMiddleware, async (req, res) => {
  try {
    const { symbol, entryPrice, stopLoss, takeProfit, timeframe } = req.body;
    
    const prediction = await buyersApiService.getPrediction({
      symbol: symbol || 'EURUSD',
      entryPrice,
      stopLoss,
      takeProfit,
      timeframe: timeframe || 'H1'
    });
    
    return res.json(prediction);
  } catch (err) {
    console.error('Prediction error:', err);
    return res.status(500).json({ error: 'Prediction service error' });
  }
});

module.exports = router;
