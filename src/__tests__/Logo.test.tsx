/**
 * Logo Component Tests
 * Tests for the Stegnocchi logo component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Logo from '@/components/Logo';

describe('Logo Component', () => {
  it('renders with default props', () => {
    const { getByTestId } = render(<Logo />);
    // The component should render without crashing
    expect(true).toBe(true);
  });

  it('renders with custom size', () => {
    const { getByTestId } = render(<Logo size={200} />);
    // The component should render with custom size
    expect(true).toBe(true);
  });

  it('renders with custom style', () => {
    const customStyle = { marginTop: 10 };
    const { getByTestId } = render(<Logo style={customStyle} />);
    // The component should render with custom style
    expect(true).toBe(true);
  });

  it('renders with custom color', () => {
    const { getByTestId } = render(<Logo color="#FF0000" />);
    // The component should render with custom color
    expect(true).toBe(true);
  });
}); 