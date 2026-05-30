import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Config and DB
import { config } from './config/config.js';
import { connectDB } from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import taskRoutes from './routes/tasks.js';
import expenseRoutes from './routes/expenses.js';
import requestRoutes from './routes/requests.js';
import notificationRoutes from './routes/notifications.js';
import chatRoutes from './routes/chat.js';
import teamsRoutes from './routes/teams.js';
import attendanceRoutes from './routes/attendance.js';
import profileRoutes from './routes/profile.js';
import pollsRoutes from './routes/polls.js';
import adminRoutes from './routes/admin.js';

// Socket Handlers
import registerChatHandler from './socket/chatHandler.js';
import registerCallHandler from './socket/callHandler.js';
import registerNotifHandler from './socket/notifHandler.js';

const app = express();
const httpServer = createServer(app);

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Vite dev servers
  credentials: true
}));

app.use(express.json());

// Set up Static folders for file uploads (Multer)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Connect Database
await connectDB();

// API Routers
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/polls', pollsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'AUISC EventSync Backend API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Socket.io Setup
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);

// Active connections registry (userId -> socket.id)
const activeUsers = new Map();
app.set('activeUsers', activeUsers);

io.on('connection', (socket) => {
  // console.log(`Client connected: ${socket.id}`);
  
  registerChatHandler(io, socket, activeUsers);
  registerCallHandler(io, socket, activeUsers);
  registerNotifHandler(io, socket, activeUsers);
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
});
