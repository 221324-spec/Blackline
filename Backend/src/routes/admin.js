const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Trade = require('../models/Trade');
const Resource = require('../models/Resource');
const { authMiddleware, requireRole } = require('../middleware/auth');

// List users
router.get('/users', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Block/unblock user
router.post('/users/:id/block', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const { action } = req.body; 
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    u.isBlocked = action === 'block';
    await u.save();
    return res.json({ user: u });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.get('/stats', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const Post = require('../models/Post'); 
    const totalUsers = await User.countDocuments();
    const totalTrades = await Trade.countDocuments();
    const totalResources = await Resource.countDocuments();
    const totalPosts = await Post.countDocuments();
    return res.json({ totalUsers, totalTrades, totalResources, totalPosts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
