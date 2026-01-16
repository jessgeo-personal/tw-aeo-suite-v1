const mongoose = require('mongoose');

/**
 * Stats Model - Single document storing global statistics
 * Used for live counter on landing page and dashboard
 */
const statsSchema = new mongoose.Schema({
  totalAnalyses: {
    type: Number,
    default: 950, // Starting value as requested
    required: true
  },
  totalUsers: {
    type: Number,
    default: 43, // Starting value as requested
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Cache timestamp for efficient querying
  cacheUntil: {
    type: Date,
    default: () => new Date(Date.now() + 60000) // Cache for 1 minute
  }
});

// Ensure only one document exists
statsSchema.statics.getSingleton = async function() {
  let stats = await this.findOne();
  if (!stats) {
    stats = await this.create({
      totalAnalyses: 950,
      totalUsers: 43
    });
  }
  return stats;
};

// Increment analysis count
statsSchema.statics.incrementAnalyses = async function() {
  const stats = await this.getSingleton();
  stats.totalAnalyses += 1;
  stats.lastUpdated = new Date();
  stats.cacheUntil = new Date(Date.now() + 60000);
  await stats.save();
  return stats;
};

// Increment user count
statsSchema.statics.incrementUsers = async function() {
  const stats = await this.getSingleton();
  stats.totalUsers += 1;
  stats.lastUpdated = new Date();
  stats.cacheUntil = new Date(Date.now() + 60000);
  await stats.save();
  return stats;
};

// Get cached stats (returns even if cache expired, but updates in background)
statsSchema.statics.getCached = async function() {
  const stats = await this.getSingleton();
  
  // If cache expired, update it asynchronously
  if (stats.cacheUntil < new Date()) {
    stats.cacheUntil = new Date(Date.now() + 60000);
    stats.save().catch(err => console.error('Failed to update cache timestamp:', err));
  }
  
  return {
    totalAnalyses: stats.totalAnalyses,
    totalUsers: stats.totalUsers
  };
};

const Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;