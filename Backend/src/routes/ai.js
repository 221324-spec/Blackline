const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Trade = require('../models/Trade');
const { 
  analyzeTrades, 
  getQuickTip, 
  analyzeSingleTrade, 
  analyzePattern,
  getTradingAdvice,
  identifyMistakes
} = require('../services/aiService');
const buyersApiService = require('../services/buyersApiService');

/**
 * @route   POST /api/ai/analyze-trade/:tradeId
 * @desc    Analyze a specific trade with AI
 * @access  Private
 */
router.post('/analyze-trade/:tradeId', authMiddleware, async (req, res) => {
  try {
    const trade = await Trade.findOne({ 
      _id: req.params.tradeId, 
      userId: req.user._id 
    });

    if (!trade) {
      return res.status(404).json({ msg: 'Trade not found' });
    }

    const analysis = await analyzeSingleTrade(trade);
    
   
    trade.aiAnalysis = analysis.analysis;
    trade.aiAnalyzedAt = analysis.timestamp;
    await trade.save();

    res.json({
      success: true,
      tradeId: trade._id,
      analysis: analysis.analysis,
      analyzedAt: analysis.timestamp
    });
  } catch (error) {
    console.error('Trade Analysis Error:', error);
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        msg: 'AI service not configured. Please add OPENAI_API_KEY to environment variables.' 
      });
    }
    res.status(500).json({ msg: 'Failed to analyze trade', error: error.message });
  }
});

/**
 * @route   GET /api/ai/pattern-analysis
 * @desc    Get AI analysis of trading patterns
 * @access  Private
 */
router.get('/pattern-analysis', authMiddleware, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(20);

    if (trades.length === 0) {
      return res.status(400).json({ msg: 'Not enough trades for pattern analysis. Add at least 5 trades.' });
    }

    if (trades.length < 5) {
      return res.status(400).json({ 
        msg: `You have ${trades.length} trades. Need at least 5 for meaningful pattern analysis.` 
      });
    }

    const patternAnalysis = await analyzePattern(trades);

    res.json({
      success: true,
      ...patternAnalysis
    });
  } catch (error) {
    console.error('Pattern Analysis Error:', error);
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        msg: 'AI service not configured. Please add OPENAI_API_KEY to environment variables.' 
      });
    }
    res.status(500).json({ msg: 'Failed to analyze patterns', error: error.message });
  }
});

/**
 * @route   GET /api/ai/daily-advice
 * @desc    Get personalized trading advice
 * @access  Private
 */
router.get('/daily-advice', authMiddleware, async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(10);

    
    const totalTrades = trades.length;
    const wins = trades.filter(t => t.result === 'win').length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
    const avgRR = totalTrades > 0 
      ? (trades.reduce((sum, t) => sum + t.riskReward, 0) / totalTrades).toFixed(2)
      : 0;
    const bestTrade = Math.max(...trades.map(t => t.profitLoss || 0), 0);
    const worstTrade = Math.min(...trades.map(t => t.profitLoss || 0), 0);

    const metrics = {
      totalTrades,
      winRate: parseFloat(winRate),
      avgRiskReward: parseFloat(avgRR),
      bestTrade,
      worstTrade
    };

    const advice = await getTradingAdvice(metrics, trades);

    res.json({
      success: true,
      advice: advice.advice,
      metrics,
      timestamp: advice.timestamp
    });
  } catch (error) {
    console.error('Daily Advice Error:', error);
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        msg: 'AI service not configured. Please add OPENAI_API_KEY to environment variables.' 
      });
    }
    res.status(500).json({ msg: 'Failed to generate advice', error: error.message });
  }
});

/**
 * @route   POST /api/ai/identify-mistakes/:tradeId
 * @desc    Identify mistakes in a specific trade
 * @access  Private
 */
router.post('/identify-mistakes/:tradeId', authMiddleware, async (req, res) => {
  try {
    const trade = await Trade.findOne({ 
      _id: req.params.tradeId, 
      userId: req.user._id 
    });

    if (!trade) {
      return res.status(404).json({ msg: 'Trade not found' });
    }

    const mistakeAnalysis = await identifyMistakes(trade);

    res.json({
      success: true,
      tradeId: trade._id,
      mistakes: mistakeAnalysis.mistakes,
      analyzedAt: mistakeAnalysis.timestamp
    });
  } catch (error) {
    console.error('Mistake Identification Error:', error);
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        msg: 'AI service not configured. Please add OPENAI_API_KEY to environment variables.' 
      });
    }
    res.status(500).json({ msg: 'Failed to identify mistakes', error: error.message });
  }
});

/**
 * @route   POST /api/ai/bulk-analyze
 * @desc    Analyze all unanalyzed trades
 * @access  Private
 */
