const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
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
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true
  },
  targetKeywords: {
    type: [String],
    default: []
  },
  
  // Overall Score (weighted)
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // Individual Analyzer Results
  technicalFoundation: {
    score: Number,
    grade: String,
    findings: mongoose.Schema.Types.Mixed,
    recommendations: [mongoose.Schema.Types.Mixed], // Changed from [String] to support objects
    details: mongoose.Schema.Types.Mixed
  },
  
  contentStructure: {
    score: Number,
    grade: String,
    findings: mongoose.Schema.Types.Mixed,
    recommendations: [mongoose.Schema.Types.Mixed], // Changed from [String] to support objects
    details: mongoose.Schema.Types.Mixed
  },
  
  pageLevelEEAT: {
    score: Number,
    grade: String,
    findings: mongoose.Schema.Types.Mixed,
    recommendations: [mongoose.Schema.Types.Mixed], // Changed from [String] to support objects
    details: mongoose.Schema.Types.Mixed
  },
  
  queryMatch: {
    score: Number,
    grade: String,
    findings: mongoose.Schema.Types.Mixed,
    recommendations: [mongoose.Schema.Types.Mixed], // Changed from [String] to support objects
    details: mongoose.Schema.Types.Mixed
  },
  
  aiVisibility: {
    score: Number,
    grade: String,
    findings: mongoose.Schema.Types.Mixed,
    recommendations: [mongoose.Schema.Types.Mixed], // Changed from [String] to support objects
    details: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    default: null
  },
  processingTime: {
    type: Number, // milliseconds
    default: 0
  },
  reportSent: {
    type: Boolean,
    default: false
  },
  reportSentAt: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ email: 1, createdAt: -1 });
analysisSchema.index({ url: 1 });
analysisSchema.index({ createdAt: -1 });

// Method to calculate overall score with weights
analysisSchema.methods.calculateOverallScore = function() {
  const weights = {
    technicalFoundation: 0.25,
    contentStructure: 0.25,
    pageLevelEEAT: 0.20,
    queryMatch: 0.15,
    aiVisibility: 0.15
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  Object.keys(weights).forEach(analyzer => {
    if (this[analyzer] && typeof this[analyzer].score === 'number') {
      totalScore += this[analyzer].score * weights[analyzer];
      totalWeight += weights[analyzer];
    }
  });
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
};

module.exports = mongoose.model('Analysis', analysisSchema);