const Async = require('async');
const DEFAULT_CONCURRENCY = 2;

class PredictionQueue {
  constructor(concurrency = DEFAULT_CONCURRENCY, delayMs = 1200) {
    this.delayMs = delayMs;
    this.queue = Async.queue(async (task, cb) => {
      try {
        await task.fn();
      } catch (err) {
        console.error('Prediction task error:', err && (err.message || err));
      }
      // delay between tasks to avoid hitting API rate limits
      setTimeout(cb, this.delayMs);
    }, concurrency);
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  idle() {
    return this.queue.idle();
  }
}

// export singleton
module.exports = new PredictionQueue();
