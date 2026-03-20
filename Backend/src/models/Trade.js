const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  text: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const TradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, trim: true },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number },
  // New fields for Buyers API / normalization
  stopLoss: { type: Number },          // stopLoss stored as number
  takeProfit: { type: Number },        // takeProfit stored as number
  timeframe: { type: String, default: 'H1' }, // timeframe like "H1", "daily"
  result: { type: String, enum: ['win', 'loss', 'open'], default: 'open' },
  date: { type: Date, default: Date.now },
  riskReward: { type: Number, default: 0 },
  profitPct: { type: Number, default: 0 },
  profitLoss: { type: Number, default: 0 },
  notes: [NoteSchema],
  aiAnalysis: { type: String },
  aiAnalyzedAt: { type: Date },
  // Buyer's API prediction fields
  prediction: {
    winProbability: { type: Number, min: 0, max: 1 },
    confidence: { type: Number, min: 0, max: 1 },
    riskScore: { type: Number, min: 0, max: 1 },
    recommendation: { type: String, enum: ['buy', 'sell', 'hold', 'neutral'], default: 'neutral' },
    predictedAt: { type: Date },
    apiResponse: { type: mongoose.Schema.Types.Mixed }
  },
  // MT5 trade metadata
  mt5: {
    position_id: Number,
    symbol: String,
    volume: Number,
    open_price: Number,
    close_price: Number,
    trade_type: String,
    profit: Number,
    open_time: Number,
    close_time: Number
  },
  createdAt: { type: Date, default: Date.now }
});

TradeSchema.pre('save', function (next) {
  if (this.exitPrice != null && this.entryPrice != null) {
    const profit = this.exitPrice - this.entryPrice;
    this.profitPct = (profit / Math.abs(this.entryPrice || 1)) * 100;
    this.profitLoss = profit * 10000;
    this.result = profit > 0 ? 'win' : (profit < 0 ? 'loss' : 'open');
  }
  next();
});

module.exports = mongoose.model('Trade', TradeSchema);
