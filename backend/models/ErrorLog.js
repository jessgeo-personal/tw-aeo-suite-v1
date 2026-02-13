const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,  // May be null for anonymous errors
  
  errorType: {
    type: String,
    enum: ['payment_error', 'webhook_error', 'api_error', 'analysis_error', 'auth_error', 'system_error'],
    required: true
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  message: {
    type: String,
    required: true
  },
  
  stack: String,
  
  context: {
    endpoint: String,
    method: String,
    ip: String,
    userAgent: String,
    requestBody: Object,
    stripeEventId: String,
    additionalData: Object
  },
  
  resolved: {
    type: Boolean,
    default: false
  },
  
  resolvedAt: Date,
  resolvedBy: String,
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Auto-delete old errors after 90 days
errorLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Indexes for queries
errorLogSchema.index({ errorType: 1, timestamp: -1 });
errorLogSchema.index({ severity: 1, resolved: 1 });
errorLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
