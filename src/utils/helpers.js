/**
 * Centralized Error Handler & Logging System
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFilePath = path.join(logsDir, 'error.log');

/**
 * Log error to file
 */
function logToFile(error, context = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message: error.message || error,
    stack: error.stack,
    context,
  };

  const logLine = JSON.stringify(logEntry) + '\n';

  try {
    fs.appendFileSync(logFilePath, logLine, 'utf8');
  } catch (err) {
    console.error('Failed to write to error log:', err);
  }
}

/**
 * Log to console and file
 */
function log(message, context = {}, isError = false) {
  const timestamp = new Date().toISOString();
  const prefix = isError ? '[ERROR]' : '[LOG]';

  console.log(`${prefix} ${timestamp}: ${message}`, context);

  if (isError) {
    logToFile(message, context);
  }
}

/**
 * Handle API errors with consistent format
 */
function handleError(res, statusCode, message, error = null, userId = null) {
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  log(`${message} (ID: ${errorId})`, { userId, error: error?.message }, true);

  return res.status(statusCode).json({
    success: false,
    error: message,
    errorId, // For user to report back to support
  });
}

/**
 * Validate required fields
 */
function validateRequired(data, fields) {
  const missing = [];

  fields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitize numeric input
 */
function sanitizeNumber(input, min = 0, max = Infinity) {
  const num = parseFloat(input);

  if (isNaN(num)) {
    return null;
  }

  if (num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Sanitize string input
 */
function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') {
    return null;
  }

  return input.trim().substring(0, maxLength);
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map();

function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || [];

  // Clean old entries
  const recentRequests = record.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return {
      allowed: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
    };
  }

  recentRequests.push(now);
  rateLimitMap.set(key, recentRequests);

  return { allowed: true };
}

/**
 * Catch and handle async errors
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 */
function globalErrorHandler(err, req, res, next) {
  const userId = req.session?.userId;
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  log(
    `Request failed: ${req.method} ${req.path}`,
    { userId, statusCode, message, error: err.message },
    true
  );

  // Graceful fallback
  return res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred. Please try again later.'
      : message,
    errorId: `ERR_${Date.now()}`,
  });
}

/**
 * Validation middleware factory
 */
function validate(rules) {
  return (req, res, next) => {
    const errors = [];

    Object.entries(rules).forEach(([field, rule]) => {
      const value = req.body[field];

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        return;
      }

      if (rule.type === 'number') {
        if (isNaN(parseFloat(value))) {
          errors.push(`${field} must be a number`);
        }
      }

      if (rule.type === 'string') {
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors.push(`${field} must be at most ${rule.maxLength} characters`);
      }

      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    next();
  };
}

module.exports = {
  log,
  logToFile,
  handleError,
  validateRequired,
  sanitizeNumber,
  sanitizeString,
  checkRateLimit,
  asyncHandler,
  globalErrorHandler,
  validate,
};
