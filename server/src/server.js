import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/database.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import taskRoutes from './routes/tasks.js';
import trashRoutes from './routes/trash.js';
import statsRoutes from './routes/stats.js';

// Load environment variables
dotenv.config();

// Connect to database (don't crash serverless on failure)
connectDB().catch(err => {
  console.error('❌ Database connection failed:', err.message);
});

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration — must come BEFORE rate limiter so 429s still get CORS headers
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'https://personal-tracker-dwge.vercel.app'];

if (!allowedOrigins.includes('https://personal-tracker-dwge.vercel.app')) {
  allowedOrigins.push('https://personal-tracker-dwge.vercel.app');
}

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting — generous for a personal app
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/stats', statsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Habit Tracker API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      habits: '/api/habits',
      tasks: '/api/tasks',
      trash: '/api/trash',
      stats: '/api/stats',
      health: '/health'
    },
    documentation: 'See README.md for API documentation'
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║       🚀 Habit Tracker API Server Running 🚀         ║
║                                                       ║
║       Environment: ${process.env.NODE_ENV?.padEnd(34) || 'development'.padEnd(34)}║
║       Port: ${PORT.toString().padEnd(42)}║
║       URL: http://localhost:${PORT.toString().padEnd(28)}║
║                                                       ║
║       Press Ctrl+C to stop                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

export default app;
