const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Stripe identifiers
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeInvoiceId: String,
  stripeSubscriptionId: String,
  
  // Transaction details
  type: {
    type: String,
    enum: ['subscription_payment', 'subscription_refund', 'failed_payment', 'dispute'],
    required: true
  },
  
  amount: {
    type: Number,
    required: true  // In cents (2000 = $20.00)
  },
  
  currency: {
    type: String,
    default: 'USD'
  },
  
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'disputed'],
    required: true
  },
  
  // Plan info
  plan: {
    type: String,
    enum: ['pro-monthly', 'pro-annual', 'unknown']
  },
  
  billingPeriod: {
    start: Date,
    end: Date
  },
  
  // Payment method (safe to store)
  paymentMethod: {
    brand: String,      // visa, mastercard
    last4: String,      // Last 4 digits only
    expiryMonth: Number,
    expiryYear: Number
  },
  
  // Receipt URLs
  receiptUrl: String,
  invoiceUrl: String,
  
  // Failure details
  failureCode: String,
  failureMessage: String,
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ stripePaymentIntentId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
