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
});