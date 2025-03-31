import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from './Footer';

describe('Footer Component', () => {
  it('should render the copyright notice with the current year', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    const expectedText = `© ${currentYear} Philosothon UofT. All rights reserved.`;

    // Check if the text is present in the document
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});