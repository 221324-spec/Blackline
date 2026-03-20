const axios = require('axios');
const BuyersApiService = require('../src/services/buyersApiService');
const mt5SyncService = require('../src/services/mt5SyncService');
const buyers = new BuyersApiService();

(async ()=>{
  try {
    const mt5Url = 'http://localhost:8005';
    console.log('Fetching demo trades from MT5 mock...');
    let trades = [];
    try {
      const res = await axios.get(`${mt5Url}/demo-trades`, { timeout: 4000 });
      trades = res.data;
      console.log('Got', trades.length, 'demo trades from mock');
    } catch (err) {
      console.warn('Failed to fetch demo trades from mock, synthesizing demo trades locally');
      const symbols = ['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF','NZDUSD'];
      const makeTrade = (id) => {
        const symbol = symbols[id % symbols.length];
        const open = +(1 + ((id % 100) / 100)) * (Math.random()*100).toFixed(5);
        return {
          position_id: 100000 + id,
          symbol,
          open_price: parseFloat((Math.random()*100).toFixed(5)),
          close_price: parseFloat((Math.random()*100).toFixed(5)),
          stop_price: null
        };
      };
      for (let i=0;i<8;i++) trades.push(makeTrade(i));
      console.log('Synthesized', trades.length, 'demo trades');
    }

    let stats = { total: 0, buy:0, sell:0, neutral:0, errors:0 };
    for (const t of trades) {
      stats.total++;
      try {
        // fetch MT5 bars and pass to predictor as canonical input
        let bars = [];
        try {
          bars = await mt5SyncService.getBars(t.symbol, 'H1', 200);
        } catch (bErr) {
          console.error('bars fetch failed for', t.symbol, bErr && (bErr.message || bErr));
        }
        const pred = await buyers.getPrediction({
          symbol: t.symbol,
          entryPrice: t.open_price,
          stopLoss: t.stop_price || undefined,
          takeProfit: t.close_price || undefined,
          timeframe: 'H1',
          timeSeries: bars
        });
        console.log('Trade', t.position_id, t.symbol, '->', pred.recommendation, JSON.stringify({ _stderr: pred._stderr || pred.apiResponse && pred.apiResponse._stderr, usedBars: (bars && bars.length>0) }));
        if (pred.recommendation === 'buy') stats.buy++;
        else if (pred.recommendation === 'sell') stats.sell++;
        else stats.neutral++;
      } catch (e) {
        console.error('Error predicting for', t.position_id, e && (e.message || e));
        stats.errors++;
      }
      // small delay to be kind to anything external
      await new Promise(r=>setTimeout(r, 250));
    }

    console.log('Summary:', stats);
    process.exit(0);
  } catch (err) {
    console.error('Batch predict failed:', err && (err.message || err));
    process.exit(1);
  }
})();
