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

// Static method to increment analysis count and track users
statsSchema.statics.incrementAnalysis = async function(email = null, isVerified = false) {
  const stats = await this.getTodayStats();
  stats.totalAnalyses += 1;
  
  // Track unique emails
  if (email) {
    const emailLower = email.toLowerCase().trim();
    
    // Check if we've seen this email today by looking at the Usage collection
    const Usage = require('./Usage');
    const todayUsage = await Usage.findOne({ 
      email: emailLower,
      date: stats.date 
    });
    
    // If this is the first analysis by this email today, count as unique
    if (todayUsage && todayUsage.count === 1) {
      stats.uniqueEmails += 1;
      
      if (isVerified) {
        stats.registeredUsers += 1;
      } else {
        stats.anonymousUsers += 1;
      }
    }
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

// Static method to get cached aggregated stats
statsSchema.statics.getCached = async function() {
  const BASE_ANALYSES_COUNT = 1025; // Baseline analysis count
  const BASE_USER_COUNT = 78; // Baseline user count
  
  try {
    // Get total analyses from stats collection (aggregate all days)
    const allTimeStats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: '$totalAnalyses' }
        }
      }
    ]);
    
    const dbAnalysesCount = allTimeStats.length > 0 ? allTimeStats[0].totalAnalyses : 0;
    
    // Get total ALL users directly from User collection (removed isVerified filter)
    const User = require('./User');
    const dbUserCount = await User.countDocuments(); // Count ALL users
    
    // Add baseline to actual counts
    const totalAnalyses = BASE_ANALYSES_COUNT + dbAnalysesCount;
    const totalUsers = BASE_USER_COUNT + dbUserCount;
    
    // Get today's stats
    const todayStats = await this.getTodayStats();
    
    console.log(`✅ [Stats] Successfully retrieved: ${totalAnalyses} analyses (${dbAnalysesCount} in DB + ${BASE_ANALYSES_COUNT} baseline), ${totalUsers} users (${dbUserCount} in DB + ${BASE_USER_COUNT} baseline)`);
    
    return {
      totalAnalyses: totalAnalyses || BASE_ANALYSES_COUNT,
      totalUsers: totalUsers || BASE_USER_COUNT,
      todayAnalyses: todayStats.totalAnalyses || 0
    };
  } catch (error) {
    console.error('❌ [Stats API] CRITICAL ERROR - Failed to retrieve stats from database:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Even on error, try to return User count
    try {
      const User = require('./User');
      const userCount = await User.countDocuments(); // Count ALL users
      console.log(`⚠️ [Stats API] Partial recovery - User count retrieved: ${userCount}, using baseline analyses`);
      return {
        totalAnalyses: BASE_ANALYSES_COUNT,
        totalUsers: BASE_USER_COUNT + userCount,
        todayAnalyses: 0
      };
    } catch (fallbackError) {
      console.error('❌ [Stats API] COMPLETE FAILURE - Cannot access database at all:', fallbackError.message);
      return {
        totalAnalyses: BASE_ANALYSES_COUNT,
        totalUsers: BASE_USER_COUNT,
        todayAnalyses: 0
      };
    }
  }
};

module.exports = mongoose.model('Stats', statsSchema);