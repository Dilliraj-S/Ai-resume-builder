require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Sentry error monitoring (optional)
const SENTRY_DSN = process.env.SENTRY_DSN;
if (SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({ dsn: SENTRY_DSN });
  console.log('✅ Sentry error monitoring enabled');
}

const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const resumeRoutes = require('./routes/resume.routes');
const aiRoutes = require('./routes/ai.routes');
const pdfRoutes = require('./routes/pdf.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const paymentRoutes = require('./routes/payment.routes');
const resumeParseRoutes = require('./routes/resume-parse.routes');
const resumeAIRoutes = require('./routes/resume-ai.routes');
const authRoutes = require('./routes/auth.routes');
const canvaRoutes = require('./routes/canva.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

// ─── Security Middleware ─────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// CORS - allow only frontend in production, all in development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || false
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id', 'x-session-id']
};
app.use(cors(corsOptions));

// ─── General Middleware ─────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined', {
  stream: { write: msg => logger.info(msg.trim()) }
}));

// ─── Rate Limiting ──────────────────────────────────
// Global rate limit
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints - strict limit (costs money per call)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'AI request limit reached. Please wait a minute.' },
});

// Payment endpoints - extra strict
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many payment requests. Please try again later.' },
});

// Auth endpoints - prevent brute force
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many login attempts. Please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/ai/', aiLimiter);
app.use('/api/payments/', paymentLimiter);
// Email login disabled - Google OAuth only
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);

// ─── Debug Logs ─────────────────────────────────────
// Request logging disabled for cleaner production logs
// app.use((req, res, next) => {
//   if (process.env.NODE_ENV !== 'test') {
//     logger.info(`[REQUEST] ${req.method} ${req.url}`);
//   }
//   next();
// });

// ─── API Routes ─────────────────────────────────────
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/resume-parser', resumeParseRoutes);
app.use('/api/resume-ai', resumeAIRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/canva', canvaRoutes);

// ─── Health Check ───────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ─── SERVE FRONTEND (IMPORTANT) ─────────────────────
const buildPath = path.join(__dirname, '../build');

app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// ─── Error Handling ─────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    console.log("⚠️ Server starting WITHOUT database...");
    console.log("Error details:", error);
  }

  // Start cron jobs for plan expiry
  try {
    const { startCronJobs } = require('./services/cron.service');
    const cronResult = startCronJobs(app);
    if (cronResult.started) {
      logger.info('✅ Cron jobs started');
    }
  } catch (e) {
    logger.warn('Cron jobs not available:', e.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();

module.exports = app;