router.post('/bulk-analyze', authMiddleware, async (req, res) => {
  try {
    const unanalyzedTrades = await Trade.find({ 
      userId: req.user._id,
      aiAnalysis: { $exists: false }
    }).limit(10); 

    if (unanalyzedTrades.length === 0) {
      return res.json({ 
        success: true, 
        msg: 'All trades already analyzed',
        analyzed: 0 
      });
    }

    const results = [];
    for (const trade of unanalyzedTrades) {
      try {
        const analysis = await analyzeSingleTrade(trade);
        trade.aiAnalysis = analysis.analysis;
        trade.aiAnalyzedAt = analysis.timestamp;
        await trade.save();
        results.push({ tradeId: trade._id, success: true });
      } catch (error) {
        results.push({ tradeId: trade._id, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      analyzed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('Bulk Analysis Error:', error);
    res.status(500).json({ msg: 'Failed to perform bulk analysis', error: error.message });
  }
});

/**
 * @route   GET /api/ai/comprehensive-analysis
 * @desc    Get comprehensive AI analysis of all trades (NEW)
 * @access  Private
 */
router.get('/comprehensive-analysis', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;

    const trades = await Trade.find({ userId }).sort({ date: -1 }).limit(50);

    if (trades.length === 0) {
      return res.json({
        success: false,
        message: 'No trades found. Add some trades to get AI analysis.',
        needsData: true
      });
    }

    const wins = trades.filter(t => t.outcome === 'Win').length;
    const losses = trades.filter(t => t.outcome === 'Loss').length;
    const total = trades.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

    const rrValues = trades
      .filter(t => t.riskReward && t.riskReward > 0)
      .map(t => t.riskReward);
    const avgRR = rrValues.length > 0
      ? (rrValues.reduce((a, b) => a + b, 0) / rrValues.length).toFixed(2)
      : 0;
    let grade = 'E';
    if (winRate >= 60 && avgRR >= 2.0) grade = 'A';
    else if (winRate >= 50 && avgRR >= 1.5) grade = 'B';
    else if (winRate >= 40 && avgRR >= 1.0) grade = 'C';
    else if (winRate >= 30) grade = 'D';

    const metrics = {
      total,
      wins,
      losses,
      winRate: parseFloat(winRate),
      avgRR: parseFloat(avgRR),
      grade
    };
    const aiResult = await analyzeTrades({
      trades: trades.slice(0, 20), 
      metrics,
      userName: req.user.name
    });

    return res.json({
      success: true,
      metrics,
      analysis: aiResult.analysis,
      usingMockData: aiResult.usingMockData || false,
      timestamp: aiResult.timestamp
    });

  } catch (error) {
    console.error('Error generating comprehensive analysis:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate analysis'
    });
  }
});

/**
 * @route   GET /api/ai/quick-tip
 * @desc    Get a quick AI tip (NEW)
 * @access  Private
 */
router.get('/quick-tip', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const trades = await Trade.find({ userId }).sort({ date: -1 }).limit(20);

    if (trades.length === 0) {
      return res.json({
        tip: 'Start tracking your trades to receive personalized AI insights!',
        icon: '📝',
        timestamp: new Date()
      });
    }

    const wins = trades.filter(t => t.outcome === 'Win').length;
    const total = trades.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;

    const rrValues = trades
      .filter(t => t.riskReward && t.riskReward > 0)
      .map(t => t.riskReward);
    const avgRR = rrValues.length > 0
      ? (rrValues.reduce((a, b) => a + b, 0) / rrValues.length).toFixed(2)
      : 0;

    const metrics = {
      total,
      winRate: parseFloat(winRate),
      avgRR: parseFloat(avgRR)
    };

    const tip = await getQuickTip(metrics);
    return res.json(tip);

  } catch (error) {
    console.error('Error generating quick tip:', error);
    return res.status(500).json({
      tip: 'Focus on consistency and risk management for long-term success.',
      icon: '💡',
      timestamp: new Date()
    });
  }
});

/**
 * @route   GET /api/ai/dashboard-insight
 * @desc    Get brief insight for dashboard (NEW)
 * @access  Private
 */
router.get('/dashboard-insight', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const trades = await Trade.find({ userId }).sort({ date: -1 }).limit(10);

    if (trades.length === 0) {
      return res.json({
        hasData: false,
        message: 'Add trades to unlock AI insights',
        icon: '🤖'
      });
    }

    const wins = trades.filter(t => t.outcome === 'Win').length;
    const total = trades.length;
    const winRate = ((wins / total) * 100).toFixed(0);

    let insight = '';
    let sentiment = 'neutral';
    let icon = '🤖';

    if (winRate >= 60) {
      insight = 'Strong performance on recent trades!';
      sentiment = 'positive';
      icon = '🎯';
    } else if (winRate >= 40) {
      insight = 'Steady progress, keep refining your strategy.';
      sentiment = 'neutral';
      icon = '📊';
    } else {
      insight = 'Review your strategy and focus on high-probability setups.';
      sentiment = 'warning';
      icon = '⚠️';
    }

    return res.json({
      hasData: true,
      insight,
      sentiment,
      icon,
      recentWinRate: parseInt(winRate),
      tradeCount: total
    });

  } catch (error) {
    console.error('Error generating dashboard insight:', error);
    return res.status(500).json({
      hasData: false,
      message: 'Unable to generate insights',
      icon: '🤖'
    });
  }
});

// POST /api/ai/predict-trade/:tradeId - generate and save prediction for a specific trade
router.post('/predict-trade/:tradeId', authMiddleware, async (req, res) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.tradeId, userId: req.user._id });
    if (!trade) return res.status(404).json({ msg: 'Trade not found' });

    const pred = await buyersApiService.getPrediction({
      symbol: trade.symbol || 'EURUSD',
      entryPrice: trade.entryPrice,
      stopLoss: trade.mt5?.stop_price || trade.stopLoss || undefined,
      takeProfit: trade.mt5?.close_price || trade.takeProfit || undefined,
      timeframe: 'H1'
    });

    trade.prediction = pred;
    await trade.save();

    return res.json({ success: true, prediction: pred, tradeId: trade._id });
  } catch (error) {
    console.error('Predict trade error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

