const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const successUrl = `${frontendUrl}/subscription-success`; // Changed from /dashboard?subscription=success
const cancelUrl = `${frontendUrl}/`; // Just go home if cancelled

/**
 * Stripe Service for Subscription Management
 * Handles all Stripe operations for AEO subscriptions
 */

// Price IDs from Stripe Dashboard (set in .env)
const PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL
};

/**
 * Create or retrieve Stripe customer for user
 */
async function getOrCreateCustomer(user) {
  try {
    // If user already has Stripe customer ID, retrieve it
    if (user.subscription.stripeCustomerId) {
      const customer = await stripe.customers.retrieve(user.subscription.stripeCustomerId);
      if (!customer.deleted) {
        return customer;
      }
    }

    // Create new customer with proper name handling
    const customerData = {
      email: user.email,
      metadata: {
        userId: user._id.toString(),
        company: user.company || '',
        country: user.country
      }
    };

    // Set name - prefer full name, fallback to email username
    if (user.firstName || user.lastName) {
      customerData.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    } else {
      // Extract name from email (e.g., "john.doe@example.com" -> "John Doe")
      const emailName = user.email.split('@')[0];
      customerData.name = emailName
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Add phone if available
    if (user.phone) {
      customerData.phone = user.phone;
    }

    const customer = await stripe.customers.create(customerData);

    // Update user with customer ID
    user.subscription.stripeCustomerId = customer.id;
    await user.save();

    return customer;
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error);
    throw new Error('Failed to setup payment account');
  }
}

/**
 * Create checkout session for subscription
 */
async function createCheckoutSession(user, priceId, successUrl, cancelUrl, couponCode = null) {
  try {
    const customer = await getOrCreateCustomer(user);

    const sessionParams = {
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true
      },
      custom_fields: [
        {
          key: 'company',
          label: {
            type: 'custom',
            custom: 'Company Name'
          },
          type: 'text',
          optional: false
        }
      ],
      subscription_data: {
        metadata: {
          userId: user._id.toString()
        }
      },
      metadata: {
        userId: user._id.toString()
      }
    };

    // Apply coupon if provided, otherwise allow promotion codes at checkout
    if (couponCode) {
      sessionParams.discounts = [{
        coupon: couponCode
      }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('Failed to create checkout session');
  }
}

/**
 * Create billing portal session for subscription management
 */
async function createBillingPortalSession(user, returnUrl) {
  try {
    if (!user.subscription.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: returnUrl
    });

    return session;
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw new Error('Failed to access billing portal');
  }
}

/**
 * Get subscription details from Stripe
 */
async function getSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
async function cancelSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

/**
 * Reactivate canceled subscription (before period ends)
 */
async function reactivateSubscription(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw new Error('Failed to reactivate subscription');
  }
}

/**
 * Handle webhook events from Stripe
 */
