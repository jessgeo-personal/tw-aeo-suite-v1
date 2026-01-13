const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const stripeService = require('../services/stripe');
const User = require('../models/User');

// ============================================
// CREATE CHECKOUT SESSION
// ============================================
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { plan, billingCycle } = req.body;
    
    if (!plan || !billingCycle) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Plan and billing cycle are required' 
      });
    }

    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if already subscribed
    if (user.subscription && user.subscription.status === 'active') {
      return res.status(400).json({
        error: 'Already subscribed',
        message: 'You already have an active subscription'
      });
    }

    const result = await stripeService.createCheckoutSession(
      userId,
      user.email,
      plan,
      billingCycle
    );

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// ============================================
// STRIPE WEBHOOK (for subscription events)
// ============================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  // When Stripe is activated, verify webhook signature:
  /*
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await stripeService.handleWebhook(event);
    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  */

  // Placeholder for now
  res.json({ received: true, note: 'Stripe not activated yet' });
});

// ============================================
// GET SUBSCRIPTION STATUS
// ============================================
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      subscription: user.subscription || {
        type: 'free',
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ 
      error: 'Failed to get subscription status',
      message: error.message 
    });
  }
});

// ============================================
// CANCEL SUBSCRIPTION
// ============================================
router.post('/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.subscription || !user.subscription.stripeSubscriptionId) {
      return res.status(400).json({
        error: 'No active subscription',
        message: 'You do not have an active subscription to cancel'
      });
    }

    const result = await stripeService.cancelSubscription(
      user.subscription.stripeSubscriptionId
    );

    if (result.error) {
      return res.status(400).json(result);
    }

    // Update user in database
    await User.findByIdAndUpdate(userId, {
      'subscription.status': 'canceling',
      'subscription.cancelAt': result.cancelAt,
    });

    res.json({
      message: 'Subscription will be canceled at the end of the billing period',
      cancelAt: result.cancelAt
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel subscription',
      message: error.message 
    });
  }
});

// ============================================
// CUSTOMER PORTAL (manage subscription)
// ============================================
router.get('/portal', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.subscription || !user.subscription.stripeCustomerId) {
      return res.status(400).json({
        error: 'No subscription',
        message: 'You do not have a subscription to manage'
      });
    }

    const result = await stripeService.createPortalSession(
      user.subscription.stripeCustomerId
    );

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Customer portal error:', error);
    res.status(500).json({ 
      error: 'Failed to create portal session',
      message: error.message 
    });
  }
});

// ============================================
// PROFESSIONAL SERVICES CONTACT
// ============================================
router.post('/contact-pro-services', async (req, res) => {
  try {
    const { name, email, service, message, companyName, websiteUrl } = req.body;

    if (!name || !email || !service) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, email, and service type are required'
      });
    }

    // TODO: Send email notification to sales team
    // TODO: Add to CRM (HubSpot)
    // TODO: Auto-reply to customer

    console.log('Professional services inquiry:', { name, email, service });

    // For now, just return success
    res.json({
      success: true,
      message: 'Thank you! Our team will contact you within 24 hours.'
    });

  } catch (error) {
    console.error('Pro services contact error:', error);
    res.status(500).json({ 
      error: 'Failed to submit inquiry',
      message: error.message 
    });
  }
});

module.exports = router;
