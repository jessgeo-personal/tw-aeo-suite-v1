/**
 * STRIPE INTEGRATION SERVICE
 * 
 * This file contains the Stripe integration skeleton.
 * When you activate your Stripe account, you'll need to:
 * 1. Install stripe: npm install stripe
 * 2. Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to .env
 * 3. Create products/prices in Stripe Dashboard
 * 4. Update the price IDs in this file
 * 5. Uncomment the code below
 */

// Uncomment when Stripe is activated
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const STRIPE_CONFIG = {
  enabled: process.env.STRIPE_ENABLED === 'true',
  
  // Add these after creating products in Stripe Dashboard
  prices: {
    monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_xxxxx', // $20/month
    semiAnnual: process.env.STRIPE_PRICE_SEMI_ANNUAL || 'price_xxxxx', // $17/month ($102 total)
    annual: process.env.STRIPE_PRICE_ANNUAL || 'price_xxxxx', // $15/month ($180 total)
  },
  
  successUrl: process.env.FRONTEND_URL + '/upgrade/success',
  cancelUrl: process.env.FRONTEND_URL + '/upgrade/cancel',
};

class StripeService {
  constructor() {
    this.enabled = STRIPE_CONFIG.enabled;
    // Uncomment when ready:
    // this.stripe = stripe;
    
    if (!this.enabled) {
      console.log('⚠️  Stripe integration disabled (set STRIPE_ENABLED=true to enable)');
    }
  }

  /**
   * Create a Stripe Checkout Session for subscription
   */
  async createCheckoutSession(userId, email, plan, billingCycle) {
    if (!this.enabled) {
      return {
        error: 'Stripe integration not yet activated',
        message: 'Coming soon! Contact support@thatworkx.com to pre-order.'
      };
    }

    // Uncomment when Stripe is activated:
    /*
    try {
      const priceId = this.getPriceId(billingCycle);
      
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: STRIPE_CONFIG.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: STRIPE_CONFIG.cancelUrl,
        metadata: {
          userId: userId,
          plan: plan,
          billingCycle: billingCycle,
        },
        subscription_data: {
          metadata: {
            userId: userId,
          },
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };

    } catch (error) {
      console.error('Stripe checkout error:', error);
      return {
        error: 'Failed to create checkout session',
        message: error.message
      };
    }
    */

    // Return placeholder for now
    return {
      error: 'Coming soon',
      message: 'Stripe integration will be activated soon. You\'ll be notified via email!'
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event) {
    if (!this.enabled) {
      return { received: true };
    }

    // Uncomment when Stripe is activated:
    /*
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };

    } catch (error) {
      console.error('Webhook error:', error);
      return { error: error.message };
    }
    */

    return { received: true };
  }

  /**
   * Get price ID based on billing cycle
   */
  getPriceId(billingCycle) {
    switch (billingCycle) {
      case 'monthly':
        return STRIPE_CONFIG.prices.monthly;
      case 'semi-annual':
        return STRIPE_CONFIG.prices.semiAnnual;
      case 'annual':
        return STRIPE_CONFIG.prices.annual;
      default:
        throw new Error('Invalid billing cycle');
    }
  }

  /**
   * Handle successful checkout
   */
  async handleCheckoutCompleted(session) {
    const User = require('../models/User');
    
    const userId = session.metadata.userId;
    const subscriptionId = session.subscription;

    await User.findByIdAndUpdate(userId, {
      subscription: {
        type: 'unlimited',
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: session.customer,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Placeholder
      }
    });

    console.log(`✓ Subscription activated for user ${userId}`);
  }

  /**
   * Handle subscription creation
   */
  async handleSubscriptionCreated(subscription) {
    const User = require('../models/User');
    
    const userId = subscription.metadata.userId;

    await User.findByIdAndUpdate(userId, {
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    });

    console.log(`✓ Subscription created for user ${userId}`);
  }

  /**
   * Handle subscription updates (renewals, changes)
   */
  async handleSubscriptionUpdated(subscription) {
    const User = require('../models/User');
    
    const userId = subscription.metadata.userId;

    await User.findByIdAndUpdate(userId, {
      'subscription.status': subscription.status,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    });

    console.log(`✓ Subscription updated for user ${userId}`);
  }

  /**
   * Handle subscription cancellation
   */
  async handleSubscriptionDeleted(subscription) {
    const User = require('../models/User');
    
    const userId = subscription.metadata.userId;

    await User.findByIdAndUpdate(userId, {
      'subscription.status': 'canceled',
      'subscription.canceledAt': new Date(),
    });

    console.log(`✓ Subscription canceled for user ${userId}`);
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    // Log successful payment, send receipt email, etc.
    console.log(`✓ Payment succeeded: ${invoice.id}`);
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    // Send payment failure email, retry logic, etc.
    console.error(`✗ Payment failed: ${invoice.id}`);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId) {
    if (!this.enabled) {
      return { error: 'Stripe not enabled' };
    }

    // Uncomment when Stripe is activated:
    /*
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return {
        success: true,
        cancelAt: new Date(subscription.current_period_end * 1000),
      };

    } catch (error) {
      console.error('Cancel subscription error:', error);
      return { error: error.message };
    }
    */

    return { error: 'Stripe not activated yet' };
  }

  /**
   * Get customer portal URL for managing subscription
   */
  async createPortalSession(customerId) {
    if (!this.enabled) {
      return { error: 'Stripe not enabled' };
    }

    // Uncomment when Stripe is activated:
    /*
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: process.env.FRONTEND_URL + '/settings',
      });

      return { url: session.url };

    } catch (error) {
      console.error('Portal session error:', error);
      return { error: error.message };
    }
    */

    return { error: 'Stripe not activated yet' };
  }
}

module.exports = new StripeService();
