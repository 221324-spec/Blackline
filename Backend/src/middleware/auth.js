const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

  const secret = process.env.JWT_SECRET || 'dev-secret';
  const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ error: 'User is blocked' });

    req.user = user;
    next();
  } catch (err) {
    console.error('auth error', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (allowed.length && !allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient role' });
  }
  next();
};

module.exports = { authMiddleware, requireRole };
