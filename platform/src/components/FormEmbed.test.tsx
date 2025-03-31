import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FormEmbed from '@/components/FormEmbed';

describe('FormEmbed Component', () => {
  it('should render the placeholder text', () => {
    render(<FormEmbed />);
    expect(screen.getByText(/Google Form Embed Placeholder/i)).toBeInTheDocument();
  });

  // TODO: Add tests for iframe rendering once implemented
});