async function handleWebhookEvent(event, User) {
  const { logWebhookError } = require('../utils/errorLogger');
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('=== PROCESSING CHECKOUT SESSION COMPLETED ===');
        const session = event.data.object;
        console.log('Session ID:', session.id);
        console.log('Session metadata:', session.metadata);
        
        const userId = session.metadata.userId;
        const subscriptionId = session.subscription;
        
        console.log('Extracted userId:', userId);
        console.log('Extracted subscriptionId:', subscriptionId);

        if (!userId) {
          console.error('❌ ERROR: No userId in session metadata!');
          console.error('Full session object:', JSON.stringify(session, null, 2));
          break;
        }

        if (!subscriptionId) {
          console.error('❌ ERROR: No subscription ID in session!');
          break;
        }

        console.log('Looking up user in database...');
        const user = await User.findById(userId);
        
        if (!user) {
          console.error(`❌ ERROR: User not found for ID: ${userId}`);
          break;
        }

        console.log(`Found user: ${user.email}`);
        
        // Update MongoDB user AND Stripe customer with billing details
        if (session.customer_details) {
          try {
            const updateData = {};
            
            // Save name to MongoDB user
            if (session.customer_details.name && !user.firstName && !user.lastName) {
              const nameParts = session.customer_details.name.split(' ');
              user.firstName = nameParts[0] || '';
              user.lastName = nameParts.slice(1).join(' ') || '';
              console.log('✅ Name saved to user:', user.firstName, user.lastName);
            }
            
            // Save phone to MongoDB user
            if (session.customer_details.phone) {
              user.phone = session.customer_details.phone;
              updateData.phone = session.customer_details.phone;
              console.log('✅ Phone saved to user:', user.phone);
            }
            
            // Save address to Stripe only
            if (session.customer_details.address) {
              updateData.address = session.customer_details.address;
              
              // Save country to MongoDB if not set
              if (session.customer_details.address.country && !user.country) {
                user.country = session.customer_details.address.country;
                console.log('✅ Country saved to user:', user.country);
              }
            }
            
            // Get company name from custom fields and save to MongoDB
            if (session.custom_fields && session.custom_fields.length > 0) {
              const companyField = session.custom_fields.find(f => f.key === 'company');
              if (companyField && companyField.text && companyField.text.value) {
                user.company = companyField.text.value;
                updateData.metadata = { 
                  ...updateData.metadata,
                  company: companyField.text.value 
                };
                console.log('✅ Company saved to user:', user.company);
              }
            }
            
            // Update Stripe customer
            if (Object.keys(updateData).length > 0) {
              await stripe.customers.update(session.customer, updateData);
              console.log('✅ Stripe customer updated');
            }
          } catch (error) {
            console.error('⚠️ Warning: Could not update customer billing info:', error.message);
          }
        }
        
        console.log('Retrieving subscription from Stripe...');
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        console.log('Subscription retrieved:', subscription.id);
        console.log('Subscription periods:', {
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          status: subscription.status
        });
        
        // Convert Unix timestamps to JavaScript Date objects
        const startDate = subscription.current_period_start 
          ? new Date(subscription.current_period_start * 1000)
          : new Date();
        const endDate = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now
        
        console.log('Converted dates:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        user.subscription.stripeSubscriptionId = subscriptionId;
        user.subscription.type = 'pro';
        user.subscription.status = 'active';
        user.subscription.startDate = startDate;
        user.subscription.endDate = endDate;
        
        console.log('Saving user with updated subscription...');
        await user.save();

        console.log(`✅ Subscription activated for user ${user.email}`);
        console.log('Updated subscription:', user.subscription);

        // SYNC WITH HUBSPOT after subscription
        try {
          const { createOrUpdateContact } = require('../utils/hubspot');
          
          // Get fresh customer data from Stripe
          const customer = await stripe.customers.retrieve(session.customer);
          
          const hubspotData = {
            email: user.email,
            firstName: user.firstName || session.customer_details?.name?.split(' ')[0] || '',
            lastName: user.lastName || session.customer_details?.name?.split(' ').slice(1).join(' ') || '',
            company: user.company || customer.metadata?.company || '',
            phone: user.phone || customer.phone || session.customer_details?.phone || '',
            country: user.country || customer.address?.country || '',
            leadInterest: 'AEO Pro Subscriber'
          };
          
          console.log('📤 Sending to HubSpot:', JSON.stringify(hubspotData, null, 2));
  
          const result = await createOrUpdateContact(hubspotData);
          
          if (result.success && result.contactId) {
            user.hubspotContactId = result.contactId;
            console.log('✅ HubSpot contact synced, ID:', result.contactId);
          } else {
            console.error('❌ HubSpot sync failed:', result);
          }
        } catch (hubspotError) {
          console.error('⚠️ HubSpot sync error (non-fatal):', hubspotError.message);
          console.error('Stack:', hubspotError.stack);
        }
        
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
        if (user) {
          // Only update dates if they're valid
          if (subscription.current_period_start) {
            user.subscription.startDate = new Date(subscription.current_period_start * 1000);
          }
          if (subscription.current_period_end) {
            user.subscription.endDate = new Date(subscription.current_period_end * 1000);
          }
          
          // Handle cancellation
          if (subscription.cancel_at_period_end) {
            user.subscription.status = 'active'; // Still active until period end
          } else if (subscription.status === 'active') {
            user.subscription.status = 'active';
          }
          
          await user.save();
          console.log(`✅ Subscription updated for user ${user.email}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
        if (user) {
          user.subscription.type = 'free';
          user.subscription.status = 'cancelled';
          user.subscription.stripeSubscriptionId = null;
          await user.save();

          console.log(`✅ Subscription cancelled for user ${user.email}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
        if (user) {
          user.subscription.status = 'inactive';
          await user.save();

          // LOG FAILED PAYMENT
          const Transaction = require('../models/Transaction');
          await Transaction.create({
            userId: user._id,
            stripePaymentIntentId: invoice.payment_intent,
            stripeInvoiceId: invoice.id,
            type: 'failed_payment',
            amount: invoice.amount_due,
            currency: invoice.currency?.toUpperCase() || 'USD',
            status: 'failed',
            failureCode: invoice.last_finalization_error?.code,
            failureMessage: invoice.last_finalization_error?.message,
            createdAt: new Date(invoice.created * 1000)
          });

          console.log(`⚠️ Payment failed for user ${user.email}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
        if (user) {
          const Transaction = require('../models/Transaction');
          
          let priceId, priceAmount, plan = 'unknown';
          let billingStart = new Date(invoice.created * 1000);
          let billingEnd = new Date(billingStart.getTime() + 30 * 24 * 60 * 60 * 1000);

          // Get price info from subscription if available
          if (invoice.subscription) {
            try {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
              priceId = subscription.items.data[0]?.price?.id;
              priceAmount = subscription.items.data[0]?.price?.unit_amount;
              
              if (subscription.current_period_start) {
                billingStart = new Date(subscription.current_period_start * 1000);
              }
              if (subscription.current_period_end) {
                billingEnd = new Date(subscription.current_period_end * 1000);
              }
            } catch (error) {
              console.error('Warning: Could not retrieve subscription:', error.message);
            }
          }
          
          // Detect plan
          if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY) {
            plan = 'pro-monthly';
          } else if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
            plan = 'pro-annual';
          } else if (priceAmount === 2000 || invoice.amount_paid === 2000) {
            plan = 'pro-monthly';
          } else if (priceAmount === 18000 || invoice.amount_paid === 18000) {
            plan = 'pro-annual';
          }

          console.log('Payment logging:', {
            priceId,
            amount: invoice.amount_paid,
            plan
          });

          await Transaction.create({
            userId: user._id,
            stripePaymentIntentId: invoice.payment_intent,
            stripeChargeId: invoice.charge,
            stripeInvoiceId: invoice.id,
            stripeSubscriptionId: invoice.subscription,
            type: 'subscription_payment',
            amount: invoice.amount_paid,
            currency: invoice.currency?.toUpperCase() || 'USD',
            status: 'succeeded',
            plan: plan,
            billingPeriod: {
              start: billingStart,
              end: billingEnd
            },
            receiptUrl: invoice.hosted_invoice_url,
            invoiceUrl: invoice.invoice_pdf,
            createdAt: new Date(invoice.created * 1000)
          });

          console.log(`✅ Payment logged: $${(invoice.amount_paid / 100).toFixed(2)} (${plan})`);
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object;
        const chargeId = dispute.charge;

        // Find user by charge
        const Transaction = require('../models/Transaction');
        const transaction = await Transaction.findOne({ stripeChargeId: chargeId });
        
        if (transaction) {
          // Log dispute
          await Transaction.create({
            userId: transaction.userId,
            stripeChargeId: chargeId,
            type: 'dispute',
            amount: dispute.amount,
            currency: dispute.currency?.toUpperCase() || 'USD',
            status: 'disputed',
            failureCode: dispute.reason,
            failureMessage: `Dispute: ${dispute.reason}`,
            createdAt: new Date(dispute.created * 1000)
          });

          // Optionally: Send alert email to admin
          console.log(`🚨 DISPUTE CREATED: Charge ${chargeId}, Amount: $${(dispute.amount / 100).toFixed(2)}, Reason: ${dispute.reason}`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        const customerId = charge.customer;

        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
        if (user) {
          const Transaction = require('../models/Transaction');
          
          await Transaction.create({
            userId: user._id,
            stripeChargeId: charge.id,
            stripePaymentIntentId: charge.payment_intent,
            type: 'subscription_refund',
            amount: charge.amount_refunded,
            currency: charge.currency?.toUpperCase() || 'USD',
            status: 'refunded',
            receiptUrl: charge.receipt_url,
            createdAt: new Date(charge.created * 1000)
          });

          console.log(`✅ Refund logged for user ${user.email}: $${(charge.amount_refunded / 100).toFixed(2)}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    
    // Log to database
    await logWebhookError(event, error);
    
    throw error;
  }
}

/**
 * Create a coupon in Stripe (for $5/month promo)
 */
async function createCoupon(name, percentOff, durationMonths) {
  try {
    const coupon = await stripe.coupons.create({
      name: name,
      percent_off: percentOff,
      duration: durationMonths ? 'repeating' : 'once',
      duration_in_months: durationMonths || undefined,
      max_redemptions: 1000 // Limit total uses
    });
    return coupon;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

module.exports = {
  PRICE_IDS,
  getOrCreateCustomer,
  createCheckoutSession,
  createBillingPortalSession,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  handleWebhookEvent,
  createCoupon
};
