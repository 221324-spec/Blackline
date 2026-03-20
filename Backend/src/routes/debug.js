const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const { MongoClient } = require('mongodb');

router.get('/resources-all', async (req, res) => {
  try {
    const dbName = mongoose.connection && mongoose.connection.db && mongoose.connection.db.databaseName;
    const db = mongoose.connection.db;
    const collections = db ? await db.listCollections().toArray() : [];
  const total = await Resource.countDocuments({});
  const approved = await Resource.countDocuments({ approved: true });
  const sample = await Resource.findOne({}).lean();
  const rawCount = db ? await db.collection('resources').countDocuments() : null;
  return res.json({ dbName, collections: collections.map(c => c.name), total, approved, rawCount, sample });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/raw-resources', async (req, res) => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return res.status(500).json({ error: 'MONGODB_URI not configured' });
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const docs = await db.collection('resources').find().toArray();
    await client.close();
    return res.json({ rawCount: docs.length, docs: docs.slice(0, 10) });
  } catch (err) {
    console.error('raw-resources error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
