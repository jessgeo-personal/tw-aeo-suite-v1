const ErrorLog = require('../models/ErrorLog');

/**
 * Log errors to database
 */
async function logError({
  errorType,
  severity = 'medium',
  message,
  stack,
  userId = null,
  context = {}
}) {
  try {
    await ErrorLog.create({
      userId,
      errorType,
      severity,
      message,
      stack,
      context,
      timestamp: new Date()
    });
  } catch (err) {
    // Don't let error logging break the app
    console.error('Failed to log error:', err);
  }
}

/**
 * Middleware to catch and log errors
 */
function errorHandler(err, req, res, next) {
  console.error('Error occurred:', err);

  // Log to database
  logError({
    errorType: err.type || 'api_error',
    severity: err.statusCode >= 500 ? 'high' : 'medium',
    message: err.message,
    stack: err.stack,
    userId: req.user?._id,
    context: {
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestBody: req.body
    }
  });

  // Send response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}

/**
 * Log webhook errors
 */
async function logWebhookError(event, error, userId = null) {
  await logError({
    errorType: 'webhook_error',
    severity: 'high',
    message: error.message,
    stack: error.stack,
    userId,
    context: {
      stripeEventId: event.id,
      eventType: event.type,
      additionalData: {
        eventData: event.data
      }
    }
  });
}

/**
 * Log payment errors
 */
async function logPaymentError(error, userId, context = {}) {
  await logError({
    errorType: 'payment_error',
    severity: 'high',
    message: error.message,
    stack: error.stack,
    userId,
    context
  });
}

module.exports = {
  logError,
  errorHandler,
  logWebhookError,
  logPaymentError
};
