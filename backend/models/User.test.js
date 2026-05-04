const mongoose = require('mongoose');
const User = require('./User');

/**
 * AEO SUITE - USER MODEL INTEGRITY TEST SUITE
 * 
 * This suite verifies the core business logic and data integrity rules 
 * implemented during the May 2026 architectural audit.
 * 
 * Documentation Style: Red-Green
 * - [RED]: Describes the original bug or missing logic.
 * - [GREEN]: Describes the implemented fix and expected behavior.
 */

describe('User Model: Subscription & Limit Logic', () => {
  beforeAll(async () => {
    const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/aeo_test';
    await mongoose.connect(url);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('FEATURE: Enterprise Tier Enforcement', () => {
    // [RED]: Original logic granted 999 audits to 'enterprise' users even if expired.
    // [GREEN]: Now strictly checks hasActiveSubscription() before granting high limits.
    test('User with EXPIRED Enterprise status must fallback to standard verified limit (5)', async () => {
      const user = new User({
        email: 'expired-ent@test.com',
        country: 'United Arab Emirates',
        isVerified: true,
        subscription: {
          type: 'enterprise',
          status: 'expired',
          endDate: new Date(Date.now() - 86400000) // 1 day ago
        }
      });
      
      expect(user.getDailyLimit()).toBe(5);
    });

    test('User with ACTIVE Enterprise status should receive 999 audits (or custom limit)', async () => {
      const user = new User({
        email: 'active-ent@test.com',
        country: 'United Arab Emirates',
        subscription: {
          type: 'enterprise',
          status: 'active',
          endDate: new Date(Date.now() + 86400000) // 1 day future
        }
      });
      
      expect(user.getDailyLimit()).toBe(999);
    });
  });

  describe('FEATURE: Subscription Grace Period (Cancelled Status)', () => {
    // [RED]: Logic only looked for 'active' status, locking out users who paid but cancelled auto-renewal.
    // [GREEN]: system now treats 'cancelled' status as active as long as the endDate has not passed.
    test('User who CANCELLED but still has remaining time should be recognized as having an active subscription', async () => {
      const user = new User({
        email: 'cancelled-grace@test.com',
        country: 'United Arab Emirates',
        subscription: {
          type: 'pro',
          status: 'cancelled',
          endDate: new Date(Date.now() + 86400000 * 10) // 10 days left
        }
      });

      expect(user.hasActiveSubscription()).toBe(true);
    });

    test('User who CANCELLED and whose time has EXPIRED should be recognized as inactive', async () => {
      const user = new User({
        email: 'cancelled-expired@test.com',
        country: 'United Arab Emirates',
        subscription: {
          type: 'pro',
          status: 'cancelled',
          endDate: new Date(Date.now() - 1000) // Just expired
        }
      });

      expect(user.hasActiveSubscription()).toBe(false);
    });
  });

  describe('FEATURE: Verified User Limits', () => {
    // [RED]: Static 'dailyLimit' field in DB was hardcoded to 3 and never updated on verification.
    // [GREEN]: User model now grants 5 audits for verified users and 3 for anonymous/unverified.
    test('Unverified users should be restricted to the anonymous limit (3)', async () => {
      const user = new User({
        email: 'unverified@test.com',
        country: 'United Arab Emirates',
        isVerified: false
      });
      
      expect(user.getDailyLimit()).toBe(3);
    });

    test('Verified users should be granted the registered user limit (5)', async () => {
      const user = new User({
        email: 'verified@test.com',
        country: 'United Arab Emirates',
        isVerified: true
      });
      
      expect(user.getDailyLimit()).toBe(5);
    });
  });

  describe('DATA INTEGRITY: Daily Limit Synchronization', () => {
    // [RED]: The database field 'dailyLimit' was often out of sync with user tier/status.
    // [GREEN]: A pre-save hook now forces the static DB field to always match the calculated reality.
    test('Should automatically update the database dailyLimit field when verification status changes', async () => {
      const user = new User({
        email: 'sync-test@test.com',
        country: 'United Arab Emirates',
        isVerified: false
      });

      await user.save();
      expect(user.dailyLimit).toBe(3); // Initial anonymous state

      user.isVerified = true;
      await user.save();

      // Verify that the hook correctly synced the field
      expect(user.dailyLimit).toBe(5);
    });
  });

  describe('FEATURE: Grandfathered Analyzer Limits', () => {
    // [RED]: Changing global limits in .env would affect all existing subscribers immediately.
    // [GREEN]: Webhooks now snapshot the .env limits into a Map on the user document for persistent pricing.
    test('Should persist a snapshot of analyzer limits on the user document', async () => {
      const snapshot = {
        technical: 75,
        content: 75,
        queryMatch: 50,
        visibility: 50,
        siteEEAT: 10
      };

      const user = new User({
        email: 'grandfather@test.com',
        country: 'United Arab Emirates',
        subscription: {
          type: 'pro',
          status: 'active',
          endDate: new Date(Date.now() + 86400000),
          analyzerLimits: snapshot
        }
      });

      await user.save();
      
      const savedUser = await User.findOne({ email: 'grandfather@test.com' });
      expect(savedUser.subscription.analyzerLimits.get('technical')).toBe(75);
      expect(savedUser.subscription.analyzerLimits.get('siteEEAT')).toBe(10);
    });
  });
});
