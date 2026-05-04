import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import VersionFooter from './VersionFooter';
import { APP_VERSION } from '../config/version';

describe('VersionFooter Component', () => {
  it('should render the correct version string from config', () => {
    render(<VersionFooter />);
    
    // Check for the version text
    const versionElement = screen.getByText(new RegExp(`v${APP_VERSION}`));
    expect(versionElement).toBeDefined();
    expect(versionElement.className).toContain('text-dark-600');
  });

  it('should render the copyright text', () => {
    render(<VersionFooter />);
    const copyrightElement = screen.getByText(/Thatworkx Solutions. All rights reserved./i);
    expect(copyrightElement).toBeDefined();
  });
});
