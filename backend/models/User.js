/**
 * User Model
 * Stores user information from lead capture
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  hubspotContactId: {
    type: String,
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'monthly', 'annual'],
      default: 'free',
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ hubspotContactId: 1 });

// Update last seen timestamp
userSchema.methods.updateLastSeen = function() {
  this.lastSeenAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
