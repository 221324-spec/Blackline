const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Resource = require('../models/Resource');
const Post = require('../models/Post');
const User = require('../models/User');


router.get('/stats', authMiddleware, async (req, res) => {
  try {
    
    if (req.user.role !== 'Mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }

    const resources = await Resource.find({ authorId: req.user.userId });
    
    
    const posts = await Post.find({ authorId: req.user.userId });
    
    
    const totalViews = resources.reduce((sum, resource) => sum + (resource.views || 0), 0);
    
    
    const totalLikes = resources.reduce((sum, resource) => sum + (resource.likes?.length || 0), 0);
    

    let helpfulRepliesCount = 0;
    posts.forEach(post => {
      post.replies.forEach(reply => {
        if (reply.helpful && reply.authorId.toString() === req.user.userId) {
          helpfulRepliesCount++;
        }
      });
    });


    const unansweredQuestions = await Post.find({ 
      isQuestion: true, 
      isAnswered: false 
    })
    .populate('authorId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      totalResources: resources.length,
      approvedResources: resources.filter(r => r.approved).length,
      pendingResources: resources.filter(r => !r.approved).length,
      totalPosts: posts.length,
      totalViews,
      totalLikes,
      helpfulRepliesCount,
      unansweredQuestions: unansweredQuestions.length,
      recentUnansweredQuestions: unansweredQuestions
    });
  } catch (error) {
    console.error('Error fetching mentor stats:', error);
    res.status(500).json({ error: 'Failed to fetch mentor statistics' });
  }
});

router.get('/content', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }

    const resources = await Resource.find({ authorId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    const posts = await Post.find({ authorId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ resources, posts });
  } catch (error) {
    console.error('Error fetching mentor content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

router.get('/unanswered-questions', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'Mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }

    const questions = await Post.find({ 
      isQuestion: true, 
      isAnswered: false 
    })
    .populate('authorId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({ questions });
  } catch (error) {
    console.error('Error fetching unanswered questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

module.exports = router;
