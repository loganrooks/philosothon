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


  it('should have responsive classes on the container', () => {
    const { container } = render(<FormEmbed />);
    const containerDiv = container.firstChild as HTMLElement;
    // Check for Tailwind classes based on Task 48 implementation (max-w-4xl, mx-auto, w-full)
    expect(containerDiv).toHaveClass('max-w-4xl', 'mx-auto', 'w-full');
  });

  it('should have width class on the iframe', () => {
    const { container } = render(<FormEmbed />);
    const iframe = container.querySelector('iframe');
    // Check for Tailwind class based on Task 48 implementation (w-full)
    expect(iframe).toHaveClass('w-full');
  });
});