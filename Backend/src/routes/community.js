const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Missing fields' });
    const p = new Post({ title, body, authorId: req.user._id });
    await p.save();
    return res.status(201).json({ post: p });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(100);
    return res.json({ posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    return res.json({ post: p });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Missing body' });
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    p.replies.push({ authorId: req.user._id, body });
    await p.save();
    return res.json({ post: p });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    const isAuthor = String(p.authorId) === String(req.user._id);
    if (!isAuthor && req.user.role !== 'Admin') return res.status(403).json({ error: 'Forbidden' });
    await p.remove();
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
