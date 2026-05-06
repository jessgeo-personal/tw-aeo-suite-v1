import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import useCanonical from './useCanonical';

// Wrapper component to test the hook
const TestComponent = ({ url }) => {
  useCanonical(url);
  return null;
};

describe('useCanonical Hook', () => {
  beforeEach(() => {
    // Clean up head before each test
    const link = document.querySelector('link[rel="canonical"]');
    if (link) {
      link.remove();
    }
  });

  it('should create a canonical link if it does not exist', () => {
    const testUrl = 'https://aeo.thatworkx.com/test';
    render(<TestComponent url={testUrl} />);
    
    const link = document.querySelector('link[rel="canonical"]');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe(testUrl);
  });

  it('should update the canonical link if it already exists', () => {
    // Create initial link
    const initialUrl = 'https://aeo.thatworkx.com/initial';
    const initialLink = document.createElement('link');
    initialLink.setAttribute('rel', 'canonical');
    initialLink.setAttribute('href', initialUrl);
    document.head.appendChild(initialLink);

    const updatedUrl = 'https://aeo.thatworkx.com/updated';
    render(<TestComponent url={updatedUrl} />);
    
    const links = document.querySelectorAll('link[rel="canonical"]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('href')).toBe(updatedUrl);
  });
});
