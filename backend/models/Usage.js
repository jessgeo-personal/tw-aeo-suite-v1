/**
 * Usage Model
 * Tracks tool usage per user per day (Dubai timezone)
 */

const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  tool: {
    type: String,
    required: true,
    enum: ['technical', 'content', 'query-match', 'visibility'],
  },
  url: {
    type: String,
    required: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD (Dubai timezone)
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  results: {
    type: mongoose.Schema.Types.Mixed, // Store the analysis results
  },
});

// Compound index for efficient daily usage queries
usageSchema.index({ userId: 1, tool: 1, date: 1 });
usageSchema.index({ email: 1, date: 1 });
usageSchema.index({ timestamp: -1 });

// Get Dubai date string (UTC+4)
usageSchema.statics.getDubaiDateString = function() {
  const now = new Date();
  // Convert to Dubai time (UTC+4)
  const dubaiTime = new Date(now.getTime() + (4 * 60 * 60 * 1000));
  return dubaiTime.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Check if user has reached daily limit for a tool
usageSchema.statics.checkDailyLimit = async function(userId, tool) {
  const today = this.getDubaiDateString();
  
  const count = await this.countDocuments({
    userId,
    tool,
    date: today,
  });

  return {
    used: count,
    limit: 1,
    remaining: Math.max(0, 1 - count),
    canUse: count < 1,
  };
};

// Check all tool limits for a user today
usageSchema.statics.checkAllLimits = async function(userId) {
  const today = this.getDubaiDateString();
  const tools = ['technical', 'content', 'query-match', 'visibility'];
  
  const limits = {};
  
  for (const tool of tools) {
    const count = await this.countDocuments({
      userId,
      tool,
      date: today,
    });
    
    limits[tool] = {
      used: count,
      limit: 1,
      remaining: Math.max(0, 1 - count),
      canUse: count < 1,
    };
  }
  
  return limits;
};

// Get user's usage history
usageSchema.statics.getUserHistory = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    timestamp: { $gte: startDate },
  })
    .sort({ timestamp: -1 })
    .select('tool url date timestamp')
    .lean();
};

// Record a new usage
usageSchema.statics.recordUsage = async function(userId, email, tool, url, results = null) {
  const today = this.getDubaiDateString();
  
  const usage = new this({
    userId,
    email,
    tool,
    url,
    date: today,
    results,
  });
  
  return usage.save();
};

module.exports = mongoose.model('Usage', usageSchema);
