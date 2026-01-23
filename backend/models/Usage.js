const mongoose = require('mongoose');

const usageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Null for anonymous users
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      // Set to Dubai timezone midnight (UTC+4)
      const now = new Date();
      const dubaiOffset = 4 * 60; // Dubai is UTC+4
      const localOffset = now.getTimezoneOffset();
      const dubaiTime = new Date(now.getTime() + (dubaiOffset + localOffset) * 60000);
      dubaiTime.setHours(0, 0, 0, 0);
      return dubaiTime;
    }
  },
  count: {
    type: Number,
    default: 0,
    min: 0
  },
  analyses: [{
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis'
    },
    url: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index for efficient daily usage queries
usageSchema.index({ email: 1, date: 1 }, { unique: true });
usageSchema.index({ userId: 1, date: 1 });
usageSchema.index({ date: -1 });

// Static method to get today's usage for an email (Dubai timezone)
usageSchema.statics.getTodayUsage = async function(email) {
  const today = this.getDubaiMidnight();
  
  let usage = await this.findOne({ 
    email: email.toLowerCase().trim(), 
    date: today 
  });
  
  if (!usage) {
    usage = await this.create({
      email: email.toLowerCase().trim(),
      date: today,
      count: 0,
      analyses: []
    });
  }
  
  return usage;
};

// Static method to get Dubai midnight (today at 00:00 Dubai time)
usageSchema.statics.getDubaiMidnight = function() {
  const now = new Date();
  const dubaiOffset = 4 * 60; // Dubai is UTC+4
  const localOffset = now.getTimezoneOffset();
  const dubaiTime = new Date(now.getTime() + (dubaiOffset + localOffset) * 60000);
  dubaiTime.setHours(0, 0, 0, 0);
  return dubaiTime;
};

// Method to increment usage count
usageSchema.methods.incrementUsage = async function(analysisId, url) {
  this.count += 1;
  this.analyses.push({
    analysisId,
    url,
    timestamp: new Date()
  });
  return await this.save();
};

// Method to check if user has exceeded daily limit
usageSchema.methods.hasExceededLimit = function(dailyLimit) {
  return this.count >= dailyLimit;
};

module.exports = mongoose.model('Usage', usageSchema);
