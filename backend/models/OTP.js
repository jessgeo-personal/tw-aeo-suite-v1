/**
 * OTP Model
 * Stores one-time passwords for email verification
 */

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // OTP expires in 10 minutes
    default: () => new Date(Date.now() + 10 * 60 * 1000),
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups and automatic cleanup
otpSchema.index({ email: 1, expiresAt: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

// Generate 6-digit OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Verify OTP
otpSchema.statics.verifyOTP = async function(email, otp) {
  const otpRecord = await this.findOne({
    email: email.toLowerCase().trim(),
    otp,
    verified: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    return { success: false, error: 'Invalid or expired OTP' };
  }

  // Mark as verified
  otpRecord.verified = true;
  await otpRecord.save();

  return { success: true };
};

module.exports = mongoose.model('OTP', otpSchema);
