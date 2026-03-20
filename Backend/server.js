const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth');
const tradesRoutes = require('./src/routes/trades');
const resourcesRoutes = require('./src/routes/resources');
const communityRoutes = require('./src/routes/community');
const adminRoutes = require('./src/routes/admin');
const debugRoutes = require('./src/routes/debug');
const aiRoutes = require('./src/routes/ai');
const mentorRoutes = require('./src/routes/mentor');
const usersRoutes = require('./src/routes/users');
const mt5Routes = require('./src/routes/mt5');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// mount routes
app.use('/api/auth', authRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/mt5', mt5Routes);

app.get('/api/metrics', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret);
    const Trade = require('./src/models/Trade');
    const trades = await Trade.find({ userId: payload.id });

    const total = trades.length;
    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const winRate = total ? Math.round((wins / total) * 10000) / 100 : 0;
    const avgRR = total ? Math.round((trades.reduce((s, t) => s + (t.riskReward || 0), 0) / total) * 100) / 100 : 0;
    const profitPct = total ? Math.round((trades.reduce((s, t) => s + (t.profitPct || 0), 0) / total) * 100) / 100 : 0;

    let grade = 'E';
    if (winRate >= 70 && avgRR >= 1.5) grade = 'A';
    else if (winRate >= 60) grade = 'B';
    else if (winRate >= 50) grade = 'C';
    else if (winRate >= 40) grade = 'D';

    return res.json({ total, wins, losses, winRate, avgRR, profitPct, grade });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/', (req, res) => res.json({ ok: true, msg: 'Blackline Matrix Backend' }));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blackline_matrix';
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'backend-service',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI).then(() => {
    mongoose.set('debug', true);
    console.log('MongoDB connected');
  }).catch(err => {
    console.error('MongoDB connection error:', err.message || err);
    // Don't exit for testing purposes
    console.log('Continuing without MongoDB for testing...');
  });
} else {
  console.log('No MONGODB_URI provided, running without database');
}

const http = require('http');
const server = http.createServer(app);

// setup Socket.IO
const { Server } = require('socket.io');
const socketHelper = require('./src/services/socket');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    methods: ['GET','POST']
  }
});
socketHelper.setIo(io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => console.log(`Server + Socket.IO running on port ${PORT}`));
