/**
 * Authentication Routes
 * Handles lead capture, OTP verification, and session management
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const Stats = require('../models/Stats');
const { sendOTPEmail } = require('../services/email');
const { createOrUpdateContact } = require('../services/hubspot');

/**
 * POST /api/auth/submit-lead
 * Submit lead information and send OTP
 */
router.post('/submit-lead', async (req, res) => {
  try {
    const { email, country, firstName, lastName, leadInterest, phoneNumber } = req.body;
    
    // Validation
    if (!email || !country) {
      return res.status(400).json({
        success: false,
        error: 'Email and country are required',
      });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists, create if not
    let user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      user = new User({
        email: normalizedEmail,
        firstName: firstName?.trim() || '',
        lastName: lastName?.trim() || '',
        country,
        phoneNumber: phoneNumber?.trim() || '',
      });
      await user.save();
      console.log(`✓ New user created: ${normalizedEmail}`);
    } else {
      // Update user info if provided
      if (firstName) user.firstName = firstName.trim();
      if (lastName) user.lastName = lastName.trim();
      if (country) user.country = country;
      if (phoneNumber) user.phoneNumber = phoneNumber.trim();
      await user.save();
      console.log(`✓ User updated: ${normalizedEmail}`);
    }
    
    // Create or update HubSpot contact (async, don't block)
    if (process.env.ENABLE_HUBSPOT_INTEGRATION === 'true') {
      createOrUpdateContact({
        email: normalizedEmail,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        phoneNumber: user.phoneNumber,
        lead_interest: leadInterest || 'AEO Tools Test',
      })
        .then(result => {
          if (result.success && result.contactId) {
            user.hubspotContactId = result.contactId;
            user.save();
          }
        })
        .catch(err => console.error('HubSpot sync error:', err));
    }
    
    // Generate and send OTP
    const otpCode = OTP.generateOTP();
    
    // Save OTP
    const otpRecord = new OTP({
      email: normalizedEmail,
      otp: otpCode,
    });
    await otpRecord.save();
    
    // Send OTP email
    const emailResult = await sendOTPEmail(normalizedEmail, otpCode, user.firstName);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      });
    }
    
    res.json({
      success: true,
      message: 'Verification code sent to your email',
      userId: user._id,
    });
    
  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred. Please try again.',
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and create session
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('[verify-otp] Request received for:', email);
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Verify OTP
    const verification = await OTP.verifyOTP(normalizedEmail, otp);
    
    if (!verification.success) {
      console.log('[verify-otp] OTP verification failed:', verification.error);
      return res.status(400).json({
        success: false,
        error: verification.error,
      });
    }
    
    // Get user
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log('[verify-otp] User not found:', normalizedEmail);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    // Track first-time login for stats
    const isFirstLogin = !user.lastSeen || user.lastSeen.getTime() === user.createdAt.getTime();
    if (isFirstLogin) {
      Stats.incrementUsers().catch(err => console.error('Stats tracking error:', err));
    }

    // Update last seen
    user.updateLastSeen();
    
    // Store user info in session
    req.session.userId = user._id.toString();
    req.session.email = user.email;
    req.session.verified = true;
    
    console.log('[verify-otp] Session data set:', {
      userId: req.session.userId,
      email: req.session.email,
      verified: req.session.verified,
      sessionId: req.sessionID
    });
    
    // Save session explicitly and wait for it
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('[verify-otp] Session save error:', err);
          reject(err);
        } else {
          console.log('[verify-otp] Session saved successfully, ID:', req.sessionID);
          resolve();
        }
      });
    });
    
    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: user.subscription.type,
      },
    });
    
  } catch (error) {
    console.error('[verify-otp] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed. Please try again.',
    });
  }
});

/**
 * POST /api/auth/login
 * Login for existing users - sends OTP if user exists
 */
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email. Please register first.',
      });
    }
    
    // Generate and send OTP
    const otpCode = OTP.generateOTP();
    
    // Save OTP
    const otpRecord = new OTP({
      email: normalizedEmail,
      otp: otpCode,
    });
    await otpRecord.save();
    
    // Send OTP email
    const emailResult = await sendOTPEmail(normalizedEmail, otpCode, user.firstName);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      });
    }
    
    console.log(`✓ Login OTP sent to existing user: ${normalizedEmail}`);
    
    res.json({
      success: true,
      message: 'Verification code sent to your email',
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred. Please try again.',
    });
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP to email
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Get user
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    // Generate new OTP
    const otpCode = OTP.generateOTP();
    
    // Save OTP
    const otpRecord = new OTP({
      email: normalizedEmail,
      otp: otpCode,
    });
    await otpRecord.save();
    
    // Send OTP email
    const emailResult = await sendOTPEmail(normalizedEmail, otpCode, user.firstName);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
      });
    }
    
    res.json({
      success: true,
      message: 'New verification code sent',
    });
    
  } catch (error) {
    console.error('OTP resend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend code. Please try again.',
    });
  }
});

/**
 * GET /api/auth/session
 * Check if user has active session
 */
router.get('/session', async (req, res) => {
  try {
    console.log('[session] Check requested');
    console.log('[session] Session ID:', req.sessionID);
    console.log('[session] Session data:', {
      userId: req.session?.userId,
      email: req.session?.email,
      verified: req.session?.verified
    });
    
    if (!req.session.userId || !req.session.verified) {
      console.log('[session] Not authenticated - missing userId or verified flag');
      return res.json({
        authenticated: false,
      });
    }
    
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      console.log('[session] User not found in DB, destroying session');
      req.session.destroy();
      return res.json({
        authenticated: false,
      });
    }
    
    console.log('[session] Authenticated as:', user.email);
    
    res.json({
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        subscription: user.subscription.type,
      },
    });
    
  } catch (error) {
    console.error('[session] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check session',
    });
  }
});

/**
 * POST /api/auth/logout
 * Destroy session
 */
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
});

module.exports = router;
