const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Send to Sentry if configured
  const Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  logger.error('Unhandled error:', { message: err.message, stack: err.stack, url: req.url, method: req.method });

  // Groq API errors
  if (err.message?.includes('groq') || err.status === 429) {
    return res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable. Please try again shortly.',
    });
  }

  // MySQL error codes
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, error: 'Duplicate entry detected.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ success: false, error: 'Referenced record not found.' });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

module.exports = errorHandler;
