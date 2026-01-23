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
      enum: ['free', 'monthly', 'semi-annual', 'annual'],
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
  if (this.hasActiveSubscription()) {
    return 999; // Unlimited for subscribers
  }
  return this.isVerified ? 10 : 3; // Registered: 10, Anonymous: 3
};

module.exports = mongoose.model('User', userSchema);