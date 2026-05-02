const mongoose = require('mongoose');
const User = require('./User');

describe('User Model Core Integrity', () => {
  beforeAll(async () => {
    // Connect to a local test database
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

  describe('Enterprise Subscription Validation (Test 1.1)', () => {
    it('should fallback to verified limit (5) if enterprise subscription is expired', async () => {
      const expiredEnterpriseUser = new User({
        email: 'expired@enterprise.com',
        country: 'United Arab Emirates',
        isVerified: true,
        subscription: {
          type: 'enterprise',
          status: 'expired',
          endDate: new Date(Date.now() - 86400000) // Yesterday
        }
      });
      
      // CURRENT BEHAVIOR (BUG): Returns 999
      // EXPECTED BEHAVIOR: Returns 5
      expect(expiredEnterpriseUser.getDailyLimit()).toBe(5);
    });

    it('should grant 999 audits if enterprise subscription is active', async () => {
      const activeEnterpriseUser = new User({
        email: 'active@enterprise.com',
        country: 'United Arab Emirates',
        isVerified: true,
        subscription: {
          type: 'enterprise',
          status: 'active',
          endDate: new Date(Date.now() + 86400000) // Tomorrow
        }
      });
      
      expect(activeEnterpriseUser.getDailyLimit()).toBe(999);
    });
  });

  describe('Subscription Grace Period (Test 1.2)', () => {
    it('should recognize a cancelled subscription with a future end date as active', async () => {
      const cancelledUserWithGrace = new User({
        email: 'grace@pro.com',
        country: 'United Arab Emirates',
        subscription: {
          type: 'pro',
          status: 'cancelled',
          endDate: new Date(Date.now() + 86400000 * 5) // 5 days from now
        }
      });

      // CURRENT BEHAVIOR: returns false (only checks 'active' status)
      // EXPECTED BEHAVIOR: returns true (honors grace period)
      expect(cancelledUserWithGrace.hasActiveSubscription()).toBe(true);
    });

    it('should recognize a cancelled subscription with a past end date as inactive', async () => {
      const expiredCancelledUser = new User({
        email: 'expired-grace@pro.com',
        country: 'United Arab Emirates',
        subscription: {
          type: 'pro',
          status: 'cancelled',
          endDate: new Date(Date.now() - 86400000) // Yesterday
        }
      });

      expect(expiredCancelledUser.hasActiveSubscription()).toBe(false);
    });
  });

  describe('Daily Limit Synchronization (Test 1.3)', () => {
    it('should automatically sync dailyLimit field to 5 when isVerified is true on save', async () => {
      const user = new User({
        email: 'sync@test.com',
        country: 'United Arab Emirates',
        isVerified: false
      });

      await user.save();
      expect(user.dailyLimit).toBe(3);

      user.isVerified = true;
      await user.save();

      // CURRENT BEHAVIOR: dailyLimit remains 3 in DB
      // EXPECTED BEHAVIOR: dailyLimit syncs to 5
      expect(user.dailyLimit).toBe(5);
    });
  });

  describe('Grandfathered Analyzer Limits (Test 2.1 & 2.2)', () => {
    it('should allow snapshotting analyzer limits from environment variables', async () => {
      // Mock environment variables (in a real scenario, these come from process.env)
      const mockEnvLimits = {
        technical: 100,
        content: 100,
        queryMatch: 100,
        visibility: 100,
        siteEEAT: 20
      };

      const user = new User({
        email: 'grandfather@test.com',
        country: 'United Arab Emirates',
        subscription: {
          type: 'pro',
          status: 'active',
          endDate: new Date(Date.now() + 86400000),
          analyzerLimits: mockEnvLimits
        }
      });

      await user.save();
      
      const savedUser = await User.findOne({ email: 'grandfather@test.com' });
      expect(savedUser.subscription.analyzerLimits.get('technical')).toBe(100);
      expect(savedUser.subscription.analyzerLimits.get('siteEEAT')).toBe(20);
    });
  });
});

describe('Premium Analyzer Restrictions (Test 2.3)', () => {
  // This test will be implemented once we add the logic to analyzers/index.js
  // For now, we are focusing on the User model schema and snapshotting
});
