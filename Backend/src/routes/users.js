const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

//
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, bio, avatarUrl, nickName, gender, country, language, timezone } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const updateData = {
      name,
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      nickName: nickName || '',
      gender: gender || '',
      country: country || '',
      language: language || '',
      timezone: timezone || ''
    };
    
    if (email) {
      updateData.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
