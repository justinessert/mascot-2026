import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Info from '../../pages/Info';

// Mock dependencies
vi.mock('../../components/HowItWorks', () => ({
    default: () => <div data-testid="how-it-works">how it works</div>
}));

describe('Info Page', () => {
    it('renders main sections', () => {
        render(
            <MemoryRouter>
                <Info />
            </MemoryRouter>
        );

        expect(screen.getByText(/About Mascot Madness/i)).toBeInTheDocument();
        expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
        expect(screen.getByText(/How Scoring Works/i)).toBeInTheDocument();
        expect(screen.getByText(/How It Started/i)).toBeInTheDocument();
        expect(screen.getByText(/Contact/i)).toBeInTheDocument();
    });

    it('renders scoring table rows', () => {
        render(
            <MemoryRouter>
                <Info />
            </MemoryRouter>
        );

        expect(screen.getByText('Round of 64')).toBeInTheDocument();
        expect(screen.getByText('Championship')).toBeInTheDocument();
        expect(screen.getByText('1,920 pts')).toBeInTheDocument();
    });

    it('renders CTA button', () => {
        render(
            <MemoryRouter>
                <Info />
            </MemoryRouter>
        );

        const link = screen.getByRole('link', { name: /start picking/i });
        expect(link).toHaveAttribute('href', '/bracket/pick');
    });
});
