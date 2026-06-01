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
import aiRoutes from './routes/ai.js';
import meetingsRoutes from './routes/meetings.js';
import searchRoutes from './routes/search.js';
import usersRoutes from './routes/users.js';
import commentsRoutes from './routes/comments.js';
import mediaRoutes from './routes/media.js';
import announcementsRoutes from './routes/announcements.js';
import photosRoutes from './routes/photos.js';
import photoAlbumsRoutes from './routes/photoAlbums.js';
import facultyRoutes from './routes/faculty.js';
import reportsRoutes from './routes/reports.js';
import taskTemplatesRoutes from './routes/taskTemplates.js';
import availabilityRoutes from './routes/availability.js';
import dmRoutes from './routes/dm.js';
import goalsRoutes from './routes/goals.js';
import auditLogsRoutes from './routes/auditLogs.js';
import { initScheduler } from './cron.js';

// Socket Handlers
import registerChatHandler from './socket/chatHandler.js';
import registerCallHandler from './socket/callHandler.js';
import registerNotifHandler from './socket/notifHandler.js';

const app = express();
const httpServer = createServer(app);

// Enable CORS
const clientUrl = process.env.CLIENT_URL;
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (clientUrl) {
  allowedOrigins.push(clientUrl);
  allowedOrigins.push(clientUrl.replace(/\/$/, '')); // remove trailing slash if any
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow any Vercel preview domain as well as listed allowedOrigins
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
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
app.use('/api/ai', aiRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/photo-albums', photoAlbumsRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/task-templates', taskTemplatesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);

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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.set('io', io);
initScheduler(io);

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
