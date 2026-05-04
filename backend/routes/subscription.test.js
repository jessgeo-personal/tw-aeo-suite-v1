const request = require('supertest');
const express = require('express');
const router = require('./subscription');
const stripeService = require('../services/stripeService');
const { extractUser } = require('../middleware/auth');

// Mock dependencies
jest.mock('../services/stripeService');
jest.mock('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/subscription', router);

describe('Subscription Routes - Billing Portal Return URL', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      subscription: {
        stripeCustomerId: 'cus_123',
        status: 'active'
      },
      hasActiveSubscription: jest.fn().mockReturnValue(true),
      getDailyLimit: jest.fn().mockReturnValue(5)
    };

    // Default mock implementation for auth middleware
    extractUser.mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });
  });

  test('[RED]: Billing portal should return to the homepage to avoid empty Dashboard states', async () => {
    stripeService.createBillingPortalSession.mockResolvedValue({ url: 'https://billing.stripe.com/portal' });
    
    // We expect the backend to pass the root URL as returnUrl
    // Currently, subscription.js uses /dashboard, so this test should fail if we assert for /
    const response = await request(app)
      .post('/api/subscription/create-portal')
      .send();

    expect(response.status).toBe(200);
    
    // Verification: The returnUrl passed to stripeService should be the frontend root
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const expectedReturnUrl = `${frontendUrl}/`;
    
    // In TDD RED phase, this will fail because it's currently `${frontendUrl}/dashboard`
    expect(stripeService.createBillingPortalSession).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'user123' }),
      expectedReturnUrl
    );
  });
});
