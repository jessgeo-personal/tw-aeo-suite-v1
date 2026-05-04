import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import PricingModal from './PricingModal';
import apiService from '../services/api';

// Mock apiService
vi.mock('../services/api', () => ({
  default: {
    subscription: {
      getPlans: vi.fn(),
      createCheckout: vi.fn(),
    },
  },
}));

describe('PricingModal Component Stripe Integration', () => {
  const mockUser = {
    email: 'test@example.com',
    subscription: { type: 'free' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch plans and render them in the subscription tab', async () => {
    const mockPlans = [
      { 
        id: 'plan_pro_monthly', 
        priceId: 'price_123', 
        name: 'Pro Monthly', 
        price: '20', 
        interval: 'month', 
        features: ['Unlimited analyses', 'All 5 analyzers'] 
      }
    ];
    apiService.subscription.getPlans.mockResolvedValue({ success: true, plans: mockPlans });

    render(<PricingModal isOpen={true} onClose={() => {}} user={mockUser} initialTab="subscription" />);

    // In TDD 'Red' phase, this is expected to fail because:
    // 1. PricingModal doesn't yet call getPlans()
    // 2. PricingModal uses static hardcoded plans
    await waitFor(() => {
      // We look for 'Pro Monthly' which is in our mock but NOT in the current static plans
      const planName = screen.queryByText('Pro Monthly');
      if (!planName) throw new Error('Plan "Pro Monthly" not found - this is the expected failure in Red phase');
    }, { timeout: 2000 }).catch(e => {
        // Log that we hit the expected failure
        console.log('Expected TDD Failure: ' + e.message);
        throw e;
    });
  });

  it('should call createCheckout when Upgrade button is clicked instead of opening LeadForm', async () => {
    const mockPlans = [
      { 
        id: 'plan_pro_monthly', 
        priceId: 'price_123', 
        name: 'Pro Monthly', 
        price: '20', 
        interval: 'month', 
        features: ['Feature 1'] 
      }
    ];
    apiService.subscription.getPlans.mockResolvedValue({ success: true, plans: mockPlans });
    apiService.subscription.createCheckout.mockResolvedValue({ success: true, url: 'https://stripe.com/checkout' });

    // Mock window.location.assign instead of replacing window.location
    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { assign: assignMock },
      writable: true
    });

    render(<PricingModal isOpen={true} onClose={() => {}} user={mockUser} initialTab="subscription" />);

    // This will also fail in 'Red' phase because the button will currently open the LeadFormModal
    // rather than calling apiService.subscription.createCheckout
    await waitFor(() => {
      const upgradeButton = screen.queryByText(/Upgrade/i);
      if (!upgradeButton) throw new Error('Upgrade button not found');
      fireEvent.click(upgradeButton);
    });

    await waitFor(() => {
      expect(apiService.subscription.createCheckout).toHaveBeenCalledWith('price_123');
    }).catch(e => {
        console.log('Expected TDD Failure: createCheckout was not called');
        throw e;
    });
  });
});
