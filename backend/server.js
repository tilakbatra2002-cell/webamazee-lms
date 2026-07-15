require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/error');

const authRoutes = require('./src/routes/authRoutes');
const leadRoutes = require('./src/routes/leadRoutes');
const scraperRoutes = require('./src/routes/scraperRoutes');
const meetingRoutes = require('./src/routes/meetingRoutes');
const proposalRoutes = require('./src/routes/proposalRoutes');
const followUpRoutes = require('./src/routes/followUpRoutes');
const pipelineRoutes = require('./src/routes/pipelineRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const userRoutes = require('./src/routes/userRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// Socket.IO auth: client connects with { auth: { token } }, we join a
// per-tenant room so scrape progress events never leak across companies.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join:company', (companyId) => {
    socket.join(`company:${companyId}`);
  });
  socket.on('disconnect', () => {});
});

app.set('io', io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Webamazee LMS API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api', analyticsRoutes); // exposes /api/dashboard and /api/analytics
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Webamazee LMS API listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = { app, server, io };
