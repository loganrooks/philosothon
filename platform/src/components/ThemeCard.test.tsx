import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ThemeCard from '@/components/ThemeCard';

describe('ThemeCard Component', () => {
  const baseProps = {
    title: 'Test Theme Title',
    description: 'Test theme description.',
  };

  const analyticPhilosophers = 'Analytic Philosopher 1 (Description)\n- Analytic Philosopher 2';
  const continentalPhilosophers = 'Continental Philosopher A (Desc)\n- Continental Philosopher B';

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
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent('Analytic Philosopher 1'); // Parenthetical removed
    expect(listItems[1]).toHaveTextContent('Analytic Philosopher 2');
  });

  it('should render only Continental tradition section when provided', () => {
    render(<ThemeCard {...baseProps} continentalTradition={continentalPhilosophers} />);
    const continentalSection = screen.getByRole('heading', { name: /Continental Tradition/i }).closest('div');
    expect(continentalSection).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Analytic Tradition/i })).not.toBeInTheDocument();

     const listItems = within(continentalSection!).getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toHaveTextContent('Continental Philosopher A'); // Parenthetical removed
    expect(listItems[1]).toHaveTextContent('Continental Philosopher B');
  });

   it('should render both tradition sections when provided', () => {
    render(<ThemeCard {...baseProps} analyticTradition={analyticPhilosophers} continentalTradition={continentalPhilosophers} />);

    // Check Analytic
    const analyticSection = screen.getByRole('heading', { name: /Analytic Tradition/i }).closest('div');
    expect(analyticSection).toBeInTheDocument();
    const analyticListItems = within(analyticSection!).getAllByRole('listitem');
    expect(analyticListItems).toHaveLength(2);
    expect(analyticListItems[0]).toHaveTextContent('Analytic Philosopher 1');
    expect(analyticListItems[1]).toHaveTextContent('Analytic Philosopher 2');

    // Check Continental
    const continentalSection = screen.getByRole('heading', { name: /Continental Tradition/i }).closest('div');
    expect(continentalSection).toBeInTheDocument();
    const continentalListItems = within(continentalSection!).getAllByRole('listitem');
    expect(continentalListItems).toHaveLength(2);
    expect(continentalListItems[0]).toHaveTextContent('Continental Philosopher A');
    expect(continentalListItems[1]).toHaveTextContent('Continental Philosopher B');
  });

  it('should handle empty tradition strings gracefully', () => {
    render(<ThemeCard {...baseProps} analyticTradition="" continentalTradition="" />);
    expect(screen.queryByRole('heading', { name: /Analytic Tradition/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Continental Tradition/i })).not.toBeInTheDocument();
  });

});