require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function deleteAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error deleting users:', error);
  }
}

deleteAllUsers();