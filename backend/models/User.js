const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'pro', 'enterprise'], // CHANGED: Added pro, enterprise
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'inactive'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    analyzerLimits: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  dailyLimit: {
    type: Number,
    default: 3 // Anonymous: 3, Registered: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  hubspotContactId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries (email index is automatic from unique: true)
userSchema.index({ createdAt: -1 });

// Method to check if user has active subscription
userSchema.methods.hasActiveSubscription = function() {
  // Allow both active AND cancelled (grace period) as long as endDate is in the future
  const isValidStatus = ['active', 'cancelled'].includes(this.subscription.status);
  
  return isValidStatus && 
         this.subscription.endDate && 
         new Date(this.subscription.endDate) > new Date();
};

// Method to get daily limit based on subscription
userSchema.methods.getDailyLimit = function() {
  // Fix: Ensure Enterprise strictly requires an active/grace subscription
  if (this.subscription.type === 'enterprise' && this.hasActiveSubscription()) {
    // If a custom dailyLimit is set on the document, use it; otherwise use 999
    return (this.dailyLimit && this.dailyLimit > 50) ? this.dailyLimit : 999;
  }
  
  if (this.subscription.type === 'pro' && this.hasActiveSubscription()) {
    return 50; // Pro: 50 analyses/day
  }
  
  // Free tiers: 5 if verified, 3 if anonymous
  return this.isVerified ? 5 : 3;
};

// Pre-save hook to ensure the dailyLimit field in the database 
// is always synchronized with the calculated limit
userSchema.pre('save', function(next) {
  // Always update the static field to match reality before saving
  this.dailyLimit = this.getDailyLimit();
  next();
});

module.exports = mongoose.model('User', userSchema);