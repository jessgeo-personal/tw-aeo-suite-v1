import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import Dashboard from './Dashboard';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: vi.fn(),
  };
});

import { useLocation } from 'react-router-dom';

describe('Dashboard Component - Empty State Redirection', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: { email: 'test@example.com' } }),
    });
  });

  it('[RED]: Should redirect to homepage when result is missing and it is not a subscription success/cancel', async () => {
    // Mock useLocation to return no state
    useLocation.mockReturnValue({
      state: null,
      search: ''
    });

    render(
      <MemoryRouter>
        <Dashboard user={{ email: 'test@example.com' }} onLogout={mockOnLogout} />
      </MemoryRouter>
    );

    // In TDD RED phase, it should show "No analysis data found" and NOT redirect automatically
    // But we want it to redirect. Currently it doesn't have the redirect logic.
    await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    }).catch(e => {
        console.log('Expected TDD Failure: Automatic redirect to / failed');
        throw e;
    });
  });
});
