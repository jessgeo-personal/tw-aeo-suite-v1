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
    stripeSubscriptionId: String
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
  return this.subscription.status === 'active' && 
         this.subscription.endDate && 
         new Date(this.subscription.endDate) > new Date();
};

// Method to get daily limit based on subscription
userSchema.methods.getDailyLimit = function() {
  if (this.subscription.type === 'enterprise') {
    return this.dailyLimit || 999; // Enterprise: Custom or default 999
  }
  if (this.subscription.type === 'pro' && this.hasActiveSubscription()) {
    return 50; // Pro: 50 analyses/day
  }
  return this.isVerified ? 5 : 3; // Free verified: 5, Anonymous: 3
};

module.exports = mongoose.model('User', userSchema);