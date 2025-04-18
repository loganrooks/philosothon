import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ThemeCard from '@/components/ThemeCard';

describe('ThemeCard Component', () => {
  const baseProps = {
    id: 'test-theme-id', // Added missing required ID
    title: 'Test Theme Title',
    description: 'Test theme description.',
  };

  // Updated mock data to be string arrays
  const analyticPhilosophers = ['Analytic Philosopher 1', 'Analytic Philosopher 2'];
  const continentalPhilosophers = ['Continental Philosopher A', 'Continental Philosopher B'];

  it('should render title and description', () => {
    render(<ThemeCard {...baseProps} />);
    expect(screen.getByRole('heading', { name: baseProps.title, level: 3 })).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();
  });

  it('should not render tradition sections if props are not provided', () => {
    render(<ThemeCard {...baseProps} />);
    expect(screen.queryByRole('heading', { name: /Analytic Tradition/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Continental Tradition/i })).not.toBeInTheDocument();
  });

  it('should render only Analytic tradition section when provided', () => {
    render(<ThemeCard {...baseProps} analyticTradition={analyticPhilosophers} />);
    const analyticSection = screen.getByRole('heading', { name: /Analytic Tradition/i }).closest('div');
    expect(analyticSection).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Continental Tradition/i })).not.toBeInTheDocument();

    const listItems = within(analyticSection!).getAllByRole('listitem');
    expect(listItems).toHaveLength(analyticPhilosophers.length);
    expect(listItems[0]).toHaveTextContent(analyticPhilosophers[0]);
    expect(listItems[1]).toHaveTextContent(analyticPhilosophers[1]);
  });

  it('should render only Continental tradition section when provided', () => {
    render(<ThemeCard {...baseProps} continentalTradition={continentalPhilosophers} />);
    const continentalSection = screen.getByRole('heading', { name: /Continental Tradition/i }).closest('div');
    expect(continentalSection).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Analytic Tradition/i })).not.toBeInTheDocument();

     const listItems = within(continentalSection!).getAllByRole('listitem');
    expect(listItems).toHaveLength(continentalPhilosophers.length);
    expect(listItems[0]).toHaveTextContent(continentalPhilosophers[0]);
    expect(listItems[1]).toHaveTextContent(continentalPhilosophers[1]);
  });

   it('should render both tradition sections when provided', () => {
    render(<ThemeCard {...baseProps} analyticTradition={analyticPhilosophers} continentalTradition={continentalPhilosophers} />);

    // Check Analytic
    const analyticSection = screen.getByRole('heading', { name: /Analytic Tradition/i }).closest('div');
    expect(analyticSection).toBeInTheDocument();
    const analyticListItems = within(analyticSection!).getAllByRole('listitem');
    expect(analyticListItems).toHaveLength(analyticPhilosophers.length);
    expect(analyticListItems[0]).toHaveTextContent(analyticPhilosophers[0]);
    expect(analyticListItems[1]).toHaveTextContent(analyticPhilosophers[1]);

    // Check Continental
    const continentalSection = screen.getByRole('heading', { name: /Continental Tradition/i }).closest('div');
    expect(continentalSection).toBeInTheDocument();
    const continentalListItems = within(continentalSection!).getAllByRole('listitem');
    expect(continentalListItems).toHaveLength(continentalPhilosophers.length);
    expect(continentalListItems[0]).toHaveTextContent(continentalPhilosophers[0]);
    expect(continentalListItems[1]).toHaveTextContent(continentalPhilosophers[1]);
  });

  it('should handle empty or null tradition arrays gracefully', () => {
    // Test with empty arrays
    const { rerender } = render(<ThemeCard {...baseProps} analyticTradition={[]} continentalTradition={[]} />);
    // Headings should render because the prop exists (even if empty array)
    const analyticHeadingEmpty = screen.getByRole('heading', { name: /Analytic Tradition/i });
    const continentalHeadingEmpty = screen.getByRole('heading', { name: /Continental Tradition/i });
    expect(analyticHeadingEmpty).toBeInTheDocument();
    expect(continentalHeadingEmpty).toBeInTheDocument();
    // But the list itself should not be rendered within the heading's parent div
    expect(within(analyticHeadingEmpty.closest('div')!).queryByRole('list')).not.toBeInTheDocument();
    expect(within(continentalHeadingEmpty.closest('div')!).queryByRole('list')).not.toBeInTheDocument();


    // Test with undefined (which is default for optional props) - Rerender the component
    rerender(<ThemeCard {...baseProps} analyticTradition={undefined} continentalTradition={undefined} />);
    render(<ThemeCard {...baseProps} analyticTradition={undefined} continentalTradition={undefined} />);
    expect(screen.queryByRole('heading', { name: /Analytic Tradition/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Continental Tradition/i })).not.toBeInTheDocument();
  });

});