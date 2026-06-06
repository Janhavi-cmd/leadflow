require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Attach io to req
app.use((req, res, next) => { req.io = io; next(); });

// Connect MongoDB or use in-memory
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI).then(() => console.log('✅ MongoDB connected')).catch(console.error);
} else {
  console.log('⚡ Running with in-memory data store (no MongoDB URI set)');
  require('./utils/seedMemory')();
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: '2.0.0', time: new Date() }));

// Socket.io
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 LeadFlow CRM v2 API running on http://localhost:${PORT}`);
  console.log(`   Auth: JWT | Realtime: Socket.io | Features: Kanban, AI Score, CSV, Activity Log`);
});
