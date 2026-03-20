const mongoose = require('mongoose');
const Trade = require('./src/models/Trade');

async function deleteAllTrades() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blackline');
    await Trade.deleteMany({});
    console.log('All trades deleted');
  } catch (err) {
    console.error('Error deleting trades:', err);
  } finally {
    mongoose.connection.close();
  }
}

deleteAllTrades();