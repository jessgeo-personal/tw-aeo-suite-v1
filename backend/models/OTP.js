const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: 6
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'analysis'],
    default: 'analysis'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    index: { expires: 0 } // TTL index - MongoDB will auto-delete expired documents
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 verification attempts
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
otpSchema.index({ email: 1, createdAt: -1 });
otpSchema.index({ email: 1, verified: 1 });

// Static method to generate a 6-digit OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create new OTP for email
otpSchema.statics.createOTP = async function(email, purpose = 'analysis') {
  // Invalidate any existing unverified OTPs for this email
  await this.updateMany(
    { email: email.toLowerCase().trim(), verified: false },
    { verified: true } // Mark old ones as used
  );
  
  const otp = this.generateOTP();
  
  return await this.create({
    email: email.toLowerCase().trim(),
    otp,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email, otp) {
  const otpDoc = await this.findOne({
    email: email.toLowerCase().trim(),
    otp,
    verified: false,
    expiresAt: { $gt: new Date() } // Not expired
  });
  
  if (!otpDoc) {
    // Check if OTP exists but is wrong (increment attempts)
    const wrongOtp = await this.findOne({
      email: email.toLowerCase().trim(),
      verified: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (wrongOtp) {
      wrongOtp.attempts += 1;
      await wrongOtp.save();
      
      if (wrongOtp.attempts >= 5) {
        return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
      }
      
      return { success: false, message: 'Invalid OTP. Please try again.' };
    }
    
    return { success: false, message: 'OTP expired or not found. Please request a new one.' };
  }
  
  // Mark as verified
  otpDoc.verified = true;
  await otpDoc.save();
  
  return { success: true, message: 'OTP verified successfully' };
};

// Method to check if OTP is still valid
otpSchema.methods.isValid = function() {
  return !this.verified && new Date() < this.expiresAt && this.attempts < 5;
};

module.exports = mongoose.model('OTP', otpSchema);
