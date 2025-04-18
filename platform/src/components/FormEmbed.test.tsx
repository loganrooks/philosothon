import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FormEmbed from '@/components/FormEmbed';

describe('FormEmbed Component', () => {
  it('should render the Google Form iframe', () => {
    const { container } = render(<FormEmbed />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://docs.google.com/forms/d/e/1FAIpQLSeP6uTZW8Loym5w_MjlVYpfsL6imKopvkMi4hYI2m6_Og4Plg/viewform?embedded=true');
  });


  it('should have max-width class for the container', () => {
    const { container } = render(<FormEmbed />);
    // Assuming the container div is the first child
    const containerDiv = container.firstChild;
    expect(containerDiv).toHaveClass('max-w-2xl'); // Check for Tailwind class
  });

  it('should have auto margin class for centering the container', () => {
    const { container } = render(<FormEmbed />);
    const containerDiv = container.firstChild;
    expect(containerDiv).toHaveClass('mx-auto'); // Check for Tailwind class (covers left and right)
  });

  it('should have 100% width class for the iframe', () => {
    const { container } = render(<FormEmbed />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toHaveClass('w-full'); // Check for Tailwind class
  });
});