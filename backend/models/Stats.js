const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  
  // Daily metrics
  totalAnalyses: {
    type: Number,
    default: 0
  },
  uniqueUsers: {
    type: Number,
    default: 0
  },
  uniqueEmails: {
    type: Number,
    default: 0
  },
  anonymousUsers: {
    type: Number,
    default: 0
  },
  registeredUsers: {
    type: Number,
    default: 0
  },
  subscribedUsers: {
    type: Number,
    default: 0
  },
  
  // Analysis breakdown by type
  analysisByType: {
    technical: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    eeat: { type: Number, default: 0 },
    queryMatch: { type: Number, default: 0 },
    visibility: { type: Number, default: 0 }
  },
  
  // Top analyzed URLs (array of objects)
  topUrls: [{
    url: String,
    count: Number
  }],
  
  // Average scores
  averageScores: {
    overall: { type: Number, default: 0 },
    technical: { type: Number, default: 0 },
    content: { type: Number, default: 0 },
    eeat: { type: Number, default: 0 },
    queryMatch: { type: Number, default: 0 },
    visibility: { type: Number, default: 0 }
  },
  
  // Conversion metrics
  conversions: {
    emailCaptures: { type: Number, default: 0 },
    otpVerifications: { type: Number, default: 0 },
    subscriptionStarts: { type: Number, default: 0 },
    reportsSent: { type: Number, default: 0 }
  },
  
  // Revenue metrics (if applicable)
  revenue: {
    total: { type: Number, default: 0 },
    monthly: { type: Number, default: 0 },
    semiAnnual: { type: Number, default: 0 },
    annual: { type: Number, default: 0 }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
statsSchema.index({ date: -1 });

// Static method to get or create today's stats
statsSchema.statics.getTodayStats = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let stats = await this.findOne({ date: today });
  
  if (!stats) {
    stats = await this.create({ date: today });
  }
  
  return stats;
};

// Static method to increment analysis count
statsSchema.statics.incrementAnalysis = async function(analyzerType = null) {
  const stats = await this.getTodayStats();
  stats.totalAnalyses += 1;
  
  if (analyzerType && stats.analysisByType[analyzerType] !== undefined) {
    stats.analysisByType[analyzerType] += 1;
  }
  
  return await stats.save();
};

// Static method to update average scores
statsSchema.statics.updateAverageScore = async function(scores) {
  const stats = await this.getTodayStats();
  const currentCount = stats.totalAnalyses || 1;
  
  // Recalculate running averages
  Object.keys(scores).forEach(key => {
    if (stats.averageScores[key] !== undefined && scores[key] !== undefined) {
      const currentAvg = stats.averageScores[key] || 0;
      stats.averageScores[key] = ((currentAvg * (currentCount - 1)) + scores[key]) / currentCount;
    }
  });
  
  return await stats.save();
};

// Static method to track URL popularity
statsSchema.statics.trackUrl = async function(url) {
  const stats = await this.getTodayStats();
  
  const existingUrl = stats.topUrls.find(u => u.url === url);
  if (existingUrl) {
    existingUrl.count += 1;
  } else {
    stats.topUrls.push({ url, count: 1 });
  }
  
  // Sort and keep top 20 URLs
  stats.topUrls.sort((a, b) => b.count - a.count);
  stats.topUrls = stats.topUrls.slice(0, 20);
  
  return await stats.save();
};

module.exports = mongoose.model('Stats', statsSchema);
