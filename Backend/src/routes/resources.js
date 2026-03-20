const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, body, category } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Missing fields' });
    const r = new Resource({ title, body, category, authorId: req.user._id, approved: req.user.role === 'Admin' });
    await r.save();
    return res.status(201).json({ resource: r });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const q = req.user.role === 'Admin' ? {} : { approved: true };
    console.log('[resources] user role:', req.user.role, 'query:', q);
    const count = await Resource.countDocuments(q);
    console.log('[resources] countDocuments:', count);
    const resources = await Resource.find(q)
      .populate('authorId', 'name role')
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json({ resources });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/:id/view', authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found' });
    
    resource.views = (resource.views || 0) + 1;
    await resource.save();
    
    return res.json({ views: resource.views });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Not found' });
    
    const userId = req.user._id.toString();
    const likes = resource.likes || [];
    const hasLiked = likes.some(id => id.toString() === userId);
    
    if (hasLiked) {
      resource.likes = likes.filter(id => id.toString() !== userId);
    } else {
      resource.likes = [...likes, req.user._id];
    }
    
    await resource.save();
    return res.json({ likes: resource.likes.length, hasLiked: !hasLiked });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/approve', authMiddleware, requireRole('Admin'), async (req, res) => {
  try {
    const r = await Resource.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Not found' });
    r.approved = true;
    await r.save();
    return res.json({ resource: r });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
