import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom'; // Ensure toHaveStyle is available
import FormEmbed from '@/components/FormEmbed';

describe('FormEmbed Component', () => {
  it('should render the Google Form iframe', () => {
    const { container } = render(<FormEmbed />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://docs.google.com/forms/d/e/1FAIpQLSeP6uTZW8Loym5w_MjlVYpfsL6imKopvkMi4hYI2m6_Og4Plg/viewform?embedded=true');
  });


  it('should have max-width styling for the container', () => {
    const { container } = render(<FormEmbed />);
    // Assuming the container div is the first child
    const containerDiv = container.firstChild as HTMLElement; // Cast for style check
    // Check computed style based on spec (max-w-4xl = 56rem)
    expect(containerDiv).toHaveStyle({ 'max-width': '56rem' });
  });

  it('should have auto margin styling for centering the container', () => {
    const { container } = render(<FormEmbed />);
    const containerDiv = container.firstChild as HTMLElement; // Cast for style check
    // Check computed style based on spec (mx-auto)
    expect(containerDiv).toHaveStyle({ 'margin-left': 'auto', 'margin-right': 'auto' });
  });

  it('should have 100% width styling for the iframe', () => {
    const { container } = render(<FormEmbed />);
    const iframe = container.querySelector('iframe');
    // Check computed style based on spec (w-full)
    expect(iframe).toHaveStyle({ width: '100%' });
  });
});