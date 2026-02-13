const express = require('express');
const router = express.Router();
const { extractUser } = require('../middleware/auth');
const stripeService = require('../services/stripeService');

/**
 * POST /api/subscription/create-checkout
 * Create Stripe checkout session for new subscription
 */
router.post('/create-checkout', extractUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please sign in to subscribe' 
      });
    }

    const { priceId, couponCode } = req.body;

    // Validate price ID
    if (!priceId || !Object.values(stripeService.PRICE_IDS).includes(priceId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid subscription plan' 
      });
    }

    // Check if already subscribed
    if (req.user.subscription.status === 'active' && req.user.hasActiveSubscription()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active subscription' 
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${frontendUrl}/dashboard?subscription=success`;
    const cancelUrl = `${frontendUrl}/dashboard?subscription=cancelled`;

    const session = await stripeService.createCheckoutSession(
      req.user,
      priceId,
      successUrl,
      cancelUrl,
      couponCode
    );

    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create checkout session' 
    });
  }
});

/**
 * POST /api/subscription/create-portal
 * Create Stripe billing portal session for subscription management
 */
router.post('/create-portal', extractUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Please sign in to manage subscription' 
      });
    }

    if (!req.user.subscription.stripeCustomerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No subscription found' 
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = `${frontendUrl}/dashboard`;

    const session = await stripeService.createBillingPortalSession(req.user, returnUrl);

    res.json({ 
      success: true, 
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to access billing portal' 
    });
  }
});

/**
 * GET /api/subscription/status
 * Get current subscription status
 */
router.get('/status', extractUser, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    const subscription = {
      type: req.user.subscription.type,
      status: req.user.subscription.status,
      startDate: req.user.subscription.startDate,
      endDate: req.user.subscription.endDate,
      hasActiveSubscription: req.user.hasActiveSubscription(),
      dailyLimit: req.user.getDailyLimit()
    };

    // If has Stripe subscription, get additional details
    if (req.user.subscription.stripeSubscriptionId) {
      const stripeSubscription = await stripeService.getSubscription(
        req.user.subscription.stripeSubscriptionId
      );

      if (stripeSubscription) {
        subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      }
    }

    res.json({ 
      success: true, 
      subscription 
    });

  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subscription status' 
    });
  }
});

/**
 * GET /api/subscription/plans
 * Get available subscription plans with pricing
 */
router.get('/plans', (req, res) => {
  try {
    const plans = [
      {
        id: 'pro-monthly',
        name: 'Pro Monthly',
        price: 20,
        currency: 'USD',
        interval: 'month',
        priceId: stripeService.PRICE_IDS.PRO_MONTHLY,
        features: [
          '50 analyses per day',
          'All 5 analyzers included',
          'Detailed PDF reports',
          'Priority support',
          'Cancel anytime'
        ]
      },
      {
        id: 'pro-annual',
        name: 'Pro Annual',
        price: 180,
        currency: 'USD',
        interval: 'year',
        priceId: stripeService.PRICE_IDS.PRO_ANNUAL,
        savings: '$60/year',
        features: [
          '50 analyses per day',
          'All 5 analyzers included',
          'Detailed PDF reports',
          'Priority support',
          'Cancel anytime',
          'Save 25% vs monthly'
        ]
      }
    ];

    res.json({ 
      success: true, 
      plans 
    });

  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch plans' 
    });
  }
});

module.exports = router;
