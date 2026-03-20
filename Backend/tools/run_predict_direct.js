const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { BuyersApiService } = require('../src/services/buyersApiService');
const buyersApiService = new BuyersApiService();
const Trade = require('../src/models/Trade');

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blackline_matrix';
    console.log('Connecting to MongoDB:', uri);
    await mongoose.connect(uri);
    console.log('MongoDB connected');

    const trade = await Trade.findOne({ 'prediction.recommendation': 'neutral' });
    if (!trade) {
      console.log('No neutral trade found; looking for any trade');
      const any = await Trade.findOne();
      if (!any) {
        console.log('No trades in DB');
        process.exit(1);
      }
      console.log('Using trade', any._id);
      return process.exit(0);
    }

    console.log('Selected trade:', trade._id.toString(), 'symbol:', trade.symbol);

    const pred = await buyersApiService.getPrediction({
      symbol: trade.symbol || 'EURUSD',
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      timeframe: 'H1'
    });

    console.log('Prediction result:', JSON.stringify(pred, null, 2));

    trade.prediction = pred;
    await trade.save();
    console.log('Trade updated and saved.');
    process.exit(0);
  } catch (err) {
    console.error('Error during direct predict:', err);
    process.exit(1);
  }
})();
