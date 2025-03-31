import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ContentBlock from '@/components/ContentBlock';

describe('ContentBlock Component', () => {
  const testTitle = 'Test Content Title';
  const testChildText = 'This is the test child content.';

  it('should render the title correctly as an h2 heading', () => {
    render(
      <ContentBlock title={testTitle}>
        <p>{testChildText}</p>
      </ContentBlock>
    );
    const heading = screen.getByRole('heading', { name: testTitle, level: 2 });
    expect(heading).toBeInTheDocument();
  });

  it('should render the children content', () => {
    render(
      <ContentBlock title={testTitle}>
        <p>{testChildText}</p>
        <span>Another child element</span>
      </ContentBlock>
    );
    // Check for the presence of the child elements/text
    expect(screen.getByText(testChildText)).toBeInTheDocument();
    expect(screen.getByText('Another child element')).toBeInTheDocument();
  });
});